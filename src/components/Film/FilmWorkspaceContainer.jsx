// src/components/Film/FilmWorkspaceContainer.jsx
// Smart wrapper bound to ONE film project. Mounted by FilmMode with either a
// freshly-created project (projectId + initialSessionId, empty chat) or an
// existing one to resume (projectId only → GET /projects/:id restores chat +
// render). Chat persists because the session is the project's bound session.

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import FilmWorkspace from './FilmWorkspace';
import useFilmAuthoring from './useFilmAuthoring';
import useFilmJob from './useFilmJob';
import { filmGetProject, filmUploadPhoto, filmUploadConsent, friendlyError } from './filmApi';

const shotToCell = s => ({
  index: s.index,
  kind: s.kind || 'pure_visual',
  seconds: Math.round(s.seconds || s.duration || 6),
  speaker: (s.speaker || '').trim(),
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
  const [editing, setEditing] = useState(null);
  const [editsByIndex, setEditsByIndex] = useState({});
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ video_style: 'anime', duration_seconds: 60, aspect_ratio: '9:16' });
  // Per-beat busy flag — threaded to the individual Regenerate button (not just
  // the stage overlay) so a click registers visibly the instant it's pressed.
  // Fixes handover §2a: "Regenerate button shows no state".
  const [regenBusyIndex, setRegenBusyIndex] = useState(null);

  // Mount: adopt the fresh session, or resume the project.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      if (initialSessionId) {
        authoring.adopt({ session_id: initialSessionId, messages: [] });
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
        setMeta({ video_style: p.video_style || 'anime', duration_seconds: p.duration_seconds || 60,
                  aspect_ratio: p.aspect_ratio || '9:16' });
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
    const text = editsByIndex[index] ?? (b.speaker ? `${b.speaker}: "${b.caption}"` : b.caption);
    setEditing({ index, kind: b.kind, text });
  }, [beats, editsByIndex]);

  const onChangeEditText = useCallback((text) => setEditing(e => e && { ...e, text }), []);
  const onCloseEdit = useCallback(() => setEditing(null), []);
  const onSaveEdit = useCallback(() => {
    if (editing) setEditsByIndex(m => ({ ...m, [editing.index]: editing.text }));
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
    const rec = await authoring.finalize();
    if (rec && !rec.shots && rec.script) doGenerate(rec.script);
  }, [authoring, doGenerate]);

  // "Review cast first": finalize the script, then run the plan phase (which
  // pauses at Meet the cast) instead of making the film straight through.
  const onReviewCast = useCallback(async () => {
    const rec = await authoring.finalize();
    const script = (rec && rec.script) || authoring.script;
    if (script) doPlan(script);
  }, [authoring, doPlan]);

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

  const onRegenerateFromEdit = useCallback((text) => {
    if (!editing) return;
    const idx = editing.index;
    setEditsByIndex(m => ({ ...m, [idx]: text }));
    setRegenBusyIndex(idx);
    // Edited text drives a full re-plan: the director re-conceives this shot.
    job.regenerate(idx, null, text);
    setEditing(null);
  }, [editing, job]);

  const onRegenerate = useCallback((index) => {
    // Card "Regenerate" with no edit → a fresh re-conception of the same beat
    // (any prior local text edit rides along as the re-plan text).
    setRegenBusyIndex(index);
    job.regenerate(index, null, editsByIndex[index] || null);
  }, [job, editsByIndex]);

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

  return (
    <FilmWorkspace
      title={job.title || authoring.title}
      loading={loading}
      onBackToFilms={onBackToFilms}
      stageState={stageState}
      beats={beats}
      aspectRatio={meta.aspect_ratio}
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
      messages={authoring.messages}
      chatSub={authoring.busy || authoring.streamingActive ? 'thinking…' : (job.error || authoring.error || '')}
      streamingActive={authoring.streamingActive}
      streamingText={authoring.streamingText}
      editingBeat={editing}
      onCloseEdit={onCloseEdit}
      onChangeEditText={onChangeEditText}
      onRegenerateFromEdit={onRegenerateFromEdit}
      onSaveEdit={onSaveEdit}
      onSend={authoring.send}
      scriptReady={authoring.scriptReady}
      onBuildFilm={onBuildFilm}
      onReviewCast={onReviewCast}
    />
  );
}