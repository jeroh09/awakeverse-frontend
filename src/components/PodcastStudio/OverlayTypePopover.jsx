// src/components/PodcastStudio/OverlayTypePopover.jsx
//
// The pop-out for a single overlay TYPE, opened from the Visual panel's four
// type buttons. One shared shell; the body swaps by `type`:
//   card    → position picker + recipe pill (full-width strip) + fine-tune glass
//   cutout  → position picker + light float-depth controls (no glass recipe)
//   inhand  → just the item to hold (name + upload/generate) — no position/glass
//   compare → launch A/B setup + rail-look pill + fine-tune rails
//
// Controlled: reads the current line's `overlay` (ov) and calls onPatch(patch)
// exactly like the inline editor did. The look lives on ov.style (see
// overlayStyle.js). Position lives on ov.preset.
// vertical (2026-10-18): a 9:16 solo episode — the picker shows a tall frame with
// the vertical positions (podcastFormat.js); the caller passes ov.preset already
// mapped to that shape.
// Real preview (2026-10-18): given `backdropUrl` (your host in your studio — the
// same still the Data card / Hook / Caption pop-outs use), the frame shows that
// image with a pin at the centre of each REAL card position (the real rects
// overlap, so full boxes would block each other; hovering a pin outlines the
// true footprint). Card type shows a live glass card styled from ov.style; cutout
// shows the line's image (or a sample) floating with its contact shadow. With no
// image yet it falls back to the HostAvatar picker exactly as before.

import React, { useEffect, useState } from 'react';
import styles from './OverlayTypePopover.module.css';
import HostAvatar from './HostAvatar';
import { IconGlassCard, IconCutout, IconInHand, IconCompare, IconChevronDown, IconClose } from './StudioIcons';
import { PRESETS_VERTICAL, PRESET_RECT_VERTICAL } from './podcastFormat';
import { PRESET_RECT } from './DataCardPopover';
import {
  RECIPE_OPTIONS, RECIPE_INHERIT, KNOB_TIPS, MATERIAL_OPTIONS,
  resolveStyle, currentRecipe, currentMaterial, withRecipe, withKnob, withMaterial,
} from './overlayStyle';

// preset → thumbnail shape (mirror of POSITION_SHAPE in PodcastStudioPage)
const POSITION_SHAPE = {
  side_panel_left: 'panel-l', side_panel_right: 'panel-r',
  corner_card_tl: 'tl', corner_card_tr: 'tr', corner_card_bl: 'bl', corner_card_br: 'br',
  corner_small_tl: 'tl', corner_small_tr: 'tr', corner_small_bl: 'bl', corner_small_br: 'br',
  lower_third: 'bar', lower_third_small_left: 'bar-l', lower_third_small_right: 'bar-r',
};
// vertical frame: the real card rects (% of the 9:16 frame)
const pct = ([l, t, w, h]) => ({ left: `${l}%`, top: `${t}%`, width: `${w}%`, height: `${h}%` });
const ZONE_BOX_VERTICAL = Object.fromEntries(
  Object.entries(PRESET_RECT_VERTICAL).map(([id, r]) => [id, pct(r)]));
const ZONE_BOX = {
  'panel-l': { left: '3%', top: '9%', width: '20%', height: '82%' },
  'panel-r': { right: '3%', top: '9%', width: '20%', height: '82%' },
  tl: { left: '26%', top: '8%', width: '20%', height: '26%' },
  tr: { right: '26%', top: '8%', width: '20%', height: '26%' },
  bl: { left: '26%', bottom: '8%', width: '20%', height: '26%' },
  br: { right: '26%', bottom: '8%', width: '20%', height: '26%' },
  bar: { left: '22%', bottom: '6%', width: '56%', height: '13%' },
  'bar-l': { left: '20%', bottom: '6%', width: '30%', height: '13%' },
  'bar-r': { right: '20%', bottom: '6%', width: '30%', height: '13%' },
};
const PRESETS_SINGLE = [
  ['side_panel_left', 'Left panel', 'Tall panel down the left · portrait (~435×520) — best for charts'],
  ['side_panel_right', 'Right panel', 'Tall panel down the right · portrait (~435×520) — best for charts'],
  ['corner_card_tl', 'Top left', 'Card top-left · wide 16:9 (~660×370)'],
  ['corner_card_tr', 'Top right', 'Card top-right · wide 16:9 (~660×370)'],
  ['corner_card_bl', 'Bottom left', 'Card bottom-left · wide 16:9 (~660×370)'],
  ['corner_card_br', 'Bottom right', 'Card bottom-right · wide 16:9 (~660×370)'],
  ['lower_third', 'Bottom bar', 'Wide strip across the bottom (~1280×160) — best for a headline or stat'],
];
const PRESETS_MULTI = [
  ['corner_small_tl', 'Top left', 'Small card top-left'],
  ['corner_small_tr', 'Top right', 'Small card top-right'],
  ['corner_small_bl', 'Bottom left', 'Small card bottom-left'],
  ['corner_small_br', 'Bottom right', 'Small card bottom-right'],
  ['lower_third_small_left', 'Bottom left bar', 'Short caption strip, lower-left (~700×110)'],
  ['lower_third_small_right', 'Bottom right bar', 'Short caption strip, lower-right (~700×110)'],
];

const HEAD_IC = { color: '#818CF8', '--si-accent': '#A5B4FC' };
const HEAD = {
  card:   [<IconGlassCard size={20} style={HEAD_IC} />, 'Glass card', 'Position · look · fine-tune'],
  cutout: [<IconCutout size={20} style={HEAD_IC} />, 'Cutout', 'Position · float depth'],
  inhand: [<IconInHand size={20} style={HEAD_IC} />, 'In hand', 'Just the item to hold'],
  compare:[<IconCompare size={20} style={HEAD_IC} />, 'Compare', 'A vs B rails · rail look'],
};

// ── live previews over the real still ───────────────────────────────────────
// Sizes are in cqw of the frame (the .layer is a size container), so the preview
// keeps the video's proportions at any width: 1280px of video ≈ 100cqw.
const PX = 100 / 1280;

function GlassPreview({ rect, view, imageUrl, frameRatio }) {
  const [l, t, w, h] = rect;
  const a = Math.max(0, Math.min(255, Number(view.glass_tint_alpha ?? 150))) / 255;
  const liquid = view.material === 'liquid_glass';
  const solid = !view.backdrop_blur && !view.glass_frame;            // "Sticker"
  const blur = view.backdrop_blur ? Number(view.blur_sigma ?? 18) * PX : 0;
  const wide = (w / h) * frameRatio > 2.2;
  const right = l + w / 2 > 50;
  const deg = view.tilt && !wide ? Number(view.tilt_strength ?? 0.1) * 80 : 0;
  const background = solid
    ? (liquid ? 'rgba(232,236,248,0.96)' : 'rgba(18,24,44,0.97)')
    : liquid
      ? `linear-gradient(180deg, rgba(255,255,255,${(a * 0.42).toFixed(3)}), rgba(255,255,255,${(a * 0.16).toFixed(3)})), rgba(12,16,30,0.10)`
      : `linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03)), rgba(14,18,36,${(a * 0.8).toFixed(3)})`;
  const shadows = ['inset 0 0 0 1px rgba(255,255,255,0.26)'];
  if (view.rim) shadows.push('inset 0 1px 0 rgba(255,255,255,0.55)', 'inset 0 -1.4cqw 1.8cqw -1.4cqw rgba(0,0,0,0.4)');
  shadows.push(view.two_layer_shadow
    ? '0 0.25cqw 0.5cqw rgba(0,0,0,0.45), 0 2.2cqw 4cqw -1.6cqw rgba(0,0,0,0.65)'
    : '0 0.8cqw 1.8cqw rgba(0,0,0,0.3)');
  const filter = blur ? `blur(${blur.toFixed(2)}cqw) saturate(1.15)` : 'none';
  const warm = Number(view.warm_tint_alpha || 0) / 255;
  const inset = view.glass_frame ? '7%' : '0';
  const ink = solid && liquid ? '#0f172a' : '#F8FAFC';
  return (
    <div className={styles.glass} style={{
      left: `${l}%`, top: `${t}%`, width: `${w}%`, height: `${h}%`, background,
      backdropFilter: filter, WebkitBackdropFilter: filter, boxShadow: shadows.join(', '),
      transform: `perspective(60cqw) rotateY(${right ? -deg : deg}deg)`,
      transformOrigin: right ? 'right center' : 'left center',
    }}>
      {warm > 0 ? <span className={styles.glassWarm} style={{ opacity: Math.min(1, warm * 2.2) }} /> : null}
      <div className={styles.glassIn} style={{ inset, color: ink }}>
        {imageUrl ? (
          <img src={imageUrl} alt="" style={{ objectFit: view.glass_content_fit === 'cover' ? 'cover' : 'contain' }} />
        ) : (
          <div className={`${styles.sample} ${wide ? styles.sampleWide : ''} ${solid && liquid ? styles.sampleLight : ''}`}>
            <span className={styles.sampleT}>Your chart</span>
            <span className={styles.sampleBars}><i style={{ height: '38%' }} /><i style={{ height: '58%' }} /><i style={{ height: '46%' }} /><i className={styles.sampleHl} style={{ height: '92%' }} /></span>
          </div>
        )}
      </div>
      {view.sheen ? <span className={styles.glassSheen} /> : null}
    </div>
  );
}

function CutoutPreview({ rect, view, imageUrl }) {
  const [l, t, w, h] = rect;
  const deg = view.tilt ? -Number(view.tilt_strength ?? 0.1) * 60 : 0;
  return (
    <div className={styles.cut} style={{ left: `${l}%`, top: `${t}%`, width: `${w}%`, height: `${h}%` }}>
      {view.two_layer_shadow ? <span className={styles.cutShadow} /> : null}
      <div className={styles.cutObj} style={{ transform: `translateX(-50%) rotate(${deg}deg)` }}>
        {imageUrl ? <img src={imageUrl} alt="" /> : <span className={styles.cutSample} />}
      </div>
    </div>
  );
}

// The still behind every frame (or null when there isn't one / it failed to load).
function useBackdrop(url) {
  const [ok, setOk] = useState(true);
  useEffect(() => { setOk(true); }, [url]);
  return [url && ok ? url : null, () => setOk(false)];
}

function Frame({ posList, activePreset, onPick, vertical = false, backdropUrl = null, renderPreview, children }) {
  const [bg, onBgError] = useBackdrop(backdropUrl);
  const [hoverId, setHoverId] = useState(null);
  const rectFor = (id) => (vertical ? PRESET_RECT_VERTICAL[id] : PRESET_RECT[id]) || null;
  const showId = hoverId || activePreset;
  const shown = posList.find(([id]) => id === showId);
  const previewRect = showId ? rectFor(showId) : null;
  const footRect = hoverId ? rectFor(hoverId) : null;
  return (
    <>
      <div className={styles.frame}
           style={vertical ? { aspectRatio: '9 / 16', width: 'min(100%, 230px)', margin: '0 auto' } : undefined}>
        {bg ? (
          <>
            <img className={styles.bg} src={bg} alt="" onError={onBgError} />
            <div className={styles.layer}>
              {previewRect && renderPreview ? renderPreview(previewRect) : null}
            </div>
            {footRect ? <span className={styles.footprint} style={pct(footRect)} /> : null}
            {posList.map(([id, label]) => {
              const r = rectFor(id);
              if (!r) return null;
              const on = activePreset === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={`${styles.pin} ${on ? styles.pinOn : ''}`}
                  style={{ left: `${r[0] + r[2] / 2}%`, top: `${r[1] + r[3] / 2}%` }}
                  aria-label={label}
                  aria-pressed={on}
                  onClick={() => onPick(id)}
                  onMouseEnter={() => setHoverId(id)}
                  onMouseLeave={() => setHoverId(null)}
                  onFocus={() => setHoverId(id)}
                  onBlur={() => setHoverId(null)}
                />
              );
            })}
          </>
        ) : (
          <>
            <div className={styles.host}
                 style={vertical ? { left: '15%', width: '70%', height: '62%' } : undefined}><HostAvatar size="82%" /></div>
            {posList.map(([id, label, tip]) => {
              const box = (vertical ? ZONE_BOX_VERTICAL[id] : ZONE_BOX[POSITION_SHAPE[id]]) || {};
              const on = activePreset === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={`${styles.zone} ${on ? styles.zoneOn : ''} ${styles.tip}`}
                  style={box}
                  data-tip={tip}
                  aria-label={label}
                  aria-pressed={on}
                  onClick={() => onPick(id)}
                />
              );
            })}
          </>
        )}
        {children}
      </div>
      {bg && shown ? (
        <p className={styles.posCap}>
          <b>{shown[1]}</b>{shown[2] ? ` · ${shown[2]}` : ''}
          {hoverId && hoverId !== activePreset ? <em> — click to move here</em> : null}
        </p>
      ) : null}
    </>
  );
}

// A plain still (in-hand / compare frames — no position choice).
function Still({ backdropUrl, children }) {
  const [bg, onBgError] = useBackdrop(backdropUrl);
  return (
    <div className={styles.frame}>
      {bg ? <img className={styles.bg} src={bg} alt="" onError={onBgError} />
          : <div className={styles.host}><HostAvatar size="82%" /></div>}
      {children}
    </div>
  );
}

export default function OverlayTypePopover({
  type = 'card',
  ov = {},
  multi = false,
  vertical = false,
  onPatch,
  onOpenCompare,
  onClose,
  onPickItemFile,
  onGenerateItem,
  itemPrompt = '',
  setItemPrompt,
  itemBusy = false,
  backdropUrl = null,          // host-in-studio still (same as Data card / Hook / Caption)
}) {
  const [ftOpen, setFtOpen] = useState(false);

  const styleObj = ov.style;
  const view = resolveStyle(styleObj);
  const recipe = currentRecipe(styleObj);
  const material = currentMaterial(styleObj);

  const setPreset = (p) => onPatch?.({ preset: p });
  const setRecipe = (r) => onPatch?.({ style: withRecipe(r, styleObj) });
  const setKnob = (k, v) => onPatch?.({ style: withKnob(styleObj, k, v) });
  const setMaterial = (m) => onPatch?.({ style: withMaterial(styleObj, m) });

  const [ic, title, sub] = HEAD[type] || HEAD.card;
  const posList = vertical && !multi ? PRESETS_VERTICAL : multi ? PRESETS_MULTI : PRESETS_SINGLE;
  const frameRatio = vertical && !multi ? 9 / 16 : 16 / 9;

  // ── small render helpers ────────────────────────────────────────────────
  const Q = ({ k }) => <span className={`${styles.qmark} ${styles.tip}`} data-tip={KNOB_TIPS[k]}>?</span>;
  const Toggle = ({ k, label }) => (
    <div className={styles.tog}>
      <span className={styles.lbl}>{label}<Q k={k} /></span>
      <label className={styles.sw}>
        <input type="checkbox" checked={!!view[k]} onChange={(e) => setKnob(k, e.target.checked)} />
        <span />
      </label>
    </div>
  );
  const Slider = ({ k, label, min, max, step = 1, toUi = (v) => v, fromUi = (v) => v, fmt }) => (
    <div className={styles.slider}>
      <span className={styles.sname}>{label}<Q k={k} /></span>
      <input
        type="range" min={min} max={max} step={step}
        value={toUi(view[k])}
        onChange={(e) => setKnob(k, fromUi(+e.target.value))}
      />
      <b>{fmt(view[k])}</b>
    </div>
  );

  const RecipePill = () => (
    <div className={styles.pillStrip}>
      {RECIPE_OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`${styles.pillBtn} ${recipe === o.id ? styles.pillOn : ''} ${styles.tip}`}
          data-tip={o.tip}
          onClick={() => setRecipe(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  // Glass material — the surface axis, shown first (above the intensity pill).
  const MaterialToggle = () => (
    <div className={styles.matStrip} role="group" aria-label="Glass material">
      {MATERIAL_OPTIONS.map((m) => (
        <button
          key={m.id}
          type="button"
          className={`${styles.matBtn} ${material === m.id ? styles.matOn : ''} ${styles.tip}`}
          data-tip={m.tip}
          aria-pressed={material === m.id}
          onClick={() => setMaterial(m.id)}
        >
          <span className={`${styles.matSwatch} ${styles[m.swatch === 'liquid' ? 'swLiquid' : 'swDark']}`} />
          {m.label}
        </button>
      ))}
    </div>
  );

  const FineTune = ({ label, children }) => (
    <div className={styles.finetune}>
      <button type="button" className={styles.ftbtn} onClick={() => setFtOpen((v) => !v)}>
        {label}<span style={{ display: 'inline-flex' }}>
          <IconChevronDown size={12} style={{ transform: ftOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
        </span>
      </button>
      <div className={`${styles.ftbody} ${ftOpen ? styles.ftOpen : ''}`}>{children}</div>
    </div>
  );

  // ── bodies ──────────────────────────────────────────────────────────────
  let body;
  if (type === 'card') {
    body = (
      <>
        <MaterialToggle />
        <RecipePill />
        <div className={styles.body}>
          <div className={styles.col}>
            <div className={styles.grp}>Position — click where it lands</div>
            <Frame posList={posList} activePreset={ov.preset} onPick={setPreset} vertical={vertical && !multi}
                   backdropUrl={backdropUrl}
                   renderPreview={(rect) => <GlassPreview rect={rect} view={view} imageUrl={ov.imageUrl} frameRatio={frameRatio} />} />
          </div>
          <div className={styles.col}>
            <FineTune label="Fine-tune glass">
              <Toggle k="glass_frame" label="Glass frame" />
              <Toggle k="backdrop_blur" label="Backdrop blur" />
              <Slider k="blur_sigma" label="Blur" min={0} max={40} fmt={(v) => v} />
              <Slider k="glass_tint_alpha" label="Frost" min={90} max={220} fmt={(v) => v} />
              <Toggle k="sheen" label="Sheen" />
              <Toggle k="rim" label="Rim light" />
              <Toggle k="two_layer_shadow" label="Two-layer shadow" />
              <Slider k="warm_tint_alpha" label="Warm" min={0} max={60} fmt={(v) => v} />
              <Toggle k="tilt" label="Perspective tilt" />
              <Slider
                k="tilt_strength" label="Tilt" min={0} max={20}
                toUi={(v) => Math.round(v * 100)} fromUi={(v) => v / 100}
                fmt={(v) => v.toFixed(2)}
              />
            </FineTune>
          </div>
        </div>
      </>
    );
  } else if (type === 'cutout') {
    body = (
      <div className={styles.body}>
        <div className={styles.col}>
          <div className={styles.grp}>Position — click where it lands</div>
          <Frame posList={posList} activePreset={ov.preset} onPick={setPreset} vertical={vertical && !multi}
                 backdropUrl={backdropUrl}
                 renderPreview={(rect) => <CutoutPreview rect={rect} view={view} imageUrl={ov.imageUrl} />} />
          <p className={styles.hint}>Cutouts float free — no card, no glass recipe.</p>
        </div>
        <div className={styles.col}>
          <div className={styles.grp}>Float depth</div>
          <Toggle k="two_layer_shadow" label="Contact shadow" />
          <Toggle k="tilt" label="Slight tilt" />
          <Slider
            k="tilt_strength" label="Tilt" min={0} max={20}
            toUi={(v) => Math.round(v * 100)} fromUi={(v) => v / 100}
            fmt={(v) => v.toFixed(2)}
          />
          <p className={styles.hint} style={{ marginTop: 12 }}>
            Depth &amp; size map to the cutout builder — wire the cutout half of the
            style contract next.
          </p>
        </div>
      </div>
    );
  } else if (type === 'inhand') {
    body = (
      <div className={styles.body}>
        <div className={styles.col}>
          <div className={styles.grp}>The item to hold</div>
          <Still backdropUrl={backdropUrl}>
            <div className={`${styles.zone} ${styles.zoneOn}`} style={{ left: '44%', bottom: '20%', width: '16%', height: '20%' }} />
          </Still>
          <p className={styles.hint}>Placement is automatic — the speaker is composed holding it.</p>
        </div>
        <div className={styles.col}>
          <div className={styles.grp}>Item</div>
          <div className={styles.field}>
            <label>Product / item name</label>
            <input
              className={styles.input}
              value={ov.productName || ''}
              placeholder="e.g. the new handset"
              onChange={(e) => onPatch?.({ productName: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label>Item image <span className={`${styles.qmark} ${styles.tip}`} data-tip="Upload a photo (background removed automatically) or generate one from a prompt.">?</span></label>
            <div className={styles.miniBtns}>
              <label className={styles.mb}>
                {itemBusy ? 'Uploading…' : ov.imageUrl ? 'Change' : 'Upload'}
                <input type="file" accept="image/*" hidden onChange={(e) => onPickItemFile?.(e.target.files?.[0])} />
              </label>
              <button type="button" className={styles.mb} onClick={onGenerateItem}>Generate</button>
            </div>
          </div>
          {typeof setItemPrompt === 'function' && (
            <div className={styles.field}>
              <label>Generate prompt</label>
              <input className={styles.input} value={itemPrompt} placeholder="a sleek matte-black phone"
                     onChange={(e) => setItemPrompt(e.target.value)} />
            </div>
          )}
          <p className={styles.hint}>In hand is the odd one out — it’s about <b>what’s held</b>, not a panel look.</p>
        </div>
      </div>
    );
  } else { // compare
    body = (
      <>
        <MaterialToggle />
        <RecipePill />
        <div className={styles.body}>
          <div className={styles.col}>
            <div className={styles.grp}>A vs B rails</div>
            <Still backdropUrl={backdropUrl}>
              <div className={`${styles.zone} ${styles.zoneOn}`} style={ZONE_BOX['panel-l']} />
              <div className={`${styles.zone} ${styles.zoneOn}`} style={ZONE_BOX['panel-r']} />
              <div className={styles.vsNode}>VS</div>
            </Still>
            <p className={styles.hint}>Rails are fixed left/right for the whole episode — no position choice.</p>
          </div>
          <div className={styles.col}>
            <button type="button" className={styles.launch} onClick={onOpenCompare}>
              <IconCompare size={15} style={{ marginRight: 6, marginTop: -2 }} />Open A vs B setup
            </button>
            <FineTune label="Fine-tune rails">
              <Toggle k="backdrop_blur" label="Backdrop blur" />
              <Slider k="blur_sigma" label="Blur" min={0} max={40} fmt={(v) => v} />
              <Toggle k="sheen" label="Sheen" />
              <Toggle k="rim" label="Rim light" />
              <Toggle k="two_layer_shadow" label="Two-layer shadow" />
              <Toggle k="tilt" label="Perspective tilt" />
              <Toggle k="vs" label="VS node" />
            </FineTune>
            <p className={styles.hint} style={{ marginTop: 10 }}>
              Rails read this look once the compare style contract lands in
              <code> podcast_compare.py</code>.
            </p>
          </div>
        </div>
      </>
    );
  }

  const hint =
    type === 'inhand' ? 'In hand ignores position + glass look — it only needs the item.'
    : type === 'compare' ? 'Rails apply episode-wide. “Episode default” keeps them consistent with your card look.'
    : recipe === RECIPE_INHERIT ? 'Leave Look on Episode default to inherit the episode-wide style.'
    : 'This look applies to just this beat.';

  return (
    <div className={styles.pop} role="dialog" aria-label={`${title} options`}>
      <div className={styles.pophead}>
        <span className={styles.ic}>{ic}</span>
        <div className={styles.t}>{title}<small>{sub}</small></div>
        <button type="button" className={styles.x} aria-label="Close" onClick={onClose}><IconClose size={14} /></button>
      </div>
      {body}
      <div className={styles.foot}>
        <span className={styles.hint}>{hint}</span>
        <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={onClose}>Done</button>
      </div>
    </div>
  );
}