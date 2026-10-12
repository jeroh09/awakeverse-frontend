// src/components/Film/FilmSeriesModals.jsx
// The series pop-out modals, in the double-border language (#1/#2). One host
// component dispatches on a `modal` descriptor; each form owns its state and
// calls a useFilmSeries action. New-episode jumps straight into the existing
// workspace via onOpenFilm(project_id, session_id). No credit UI lives here —
// nothing renders video until an episode's render, which the workspace handles.
//
// modal shapes:
//   { type:'newSeries' }
//   { type:'chain',   series }
//   { type:'promote', film }
//   { type:'refresh', series, character }

import React, { useState, useEffect, useMemo } from 'react';
import './FilmSeries.css';
import { IconPlus, IconChain, IconRefreshLook } from './filmIcons';
import { friendlyError, filmGetPlan } from './filmApi';
import { GENRES, genreHint } from './filmGenres';

// 'realistic' has ALWAYS rendered the painterly stylized_real look (backend
// remap) — the label now says so. 'photoreal' is the Veo tier (2026-08-24):
// true photographic realism, passes through unremapped, routed by VEO_STYLES
// on the worker. Series canon fixes style for every episode, so a photoreal
// series is photoreal for life — exactly like the other four.
const STYLES = ['anime', 'cartoon', 'comic_book', 'realistic', 'photoreal'];
const STYLE_LABEL = { anime: 'Anime', cartoon: 'Cartoon', comic_book: 'Comic',
                      realistic: 'Realistic', stylized_real: 'Realistic',
                      photoreal: 'Photoreal' };
const DURATIONS = [{ v: 60, l: '60s' }, { v: 120, l: '2 min' }, { v: 180, l: '3 min' }];
const ASPECTS = [{ v: '9:16', l: 'Vertical', w: 9, h: 15 }, { v: '1:1', l: 'Square', w: 13, h: 13 }, { v: '16:9', l: 'Widescreen', w: 18, h: 10 }];

function FilmModal({ title, sub, wide, onClose, children }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="fs fs-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`fs-modal${wide ? ' wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <h3>{title}</h3>
        {sub && <p className="fs-msub">{sub}</p>}
        {children}
      </div>
    </div>
  );
}

const Seg = ({ options, value, onChange, render }) => (
  <div className="fs-seg">
    {options.map((o) => {
      const v = o.v ?? o;
      return (
        <button key={v} type="button" className={value === v ? 'is-on' : ''} onClick={() => onChange(v)}
                title={o.tip || (typeof o === 'string' ? `${STYLE_LABEL[v] || v} style` : (o.l || String(v)))}>
          {render ? render(o) : (o.l ?? STYLE_LABEL[v] ?? v)}
        </button>
      );
    })}
  </div>
);

const aspectGlyph = (a) => (<><span className="fs-aspg"><i style={{ width: a.w, height: a.h }} /></span> {a.l}</>);

function Footer({ busy, onClose, submitLabel, onSubmit, disabled, submitTip }) {
  return (
    <div className="fs-mfoot">
      <button className="fs-mbtn ghost" onClick={onClose} disabled={busy} title="Close without saving">Cancel</button>
      <button className="fs-mbtn primary" onClick={onSubmit} disabled={busy || disabled} title={submitTip || submitLabel}>
        {busy ? 'Working…' : submitLabel}
      </button>
    </div>
  );
}

/* ── New Series ── */
function NewSeries({ actions, onClose, onToast }) {
  const [title, setTitle] = useState('');
  const [style, setStyle] = useState('realistic');
  const [aspect, setAspect] = useState('9:16');
  const [bible, setBible] = useState('');
  const [genre, setGenre] = useState(null);       // optional — every episode inherits it
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      await actions.createSeries({ title: title.trim() || 'Untitled Series', video_style: style, aspect_ratio: aspect,
                                   canonical_bible: bible.trim() || undefined, ...(genre ? { genre } : {}) });
      onToast?.('Series created — build Episode 1 in the writers’ room');
      onClose();
    } catch (e) { setErr(friendlyError(e, 'Could not create the series.')); setBusy(false); }
  };
  return (
    <FilmModal title="New series" onClose={onClose}
      sub="Start an empty series. You'll build Episode 1 in the writers' room — its cast is saved and reused from then on.">
      <div className="fs-field"><label>Series title</label>
        <input className="fs-inp" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Bedtime for Big Sister Maya" /></div>
      <div className="fs-field"><label>Style</label><Seg options={STYLES} value={style} onChange={setStyle} /></div>
      <div className="fs-field"><label>Genre <span className="fs-opt">· optional — every episode inherits it; changes nothing on screen</span></label>
        <Seg options={GENRES.map((g) => ({ v: g.key, l: g.label, tip: `${g.label}: ${g.hint}` }))}
             value={genre} onChange={(v) => setGenre(genre === v ? null : v)} />
        <div className="fs-ghint">{genreHint(genre)}</div></div>
      <div className="fs-field"><label>Frame <span className="fs-opt">· fixed for every episode</span></label>
        <Seg options={ASPECTS} value={aspect} onChange={setAspect} render={aspectGlyph} /></div>
      <div className="fs-field"><label>Series bible <span className="fs-opt">· optional, editable later</span></label>
        <textarea className="fs-inp" rows={3} value={bible} onChange={(e) => setBible(e.target.value)}
          placeholder="Premise, style, tone — the DNA every episode stays faithful to. Leave blank and we'll draft it after Episode 1." /></div>
      {err && <div className="fs-merr">{err}</div>}
      <Footer busy={busy} onClose={onClose} submitLabel="Create series" onSubmit={submit} />
    </FilmModal>
  );
}

/* ── New Episode (chain-loader) ──
   SEASON PLAN (2026-10-12): when the series has a plan, the user can start the episode
   FROM A CARD — the card's title fills the title, its relation is shown, and plan_card
   links the card to the new episode (the writers' room gets it as a guide). Opened from
   a card's "Start episode", that card comes preselected. "Something new" sends no card.
   No plan (or the switch off → 404) → the modal is exactly as before. */
const REL_NOTE = {
  continues: 'picks up straight after the last episode — same moment, same place. It opens on that episode\u2019s final frame.',
  later: 'picks up later — lasting things carry (injuries, damaged clothes) and the scene resets.',
  new_setting: 'moves to a new place or period — lasting things still carry.',
  pilot: 'is the pilot.',
};
function ChainLoader({ series, planCard = null, actions, onClose, onOpenFilm, onToast }) {
  const eps = series.episodes || [];
  const [duration, setDuration] = useState(60);
  const [title, setTitle] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);
  const [picked, setPicked] = useState(() => eps.map((e) => e.project_id)); // default: chain all
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [openCards, setOpenCards] = useState([]);   // plan cards with no episode yet
  const [card, setCard] = useState(null);           // chosen card n, or null = something new

  useEffect(() => {
    let off = false;
    filmGetPlan(series.series_id).then((res) => {
      if (off || !res || !res.plan) return;
      const linked = new Set((res.statuses || []).filter((x) => x.project_id).map((x) => x.n));
      const free = (res.plan.cards || []).filter((c) => !c.project_id && !linked.has(c.n));
      setOpenCards(free);
      const pre = free.find((c) => c.n === planCard) || free[0] || null;
      setCard(pre ? pre.n : null);
    }).catch(() => {});   // no plan / switch off → the classic modal
    return () => { off = true; };
  }, [series.series_id, planCard]);

  const chosen = openCards.find((c) => c.n === card) || null;
  useEffect(() => {
    if (!titleTouched) setTitle(chosen && (chosen.logline || '').trim() ? (chosen.title || '') : '');
  }, [card]);   // title follows the chosen card until the user types their own

  const toggle = (id) => setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  // most-recent picked = full; earlier picked = summarised
  const fullId = useMemo(() => {
    const sel = eps.filter((e) => picked.includes(e.project_id));
    return sel.length ? sel[sel.length - 1].project_id : null;
  }, [eps, picked]);

  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      const res = await actions.createEpisode(series.series_id, {
        title: title.trim() || undefined, prior_episode_ids: picked, duration_seconds: duration,
        ...(chosen ? { plan_card: chosen.n } : {}),
      });
      onToast?.(`Episode ${res.episode_ordinal} created`);
      onClose();
      onOpenFilm?.(res.project_id, res.session_id);   // straight into the writers' room
    } catch (e) { setErr(friendlyError(e, 'Could not create the episode.')); setBusy(false); }
  };
  return (
    <FilmModal wide title={`New episode · ${series.title}`} onClose={onClose}
      sub={openCards.length
        ? 'The cast and bible come in automatically. Start from a card in your season plan, or write something new.'
        : 'The cast and bible come in automatically. Choose which earlier episodes to carry forward for continuity.'}>
      {openCards.length > 0 && (
        <div className="fs-field"><label>Start from the plan <span className="fs-opt">· optional</span></label>
          <div className="fs-cardpick" role="radiogroup" aria-label="Season plan card">
            {openCards.map((c) => (
              <button key={c.n} type="button" role="radio" aria-checked={card === c.n}
                      className={`fs-cp${card === c.n ? ' is-on' : ''}`} onClick={() => setCard(c.n)}
                      title={(c.logline || '').trim() ? `Make this episode from card ${c.n}: ${c.logline}` : `Use card ${c.n}'s role as a guide`}>
                <span className="fs-cp-dot" />
                <span className="fs-cp-txt"><b>Card {c.n} · {(c.logline || '').trim() ? (c.title || 'Untitled') : (c.act || 'Episode')}</b>
                  <small>{(c.logline || '').trim() ? c.logline : (c.hint || 'Your story')}</small></span>
              </button>
            ))}
            <button type="button" role="radio" aria-checked={card === null}
                    className={`fs-cp${card === null ? ' is-on' : ''}`} onClick={() => setCard(null)}
                    title="Write an episode that isn\u2019t on the plan">
              <span className="fs-cp-dot" />
              <span className="fs-cp-txt"><b>Something new</b><small>Not on the plan — the writer follows your lead.</small></span>
            </button>
          </div>
          {chosen && eps.length > 0 && REL_NOTE[chosen.relation] && (
            <div className="fs-hint">This episode <b>{chosen.relation === 'new_setting' ? 'moves on' : chosen.relation === 'continues' ? 'continues' : 'starts later'}</b>: {REL_NOTE[chosen.relation]} You can change this on the episode&rsquo;s &ldquo;Where we left off&rdquo; card.</div>
          )}
        </div>
      )}
      <div className="fs-field"><label>Duration</label><Seg options={DURATIONS} value={duration} onChange={setDuration} /></div>
      <div className="fs-field"><label>Episode title <span className="fs-opt">· {chosen ? 'from the card, editable' : 'optional'}</span></label>
        <input className="fs-inp" value={title} onChange={(e) => { setTitle(e.target.value); setTitleTouched(true); }} placeholder={`Episode ${(eps.length || 0) + 1}`} /></div>
      <div className="fs-field">
        <details className="fs-chainbox" open={!openCards.length}>
          <summary title="Choose which earlier episodes the writer remembers">Chain earlier episodes <span className="fs-opt">· {picked.length} selected</span></summary>
          <div className="fs-chain">
            {eps.map((e) => {
              const on = picked.includes(e.project_id);
              return (
                <div key={e.project_id} className={`fs-chk${on ? ' is-on' : ''}`} onClick={() => toggle(e.project_id)}
                     title={on ? 'Leave this episode out of the new episode\'s memory' : 'Let the writer remember this episode'}>
                  <span className="fs-box">✓</span>
                  <span className="fs-ct">Episode {e.episode_ordinal} · {e.title || 'Untitled'}</span>
                  {on && (e.project_id === fullId
                    ? <span className="fs-full-b">full script</span>
                    : <span className="fs-sum-b">summarised</span>)}
                </div>
              );
            })}
            {!eps.length && <div className="fs-hint">This is the first episode — nothing to chain yet.</div>}
          </div>
          {eps.length > 0 && (
            <div className="fs-hint">The <b>most recent</b> episode you pick is given in <b>full</b>; earlier ones are <b>summarised</b> so continuity stays sharp. Pick as many as you like.</div>
          )}
        </details>
      </div>
      {err && <div className="fs-merr">{err}</div>}
      <Footer busy={busy} onClose={onClose} submitLabel="Create episode" onSubmit={submit}
              submitTip="Open the writers\u2019 room for this episode — writing is free" />
    </FilmModal>
  );
}

/* ── Promote a finished film to a series ── */
function Promote({ film, actions, onClose, onToast }) {
  const [title, setTitle] = useState(film?.title || '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      await actions.promote(film.project_id || film.id, { title: title.trim() || undefined });
      onToast?.('Series created — this film is now Episode 1');
      onClose();
    } catch (e) { setErr(friendlyError(e, 'Could not start a series from this film.')); setBusy(false); }
  };
  return (
    <FilmModal title="Start a series from this film" onClose={onClose}>
      <p className="fs-msub">This film becomes <b>Episode 1</b>. Its cast — with their locked looks — is saved so every future episode reuses them.</p>
      <div className="fs-field"><label>Series title</label>
        <input className="fs-inp" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div className="fs-hint">We'll read the cast and plates from this finished film and draft a short series bible from its script. Nothing is re-rendered.</div>
      {err && <div className="fs-merr">{err}</div>}
      <Footer busy={busy} onClose={onClose} submitLabel="Create series" onSubmit={submit} />
    </FilmModal>
  );
}

/* ── Refresh a character's canonical look ── */
function Refresh({ series, character, actions, onClose, onToast }) {
  const [desc, setDesc] = useState(character?.description || '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      await actions.refreshCharacterPlate(series.series_id, character.id ?? character.series_character_id, {
        regenerate: true, description: desc.trim() || undefined,
      });
      onToast?.(`${character.name}'s look refreshed — future episodes use the new plate`);
      onClose();
    } catch (e) { setErr(friendlyError(e, 'Could not refresh the look.')); setBusy(false); }
  };
  return (
    <FilmModal title={`Refresh look · ${character?.name || ''}`} onClose={onClose}>
      <p className="fs-msub">Regenerate this character's canonical plate — same identity, refreshed. This becomes the look every <b>future</b> episode uses; already-rendered episodes keep their frames.</p>
      <div className="fs-field"><label>Description</label>
        <textarea className="fs-inp" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
      <div className="fs-hint">Kept anchored to the current plate so the face stays consistent — a refresh, not a new character.</div>
      {err && <div className="fs-merr">{err}</div>}
      <Footer busy={busy} onClose={onClose} submitLabel="Regenerate & lock" onSubmit={submit} />
    </FilmModal>
  );
}

export default function FilmSeriesModals({ modal, onClose, actions, onOpenFilm, onToast }) {
  if (!modal) return null;
  switch (modal.type) {
    case 'newSeries': return <NewSeries actions={actions} onClose={onClose} onToast={onToast} />;
    case 'chain':     return <ChainLoader series={modal.series} planCard={modal.planCard ?? null} actions={actions} onClose={onClose} onOpenFilm={onOpenFilm} onToast={onToast} />;
    case 'promote':   return <Promote film={modal.film} actions={actions} onClose={onClose} onToast={onToast} />;
    case 'refresh':   return <Refresh series={modal.series} character={modal.character} actions={actions} onClose={onClose} onToast={onToast} />;
    default:          return null;
  }
}