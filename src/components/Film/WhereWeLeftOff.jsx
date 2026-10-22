// src/components/Film/WhereWeLeftOff.jsx
// "WHERE WE LEFT OFF" (2026-10-12, SERIES_CARRY=1) — the top of a series episode's
// writers' room. Shows how the previous episode ended for each character, lets the user
// say how this episode starts (Continues / Later / New setting) and drop anything that
// shouldn't carry. The server rebuilds the writer's context from this on every message,
// so a change applies to the next message. Nothing here reaches Seedance directly.
//
// GET/PUT /film/projects/:id/carry. A 404 (switch off) or "not a series episode" /
// "first episode" hides the card; "fills in once Episode N is rendered" shows as a line.

import React, { useEffect, useState } from 'react';
import { filmGetCarry, filmSaveCarry, friendlyError } from './filmApi';
import { IconChevron } from './filmIcons';

const REL = [
  { k: 'continues', l: 'Continues', tip: 'Same moment, same place — posture and position carry too' },
  { k: 'later', l: 'Later', tip: 'Same world, time has passed — lasting things carry, the scene resets' },
  { k: 'new_setting', l: 'New setting', tip: 'A different place or period — lasting things carry, the scene resets' },
];
const NOTE = {
  continues: (ep) => `Picks up the same moment, same place — the first shot opens on Episode ${ep}\u2019s final frame when the scene allows.`,
  later: () => 'Time has passed. Injuries, damaged clothes and what they wear carry; where they stood resets.',
  new_setting: () => 'A different place or period. Lasting things carry; the scene resets.',
};
// series_snapshot sources: body (injury when lasting, posture/position when scene-only),
// condition (soaked, torn…), garment (on/off), outfit (a changed costume).
const kindOf = (it) => (it.kind === 'scene_only' ? 'scene'
  : it.source === 'body' ? 'injury'
  : it.source === 'condition' ? (it.damage ? 'damage' : 'clothes')
  : it.source === 'garment' ? 'wearing'
  : it.source === 'outfit' ? 'outfit' : 'carries');
const HIDE = /first episode|series episodes/i;

export default function WhereWeLeftOff({ projectId, compact = false }) {
  const [view, setView] = useState(null);
  const [hidden, setHidden] = useState(true);
  const [open, setOpen] = useState(!compact);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let off = false;
    setHidden(true); setView(null); setErr(null);
    if (!projectId) return undefined;
    filmGetCarry(projectId).then((v) => {
      if (off) return;
      if (!v || (!v.available && HIDE.test(v.reason || ''))) return;
      setView(v); setHidden(false);
    }).catch(() => {});   // 404 = switch off → stay hidden
    return () => { off = true; };
  }, [projectId]);
  useEffect(() => { setOpen(!compact); }, [compact]);

  if (hidden || !view) return null;
  if (!view.available) {
    return <div className="fw-wwlo fw-wwlo--wait" title="This card fills in from the previous episode's finished film">
      <b>Where we left off</b> · {view.reason}</div>;
  }

  const save = async (body) => {
    setBusy(true); setErr(null);
    try { setView(await filmSaveCarry(projectId, body)); }
    catch (e) { setErr((e && e.response && e.response.data && e.response.data.error) || friendlyError(e)); }
    finally { setBusy(false); }
  };
  const dropped = view.dropped || [];
  const toggleDrop = (key, isDropped) =>
    save({ dropped: isDropped ? dropped.filter((d) => d.toLowerCase() !== key.toLowerCase()) : [...dropped, key] });
  const prev = view.previous_episode || {};
  const where = (view.ending && view.ending.location || '').replace(/_/g, ' ');
  const relLabel = (REL.find((r) => r.k === view.relation) || {}).l;
  const shown = (view.characters || []).filter((c) => (c.items || []).length || c.in_final_scene);

  return (
    <div className={`fw-wwlo${open ? ' is-open' : ''}`}>
      <button type="button" className="fw-wwlo-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}
              title={open ? 'Fold this card away' : 'Show what carries over from the last episode'}>
        <b>Where we left off</b>
        <span>end of Episode {prev.ordinal}{prev.title ? ` · “${prev.title}”` : ''} · {relLabel}</span>
        <IconChevron s={12} dir={open ? 'down' : 'right'} />
      </button>
      {open && (
        <div className="fw-wwlo-body">
          <div className="fw-wwlo-rel" role="radiogroup" aria-label="How this episode starts">
            {REL.map((r) => (
              <button key={r.k} type="button" role="radio" aria-checked={view.relation === r.k} disabled={busy}
                      className={view.relation === r.k ? 'is-on' : ''} onClick={() => save({ relation: r.k })}
                      title={r.tip}>{r.l}</button>
            ))}
          </div>
          <p className="fw-wwlo-note">{(NOTE[view.relation] || NOTE.later)(prev.ordinal)}</p>
          {shown.map((c) => (
            <div className="fw-wwlo-who" key={c.name}>
              <span className="fw-wwlo-name">{c.name}
                {c.last_location && <small> · last seen at {String(c.last_location).replace(/_/g, ' ')}</small>}</span>
              <div className="fw-wwlo-items">
                {(c.items || []).map((it) => {
                  const st = it.dropped ? 'dropped' : it.resets ? 'resets' : 'carried';
                  return (
                    <span key={it.key} className={`fw-wwlo-it is-${st}`}
                          title={st === 'resets' ? `${it.text} — resets: the scene starts fresh`
                                 : st === 'dropped' ? `${it.text} — dropped: the writer won't carry it` : `${it.text} — carries into this episode`}>
                      <span className="k">{kindOf(it)}</span>{it.text}
                      {st !== 'resets' && (
                        <button type="button" disabled={busy} onClick={() => toggleDrop(it.key, it.dropped)}
                                aria-label={it.dropped ? `Carry ${it.text}` : `Drop ${it.text}`}
                                title={it.dropped ? 'Carry this again' : `Don't carry this — ${c.name} starts without it`}>
                          {it.dropped ? '↺' : '×'}</button>
                      )}
                    </span>
                  );
                })}
                {!(c.items || []).length && <span className="fw-wwlo-none">nothing to carry</span>}
              </div>
            </div>
          ))}
          {where && view.relation === 'continues' && (
            <p className="fw-wwlo-note">Last seen: <b>{where}</b>{view.ending.atmosphere ? `, ${view.ending.atmosphere}` : ''}</p>
          )}
          {(view.open_threads || []).length > 0 && (
            <p className="fw-wwlo-note">Open threads: {view.open_threads.map((t, i) => <b key={i}>{i ? ' · ' : ''}{t}</b>)}</p>
          )}
          {err && <p className="fw-wwlo-err">{err}</p>}
        </div>
      )}
    </div>
  );
}