// src/components/Film/FilmWorkspaceContainer.jsx
// Smart wrapper: connects the two hooks to the presentational FilmWorkspace.
// This is the component you mount (e.g. from ScenariosTab). It owns the small
// bits of view state the hooks don't — which beat is pulled into the chat editor,
// and the composed stageState (review comes from authoring, render/edit from the job).

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import FilmWorkspace from './FilmWorkspace';
import useFilmAuthoring from './useFilmAuthoring';
import useFilmJob from './useFilmJob';

// directed shot (review) -> storyboard cell
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
  premise = null,               // optional: seed the first chat turn
  durationSeconds = 60,
  videoStyle = 'anime',
  onClose,                      // optional: back out of the workspace
}) {
  const authoring = useFilmAuthoring();
  const job = useFilmJob();
  const [editing, setEditing] = useState(null);   // { index, kind, text }
  const [editsByIndex, setEditsByIndex] = useState({}); // optimistic local text edits

  // start a session on mount
  useEffect(() => { authoring.start(premise); /* eslint-disable-next-line */ }, []);

  // ── compose the stage state + the beats shown on the left ──
  const reviewCells = useMemo(
    () => (authoring.shots ? authoring.shots.map(shotToCell) : null),
    [authoring.shots]
  );

  const stageState =
    job.stage === 'edit' ? 'edit'
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
    const text = editsByIndex[index]
      ?? (b.speaker ? `${b.speaker}: "${b.caption}"` : b.caption);
    setEditing({ index, kind: b.kind, text });
  }, [beats, editsByIndex]);

  const onChangeEditText = useCallback((text) => setEditing(e => e && { ...e, text }), []);
  const onCloseEdit = useCallback(() => setEditing(null), []);
  const onSaveEdit = useCallback(() => {
    if (editing) setEditsByIndex(m => ({ ...m, [editing.index]: editing.text }));
    setEditing(null);
  }, [editing]);

  const onBuildFilm = useCallback(async () => {
    const rec = await authoring.finalize();
    // If the backend dry-compiles on finalize, authoring.shots now drives the
    // review storyboard. If it only returns script text, we skip straight to
    // Generate (render fills the board live).
    if (rec && !rec.shots && rec.script) {
      job.generate({ script: rec.script, title: authoring.title,
        duration_seconds: durationSeconds, video_style: videoStyle });
    }
  }, [authoring, job, durationSeconds, videoStyle]);

  const onGenerate = useCallback(() => {
    if (!authoring.script) return;
    job.generate({
      script: authoring.script, title: authoring.title,
      duration_seconds: durationSeconds, video_style: videoStyle,
      expectedShots: reviewCells ? reviewCells.length : 0,
    });
  }, [authoring.script, authoring.title, job, durationSeconds, videoStyle, reviewCells]);

  const onRegenerateFromEdit = useCallback((text) => {
    if (!editing) return;
    setEditsByIndex(m => ({ ...m, [editing.index]: text }));
    job.regenerate(editing.index, text);
    setEditing(null);
  }, [editing, job]);

  const onRegenerate = useCallback((index) => {
    job.regenerate(index, editsByIndex[index] || null);
  }, [job, editsByIndex]);

  const onCut = useCallback((index) => {
    const next = job.cells.filter(c => c.index !== index)
      .map(c => ({ index: c.index, clip_url: c.clipUrl, seconds: c.seconds,
                   speaker: c.speaker, caption: c.caption, kind: c.kind, durable: c.durable }));
    job.reassemble(next);
  }, [job]);

  const onDuplicate = useCallback((index) => {
    const src = job.cells.find(c => c.index === index);
    if (!src) return;
    const out = [];
    job.cells.forEach(c => {
      out.push({ index: c.index, clip_url: c.clipUrl, seconds: c.seconds,
                 speaker: c.speaker, caption: c.caption, kind: c.kind, durable: c.durable });
      if (c.index === index) out.push({ ...out[out.length - 1] }); // duplicate right after
    });
    job.reassemble(out);
  }, [job]);

  const onExport = useCallback(() => {
    if (job.outputUrl) window.open(job.outputUrl, '_blank', 'noopener');
  }, [job.outputUrl]);

  return (
    <FilmWorkspace
      title={authoring.title}
      stageState={stageState}
      beats={beats}
      selectedBeat={editing ? editing.index : null}
      progress={job.progress}
      onSelectBeat={onSelectBeat}
      onGenerate={onGenerate}
      onExport={onExport}
      onStop={job.cancel}
      onRegenerate={onRegenerate}
      onDuplicate={onDuplicate}
      onCut={onCut}
      messages={authoring.messages}
      chatSub={authoring.busy ? 'thinking…' : (job.error || authoring.error || '')}
      editingBeat={editing}
      onCloseEdit={onCloseEdit}
      onChangeEditText={onChangeEditText}
      onRegenerateFromEdit={onRegenerateFromEdit}
      onSaveEdit={onSaveEdit}
      onSend={authoring.send}
      scriptReady={authoring.scriptReady}
      onBuildFilm={onBuildFilm}
    />
  );
}