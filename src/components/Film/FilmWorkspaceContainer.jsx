// src/components/Film/FilmWorkspaceContainer.jsx
// Smart wrapper bound to ONE film project. Mounted by FilmMode with either a
// freshly-created project (projectId + initialSessionId, empty chat) or an
// existing one to resume (projectId only → GET /projects/:id restores chat +
// render). Chat persists because the session is the project's bound session.

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FilmWorkspace from './FilmWorkspace';
import useFilmAuthoring from './useFilmAuthoring';
import useFilmJob from './useFilmJob';
import useCredits from '../../hooks/useCredits';
import { InsufficientCard } from './CreditsUI';
import FilmSeriesModals from './FilmSeriesModals';
import { filmGetProject, filmUploadPhoto, filmUploadConsent, filmSaveScript, filmPromoteToSeries, friendlyError } from './filmApi';

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
  // Per-beat busy flag — threaded to the individual Regenerate button (not just
  // the stage overlay) so a click registers visibly the instant it's pressed.
  // Fixes handover §2a: "Regenerate button shows no state".
  const [regenBusyIndex, setRegenBusyIndex] = useState(null);
  // Series awareness: seriesId stays `undefined` for a fresh session (we can't
  // know yet) and is set from GET /projects on resume. `null` = confirmed
  // standalone → promotable once rendered; a number = an episode → not promotable.
  const [seriesId, setSeriesId] = useState(undefined);
  const [promoteOpen, setPromoteOpen] = useState(false);

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
        authoring.adopt({
          session_id: p.session_id, messages: p.messages || [],
          title: p.title, script: p.script, scriptReady: !!p.script,
        });
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
    job.editBusy ? 'edit'
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
    if (editing) setEditsByIndex(m => ({ ...m,
      [editing.index]: { visual: editing.visual, lines: editing.lines } }));
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
    if (savedScript) { doPlan(savedScript); return; }
    const rec = await authoring.finalize();
    const script = (rec && rec.script) || authoring.script;
    if (script) doPlan(script);
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
    setRegenBusyIndex(index);
    job.regenerate(index, null, null);
  }, [job]);

  const onCut = useCallback((index) => {
    const next = job.cells.filter(c => c.index !== index)
      .map(c => ({ index: c.index, clip_url: c.clipUrl, seconds: c.seconds,
                   speaker: c.speaker, caption: c.caption, kind: c.kind, durable: c.durable }));
    job.reassemble(next);
  }, [job]);

  const onDuplicate = useCallback((index) => {
    const out = [];
    job.cells.forEach(c => {
      out.push({ index: c.index, clip_url: c.clipUrl, seconds: c.seconds,
                 speaker: c.speaker, caption: c.caption, kind: c.kind, durable: c.durable });
      if (c.index === index) out.push({ ...out[out.length - 1] });
    });
    job.reassemble(out);
  }, [job]);

  const onExport = useCallback(() => {
    if (job.outputUrl) window.open(job.outputUrl, '_blank', 'noopener');
  }, [job.outputUrl]);

  // Promote is offered only for a CONFIRMED standalone film that has rendered —
  // a look is locked at its first Seedance render, not before, and an episode is
  // already in a series. (Fresh in-session films have seriesId===undefined → the
  // affordance appears on their next open, via the resume path.)
  const canPromote = seriesId === null && job.status === 'ready';

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
                          || authoring.editorMode.active;
  const onApplyEditIntent = useCallback((proposalId, intentIdx, intent) => {
    if (!intent) return;
    if (intent.action === 'regenerate') {
      setRegenBusyIndex(intent.beat_index);
      job.regenerate(intent.beat_index, intent.note || null,
                     intent.edited_text || null,
                     (intent.present && intent.present.length) ? intent.present : undefined);
    } else if (intent.action === 'cut') {
      onCut(intent.beat_index);
    } else if (intent.action === 'duplicate') {
      onDuplicate(intent.beat_index);
    }
    authoring.markIntentApplied(proposalId, intentIdx);
  }, [job, onCut, onDuplicate, authoring]);

  return (
    <>
    <FilmWorkspace
      title={job.title || authoring.title}
      loading={loading}
      onBackToFilms={onBackToFilms}
      stageState={stageState}
      beats={beats}
      aspectRatio={meta.aspect_ratio}
      videoStyle={meta.video_style}
      durationSeconds={meta.duration_seconds}
      onDurationChange={(v) => setMeta(m => ({ ...m, duration_seconds: v }))}
      credits={credits}
      onShowCredits={() => navigate('/billing')}
      cost={renderCost ? renderCost.price : null}
      costAffordable={renderCost ? renderCost.affordable : null}
      cast={job.reviewCharacters}
      planningCast={job.planningPlates}
      onRedrawCast={onRedrawCast}
      onUploadCastPhoto={onUploadCastPhoto}
      onAcceptUploadConsent={onAcceptUploadConsent}
      onApproveCast={onApproveCast}
      selectedBeat={editing ? editing.index : null}
      progress={job.progress}
      finalUrl={job.outputUrl}
      editBusy={job.editBusy}
      regenBusyIndex={regenBusyIndex}
      onSelectBeat={onSelectBeat}
      onGenerate={onGenerate}
      onExport={onExport}
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