// src/components/Film/AdStudio.jsx
// ADVERTISING MODE (2026-10-18, AD_MODE=1) — the Ad studio. Shown in the LEFT panel of
// an ad's workspace (in place of the empty storyboard) until the cast review starts:
//   1 Brief → 2 Lenses → 3 Concepts → 4 Script
// The chat on the right is the same conversation (the server's ad persona follows the
// stage): typing there in the brief stage fills this form too (ad_state line).
// Every call returns the ad's whole state ({ad}); the container keeps it and passes it
// back down, so the form, the chat and a reload always agree.
//
// Props:
//   projectId     the ad's film project
//   ad            the ad state from the server (brief, lenses, concepts, chosen, locked,
//                 stage, missing, notices, film_seconds, end_card_seconds, questions)
//   onAd(ad)      store a new state
//   onChosen()    a concept was chosen (the container refreshes title / frame / length)
//   onScript(res) the script was written ({script_meta, commentary, ad})
//   hasScript     the room already holds a script draft
//   chatBusy      the chat is replying (actions wait so the two never cross)

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AD_LENGTHS, AD_RATIOS, adLengthTip } from './filmGenres';
import { filmAdAvailable, filmSaveAdBrief, filmAdAssist, filmSaveAdLenses, filmAdConcepts,
         filmAdChoose, filmAdScript, friendlyError } from './filmApi';
import './AdStudio.css';

const STEPS = [
  { key: 'brief', label: 'Brief', tip: 'What you are advertising, who it is for, the one thing to remember' },
  { key: 'lenses', label: 'Lenses', tip: 'Pick up to three inspirations — an era, a city, a storytelling form or a feeling' },
  { key: 'concepts', label: 'Concepts', tip: 'Three different ideas to choose from' },
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
  end_card_only: { label: 'End card', tip: 'The story carries the feeling; the brand lands on the end card' },
};
const FIELD_LABEL = { what: 'what you are advertising', audience: 'who it is for',
                      one_thing: 'the one thing to remember' };

const errText = (e, fallback) => (e && e.response && e.response.data && e.response.data.error)
  || friendlyError(e, fallback);

// Text fields of the brief: [key, label, placeholder, multiline, maxLength]
const TEXT_FIELDS = [
  ['what', 'What are you advertising?', 'e.g. our sourdough bakery — fresh bread every morning', true, 300],
  ['name', 'Brand or name', 'e.g. Mama’s Bread', false, 80],
  ['audience', 'Who is it for?', 'e.g. busy parents in Lagos', false, 200],
  ['one_thing', 'The one thing people should remember', 'e.g. baked before you wake up', false, 160],
  ['offer', 'Offer', 'optional — e.g. 2 loaves for ₦3,000 this week', false, 160],
  ['cta', 'Call to action', 'optional — shown on the end card, e.g. Order today', false, 80],
  ['url', 'Website or handle', 'optional — shown on the end card', false, 120],
  ['tone', 'Tone', 'optional — e.g. warm and funny', false, 80],
  ['cast', 'Who appears, and where it is set', 'optional — e.g. a young baker and her neighbours, a busy Lagos street', true, 300],
];

export default function AdStudio({
  projectId, ad, onAd = () => {}, onChosen = () => {}, onScript = () => {},
  hasScript = false, chatBusy = false,
}) {
  const stage = (ad && ad.stage) || 'brief';
  const reached = STAGE_INDEX[stage] ?? 0;
  const [view, setView] = useState(reached);
  useEffect(() => { setView(reached); }, [reached]);   // follow the ad forward

  const [catalogue, setCatalogue] = useState(null);
  useEffect(() => { let live = true; filmAdAvailable().then(c => { if (live) setCatalogue(c); }); return () => { live = false; }; }, []);

  const brief = (ad && ad.brief) || {};
  const locked = !!(ad && ad.locked);
  const [busy, setBusy] = useState(null);     // 'assist' | 'pitch' | 'redo:N' | 'choose:N' | 'script' | 'save'
  const [error, setError] = useState(null);

  // ── brief draft: a field being typed in is never overwritten by a server update ──
  const toDraft = (b) => ({ ...b, must_say: (b.must_say || []).join('\n'), must_not_say: (b.must_not_say || []).join('\n') });
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
    if (busy) return null;
    setBusy(tag); setError(null);
    try { const r = await fn(); if (r && r.ad) onAd(r.ad); return r; }
    catch (e) { setError(errText(e, 'That didn’t go through — please try again.')); return null; }
    finally { setBusy(null); }
  };

  const saveField = (key) => {
    focused.current = null;
    const raw = draft[key] ?? '';
    const value = (key === 'must_say' || key === 'must_not_say')
      ? raw.split('\n').map(x => x.trim()).filter(Boolean) : String(raw).trim();
    const before = brief[key] ?? (Array.isArray(value) ? [] : '');
    if (JSON.stringify(before) === JSON.stringify(value)) return;
    run('save', () => filmSaveAdBrief(projectId, { [key]: value }));
  };
  const saveNow = (patch) => run('save', () => filmSaveAdBrief(projectId, patch));

  const [describe, setDescribe] = useState('');
  const doAssist = async () => {
    if (!describe.trim()) return;
    const r = await run('assist', () => filmAdAssist(projectId, describe.trim()));
    if (r) setDescribe('');
  };

  // ── lenses ──
  const lensSel = (ad && ad.lenses) || { keys: [], custom: '' };
  const [custom, setCustom] = useState(lensSel.custom || '');
  useEffect(() => { setCustom(lensSel.custom || ''); }, [lensSel.custom]);
  const maxLenses = (catalogue && catalogue.max) || 3;
  const used = (lensSel.keys || []).length + (lensSel.custom ? 1 : 0);
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

  // ── concepts / choose / script ──
  const [note, setNote] = useState('');
  const pitch = async (opts = {}) => {
    const r = await run(Number.isInteger(opts.replace) ? `redo:${opts.replace}` : 'pitch',
      () => filmAdConcepts(projectId, opts));
    if (r && !Number.isInteger(opts.replace)) setNote('');
    if (r) setView(2);
  };
  const choose = async (i) => {
    const r = await run(`choose:${i}`, () => filmAdChoose(projectId, i));
    if (r) { onChosen(); setView(3); }
  };
  const [scriptNote, setScriptNote] = useState('');
  const writeScript = async () => {
    const r = await run('script', () => filmAdScript(projectId, scriptNote.trim() || undefined));
    if (r) { onScript(r); setScriptNote(''); }
  };

  const concepts = (ad && ad.concepts) || [];
  const chosen = ad && Number.isInteger(ad.chosen) ? ad.chosen : null;
  const missing = (ad && ad.missing) || [];
  const canGo = (i) => i <= reached || (i === 1 && missing.length === 0)
                   || (i === 2 && concepts.length > 0);
  const waiting = !!busy || chatBusy;
  const length = Number(brief.length) || 15;
  const ratio = brief.ratio || '9:16';
  const groups = useMemo(() => (catalogue && catalogue.groups) || [], [catalogue]);

  if (!ad) return null;
  return (
    <div className="film-pcontent ad-studio">
      <div className="film-phead ad-head">
        <span className="ad-title">Ad studio</span>
        <ol className="ad-steps">
          {STEPS.map((s, i) => (
            <li key={s.key}>
              <button type="button" disabled={!canGo(i)}
                className={`ad-step${view === i ? ' is-on' : ''}${i < reached ? ' is-done' : ''}`}
                onClick={() => setView(i)} title={canGo(i) ? s.tip : `${s.label} opens once the step before it is done`}>
                <span className="ad-step-n">{i < reached ? '✓' : i + 1}</span>{s.label}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="film-stage ad-body">
        {/* facts: length + frame (fixed once a concept is chosen) */}
        <div className="ad-facts">
          <div className="ad-fact">
            <span className="ad-fact-k">Length</span>
            {locked ? <b title="Fixed once a concept is chosen">{length}s</b> : (
              <div className="ad-pills">
                {AD_LENGTHS.map(n => (
                  <button key={n} type="button" className={`ad-pill${length === n ? ' is-on' : ''}`}
                    disabled={waiting} onClick={() => length !== n && saveNow({ length: n })}
                    title={`${n}s: ${adLengthTip(n)}`}>{n}s</button>
                ))}
              </div>
            )}
          </div>
          <div className="ad-fact">
            <span className="ad-fact-k">Frame</span>
            {locked ? <b title="Fixed once a concept is chosen">{ratio}</b> : (
              <div className="ad-pills">
                {AD_RATIOS.map(r => (
                  <button key={r} type="button" className={`ad-pill${ratio === r ? ' is-on' : ''}`}
                    disabled={waiting} onClick={() => ratio !== r && saveNow({ ratio: r })}
                    title={r === '9:16' ? 'Vertical — TikTok, Reels, Shorts' : 'Landscape — YouTube, TV'}>{r}</button>
                ))}
              </div>
            )}
          </div>
          <span className="ad-fact-note">
            {locked ? '🔒 Length and frame are fixed for this ad. ' : ''}
            {adLengthTip(length)} — the studio adds the end card.
          </span>
        </div>

        {(ad.notices || []).map(n => (
          <div className="ad-notice" key={n.code} role="note"><b>Before it runs</b> {n.text}</div>
        ))}
        {error && <div className="ad-error" role="alert">{error}
          <button type="button" className="ad-x" onClick={() => setError(null)} title="Dismiss" aria-label="Dismiss">×</button></div>}

        {/* ── 1. BRIEF ── */}
        {view === 0 && (
          <section className="ad-sec">
            <div className="ad-describe">
              <label className="ad-label" htmlFor="ad-describe">Describe it in your own words <span>— I’ll fill the brief</span></label>
              <textarea id="ad-describe" className="ad-input" rows={3} value={describe} disabled={busy === 'assist'}
                placeholder="e.g. We run a small bakery in Surulere. Fresh sourdough every morning for busy parents…"
                onChange={e => setDescribe(e.target.value)} />
              <div className="ad-row-end">
                <button type="button" className="film-btn film-btn--ghost" onClick={doAssist}
                  disabled={waiting || !describe.trim()} title="The assistant reads this and fills the empty parts of the brief">
                  {busy === 'assist' ? <><span className="film-ctrl-spin" /> Reading…</> : 'Fill the brief'}
                </button>
              </div>
            </div>

            {(ad.questions || []).length > 0 && missing.length > 0 && (
              <div className="ad-questions">
                <b>To pitch good ideas I still need:</b>
                <ul>{ad.questions.map((q, i) => <li key={i}>{q}</li>)}</ul>
              </div>
            )}

            <div className="ad-field">
              <span className="ad-label">What kind of thing is it?</span>
              <div className="ad-pills">
                {KINDS.map(([k, label]) => (
                  <button key={k} type="button" className={`ad-pill${brief.kind === k ? ' is-on' : ''}`}
                    disabled={waiting} onClick={() => brief.kind !== k && saveNow({ kind: k })}
                    title={`It is ${label === 'Other' ? 'something else' : `a ${label.toLowerCase()}`}`}>{label}</button>
                ))}
              </div>
            </div>

            {TEXT_FIELDS.map(([key, label, ph, multi, max]) => {
              const need = missing.includes(key);
              const Tag = multi ? 'textarea' : 'input';
              return (
                <div className={`ad-field${need ? ' is-needed' : ''}`} key={key}>
                  <label className="ad-label" htmlFor={`ad-${key}`}>{label}{need && <span className="ad-need"> · needed</span>}</label>
                  <Tag id={`ad-${key}`} className="ad-input" maxLength={max} placeholder={ph}
                    {...(multi ? { rows: 2 } : { type: 'text' })}
                    value={draft[key] || ''} onFocus={() => { focused.current = key; }}
                    onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                    onBlur={() => saveField(key)} />
                </div>
              );
            })}

            <div className="ad-two">
              {[['must_say', 'Must say', 'one per line — e.g. Baked fresh daily'],
                ['must_not_say', 'Must not say', 'one per line — e.g. cheap']].map(([key, label, ph]) => (
                <div className="ad-field" key={key}>
                  <label className="ad-label" htmlFor={`ad-${key}`}>{label} <span>· optional</span></label>
                  <textarea id={`ad-${key}`} className="ad-input" rows={2} placeholder={ph}
                    value={draft[key] || ''} onFocus={() => { focused.current = key; }}
                    onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                    onBlur={() => saveField(key)} />
                </div>
              ))}
            </div>

            <div className="ad-field">
              <span className="ad-label">Where will it run? <span>· optional — some places have rules for ads</span></span>
              <div className="ad-pills">
                {MARKETS.map(([k, label]) => {
                  const on = (brief.markets || []).includes(k);
                  return (
                    <button key={k} type="button" className={`ad-pill${on ? ' is-on' : ''}`} disabled={waiting}
                      onClick={() => saveNow({ markets: on ? (brief.markets || []).filter(m => m !== k) : [...(brief.markets || []), k] })}
                      title={on ? `Remove ${label}` : `It will run in ${label}`}>{label}</button>
                  );
                })}
              </div>
            </div>

            <div className="ad-row-end">
              <span className="ad-hint">{missing.length
                ? `Still needed: ${missing.map(k => FIELD_LABEL[k] || k).join(', ')}.`
                : 'The brief is ready.'}</span>
              <button type="button" className="film-btn film-btn--primary" disabled={missing.length > 0}
                onClick={() => setView(1)} title={missing.length ? 'Fill in what is still needed first' : 'Pick inspiration lenses next'}>
                Next: lenses
              </button>
            </div>
          </section>
        )}

        {/* ── 2. LENSES ── */}
        {view === 1 && (
          <section className="ad-sec">
            <p className="ad-lead">Pick up to {maxLenses} lenses to pitch through — or none, and I’ll choose three
              different ones. They shape the look, rhythm and storytelling, never who your people are.</p>
            {groups.map(g => (
              <div className="ad-lensgroup" key={g.key}>
                <div className="ad-label">{g.label}</div>
                <div className="ad-lenses">
                  {g.lenses.map(l => {
                    const on = (lensSel.keys || []).includes(l.key);
                    const full = !on && used >= maxLenses;
                    return (
                      <button key={l.key} type="button" className={`ad-lens${on ? ' is-on' : ''}`}
                        disabled={waiting || full} onClick={() => toggleLens(l.key)}
                        title={full ? `You can pick ${maxLenses} — remove one first` : (on ? `Remove ${l.label}` : `${l.label}: ${l.hint}`)}>
                        <b>{l.label}</b><span>{l.hint}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="ad-field">
              <label className="ad-label" htmlFor="ad-custom">Your own lens <span>· optional — an era, a place, a form or a feeling</span></label>
              <input id="ad-custom" className="ad-input" type="text" maxLength={80} value={custom}
                placeholder="e.g. a Victorian music hall, a midnight market"
                disabled={waiting || (!lensSel.custom && used >= maxLenses)}
                onChange={e => setCustom(e.target.value)} onBlur={saveCustom} />
            </div>
            <div className="ad-row-end">
              <span className="ad-hint">{used ? `${used} of ${maxLenses} picked.` : 'No lens picked — I’ll choose.'}</span>
              <button type="button" className="film-btn film-btn--primary" disabled={waiting || missing.length > 0}
                onClick={() => pitch()} title="Three different concepts for your ad (takes up to a minute)">
                {busy === 'pitch' ? <><span className="film-ctrl-spin" /> Pitching…</> : (concepts.length ? 'Pitch three new concepts' : 'Pitch me concepts')}
              </button>
            </div>
          </section>
        )}

        {/* ── 3. CONCEPTS ── */}
        {view === 2 && (
          <section className="ad-sec">
            {concepts.length === 0 && <p className="ad-lead">No concepts yet — pick lenses and press “Pitch me concepts”.</p>}
            <div className="ad-concepts">
              {concepts.map((c, i) => {
                const ap = APPEARS[c.appears] || APPEARS.in_story;
                return (
                  <article className={`ad-concept${chosen === i ? ' is-chosen' : ''}`} key={i}>
                    <div className="ad-concept-top">
                      <span className="ad-concept-n">{i + 1}</span>
                      <h4>{c.title}</h4>
                      {chosen === i && <span className="ad-badge">Chosen</span>}
                    </div>
                    <p className="ad-hook" title="What we see and hear in the first two seconds">“{c.hook}”</p>
                    <p className="ad-story">{c.story}</p>
                    <div className="ad-tags">
                      <span className="ad-tag" title={ap.tip}>{ap.label}</span>
                      {c.lens && <span className="ad-tag" title="The lens this concept is pitched through">{c.lens}</span>}
                      {c.tone && <span className="ad-tag" title="Tone">{c.tone}</span>}
                    </div>
                    {c.appearance && <p className="ad-small"><b>How it appears:</b> {c.appearance}</p>}
                    {c.why && <p className="ad-small"><b>Why it works:</b> {c.why}</p>}
                    {c.sound && <p className="ad-small"><b>Sound:</b> {c.sound}</p>}
                    <div className="ad-concept-acts">
                      <button type="button" className="film-btn film-btn--ghost" disabled={waiting}
                        onClick={() => pitch({ replace: i, ...(note.trim() ? { note: note.trim() } : {}) })}
                        title="Replace just this concept with a different one">
                        {busy === `redo:${i}` ? <><span className="film-ctrl-spin" /> Redoing…</> : 'Redo this one'}
                      </button>
                      <button type="button" className="film-btn film-btn--primary" disabled={waiting}
                        onClick={() => choose(i)}
                        title={locked ? 'Use this concept for the script' : 'Use this concept — this also fixes the length and frame of your ad'}>
                        {busy === `choose:${i}` ? <><span className="film-ctrl-spin" /> Choosing…</> : (chosen === i ? 'Chosen ✓' : 'Use this concept')}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            {concepts.length > 0 && (
              <div className="ad-field">
                <label className="ad-label" htmlFor="ad-note">Mix or change <span>· optional</span></label>
                <textarea id="ad-note" className="ad-input" rows={2} value={note} maxLength={600}
                  placeholder="e.g. the hook of 1 with the story of 3 — and make it funnier"
                  onChange={e => setNote(e.target.value)} />
                <div className="ad-row-end">
                  <button type="button" className="film-btn film-btn--ghost" disabled={waiting} onClick={() => pitch(note.trim() ? { note: note.trim() } : {})}
                    title="Pitch three new concepts, following your note if you wrote one">
                    {busy === 'pitch' ? <><span className="film-ctrl-spin" /> Pitching…</> : 'Pitch three new ones'}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── 4. SCRIPT ── */}
        {view === 3 && (
          <section className="ad-sec">
            {chosen == null ? <p className="ad-lead">Choose a concept first.</p> : (
              <>
                <div className="ad-concept is-chosen is-summary">
                  <div className="ad-concept-top"><span className="ad-concept-n">{chosen + 1}</span><h4>{concepts[chosen].title}</h4></div>
                  <p className="ad-hook">“{concepts[chosen].hook}”</p>
                  <p className="ad-story">{concepts[chosen].story}</p>
                </div>
                <div className="ad-field">
                  <label className="ad-label" htmlFor="ad-snote">A note for the script <span>· optional</span></label>
                  <textarea id="ad-snote" className="ad-input" rows={2} value={scriptNote} maxLength={600}
                    placeholder="e.g. keep it gentle, no dialogue — a narrator only"
                    onChange={e => setScriptNote(e.target.value)} />
                </div>
                <div className="ad-row-end">
                  <span className="ad-hint">{hasScript
                    ? 'The script is in the chat — ask for changes there. When it reads right, press Review cast.'
                    : `A ${length - (ad.end_card_seconds || 3)}-second script in the film format — it appears in the chat.`}</span>
                  <button type="button" className={`film-btn ${hasScript ? 'film-btn--ghost' : 'film-btn--primary'}`}
                    disabled={waiting} onClick={writeScript}
                    title={hasScript ? 'Write a fresh script from the chosen concept (the current one stays in the chat history)' : 'Write the script for this concept (takes up to a minute)'}>
                    {busy === 'script' ? <><span className="film-ctrl-spin" /> Writing…</> : (hasScript ? 'Rewrite from the concept' : 'Write the script')}
                  </button>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}