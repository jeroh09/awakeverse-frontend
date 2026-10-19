// src/components/Film/AdSetup.jsx
// ADVERTISING MODE (2026-10-19) — Ad setup: the popup where an ad is set up before its
// script goes to the storyboard. Replaces the Ad studio that used to sit in the
// storyboard panel (owner, 2026-10-18: "a pop up after selecting Advertise").
//   1 Brief → 2 Look → 3 Concepts → 4 Script → "Open in storyboard"
// No chat in here (owner decision): "Describe it in your own words" does the brief
// stage's job; the Ad room chat beside the storyboard takes over once the script is in.
// Every call returns the ad's whole state ({ad}); the container keeps it and passes it
// back down, so the popup, the storyboard and a reload always agree.
//
// Props:
//   projectId          the ad's film project
//   ad                 the ad state from the server (brief, lenses, concepts, chosen, locked,
//                      stage, missing, notices, questions, film_seconds, end_card_seconds)
//   onAd(ad)           store a new state
//   onChosen()         a concept was chosen (the container refreshes title / frame / length)
//   onScript(res)      the script was written ({script_meta, commentary, ad})
//   scriptText         the latest script draft, or null
//   startAt            optional step index (0–3) to open on; default = the step the ad reached
//   seed               optional text carried from a film room's "Start an ad" — goes into
//                      "Describe it" and fills the brief once
//   onSeedUsed()       the seed was taken
//   onOpenStoryboard() close and show the storyboard (after the script)
//   onClose()          the × / Esc (the container decides: storyboard or My Films)

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AD_LENGTHS, AD_RATIOS, adLengthTip } from './filmGenres';
import { filmAdAvailable, filmSaveAdBrief, filmAdAssist, filmSaveAdLenses, filmAdConcepts,
         filmAdChoose, filmAdScript, friendlyError } from './filmApi';
import { lensSwatch, lensImage } from './adLensArt';
import './AdSetup.css';

const STEPS = [
  { key: 'brief', label: 'Brief', tip: 'What you are advertising, who it is for, the one thing to remember' },
  { key: 'look', label: 'Look', tip: 'Pick up to three inspirations: an era, a city, a storytelling form or a feeling' },
  { key: 'concepts', label: 'Concepts', tip: 'Three different ways to tell it' },
  { key: 'script', label: 'Script', tip: 'The script for the concept you chose' },
];
const STAGE_INDEX = { brief: 0, lenses: 1, concepts: 2, script: 3 };

const KINDS = [
  ['product', 'Product'], ['service', 'Service'], ['place', 'Place'], ['event', 'Event'],
  ['app', 'App'], ['cause', 'Cause'], ['brand', 'Brand'], ['other', 'Other'],
];
const MARKETS = [
  ['UK', 'UK'], ['EU', 'EU'], ['US', 'US'], ['US-NY', 'New York'], ['US-CA', 'California'],
  ['CA', 'Canada'], ['AU', 'Australia'], ['NG', 'Nigeria'], ['GH', 'Ghana'], ['KE', 'Kenya'],
  ['ZA', 'South Africa'], ['IN', 'India'], ['OTHER', 'Elsewhere'],
];
const APPEARS = {
  in_story: { label: 'In the story', tip: 'What you advertise is used inside the story' },
  hero_shot: { label: 'Hero shot', tip: 'A held, beautiful moment of the thing itself' },
  end_card_only: { label: 'On the end card', tip: 'The story carries the feeling; the brand lands on the end card' },
};
const FIELD_LABEL = { what: 'what you are advertising', audience: 'who it is for',
                      one_thing: 'the one thing to remember' };
// [key, label, placeholder, multiline, maxLength]
const ESSENTIALS = [
  ['what', 'What are you advertising?', 'e.g. lightweight running shoes, a weekend food festival, a budgeting app', true, 300],
  ['audience', 'Who is it for?', 'e.g. people starting to run, young families, small business owners', false, 200],
  ['one_thing', 'The one thing people should remember', 'e.g. so light you forget you’re wearing them', false, 160],
];
const DETAILS = [
  ['name', 'Brand or name', 'your brand or product name', false, 80],
  ['offer', 'Offer', 'e.g. 20% off this week, or free delivery', false, 160],
  ['cta', 'Call to action', 'shown on the end card, e.g. Shop now, Book today', false, 80],
  ['url', 'Website or handle', 'shown on the end card, e.g. yourbrand.com or @yourbrand', false, 120],
  ['tone', 'Tone', 'e.g. warm and funny', false, 80],
  ['cast', 'Who appears, and where it is set', 'e.g. two friends on a morning run in a city park at sunrise. No real people.', true, 300],
];
const LIST_FIELDS = ['must_say', 'must_not_say'];
const DETAIL_KEYS = ['name', 'offer', 'cta', 'url', 'tone', 'cast', 'must_say', 'must_not_say', 'markets'];

const errText = (e, fallback) => (e && e.response && e.response.data && e.response.data.error)
  || friendlyError(e, fallback);
const toDraft = (b) => ({ ...b, must_say: (b.must_say || []).join('\n'), must_not_say: (b.must_not_say || []).join('\n') });
const hasValue = (v) => (Array.isArray(v) ? v.length > 0 : !!(v && String(v).trim()));

// The script's VISUAL: blocks, for the timeline (labels only — the director sets real timings).
const visualBeats = (script) => String(script || '').split('\n')
  .map(l => l.trim()).filter(l => /^VISUAL:/i.test(l))
  .map(l => l.replace(/^VISUAL:\s*/i, '').split(/[.;:]/)[0].trim()).filter(Boolean);

// One line of the script, styled by what it is.
const HEADER_RE = /^(TITLE|FORMAT|PACING|WORLD|CHARACTERS|LOCATIONS):/;
function ScriptLine({ line }) {
  const t = line.trim();
  if (HEADER_RE.test(t)) {
    const i = t.indexOf(':');
    return <div><span className="ads-sc-h">{t.slice(0, i + 1)}</span>{t.slice(i + 1)}</div>;
  }
  if (/^\[.*\]/.test(t)) return <div className="ads-sc-tc">{line}</div>;
  if (/^VISUAL:/i.test(t)) return <div><span className="ads-sc-v">VISUAL:</span>{t.slice(7)}</div>;
  if (t && t === t.toUpperCase() && /[A-Z]/.test(t) && t.length < 48) return <div className="ads-sc-sp">{line}</div>;
  return <div>{line || ' '}</div>;
}

export default function AdSetup({
  projectId, ad, onAd = () => {}, onChosen = () => {}, onScript = () => {},
  scriptText = null, startAt = null, seed = null, onSeedUsed = () => {},
  onOpenStoryboard = () => {}, onClose = () => {},
}) {
  const stage = (ad && ad.stage) || 'brief';
  const reached = STAGE_INDEX[stage] ?? 0;
  const [view, setView] = useState(Number.isInteger(startAt) ? startAt : reached);

  const [catalogue, setCatalogue] = useState(null);
  useEffect(() => { let live = true; filmAdAvailable().then(c => { if (live) setCatalogue(c); }); return () => { live = false; }; }, []);

  const brief = (ad && ad.brief) || {};
  const locked = !!(ad && ad.locked);
  const [busy, setBusy] = useState(null);     // 'assist' | 'pitch' | 'redo:N' | 'choose:N' | 'script' | 'save'
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const mainRef = useRef(null);

  // ── brief draft: a field being typed in is never overwritten by a server update ──
  const [draft, setDraft] = useState(() => toDraft(brief));
  const focused = useRef(null);
  useEffect(() => {
    setDraft(prev => {
      const next = toDraft(brief);
      if (focused.current) next[focused.current] = prev[focused.current];
      return next;
    });
  }, [ad && ad.updated_at]);

  const run = async (tag, fn) => {
    if (busy && tag !== 'save') return null;
    if (tag === 'save') setSaving(true); else setBusy(tag);
    setError(null);
    try { const r = await fn(); if (r && r.ad) onAd(r.ad); return r; }
    catch (e) { setError(errText(e, 'That didn’t go through. Please try again.')); return null; }
    finally { if (tag === 'save') setSaving(false); else setBusy(null); }
  };

  const fieldValue = (key, raw) => (LIST_FIELDS.includes(key)
    ? String(raw || '').split('\n').map(x => x.trim()).filter(Boolean) : String(raw ?? '').trim());
  const saveField = (key) => {
    if (focused.current === key) focused.current = null;
    const value = fieldValue(key, draft[key]);
    const before = brief[key] ?? (Array.isArray(value) ? [] : '');
    if (JSON.stringify(before) === JSON.stringify(value)) return null;
    return run('save', () => filmSaveAdBrief(projectId, { [key]: value }));
  };
  const saveNow = (patch) => run('save', () => filmSaveAdBrief(projectId, patch));

  // Close / Esc: a field still being typed in is saved first, so nothing is lost.
  const closeSafely = () => {
    if (focused.current) saveField(focused.current);
    onClose();
  };
  const closeRef = useRef(closeSafely);
  closeRef.current = closeSafely;
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, []);

  // ── describe → the brief assistant (fills EMPTY fields only); new fields flash ──
  const [describe, setDescribe] = useState(seed || '');
  const [flash, setFlash] = useState([]);
  const doAssist = async (text) => {
    const said = String(text ?? describe).trim();
    if (!said) return;
    const before = { ...brief };
    const r = await run('assist', () => filmAdAssist(projectId, said));
    if (r && r.ad) {
      const after = r.ad.brief || {};
      const filled = Object.keys(after).filter(k => hasValue(after[k]) && !hasValue(before[k]));
      setFlash(filled);
      if (filled.some(k => DETAIL_KEYS.includes(k))) setMoreOpen(true);
      setTimeout(() => setFlash([]), 1600);
    }
  };
  const seedDone = useRef(false);
  useEffect(() => {
    if (seed && !seedDone.current && ad) {
      seedDone.current = true;
      onSeedUsed();
      doAssist(seed);
    }
  }, [seed, ad]);

  const [moreOpen, setMoreOpen] = useState(() => DETAIL_KEYS.some(k => hasValue(brief[k])));

  // ── lenses ──
  const lensSel = (ad && ad.lenses) || { keys: [], custom: '' };
  const [custom, setCustom] = useState(lensSel.custom || '');
  useEffect(() => { setCustom(lensSel.custom || ''); }, [lensSel.custom]);
  const maxLenses = (catalogue && catalogue.max) || 3;
  const used = (lensSel.keys || []).length + (lensSel.custom ? 1 : 0);
  const groups = useMemo(() => (catalogue && catalogue.groups) || [], [catalogue]);
  const [lensTab, setLensTab] = useState(null);
  const tab = lensTab || (groups[0] && groups[0].key);
  const lensByKey = useMemo(() => {
    const m = {};
    groups.forEach(g => g.lenses.forEach(l => { m[l.key] = l; }));
    return m;
  }, [groups]);
  const toggleLens = (key) => {
    const keys = lensSel.keys || [];
    const next = keys.includes(key) ? keys.filter(k => k !== key)
      : (used < maxLenses ? [...keys, key] : keys);
    if (next === keys) return;
    run('save', () => filmSaveAdLenses(projectId, { keys: next, custom: lensSel.custom || '' }));
  };
  const saveCustom = () => {
    if ((custom || '').trim() === (lensSel.custom || '')) return;
    run('save', () => filmSaveAdLenses(projectId, { keys: lensSel.keys || [], custom: custom.trim() }));
  };
  const [brokenImg, setBrokenImg] = useState({});

  // ── concepts / choose / script ──
  const concepts = (ad && ad.concepts) || [];
  const chosen = ad && Number.isInteger(ad.chosen) ? ad.chosen : null;
  const missing = (ad && ad.missing) || [];
  const [note, setNote] = useState('');
  const [confirm, setConfirm] = useState(null);      // concept index waiting for the lock OK
  const goto = (i) => { setView(i); setConfirm(null); if (mainRef.current) mainRef.current.scrollTop = 0; };
  const pitch = async (opts = {}) => {
    const redo = Number.isInteger(opts.replace);
    const r = await run(redo ? `redo:${opts.replace}` : 'pitch', () => filmAdConcepts(projectId, opts));
    if (r && !redo) { setNote(''); goto(2); }
  };
  const choose = async (i) => {
    setConfirm(null);
    const r = await run(`choose:${i}`, () => filmAdChoose(projectId, i));
    if (r) onChosen();
  };
  const askChoose = (i) => (locked ? choose(i) : setConfirm(i));
  const [scriptNote, setScriptNote] = useState('');
  const writeScript = async () => {
    const r = await run('script', () => filmAdScript(projectId, scriptNote.trim() || undefined));
    if (r) { onScript(r); setScriptNote(''); }
  };

  const length = Number(brief.length) || 15;
  const ratio = brief.ratio || '9:16';
  const endCard = (ad && ad.end_card_seconds) || 3;
  const filmSecs = (ad && ad.film_seconds) || (length - endCard);
  const canGo = (i) => i <= reached || (i === 1 && missing.length === 0)
                   || (i === 2 && concepts.length > 0) || (i === 3 && chosen != null);
  const waiting = !!busy;
  const chosenConcept = chosen != null ? concepts[chosen] : null;

  if (!ad) return null;

  // ── the "Your ad" rail ──
  const fact = (k, label) => (
    <div className="ads-fact" key={k}>
      <dt>{label}</dt>
      <dd className={hasValue(brief[k]) ? '' : 'is-empty'}>{hasValue(brief[k]) ? brief[k] : 'not yet'}</dd>
    </div>
  );
  const rail = (
    <aside className="ads-rail" aria-label="Your ad">
      <div className="ads-rail-frame">
        <div className={`ads-frame${ratio === '16:9' ? ' is-wide' : ''}`}>
          {locked && <span className="ads-frame-lock" title="Length and frame are fixed for this ad">🔒</span>}
          <b>{(chosenConcept && chosenConcept.title) || brief.name || 'Your ad'}</b>
          <small>{length}s · {ratio}</small>
        </div>
      </div>
      <dl className="ads-facts">
        {fact('what', 'Advertising')}
        {fact('audience', 'For')}
        {fact('one_thing', 'Remember')}
        {hasValue(brief.offer) && fact('offer', 'Offer')}
        {hasValue(brief.cta) && fact('cta', 'Call to action')}
      </dl>
      <div className="ads-lenbar" title="What is filmed, and what the studio adds at the end">
        <span className="ads-k">Length</span>
        <div className="ads-lenbar-track" aria-hidden="true">
          <i className="is-film" style={{ width: `${(filmSecs / length) * 100}%` }} />
          <i className="is-card" style={{ width: `${(endCard / length) * 100}%` }} />
        </div>
        <div className="ads-lenbar-cap"><span>{filmSecs}s film</span><span>{endCard}s end card</span></div>
      </div>
      {used > 0 && (
        <div className="ads-rail-lenses">
          <span className="ads-k">Look</span>
          <div className="ads-chips">
            {(lensSel.keys || []).map(k => <span className="ads-chip" key={k}>{(lensByKey[k] && lensByKey[k].label) || k}</span>)}
            {lensSel.custom && <span className="ads-chip">{lensSel.custom}</span>}
          </div>
        </div>
      )}
    </aside>
  );

  // ── a text field (essentials / details) ──
  const textField = ([key, label, ph, multi, max], need) => {
    const Tag = multi ? 'textarea' : 'input';
    const isNeeded = need && missing.includes(key);
    return (
      <div className={`ads-field${multi ? ' is-wide' : ''}`} key={key}>
        <label className="ads-lbl" htmlFor={`ads-${key}`}>{label}
          {need ? (isNeeded && <span className="ads-need"> · needed</span>) : <small> · optional</small>}</label>
        <Tag id={`ads-${key}`} className={`ads-inp${isNeeded ? ' is-need' : ''}${flash.includes(key) ? ' is-flash' : ''}`}
          maxLength={max} placeholder={ph} {...(multi ? { rows: 2 } : { type: 'text' })}
          value={draft[key] || ''} onFocus={() => { focused.current = key; }}
          onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
          onBlur={() => saveField(key)} />
      </div>
    );
  };

  // ── steps ──
  const briefStep = (
    <div className="ads-step">
      <h2 className="ads-h">What are we advertising?</h2>
      <p className="ads-sub">Say it in your own words and I’ll fill the brief, or type straight into the fields.
        Three things are needed; the rest helps.</p>

      <div className="ads-describe">
        <label className="ads-lbl" htmlFor="ads-describe">Describe it in your own words</label>
        <textarea id="ads-describe" className="ads-inp" rows={3} value={describe} disabled={busy === 'assist'}
          placeholder="e.g. We make lightweight running shoes for people just starting out. We want them to feel they can do it. 20% off this week…"
          onChange={e => setDescribe(e.target.value)} />
        <div className="ads-row">
          <span className="ads-hint">Fills only empty fields. It never invents prices or claims.</span>
          <button type="button" className="ads-btn is-pri is-sm" onClick={() => doAssist()}
            disabled={waiting || !describe.trim()} title="Read your description and fill the empty parts of the brief">
            {busy === 'assist' ? <><span className="ads-spin" /> Reading…</> : 'Fill the brief'}
          </button>
        </div>
        {(ad.questions || []).length > 0 && missing.length > 0 && (
          <ul className="ads-asks" aria-label="Still to answer">
            {ad.questions.map((q, i) => <li key={i}>{q}</li>)}
          </ul>
        )}
      </div>

      <div className="ads-group">
        <div className="ads-group-h"><h3>Length and frame</h3>
          <span className="ads-hint">{locked ? '🔒 Fixed for this ad' : 'Fixed for good once you choose a concept'}</span></div>
        <div className="ads-pills" role="group" aria-label="Length">
          {AD_LENGTHS.map(n => (
            <button key={n} type="button" className={`ads-pill${length === n ? ' is-on' : ''}`}
              disabled={locked || waiting} onClick={() => length !== n && saveNow({ length: n })}
              title={locked ? 'Fixed once a concept is chosen' : `${n}s: ${adLengthTip(n)}`}>{n}s</button>
          ))}
        </div>
        <div className="ads-pills" role="group" aria-label="Frame">
          {AD_RATIOS.map(r => (
            <button key={r} type="button" className={`ads-pill${ratio === r ? ' is-on' : ''}`}
              disabled={locked || waiting} onClick={() => ratio !== r && saveNow({ ratio: r })}
              title={locked ? 'Fixed once a concept is chosen'
                : (r === '9:16' ? 'Vertical: TikTok, Reels, Shorts, Stories' : 'Landscape: YouTube, TV, the web')}>
              {r === '9:16' ? 'Vertical 9:16' : 'Landscape 16:9'}</button>
          ))}
        </div>
      </div>

      <div className="ads-group">
        <div className="ads-group-h"><h3>The essentials</h3></div>
        <div className="ads-field is-wide">
          <span className="ads-lbl">What kind of thing is it?</span>
          <div className="ads-pills">
            {KINDS.map(([k, label]) => (
              <button key={k} type="button" className={`ads-pill${brief.kind === k ? ' is-on' : ''}${flash.includes('kind') && brief.kind === k ? ' is-flash' : ''}`}
                disabled={waiting} onClick={() => brief.kind !== k && saveNow({ kind: k })}
                title={label === 'Other' ? 'Something else' : `It is ${/^[AEIOU]/.test(label) ? 'an' : 'a'} ${label.toLowerCase()}`}>{label}</button>
            ))}
          </div>
        </div>
        <div className="ads-grid">{ESSENTIALS.map(f => textField(f, true))}</div>
      </div>

      <div className={`ads-more${moreOpen ? ' is-open' : ''}`}>
        <button type="button" className="ads-more-h" onClick={() => setMoreOpen(o => !o)} aria-expanded={moreOpen}
          title={moreOpen ? 'Hide the extra details' : 'Brand, offer, call to action, tone, cast, rules and markets'}>
          <b>More details</b><span>brand, offer, call to action, tone, cast, rules, markets</span>
          <i aria-hidden="true">{moreOpen ? '–' : '+'}</i>
        </button>
        {moreOpen && (
          <div className="ads-more-b">
            <div className="ads-grid">
              {DETAILS.map(f => textField(f, false))}
              {[['must_say', 'Must say', 'one per line, e.g. Free returns'],
                ['must_not_say', 'Must not say', 'one per line, e.g. cheap']].map(([key, label, ph]) => (
                <div className="ads-field" key={key}>
                  <label className="ads-lbl" htmlFor={`ads-${key}`}>{label}<small> · optional</small></label>
                  <textarea id={`ads-${key}`} className={`ads-inp${flash.includes(key) ? ' is-flash' : ''}`} rows={2} placeholder={ph}
                    value={draft[key] || ''} onFocus={() => { focused.current = key; }}
                    onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                    onBlur={() => saveField(key)} />
                </div>
              ))}
            </div>
            <div className="ads-field is-wide ads-markets">
              <span className="ads-lbl">Where will it run?<small> · some places have rules for ads</small></span>
              <div className="ads-pills">
                {MARKETS.map(([k, label]) => {
                  const on = (brief.markets || []).includes(k);
                  return (
                    <button key={k} type="button" className={`ads-pill${on ? ' is-on' : ''}`} disabled={waiting}
                      onClick={() => saveNow({ markets: on ? (brief.markets || []).filter(m => m !== k) : [...(brief.markets || []), k] })}
                      title={on ? `Remove ${label}` : `It will run in ${label}`}>{label}</button>
                  );
                })}
              </div>
              {(ad.notices || []).map(n => (
                <div className="ads-notice" key={n.code} role="note"><b>Before it runs:</b> {n.text}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const groupNow = groups.find(g => g.key === tab);
  const lookStep = (
    <div className="ads-step">
      <h2 className="ads-h">Pick a look</h2>
      <p className="ads-sub">Lenses shape the craft: palette, light, rhythm and the storytelling device, never who your
        people are. Up to {maxLenses}, or none and I’ll choose three different ones.</p>
      <div className="ads-pills ads-tabs" role="tablist" aria-label="Kinds of lens">
        {groups.map(g => (
          <button key={g.key} type="button" role="tab" aria-selected={tab === g.key}
            className={`ads-pill${tab === g.key ? ' is-on' : ''}`} onClick={() => setLensTab(g.key)}
            title={`Show ${g.label.toLowerCase()} lenses`}>{g.label}</button>
        ))}
      </div>
      <div className="ads-lenses">
        {(groupNow ? groupNow.lenses : []).map(l => {
          const on = (lensSel.keys || []).includes(l.key);
          const full = !on && used >= maxLenses;
          const src = lensImage(l);
          const img = src && !brokenImg[l.key] ? src : null;
          return (
            <button key={l.key} type="button" className={`ads-lens${on ? ' is-on' : ''}`} aria-pressed={on}
              disabled={waiting || full} onClick={() => toggleLens(l.key)}
              title={full ? `You can pick ${maxLenses}. Remove one first` : (on ? `Remove ${l.label}` : `${l.label}: ${l.hint}`)}>
              <span className="ads-lens-art">
                {img ? <img src={img} alt="" loading="lazy" onError={() => setBrokenImg(b => ({ ...b, [l.key]: true }))} />
                  : lensSwatch(l.key).map((c, i) => <i key={i} style={{ background: c }} />)}
              </span>
              <span className="ads-lens-b"><b>{l.label}</b><small>{l.hint}</small></span>
              <span className="ads-lens-tick" aria-hidden="true">✓</span>
            </button>
          );
        })}
      </div>
      <div className="ads-chosen">
        <span className="ads-k">Chosen · {used} of {maxLenses}</span>
        {(lensSel.keys || []).map(k => (
          <span className="ads-tok" key={k}>{(lensByKey[k] && lensByKey[k].label) || k}
            <button type="button" disabled={waiting} onClick={() => toggleLens(k)}
              title={`Remove ${(lensByKey[k] && lensByKey[k].label) || k}`} aria-label="Remove">×</button></span>
        ))}
        {!used && <span className="ads-hint">None yet. That’s fine.</span>}
      </div>
      <div className="ads-field is-wide">
        <label className="ads-lbl" htmlFor="ads-custom">Your own lens<small> · optional: an era, a place, a form or a feeling</small></label>
        <input id="ads-custom" className="ads-inp" type="text" maxLength={80} value={custom}
          placeholder="e.g. a Victorian music hall, a midnight market"
          disabled={waiting || (!lensSel.custom && used >= maxLenses)}
          onChange={e => setCustom(e.target.value)} onBlur={saveCustom} />
      </div>
    </div>
  );

  const conceptsStep = (
    <div className="ads-step">
      <h2 className="ads-h">Three ways to tell it</h2>
      <p className="ads-sub">Each one is a different story. Use one, redo one you don’t like, or mix them with a note.</p>
      {busy === 'pitch' ? (
        <div className="ads-concepts"><div className="ads-skel" /><div className="ads-skel" /><div className="ads-skel" /></div>
      ) : concepts.length === 0 ? (
        <p className="ads-hint">No concepts yet. Go back to Look and press “Pitch me three concepts”.</p>
      ) : (
        <div className="ads-concepts">
          {concepts.map((c, i) => {
            const ap = APPEARS[c.appears] || APPEARS.in_story;
            const redoing = busy === `redo:${i}`;
            return (
              <article className={`ads-concept${chosen === i ? ' is-on' : ''}`} key={i}>
                {redoing ? <div className="ads-skel ads-skel--in" /> : (<>
                  <span className="ads-k">Concept {i + 1}{chosen === i ? ' · chosen' : ''}</span>
                  <h3>{c.title}</h3>
                  <p className="ads-hook" title="What we see and hear in the first two seconds">{c.hook}</p>
                  <p className="ads-story">{c.story}</p>
                  <dl className="ads-cmeta">
                    <div><dt>Shows it</dt><dd title={ap.tip}>{ap.label}</dd></div>
                    {c.lens && <div><dt>Look</dt><dd>{c.lens}</dd></div>}
                    {c.tone && <div><dt>Tone</dt><dd>{c.tone}</dd></div>}
                    {c.sound && <div><dt>Sound</dt><dd>{c.sound}</dd></div>}
                  </dl>
                  {c.why && <p className="ads-why"><b>Why it works:</b> {c.why}</p>}
                  <div className="ads-cacts">
                    <button type="button" className="ads-btn is-pri is-sm" disabled={waiting || chosen === i}
                      onClick={() => askChoose(i)}
                      title={chosen === i ? 'This is the concept you chose'
                        : locked ? 'Use this concept instead (length and frame stay as they are)'
                        : 'Use this concept. You’ll confirm fixing the length and frame first'}>
                      {busy === `choose:${i}` ? <><span className="ads-spin" /> Choosing…</> : (chosen === i ? 'Chosen ✓' : 'Use this')}
                    </button>
                    <button type="button" className="ads-btn is-sm" disabled={waiting}
                      onClick={() => pitch({ replace: i, ...(note.trim() ? { note: note.trim() } : {}) })}
                      title="Replace just this concept with a different one">Redo this one</button>
                  </div>
                </>)}
              </article>
            );
          })}
        </div>
      )}
      {confirm != null && concepts[confirm] && (
        <div className="ads-lockask" role="alertdialog" aria-label="Fix length and frame">
          <p><b>Use “{concepts[confirm].title}”?</b> This fixes the ad at <b>{length}s · {ratio}</b> for good.
            A different length or frame later means a new ad.</p>
          <button type="button" className="ads-btn is-sm" onClick={() => setConfirm(null)} title="Go back to the concepts">Not yet</button>
          <button type="button" className="ads-btn is-pri is-sm" onClick={() => choose(confirm)}
            title="Fix the length and frame and choose this concept">Use it and fix {length}s · {ratio}</button>
        </div>
      )}
      {concepts.length > 0 && (
        <div className="ads-noterow">
          <label className="ads-sr" htmlFor="ads-note">Mix or change</label>
          <input id="ads-note" className="ads-inp" type="text" maxLength={600} value={note}
            placeholder="Mix or change, e.g. the hook of 1 with the ending of 3, and make it funnier"
            onChange={e => setNote(e.target.value)} />
          <button type="button" className="ads-btn is-sm" disabled={waiting} onClick={() => pitch(note.trim() ? { note: note.trim() } : {})}
            title="Pitch three new concepts, following your note if you wrote one">Pitch three new ones</button>
        </div>
      )}
    </div>
  );

  const beats = visualBeats(scriptText);
  const scriptStep = (
    <div className="ads-step">
      {!chosenConcept ? <p className="ads-hint">Choose a concept first.</p> : (<>
        <h2 className="ads-h">{chosenConcept.title}</h2>
        <p className="ads-sub">{filmSecs} seconds of film, then the studio’s {endCard}-second end card with your
          logo, offer and call to action.</p>
        {busy === 'script' ? <div className="ads-skel ads-skel--tall" /> : scriptText ? (<>
          <div className="ads-timeline">
            <span className="ads-k">Timeline · {length}s</span>
            <div className="ads-tl">
              <div className="ads-tl-film" style={{ flex: filmSecs }}>
                {(beats.length ? beats : ['The film']).map((b, i) => (
                  <span className="ads-tl-seg" key={i} title={b}><b>{b}</b></span>
                ))}
              </div>
              <span className="ads-tl-seg is-card" style={{ flex: endCard }} title="Drawn by the studio over the end of the film">
                <b>End card</b></span>
            </div>
            <div className="ads-tl-cap" aria-hidden="true">
              <span style={{ flex: filmSecs }}>0s</span>
              <span className="ads-tl-cap-end" style={{ flex: endCard }}><span>{filmSecs}s</span><span>{length}s</span></span>
            </div>
          </div>
          <div className="ads-script" aria-label="The script">
            {String(scriptText).split('\n').map((l, i) => <ScriptLine line={l} key={i} />)}
          </div>
        </>) : (
          <div className="ads-hook ads-hook--big">{chosenConcept.hook}<p className="ads-story">{chosenConcept.story}</p></div>
        )}
        <div className="ads-noterow">
          <label className="ads-sr" htmlFor="ads-snote">A note for the script</label>
          <input id="ads-snote" className="ads-inp" type="text" maxLength={600} value={scriptNote}
            placeholder={scriptText ? 'A note for a rewrite, e.g. make the line funnier' : 'Optional note, e.g. no dialogue, a narrator only'}
            onChange={e => setScriptNote(e.target.value)} />
          {scriptText && (
            <button type="button" className="ads-btn is-sm" disabled={waiting} onClick={writeScript}
              title="Write the script again from the chosen concept, following your note">Rewrite</button>
          )}
        </div>
      </>)}
    </div>
  );

  // ── footer: one primary action per step ──
  let status = '', primary = null;
  if (view === 0) {
    status = missing.length ? `Still needed: ${missing.map(k => FIELD_LABEL[k] || k).join(', ')}` : 'The brief is ready';
    primary = (
      <button type="button" className="ads-btn is-pri" disabled={missing.length > 0 || waiting} onClick={() => goto(1)}
        title={missing.length ? 'Fill in what is still needed first' : 'Pick a look next'}>Next: pick a look →</button>
    );
  } else if (view === 1) {
    status = used ? `${used} of ${maxLenses} lenses` : 'No lens picked: I’ll choose';
    primary = concepts.length ? (<>
      <button type="button" className="ads-btn" disabled={waiting} onClick={() => pitch()}
        title="Pitch three new concepts with this look">Pitch three new ones</button>
      <button type="button" className="ads-btn is-pri" disabled={waiting} onClick={() => goto(2)}
        title="Back to the concepts you already have">See the concepts →</button>
    </>) : (
      <button type="button" className="ads-btn is-pri" disabled={waiting || missing.length > 0} onClick={() => pitch()}
        title="Three different concepts for your ad (takes up to a minute)">
        {busy === 'pitch' ? <><span className="ads-spin" /> Pitching…</> : 'Pitch me three concepts →'}</button>
    );
  } else if (view === 2) {
    status = chosen != null ? (locked ? `Fixed at ${length}s · ${ratio}` : 'Concept chosen') : 'Choose a concept to continue';
    primary = (
      <button type="button" className="ads-btn is-pri" disabled={waiting || chosen == null} onClick={() => goto(3)}
        title={chosen == null ? 'Use a concept first' : 'Go to the script'}>{scriptText ? 'See the script →' : 'Next: the script →'}</button>
    );
  } else {
    status = busy === 'script' ? 'Writing the script…' : scriptText ? 'Script saved' : `A ${filmSecs}-second script in the film format`;
    primary = scriptText ? (
      <button type="button" className="ads-btn is-pri" disabled={waiting} onClick={onOpenStoryboard}
        title="Close setup and open the storyboard, with the Ad room beside it for changes">Open in storyboard →</button>
    ) : (
      <button type="button" className="ads-btn is-pri" disabled={waiting || chosen == null} onClick={writeScript}
        title="Write the script for this concept (takes up to a minute)">
        {busy === 'script' ? <><span className="ads-spin" /> Writing…</> : 'Write the script →'}</button>
    );
  }

  return createPortal(
    <div className="ads-scrim" onClick={(e) => e.target === e.currentTarget && closeSafely()}>
      <div className="ads-modal" role="dialog" aria-modal="true" aria-labelledby="ads-title">
        <div className="ads-head">
          <span className="ads-title" id="ads-title">Ad setup
            <em className={saving ? 'is-saving' : ''}>{saving ? 'Saving…' : 'Saved'}</em></span>
          <ol className="ads-steps" aria-label="Steps">
            {STEPS.map((s, i) => {
              const done = i < reached || (i === 3 && !!scriptText);
              return (
                <li key={s.key}>
                  <button type="button" disabled={!canGo(i) || waiting}
                    className={`ads-stepbtn${view === i ? ' is-on' : ''}${done && view !== i ? ' is-done' : ''}`}
                    onClick={() => goto(i)} aria-current={view === i ? 'step' : undefined}
                    title={canGo(i) ? s.tip : `${s.label} opens once the step before it is done`}>
                    <i>{done && view !== i ? '✓' : i + 1}</i><span>{s.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <button type="button" className="ads-x" onClick={closeSafely} aria-label="Close"
            title={scriptText ? 'Close setup and go back to the storyboard. Everything is saved'
                              : 'Close. Everything is saved; reopen it from the Ads shelf'}>×</button>
        </div>

        <div className="ads-body">
          <div className="ads-main" ref={mainRef}>
            {error && (
              <div className="ads-error" role="alert">{error}
                <button type="button" className="ads-x is-sm" onClick={() => setError(null)} title="Dismiss" aria-label="Dismiss">×</button>
              </div>
            )}
            {[briefStep, lookStep, conceptsStep, scriptStep][view]}
          </div>
          {rail}
        </div>

        <div className="ads-foot">
          {view > 0 && (
            <button type="button" className="ads-btn is-ghost" disabled={waiting} onClick={() => goto(view - 1)}
              title={`Back to ${STEPS[view - 1].label}`}>← {STEPS[view - 1].label}</button>
          )}
          <span className="ads-status">{status}</span>
          {primary}
        </div>
      </div>
    </div>,
    document.body
  );
}