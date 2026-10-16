// src/components/Film/FilmWorkspaceContainer.jsx
// Smart wrapper bound to ONE film project. Mounted by FilmMode with either a
// freshly-created project (projectId + initialSessionId, empty chat) or an
// existing one to resume (projectId only → GET /projects/:id restores chat +
// render). Chat persists because the session is the project's bound session.

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FilmWorkspace from './FilmWorkspace';
import useFilmAuthoring from './useFilmAuthoring';
import useFilmJob, { beatPayload } from './useFilmJob';
import useCredits from '../../hooks/useCredits';
import { InsufficientCard } from './CreditsUI';
import FilmSeriesModals from './FilmSeriesModals';
import { filmGetProject, filmUploadPhoto, filmUploadConsent, filmSaveScript, filmPromoteToSeries,
         filmGetRecap, filmReviewEpisode, friendlyError } from './filmApi';

const shotToCell = s => ({
  index: s.index,
  kind: s.kind || 'pure_visual',
  seconds: Math.round(s.seconds || s.duration || 6),
  speaker: (s.speaker || '').trim(),
  // Keep the shot description (visual/action) and the spoken/voiced line SEPARATE
  // so they can be edited independently — collapsing them into one field is why
  // text typed as a shot description used to come out as VO. `caption` stays as a
  // display-only convenience (what shows under the thumbnail).
  visual: (s.action || '').trim(),
  vo: (s.dialogue || s.vo || '').trim(),
  voKind: s.dialogue ? 'dialogue' : (s.vo ? 'vo' : ''),   // spoken vs voiceover
  caption: (s.dialogue || s.vo || s.action || '').trim(),
  softened: !!s.softened,
  clipUrl: null,
  status: 'queued',
});

// SAVED SCRIPT EDITS (2026-10-15) — what the user Saved, recovered on load.
// Save now writes the edit INTO the room's newest script message and marks it
// `edited: true` (film_routes PATCH /projects/:id/script), so the room shows the
// edit on reopen with no help from here. If the NEWEST script message is that
// edit, it is what "Make the film" / "Review cast" must use → seed savedScript.
// If the room has written a newer draft since, that draft wins (saved = null).
// Edits saved BEFORE the server fix were never written into the room and can't be
// told apart from a later room draft safely, so they are not guessed at here —
// re-save once and they persist from then on.
function seedSavedScript(p) {
  const messages = (p && p.messages) || [];
  let sm = null;
  messages.forEach((m) => { if (m.role !== 'system' && m.scriptMeta && m.scriptMeta.script) sm = m.scriptMeta; });
  return { messages, saved: (sm && sm.edited) ? sm.script : null };
}

export default function FilmWorkspaceContainer({
  projectId,
  initialSessionId = null,     // set when the project was just created
  onBackToFilms = () => {},
}) {
  const authoring = useFilmAuthoring();
  const job = useFilmJob();
  const credits = useCredits();
  const navigate = useNavigate();
  const [blockInfo, setBlockInfo] = useState(null);   // 402 → InsufficientCard
  const [renderCost, setRenderCost] = useState(null); // {price, affordable, ...} for the header badge
  const [editing, setEditing] = useState(null);
  const [editsByIndex, setEditsByIndex] = useState({});
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ video_style: 'anime', duration_seconds: 120, aspect_ratio: '9:16' });
  const [savedScript, setSavedScript] = useState(null);   // user's saved script edits (win over finalize)
  // SAVED SCRIPT EDITS (2026-10-15, owner bug: "edits don't persist"). savedScript
  // used to live ONLY in this component's memory: Save → leave → come back and it
  // was null again, the room showed the old draft, and "Make the film" finalized
  // the old draft (overwriting the saved edit on the server). It is now SEEDED on
  // load from the server's record of the edit (seedSavedScript, above), and
  // CLEARED when the room writes a newer draft, so an old edit never beats a new
  // draft. scriptCountRef = how many room messages carry a script, to spot a new one.
  const scriptCountRef = useRef(0);
  // Per-beat busy flag — threaded to the individual Regenerate button (not just
  // the stage overlay) so a click registers visibly the instant it's pressed.
  // Fixes handover §2a: "Regenerate button shows no state".
  const [regenBusyIndex, setRegenBusyIndex] = useState(null);
  // Series awareness: seriesId stays `undefined` for a fresh session (we can't
  // know yet) and is set from GET /projects on resume. `null` = confirmed
  // standalone → promotable once rendered; a number = an episode → not promotable.
  const [seriesId, setSeriesId] = useState(undefined);
  const [promoteOpen, setPromoteOpen] = useState(false);
  // Transient "the funnel was just clicked" flag. onReviewCast awaits
  // authoring.finalize() (an LLM call, several seconds) BEFORE job.plan() sets
  // status='processing' — during that gap job.status is still 'idle', so a
  // purely job-derived button would read "enabled" and users re-click (the exact
  // double-click report). This greys the button the instant it's pressed; it is
  // NOT the lifecycle source of truth (that's job.status/live below) and is
  // deliberately transient — it must NOT survive a reload, since nothing was
  // enqueued yet. Cleared the moment the real job leaves 'idle'.
  const [castKickoff, setCastKickoff] = useState(false);
  useEffect(() => { if (job.status !== 'idle') setCastKickoff(false); }, [job.status]);

  // Mount: adopt the fresh session, or resume the project.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      if (initialSessionId) {
        // Fresh room (brand-new film/episode): there are no messages to load, but
        // we STILL must hydrate meta from the just-created project — otherwise meta
        // keeps its initial default (video_style:'anime') and the style/duration/
        // frame the user picked are lost. Without this, every newly-created film or
        // episode opened as anime regardless of the chosen style.
        authoring.adopt({ session_id: initialSessionId, messages: [] });
        scriptCountRef.current = 0;
        setSavedScript(null);   // a brand-new film never inherits another film's edit
        try {
          const p = await filmGetProject(projectId);
          if (!cancelled && p) {
            setMeta({ video_style: p.video_style || 'anime',
                      duration_seconds: p.duration_seconds || 120,
                      aspect_ratio: p.aspect_ratio || '9:16' });
            setSeriesId(p.series_id ?? null);
          }
        } catch (e) { /* keep defaults if the fetch fails */ }
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const p = await filmGetProject(projectId);
        if (cancelled) return;
        const { messages: msgs, saved } = seedSavedScript(p);
        scriptCountRef.current = msgs.filter(m => m.role !== 'system' && m.scriptMeta).length;
        authoring.adopt({
          session_id: p.session_id, messages: msgs,
          title: p.title, script: p.script, scriptReady: !!p.script,
        });
        setSavedScript(saved);
        setMeta({ video_style: p.video_style || 'anime', duration_seconds: p.duration_seconds || 120,
                  aspect_ratio: p.aspect_ratio || '9:16' });
        setSeriesId(p.series_id ?? null);   // confirmed standalone (null) or an episode (id)
        if (p.render) job.adopt(p.render);
      } catch (e) {
        // authoring/job errors surface in their own state; nothing else to do
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [projectId, initialSessionId]);

  // SAVED SCRIPT EDITS: a NEWER room draft (a new script message after the load or
  // after Save) replaces the saved edit — "Make the film" must use what the room
  // just wrote, not an older hand edit.
  const scriptMsgCount = useMemo(
    () => (authoring.messages || []).filter(m => m.scriptMeta).length, [authoring.messages]);
  useEffect(() => {
    if (scriptMsgCount > scriptCountRef.current) setSavedScript(null);
    scriptCountRef.current = scriptMsgCount;
  }, [scriptMsgCount]);

  // Clear the button-level regen spinner once the job's overlay-level busy
  // flag clears (regenerate completed, failed, or was superseded).
  useEffect(() => {
    if (!job.editBusy) setRegenBusyIndex(null);
  }, [job.editBusy]);

  // Refresh the balance whenever a render reaches a terminal state (it just
  // settled or refunded), so the chip reflects the charge without a reload.
  useEffect(() => {
    if (['ready', 'complete', 'failed', 'cancelled'].includes(job.status)) credits.refresh();
  }, [job.status]);

  // Surface a 402 block from generate/plan as the insufficient card.
  useEffect(() => { if (job.blocked) setBlockInfo(job.blocked); }, [job.blocked]);

  // Pre-compute the render cost for the storyboard header (flat by duration tier).
  // Recomputes when the duration or the live balance changes so affordability stays honest.
  useEffect(() => {
    const tier = meta.duration_seconds <= 60 ? '60' : meta.duration_seconds <= 120 ? '120' : '180';
    credits.priceFor('film', tier).then(setRenderCost);
  }, [meta.duration_seconds, credits.balance]);

  // ── stage composition ──
  const reviewCells = useMemo(
    () => (authoring.shots ? authoring.shots.map(shotToCell) : null),
    [authoring.shots]
  );
  const stageState =
    job.contentBlock ? 'blocked'                       // photoreal adults-only block — show the card
    : job.editBusy ? 'edit'
    : job.stage === 'edit' ? 'edit'
    : job.stage === 'plate_review' ? 'plate_review'   // paused: Meet the cast
    : job.stage === 'render' ? 'render'
    : reviewCells ? 'review'
    : 'empty';
  const beats =
    stageState === 'review' ? reviewCells
    : (stageState === 'render' || stageState === 'edit') ? job.cells
    : [];

  // ── handlers ──
  const onSelectBeat = useCallback((index) => {
    const b = beats.find(x => x.index === index);
    if (!b) return;
    const saved = editsByIndex[index];
    setEditing({
      index, kind: b.kind,
      visual: saved ? (saved.visual ?? b.visual) : b.visual,
      present: b.present || [],
      lines: saved ? (saved.lines ?? b.lines ?? []) : (b.lines || []),
      activeSpeaker: null,   // which name chip's line box is open (null = none)
    });
  }, [beats, editsByIndex]);

  const onChangeEditVisual = useCallback((visual) => setEditing(e => e && { ...e, visual }), []);

  // Click a name chip → open that speaker's line box (Narrator always allowed).
  const onPickSpeaker = useCallback((speaker) =>
    setEditing(e => e && { ...e, activeSpeaker: e.activeSpeaker === speaker ? null : speaker }), []);

  // Remove a character from THIS shot: drop them from present AND drop any line
  // they had (a line needs a present speaker). One action, both effects.
  const onRemovePresent = useCallback((name) => setEditing(e => {
    if (!e) return e;
    return {
      ...e,
      present: (e.present || []).filter(n => n !== name),
      lines: (e.lines || []).filter(l => l.speaker !== name),
      activeSpeaker: e.activeSpeaker === name ? null : e.activeSpeaker,
    };
  }), []);

  // Edit the active speaker's line text. Empty text = that speaker is silent
  // (their line is dropped from the list on change).
  const onChangeLine = useCallback((text) => setEditing(e => {
    if (!e || !e.activeSpeaker) return e;
    const who = e.activeSpeaker;
    const isNarrator = who === 'Narrator';
    const others = e.lines.filter(l => l.speaker !== who);
    const trimmed = text;
    const nextLines = trimmed.trim()
      ? [...others, { speaker: who, text: trimmed, kind: isNarrator ? 'vo' : 'dialogue' }]
      : others;   // cleared → silent
    return { ...e, lines: nextLines };
  }), []);

  const onCloseEdit = useCallback(() => setEditing(null), []);
  const onSaveEdit = useCallback(() => {
    // a one-line edit of a merged clip is kept under its own key, never as the whole clip's
    if (editing) setEditsByIndex(m => ({ ...m,
      [editing.targetSourceIndex != null ? `${editing.index}:${editing.targetSourceIndex}` : editing.index]:
        { visual: editing.visual, lines: editing.lines } }));
    setEditing(null);
  }, [editing]);

  const doGenerate = useCallback((script) => {
    job.generate({
      script, title: authoring.title, film_project_id: projectId,
      duration_seconds: meta.duration_seconds, video_style: meta.video_style,
      aspect_ratio: meta.aspect_ratio,
      expectedShots: reviewCells ? reviewCells.length : 0,
    });
  }, [job, authoring.title, projectId, meta, reviewCells]);

  // "Review cast first" — same inputs as doGenerate, routed to the plan phase
  // (director + cast, then pause for review before the full film is made).
  const doPlan = useCallback((script) => {
    job.plan({
      script, title: authoring.title, film_project_id: projectId,
      duration_seconds: meta.duration_seconds, video_style: meta.video_style,
      aspect_ratio: meta.aspect_ratio,
      expectedShots: reviewCells ? reviewCells.length : 0,
    });
  }, [job, authoring.title, projectId, meta, reviewCells]);

  const onBuildFilm = useCallback(async () => {
    // A saved edited script wins over re-finalizing (the user hand-tuned it).
    if (savedScript) { doGenerate(savedScript); return; }
    const rec = await authoring.finalize();
    if (rec && !rec.shots && rec.script) doGenerate(rec.script);
  }, [authoring, doGenerate, savedScript]);

  // "Review cast first": finalize the script, then run the plan phase (which
  // pauses at Meet the cast) instead of making the film straight through.
  const onReviewCast = useCallback(async () => {
    // Grey the funnel synchronously, before the await, so the finalize() gap
    // can't invite a second click. If we never reach doPlan (finalize failed, or
    // no script came back), release the flag so the button returns to entry.
    setCastKickoff(true);
    try {
      if (savedScript) { doPlan(savedScript); return; }
      const rec = await authoring.finalize();
      const script = (rec && rec.script) || authoring.script;
      if (script) doPlan(script);
      else setCastKickoff(false);
    } catch (e) {
      setCastKickoff(false);
    }
  }, [authoring, doPlan, savedScript]);

  // Save an edited script to the project. The saved text then takes precedence
  // for Make/Review; the render's condense_script fits it to the chosen duration.
  const onSaveScript = useCallback(async (script) => {
    try {
      await filmSaveScript(projectId, script);
      setSavedScript(script);
      return true;
    } catch (e) { return false; }
  }, [projectId]);

  // Cast review actions (only meaningful while stageState === 'plate_review').
  const onRedrawCast = useCallback((name, description) =>
    job.regeneratePlate(name, description), [job]);
  // Photo upload: the endpoint takes a URL, so upload the File to storage first,
  // then hand the resulting photo_url to the stylize endpoint. If the (parallel)
  // consent POST hadn't landed yet, the stylize call returns consentRequired —
  // record consent and retry once so a fast picker doesn't lose the upload.
  const onUploadCastPhoto = useCallback(async (name, file) => {
    const { photo_url } = await filmUploadPhoto(file);
    let res = await job.uploadCharacterImage(name, photo_url);
    if (res && res.consentRequired) {
      await filmUploadConsent();
      res = await job.uploadCharacterImage(name, photo_url);
    }
    return res;
  }, [job]);
  const onAcceptUploadConsent = useCallback(() => filmUploadConsent(), []);
  const onApproveCast = useCallback(() => job.approveRender(), [job]);

  const onGenerate = useCallback(() => {
    if (authoring.script) doGenerate(authoring.script);
  }, [authoring.script, doGenerate]);

  // Recompose the visual + the attributed lines into the labeled script grammar,
  // each line emitted as its speaker's cue so the director re-plans with correct
  // attribution (a present character speaks dialogue; Narrator/named speaker for
  // V.O.). A line always belongs to whoever the user opened the box for, so it
  // can't orphan.
  const composeBeatScript = (visual, lines) => {
    const out = [];
    if (visual && visual.trim()) out.push(`VISUAL: ${visual.trim()}`);
    (lines || []).forEach(l => {
      const who = (l.speaker || '').trim().toUpperCase();
      if (!l.text || !l.text.trim()) return;
      if (l.kind === 'vo' || who === 'NARRATOR') out.push(`${who || 'NARRATOR'} (V.O.)\n${l.text.trim()}`);
      else out.push(`${who}\n${l.text.trim()}`);
    });
    return out.join('\n');
  };

  const onRegenerateFromEdit = useCallback(() => {
    if (!editing) return;
    const idx = editing.index;
    if (editing.targetSourceIndex != null) {
      // ONE LINE of a merged clip: the edit routes to that line's own shot; the clip splits
      // into one shot per line (dissolve) and only this one is re-directed.
      const o = editing.original || {};
      const text = composeBeatScript(editing.visual, editing.lines);
      const unchanged = text === composeBeatScript(o.visual, o.lines);
      const presentChanged = JSON.stringify((editing.present || []).slice().sort())
                             !== JSON.stringify((o.present || []).slice().sort());
      if (job.isLocked()) return;   // one job at a time — the editor stays open
      setRegenBusyIndex(idx);
      job.regenerate(idx, null, unchanged ? null : text,
        (presentChanged && (editing.present || []).length) ? editing.present : undefined,
        editing.targetSourceIndex);
      setEditing(null);
      return;
    }
    const b = beats.find(x => x.index === idx);
    const text = composeBeatScript(editing.visual, editing.lines);
    // Honest payload (2026-08-21 incident): send edited_text only when the
    // composition actually DIFFERS from the beat's current text — an unchanged
    // beat is a fresh take, not a re-direction. Same for present: only when a
    // pill was actually toggled, and never an empty list (removing everyone is
    // never the intent of a regenerate).
    const unchanged = b && text === composeBeatScript(b.visual, b.lines);
    const presentChanged = b && JSON.stringify((editing.present || []).slice().sort())
                             !== JSON.stringify((b.present || []).slice().sort());
    if (job.isLocked()) return;   // one job at a time — the editor stays open
    setEditsByIndex(m => ({ ...m,
      [idx]: { visual: editing.visual, lines: editing.lines, present: editing.present } }));
    setRegenBusyIndex(idx);
    job.regenerate(idx, null,
      unchanged ? null : text,
      (presentChanged && (editing.present || []).length) ? editing.present : undefined);
    setEditing(null);
  }, [editing, job, beats]);

  const onRegenerate = useCallback((index) => {
    // Bare regenerate = "roll these dice again": same authored beat, no text,
    // no override. Any saved edit was already applied by the edit-regenerate
    // that saved it — re-sending it here made every retry a re-direction
    // (the 2026-08-21 biscuit-Wicklow loop).
    if (job.isLocked()) return;
    setRegenBusyIndex(index);
    job.regenerate(index, null, null);
  }, [job]);

  // Cut / Duplicate send each beat AS STORED (beatPayload): the reassemble saves the
  // list it receives, so the old display-only payload wiped every shot's visual, lines,
  // cast, location and voices after one cut. Locked preview-wall cells are never sent.
  const onCut = useCallback((index) => {
    const next = job.cells.filter(c => c.status !== 'locked' && c.index !== index).map(beatPayload);
    return job.reassemble(next);
  }, [job]);

  const onDuplicate = useCallback((index) => {
    const out = [];
    job.cells.filter(c => c.status !== 'locked').forEach(c => {
      out.push(beatPayload(c));
      if (c.index === index) out.push(JSON.parse(JSON.stringify(out[out.length - 1])));
    });
    return job.reassemble(out);
  }, [job]);

  const onExport = useCallback(() => {
    if (job.outputUrl) window.open(job.outputUrl, '_blank', 'noopener');
  }, [job.outputUrl]);

  // "Finish your film" — promote THIS completed preview into the full 720p render.
  // All spend lives in job.finish(): it creates the new full job, reserves the full
  // price, and switches the workspace to the live render. A 402 flows through
  // job.blocked → the InsufficientCard below (top-up primary). Idempotent server-
  // side, so a double-click can't double-spend.
  const onFinish = useCallback(() => { job.finish(projectId); }, [job, projectId]);

  // Promote is offered only for a CONFIRMED standalone film that has rendered —
  // a look is locked at its first Seedance render, not before, and an episode is
  // already in a series. (Fresh in-session films have seriesId===undefined → the
  // affordance appears on their next open, via the resume path.)
  const canPromote = seriesId === null && job.status === 'ready';

  // ── SERIES EPISODE features (2026-10-12) — each feature-detects its own switch (404 → hidden) ──
  const isEpisode = typeof seriesId === 'number';

  // "Previously on": options for a finished episode; refreshed whenever an edit lands.
  const [recap, setRecap] = useState(null);
  useEffect(() => {
    let off = false;
    if (!isEpisode || !job.jobId || job.status !== 'complete' || job.editBusy) return undefined;
    filmGetRecap(job.jobId).then((r) => { if (!off) setRecap(r); })
      .catch(() => { if (!off) setRecap(null); });   // 404 = switch off / not ours → no bar
    return () => { off = true; };
  }, [isEpisode, job.jobId, job.status, job.editBusy]);
  const onRecap = useCallback((opts) => job.recap(opts), [job]);

  // "Review episode": a report the user asks for. 404 → the switch is off: hide the button.
  const [review, setReview] = useState(null);
  const [reviewOff, setReviewOff] = useState(false);
  const onReview = useCallback(async () => {
    setReview({ busy: true });
    try { setReview({ data: await filmReviewEpisode(projectId, savedScript || undefined) }); }
    catch (e) {
      const st = e && e.response && e.response.status;
      if (st === 404) { setReviewOff(true); setReview(null); return; }
      setReview({ error: (e && e.response && e.response.data && e.response.data.error) || friendlyError(e) });
    }
  }, [projectId, savedScript]);

  // One line of a merged clip, edited on its own (target_source_index on regenerate).
  const onEditLine = useCallback((index, sourceIndex, lineNo) => {
    const b = beats.find(x => x.index === index);
    const sub = b && (b.subLines || []).find(l => l.sourceIndex === sourceIndex);
    if (!sub) return;
    const saved = editsByIndex[`${index}:${sourceIndex}`];
    setEditing({
      index, kind: b.kind, targetSourceIndex: sourceIndex, lineNo,
      visual: saved ? saved.visual : sub.visual, present: (sub.present && sub.present.length) ? sub.present : (b.present || []),
      lines: saved ? saved.lines : [{ speaker: sub.speaker, text: sub.text, kind: sub.kind }],
      original: { visual: sub.visual, lines: [{ speaker: sub.speaker, text: sub.text, kind: sub.kind }],
                  present: (sub.present && sub.present.length) ? sub.present : (b.present || []) },
      activeSpeaker: sub.speaker || null,
    });
  }, [beats, editsByIndex]);

  // ── EDITORS' ROOM wiring (2026-08-25) ──
  // The tab unlocks when a rendered film with beats exists; the chat's intents
  // apply through the SAME machinery the storyboard buttons use — regenerate
  // goes through job.regenerate with the intent's contract fields (which map
  // 1:1 onto filmRegenerate's signature), cut/duplicate reuse onCut/onDuplicate
  // verbatim. Chat is a natural-language front end to existing operations;
  // nothing new can happen to a film from here that a button couldn't do.
  // 'ready' is the in-session render-finished status; an EXISTING film adopted
  // into the workspace reports 'complete' (both appear in the credits-refresh
  // list above) — the tab must unlock for BOTH, or the Editor's Room only ever
  // exists for films rendered in the current session (the 2026-08-25 "can't
  // see the editor's space" report). editorMode.active is the server's own
  // confirmation from the stream's mode line — trust it as a third unlock.
  const editorAvailable = (['ready', 'complete'].includes(job.status) && beats.length > 0)
                          || !!(authoring.editorMode && authoring.editorMode.active);
  // ONE JOB AT A TIME (TD-20): an intent applies only when nothing else is running,
  // and is ticked "applied" only when its job actually started.
  const onApplyEditIntent = useCallback(async (proposalId, intentIdx, intent) => {
    if (!intent || job.isLocked()) return;
    let started = false;
    if (intent.action === 'regenerate') {
      setRegenBusyIndex(intent.beat_index);
      started = await job.regenerate(intent.beat_index, intent.note || null,
                     intent.edited_text || null,
                     (intent.present && intent.present.length) ? intent.present : undefined);
    } else if (intent.action === 'cut') {
      started = await onCut(intent.beat_index);
    } else if (intent.action === 'duplicate') {
      started = await onDuplicate(intent.beat_index);
    }
    if (started) authoring.markIntentApplied(proposalId, intentIdx);
  }, [job, onCut, onDuplicate, authoring]);

  // ── the single-funnel lifecycle (2026-08-26) ──
  // ONE morphing CTA replaces the old competing "Review cast" / "Make the film"
  // pair. Its state derives from the job (reload-safe) — job.status leads, and
  // job.live splits the two processing renders (cast plan vs approved film). The
  // transient castKickoff only fills the pre-status finalize() gap. Order is
  // load-bearing: check the durable job states first, kickoff last.
  //   entry          → enabled  "Review cast"     → onReviewCast (plan phase)
  //   cast_rendering → greyed   "Reviewing the cast…"
  //   cast_ready     → enabled  "Make the film"   → onApproveCast (approve plan)
  //   film_rendering → greyed   "Making the film…"
  //   editing        → greyed   "Regenerating shot N…" (the live editBusy label)
  //   done           → bar hidden (storyboard + Editor's Room take over)
  //
  // editBusy is checked FIRST and is load-bearing (2026-09-25). A regenerate sets
  // status='processing' locally while the manifest is still the FINISHED film's
  // (live:false), so without this branch the chain fell through to
  // 'cast_rendering' — the locked CTA read "Reviewing the cast…" and the
  // storyboard swapped the shot grid for the "Building your cast…" skeleton,
  // both wrong: no cast is being built, one shot is being remade.
  const castPhase =
      job.editBusy                     ? 'editing'
    : job.status === 'awaiting_review' ? 'cast_ready'
    : job.status === 'complete'        ? 'done'
    : job.status === 'processing'      ? (job.live ? 'film_rendering' : 'cast_rendering')
    : castKickoff                      ? 'cast_rendering'   // click→finalize gap
    : 'idle';   // idle | failed → entry (failed offers a retry)

  return (
    <>
    <FilmWorkspace
      title={job.title || authoring.title}
      loading={loading}
      onBackToFilms={onBackToFilms}
      stageState={stageState}
      contentBlock={job.contentBlock}
      beats={beats}
      aspectRatio={meta.aspect_ratio}
      videoStyle={meta.video_style}
      durationSeconds={meta.duration_seconds}
      onDurationChange={(v) => {
        setMeta(m => ({ ...m, duration_seconds: v }));
        authoring.setLength(v);   // TD-18: the room hears it on the next message
      }}
      credits={credits}
      onShowCredits={() => navigate('/billing')}
      cost={renderCost ? renderCost.price : null}
      costAffordable={renderCost ? renderCost.affordable : null}
      cast={job.reviewCharacters}
      places={job.reviewLocations}
      placesStatus={job.locationsStatus}
      onRedrawPlace={job.redrawLocation}
      onRevertPlace={job.revertLocation}
      planningCast={job.planningPlates}
      onRedrawCast={onRedrawCast}
      onUploadCastPhoto={onUploadCastPhoto}
      onAcceptUploadConsent={onAcceptUploadConsent}
      onApproveCast={onApproveCast}
      selectedBeat={editing ? editing.index : null}
      progress={job.progress}
      finalUrl={job.outputUrl}
      editBusy={job.editBusy}
      notice={job.notice}
      onDismissNotice={job.clearNotice}
      busyLabel={job.editBusy}
      recap={isEpisode ? recap : null}
      onRecap={isEpisode ? onRecap : null}
      onEditLine={onEditLine}
      carryProjectId={isEpisode ? projectId : null}
      canReview={isEpisode && !reviewOff && !!(authoring.scriptReady || savedScript)}
      onReview={onReview}
      review={review}
      onDismissReview={() => setReview(null)}
      regenBusyIndex={regenBusyIndex}
      onSelectBeat={onSelectBeat}
      onGenerate={onGenerate}
      onExport={onExport}
      onFinish={onFinish}
      onStop={job.cancel}
      onRegenerate={onRegenerate}
      onDuplicate={onDuplicate}
      onCut={onCut}
      canPromote={canPromote}
      onPromote={() => setPromoteOpen(true)}
      messages={authoring.messages}
      chatSub={authoring.busy || authoring.streamingActive
        ? 'thinking…'
        : (() => {
            const msg = job.error || authoring.error || '';
            // Header subtitle is one tight line; a long backend error would stretch
            // it and break the header. Cap here — full error still shows in chat,
            // and the .film-hsub ellipsis (CSS) handles the rest.
            return msg.length > 90 ? msg.slice(0, 88).trimEnd() + '\u2026' : msg;
          })()}
      streamingActive={authoring.streamingActive}
      streamingText={authoring.streamingText}
      thinking={authoring.thinking}
      editorAvailable={editorAvailable}
      editorMode={authoring.editorMode}
      editProposal={authoring.editProposal}
      chatMode={authoring.chatMode}
      onSetChatMode={authoring.setChatMode}
      onApplyEditIntent={onApplyEditIntent}
      onDismissProposal={authoring.dismissProposal}
      editingBeat={editing}
      onCloseEdit={onCloseEdit}
      onChangeEditVisual={onChangeEditVisual}
      onPickSpeaker={onPickSpeaker}
      onRemovePresent={onRemovePresent}
      onChangeLine={onChangeLine}
      onRegenerateFromEdit={onRegenerateFromEdit}
      onSaveEdit={onSaveEdit}
      onSend={authoring.send}
      scriptReady={authoring.scriptReady}
      onBuildFilm={onBuildFilm}
      onReviewCast={onReviewCast}
      castPhase={castPhase}
      onSaveScript={onSaveScript}
    />
    {blockInfo && (
      <div
        className="film-modal-scrim"
        onClick={() => { setBlockInfo(null); job.clearBlocked && job.clearBlocked(); }}
      >
        <div className="film-modal-body" onClick={(e) => e.stopPropagation()}>
          <InsufficientCard
            needed={blockInfo.needed}
            available={blockInfo.available}
            shortBy={blockInfo.shortBy}
            title={blockInfo.title}
            message={blockInfo.message}
            onTopUp={() => navigate('/billing')}
            onUpgrade={() => navigate('/billing')}
            onCancel={() => { setBlockInfo(null); job.clearBlocked && job.clearBlocked(); }}
          />
        </div>
      </div>
    )}
    {promoteOpen && (
      <FilmSeriesModals
        modal={{ type: 'promote', film: { project_id: projectId, title: job.title || authoring.title } }}
        onClose={() => setPromoteOpen(false)}
        actions={{ promote: (id, opts) => filmPromoteToSeries(id, opts).then((r) => { setTimeout(onBackToFilms, 0); return r; }) }}
      />
    )}
    </>
  );
}