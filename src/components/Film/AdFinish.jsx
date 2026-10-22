// src/components/Film/AdFinish.jsx
// ADVERTISING MODE — step 4, part 1 (2026-10-19): the advert's FINISH picker.
//
// How the studio closes the advert, chosen by the user (owner 10:15): the end-card style
// (soft hold / brand slate / lower third, then card), the visible AI label (small print /
// a corner mark on the end card / none — the file's machine-readable "made with AI" tag is
// written whatever is chosen), captions on or off, and the brand colour. Saved with the
// advert (PUT /projects/<id>/ad/finish). Nothing here is paid: the end card is drawn live in
// the browser over the photoreal style clip from the New Film popup (filmStyleMedia), the
// same clip every advert previews on until its own film exists. The real end card is drawn
// by the finishing render (part 2).
//
// Portalled to <body> with its own --adf-* tokens (like AdSetup); every class starts with
// "adf-"; divs only (landing.css styles bare `section` globally). Every button has a title.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { stylePreviewUrl, stylePosterUrl } from './filmStyleMedia';
import './AdFinish.css';

export const END_CARD_OPTIONS = [
  { key: 'hold', label: 'Soft hold', rec: true, tip: 'The last frame softens behind a glass card',
    text: 'The last frame blurs and dims; a glass card rises. Keeps the film’s world.' },
  { key: 'slate', label: 'Brand slate', tip: 'Cut to your brand colour',
    text: 'Cut to your brand colour with logo, offer and button. Cleanest for products.' },
  { key: 'lower_third', label: 'Lower third, then card', tip: 'Your name rides in over the last seconds, then the card',
    text: 'Your name slides in over the last 2 s of film, then the soft-hold card.' },
];
// Owner 2026-10-19: the default (and suggested) label is the HIDDEN one — nothing visible on the
// advert, only the machine-readable tag inside the file. A visible label is the user's choice.
export const AI_LABEL_OPTIONS = [
  { key: 'none', label: 'File tag only', rec: true, tip: 'Nothing visible — only the hidden tag in the file',
    text: 'Nothing visible. Only the hidden tag in the file.' },
  { key: 'inline', label: 'Small print', tip: '“Made with AI” in the end card’s small line',
    text: '“Made with AI” in the end card’s small line, beside your website.' },
  { key: 'mark', label: 'Corner mark', tip: 'A tiny, faint “AI” in the end card’s corner',
    text: 'A tiny, faint “AI” in the end card’s corner only.' },
];
export const BRAND_COLORS = ['#1F3A2E', '#6366F1', '#B4532A', '#0F172A', '#E8D9B5', '#C2185B'];
export const FINISH_DEFAULTS = { end_card: 'hold', ai_label: 'none', captions: true, brand_color: BRAND_COLORS[0], show_name: true };

// Brand assets (AD_BRAND_ASSETS): how the uploaded logo sits on the card — the same rule as
// ad_brand.logo_plate and AdCompose.jsx. A solid logo sits on its own background colour; a
// transparent one gets a white plate (dark logo) or a near-black one (light logo) only when it
// would not stand out against the card. Returns the plate colour, or null for none.
export const lumOf = (hex) => {
  const h = String(hex || '').replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(h)) return 0.5;
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = [0, 2, 4].map(i => lin(parseInt(h.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export function logoPlate(logo, bgLum) {
  if (!logo) return null;
  if (!logo.alpha) return logo.bg || '#FFFFFF';
  const lum = Number.isFinite(logo.lum) ? logo.lum : 0.5;
  if (Math.abs(lum - bgLum) >= 0.35) return null;
  return lum < 0.5 ? '#FFFFFF' : '#141414';
}
const LOGO_TYPES = 'image/png,image/jpeg,image/webp';

// Same rule as ad_room.ink_for: near-black on light colours, white on dark ones.
export function inkFor(hex) {
  const h = String(hex || '').replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(h)) return '#FFFFFF';
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = [0, 2, 4].map(i => lin(parseInt(h.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.5 ? '#141414' : '#FFFFFF';
}
export const endCardLabel = (k) => (END_CARD_OPTIONS.find(o => o.key === k) || END_CARD_OPTIONS[0]).label;
export const aiLabelLabel = (k) => (AI_LABEL_OPTIONS.find(o => o.key === k) || AI_LABEL_OPTIONS[0]).label;

function initials(name) {
  const w = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!w.length) return 'AB';
  return ((w[0][0] || '') + (w[1] ? w[1][0] : (w[0][1] || ''))).toUpperCase();
}

const same = (a, b) => ['end_card', 'ai_label', 'captions', 'brand_color', 'show_name']
  .every(k => String(a[k]).toUpperCase() === String(b[k]).toUpperCase());
const LT_SECONDS = 2;

// The finishing state of a made advert (manifest.ad_finish) in plain words.
// Same 45-minute "stuck" rule as useFilmJob / the server (AD_FINISH_STALE_MIN).
export function adFinishState(f) {
  if (!f || !f.status) return null;
  if (f.status === 'queued' || f.status === 'running') {
    const at = Date.parse(f.at || '');
    if (Number.isFinite(at) && Date.now() - at > 45 * 60 * 1000) {
      return { key: 'failed', label: 'Not finished', tip: 'Finishing took too long. Try again.' };
    }
    return { key: 'finishing', label: 'Finishing…', tip: 'Adding the end card, captions and AI label — usually a minute or two' };
  }
  if (f.status === 'done') {
    return { key: 'done', label: 'Finished',
             tip: f.engine === 'ffmpeg' ? 'Finished with the plain end card (no captions or motion this time)'
                                        : 'End card, captions and AI label added' };
  }
  return { key: 'failed', label: 'Not finished', tip: f.reason || 'The finishing step didn’t work. Try again.' };
}

export default function AdFinish({ ad, sampleLine = '', onSave, onClose, onEditWords = null, filmUrl = null,
                                   logoApi = null }) {
  const saved = { ...FINISH_DEFAULTS, ...((ad && ad.finish) || {}) };
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [showSafe, setShowSafe] = useState(false);
  const [muted, setMuted] = useState(true);
  const [phase, setPhase] = useState('film');     // film | end
  const [lt, setLt] = useState(false);            // lower third showing
  const [clipDur, setClipDur] = useState(null);
  const [replay, setReplay] = useState(0);
  const vidRef = useRef(null);
  const headRef = useRef(null);
  const badgeRef = useRef(null);
  // Brand assets: the logo is saved the moment it is uploaded or removed (its own route);
  // on a made advert that counts as a change, so "Save & update advert" finishes it again.
  const [rights, setRights] = useState(false);
  const [logoBusy, setLogoBusy] = useState(null);      // null | 'upload' | 'remove'
  const [logoErr, setLogoErr] = useState(null);
  const [logoChanged, setLogoChanged] = useState(false);
  const fileRef = useRef(null);
  const logo = (ad && ad.logo) || null;

  const wide = (ad && ad.ratio) === '16:9';
  const endSec = Math.max(2, Number(ad && ad.endCard) || 3);
  const filmSec = Math.max(2, Math.min(Number(ad && ad.filmSeconds) || 8, clipDur || 8));
  const total = filmSec + endSec;
  const dirty = !same(draft, saved) || logoChanged;
  const set = (patch) => { setErr(null); setDraft(d => ({ ...d, ...patch })); };

  // Esc / × / Cancel close without saving.
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // The loop: film (the style clip, up to the advert's film seconds) → the end card → again.
  const style = draft.end_card;
  useEffect(() => {
    const v = vidRef.current;
    if (phase === 'end') {
      if (v) { try { v.pause(); } catch (_) { /* not ready yet */ } }
      const start = performance.now();
      let raf = 0;
      const step = () => {
        const t = filmSec + Math.min((performance.now() - start) / 1000, endSec);
        if (headRef.current) headRef.current.style.left = `calc(${(t / total) * 100}% - 1px)`;
        if (badgeRef.current) badgeRef.current.textContent = `END CARD ${t.toFixed(1)}s`;
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      const back = setTimeout(() => setPhase('film'), endSec * 1000 + 900);
      return () => { cancelAnimationFrame(raf); clearTimeout(back); };
    }
    setLt(false);
    if (v) {
      try { v.currentTime = 0; } catch (_) { /* not seekable yet */ }
      try { const p = v.play(); if (p && p.catch) p.catch(() => {}); } catch (_) { /* autoplay refused */ }
    }
    let raf = 0;
    const step = () => {
      const cur = v ? Math.min(v.currentTime || 0, filmSec) : 0;
      if (headRef.current) headRef.current.style.left = `calc(${(cur / total) * 100}% - 1px)`;
      if (badgeRef.current) badgeRef.current.textContent = `FILM ${cur.toFixed(1)}s`;
      setLt(style === 'lower_third' && cur >= filmSec - LT_SECONDS);
      if (v && (v.currentTime >= filmSec - 0.02 || v.ended)) { setPhase('end'); return; }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [phase, filmSec, endSec, total, style, replay]);

  const restart = useCallback(() => { setPhase('film'); setReplay(n => n + 1); }, []);
  const showEnd = useCallback(() => setPhase('end'), []);

  const save = async () => {
    setSaving(true); setErr(null);
    try {
      await onSave({ end_card: draft.end_card, ai_label: draft.ai_label, captions: !!draft.captions,
                     brand_color: String(draft.brand_color).toUpperCase(), show_name: draft.show_name !== false });
      onClose();
    } catch (e) {
      const d = e && e.response && e.response.data;
      setErr((d && d.error) || 'Could not save — please try again.');
    } finally { setSaving(false); }
  };

  const brand = (ad && ad.brand) || 'Your brand';
  const offer = (ad && ad.offer) || '';
  // No call to action in the brief → no button on the card: the preview draws exactly what the
  // finished advert will have (the render leaves the button out too).
  const cta = ((ad && ad.cta) || '').trim();
  const url = (ad && ad.url) || '';
  const color = String(draft.brand_color || BRAND_COLORS[0]).toUpperCase();
  const ink = inkFor(color);
  const custom = !BRAND_COLORS.includes(color);
  const frameStyle = { '--adf-brand': color, '--adf-brand-ink': ink };
  const frameCls = ['adf-frame', wide ? 'is-wide' : 'is-tall', phase === 'end' ? 'is-end' : '',
    style === 'slate' ? 's-slate' : 's-hold', lt ? 'is-lt' : '', showSafe ? 'show-safe' : ''].filter(Boolean).join(' ');

  const pickLogo = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f || !logoApi) return;
    setLogoErr(null); setLogoBusy('upload');
    try { await logoApi.upload(f); setLogoChanged(true); showEnd(); }
    catch (er) {
      const d = er && er.response && er.response.data;
      setLogoErr((d && d.error) || 'That logo couldn’t be uploaded — please try again.');
    } finally { setLogoBusy(null); }
  };
  const removeLogo = async () => {
    setLogoErr(null); setLogoBusy('remove');
    try { await logoApi.remove(); setLogoChanged(true); showEnd(); }
    catch (er) { setLogoErr('The logo couldn’t be removed — please try again.'); }
    finally { setLogoBusy(null); }
  };
  const showName = !logo || draft.show_name !== false;
  // The mark on the card: the logo (kept to its shape) or the initials square.
  const mark = (small) => {
    if (!logo) return <div className={`adf-logo${small ? ' adf-lt-logo' : ''}`}>{initials(brand)}</div>;
    const plate = logoPlate(logo, small ? 0.1 : (style === 'slate' ? lumOf(color) : 0.08));
    return (
      <div className={`adf-mark${small ? ' is-small' : ''}${plate ? ' has-plate' : ''}`}
           style={{ '--adf-ratio': `${logo.w} / ${logo.h}`, ...(plate ? { background: plate } : {}) }}>
        <img src={logo.url} alt="" />
      </div>
    );
  };

  const optGroup = (opts, key) => (
    <div className="adf-opts">
      {opts.map(o => (
        <button key={o.key} type="button" className={`adf-opt${draft[key] === o.key ? ' is-on' : ''}`}
                aria-pressed={draft[key] === o.key} title={o.tip}
                onClick={() => { set({ [key]: o.key }); if (key === 'ai_label') showEnd(); else restart(); }}>
          {o.rec && <span className="adf-rec">Suggested</span>}
          <b>{o.label}</b><span>{o.text}</span>
        </button>
      ))}
    </div>
  );

  return createPortal(
    <div className="adf-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="adf-modal" role="dialog" aria-modal="true" aria-labelledby="adf-title">
        <div className="adf-head">
          <div className="adf-title" id="adf-title">How your advert finishes</div>
          {ad && ad.length ? <span className="adf-sub">{`${ad.length}s advert · ${ad.filmSeconds || filmSec}s film + ${endSec}s end card`}</span> : null}
          <button type="button" className="adf-x" onClick={onClose} aria-label="Close" title="Close without saving">×</button>
        </div>

        <div className="adf-body">
          <div className="adf-stage">
            <div className={frameCls} style={frameStyle}>
              <video ref={vidRef} className="adf-vid" src={filmUrl || stylePreviewUrl('photoreal')}
                     poster={filmUrl ? undefined : stylePosterUrl('photoreal')}
                     muted={muted} playsInline preload="auto"
                     onLoadedMetadata={(e) => { const d = e.currentTarget.duration; if (isFinite(d) && d > 1) setClipDur(d); }} />
              <div className="adf-slate" />
              {draft.captions && phase === 'film' && (
                <div className="adf-caption">{sampleLine || 'Spoken lines appear here as captions'}</div>
              )}
              <div className="adf-lt">
                {mark(true)}
                <div>{showName && <b>{brand}</b>}{offer && <small>{offer}</small>}</div>
              </div>
              <div className="adf-ec">
                <div className="adf-card">
                  {mark(false)}
                  {showName && <div className="adf-brand">{brand}</div>}
                  {offer && <div className="adf-offer">{offer}</div>}
                  {cta && <div className="adf-cta">{cta}</div>}
                  {(url || draft.ai_label === 'inline') && (
                    <div className="adf-small">
                      {url && <span>{url}</span>}
                      {url && draft.ai_label === 'inline' && <span className="adf-dot">·</span>}
                      {draft.ai_label === 'inline' && <span className="adf-ailbl">Made with AI</span>}
                    </div>
                  )}
                </div>
                {draft.ai_label === 'mark' && <div className="adf-aimark" aria-label="AI"><b>A</b><b>I</b></div>}
              </div>
              <div className="adf-safe" aria-hidden="true">
                {wide ? <><i className="w" /><span>Keep words inside the inner box</span></>
                      : <><i className="t" /><i className="r" /><i className="b" /><span>Platform buttons / captions</span></>}
              </div>
              <span className="adf-badge" ref={badgeRef}>FILM 0.0s</span>
              <button type="button" className="adf-sound" onClick={() => setMuted(m => !m)}
                      title="Turn the preview sound on or off">{muted ? 'Sound off' : 'Sound on'}</button>
            </div>
            <div className="adf-tl" aria-hidden="true">
              <div className="adf-tl-bar">
                <i className="film" style={{ flex: filmSec }} /><i className="card" style={{ flex: endSec }} />
                <span className="adf-tl-head" ref={headRef} />
              </div>
              <div className="adf-tl-cap"><span>0s</span><span><b>film {filmSec}s{ad && Number(ad.filmSeconds) > filmSec ? ' (clip)' : ''}</b> · end card {endSec}s</span><span>{total}s</span></div>
            </div>
            <div className="adf-play">
              <button type="button" className="adf-btn is-pri" onClick={restart} title="Play the preview again from the start">Replay</button>
              <button type="button" className="adf-btn" onClick={showEnd} title="Jump to the end card">Show the end card</button>
            </div>
            <p className="adf-note">{filmUrl ? 'Preview on your advert’s own film. Saving finishes it again with these choices (free).'
                                             : 'Preview on the photoreal style clip. Your advert’s own film takes its place once it is made.'}</p>
          </div>

          <div className="adf-panel">
            {logoApi && (
              <div className="adf-grp">
                <h3 className="adf-h">Logo</h3>
                <div className="adf-logo-row">
                  <div className={`adf-logo-thumb${logo ? '' : ' is-empty'}`}>
                    {logo ? <img src={logo.url} alt="Your logo" /> : <span>{initials(brand)}</span>}
                  </div>
                  <div className="adf-logo-side">
                    {!logo && (
                      <label className="adf-chk" title="You must own this logo or have permission to use it">
                        <input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} />
                        <span>I own this logo or have permission to use it</span>
                      </label>
                    )}
                    <div className="adf-logo-acts">
                      <input ref={fileRef} type="file" accept={LOGO_TYPES} hidden onChange={pickLogo} aria-label="Choose a logo image" />
                      <button type="button" className="adf-btn" disabled={!!logoBusy || (!logo && !rights)}
                              onClick={() => fileRef.current && fileRef.current.click()}
                              title={!logo && !rights ? 'Tick the box first: you own this logo or may use it'
                                : 'PNG, JPG or WebP, up to 5 MB — a transparent PNG looks best'}>
                        {logoBusy === 'upload' ? 'Uploading…' : logo ? 'Replace logo' : 'Upload logo'}
                      </button>
                      {logo && (
                        <button type="button" className="adf-btn" disabled={!!logoBusy} onClick={removeLogo}
                                title="Remove the logo — the card shows your initials again">
                          {logoBusy === 'remove' ? 'Removing…' : 'Remove'}
                        </button>
                      )}
                    </div>
                    {logo && (
                      <label className="adf-switch" title="Most logos already carry the name — turn this off to show the logo alone">
                        <input type="checkbox" checked={draft.show_name !== false}
                               onChange={(e) => { set({ show_name: e.target.checked }); showEnd(); }} />
                        <span>Show the brand name under the logo</span>
                      </label>
                    )}
                    {logoErr && <span className="adf-err" role="alert">{logoErr}</span>}
                  </div>
                </div>
              </div>
            )}

            <div className="adf-grp">
              <h3 className="adf-h">End card</h3>
              {optGroup(END_CARD_OPTIONS, 'end_card')}
            </div>

            <div className="adf-grp">
              <h3 className="adf-h">AI label</h3>
              <p className="adf-hint">Nothing sits on the film itself. Every choice also writes a hidden “made with AI” tag into the file, which platforms read.</p>
              {optGroup(AI_LABEL_OPTIONS, 'ai_label')}
            </div>

            <div className="adf-grp">
              <h3 className="adf-h">Captions</h3>
              <label className="adf-switch" title="Show the spoken lines as captions (most people watch with the sound off)">
                <input type="checkbox" checked={!!draft.captions} onChange={(e) => { set({ captions: e.target.checked }); restart(); }} />
                <span>{draft.captions ? 'On — spoken lines show as captions' : 'Off — no captions'}</span>
              </label>
            </div>

            <div className="adf-grp">
              <h3 className="adf-h">Brand colour</h3>
              <div className="adf-colors">
                {BRAND_COLORS.map(c => (
                  <button key={c} type="button" className={`adf-sw${color === c ? ' is-on' : ''}`} style={{ background: c }}
                          aria-pressed={color === c} aria-label={`Brand colour ${c}`} title={`Use ${c} as the brand colour`}
                          onClick={() => { set({ brand_color: c }); if (style === 'slate') showEnd(); }} />
                ))}
                <label className={`adf-sw adf-sw-pick${custom ? ' is-on' : ''}`} style={custom ? { background: color } : undefined}
                       title="Pick your own brand colour">
                  <input type="color" value={color.toLowerCase()} aria-label="Pick your own brand colour"
                         onChange={(e) => set({ brand_color: e.target.value.toUpperCase() })} />
                  {!custom && <span aria-hidden="true">+</span>}
                </label>
                <span className="adf-hex">{color}</span>
              </div>
              {logo && logo.colors && logo.colors.length > 0 && (
                <div className="adf-colors adf-colors-logo">
                  <span className="adf-hint">From your logo</span>
                  {logo.colors.map(c => (
                    <button key={`logo-${c}`} type="button" className={`adf-sw${color === c ? ' is-on' : ''}`} style={{ background: c }}
                            aria-pressed={color === c} aria-label={`Brand colour ${c} from your logo`} title={`Use ${c} from your logo`}
                            onClick={() => { set({ brand_color: c }); if (style === 'slate') showEnd(); }} />
                  ))}
                </div>
              )}
            </div>

            <div className="adf-grp">
              <h3 className="adf-h">Words on the card</h3>
              <div className="adf-words">
                <span><em>Brand</em>{brand}</span>
                <span><em>Offer</em>{offer || '—'}</span>
                <span className={cta ? undefined : 'adf-missing'}><em>Call to action</em>{cta || 'None yet — no button on the card'}</span>
                <span><em>Website</em>{url || '—'}</span>
              </div>
              {onEditWords && (
                <button type="button" className="adf-btn" onClick={onEditWords}
                        title="Change these words in Ad setup (brand, offer, call to action, website)">Edit in Ad setup</button>
              )}
            </div>

            <div className="adf-grp">
              <label className="adf-chk" title="Show where platform buttons and captions sit">
                <input type="checkbox" checked={showSafe} onChange={(e) => setShowSafe(e.target.checked)} />
                <span>{wide ? 'Show the title-safe area' : 'Show where platform buttons and captions sit (Reels, TikTok, Shorts)'}</span>
              </label>
            </div>
          </div>
        </div>

        <div className="adf-foot">
          {err && <span className="adf-err" role="alert">{err}</span>}
          <button type="button" className="adf-btn" onClick={onClose} title="Close without saving">Cancel</button>
          <button type="button" className="adf-btn is-pri" disabled={saving || !dirty} onClick={save}
                  title={!dirty ? 'Nothing has changed'
                    : filmUrl ? 'Save these choices and finish your advert again with them (free — the film is kept)'
                    : 'Save these choices with your advert'}>
            {saving ? 'Saving…' : filmUrl ? 'Save & update advert' : 'Save'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}