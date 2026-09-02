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

import React, { useState } from 'react';
import styles from './OverlayTypePopover.module.css';
import HostAvatar from './HostAvatar';
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

const HEAD = {
  card:   ['▣', 'Glass card', 'Position · look · fine-tune'],
  cutout: ['✂', 'Cutout', 'Position · float depth'],
  inhand: ['✋', 'In hand', 'Just the item to hold'],
  compare:['⚖️', 'Compare', 'A vs B rails · rail look'],
};

function Frame({ posList, activePreset, onPick, children }) {
  return (
    <div className={styles.frame}>
      <div className={styles.host}><HostAvatar size="82%" /></div>
      {posList.map(([id, label, tip]) => {
        const box = ZONE_BOX[POSITION_SHAPE[id]] || {};
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
      {children}
    </div>
  );
}

export default function OverlayTypePopover({
  type = 'card',
  ov = {},
  multi = false,
  onPatch,
  onOpenCompare,
  onClose,
  onPickItemFile,
  onGenerateItem,
  itemPrompt = '',
  setItemPrompt,
  itemBusy = false,
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
  const posList = multi ? PRESETS_MULTI : PRESETS_SINGLE;
  const showPill = type === 'card' || type === 'compare';

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
        {label}<span>{ftOpen ? '▴' : '▾'}</span>
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
            <Frame posList={posList} activePreset={ov.preset} onPick={setPreset} />
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
          <Frame posList={posList} activePreset={ov.preset} onPick={setPreset} />
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
          <div className={styles.frame}>
            <div className={styles.host}><HostAvatar size="82%" /></div>
            <div className={`${styles.zone} ${styles.zoneOn}`} style={{ left: '44%', bottom: '20%', width: '16%', height: '20%' }} />
          </div>
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
            <div className={styles.frame}>
              <div className={`${styles.zone} ${styles.zoneOn}`} style={ZONE_BOX['panel-l']} />
              <div className={`${styles.zone} ${styles.zoneOn}`} style={ZONE_BOX['panel-r']} />
              <div className={styles.vsNode}>VS</div>
            </div>
            <p className={styles.hint}>Rails are fixed left/right for the whole episode — no position choice.</p>
          </div>
          <div className={styles.col}>
            <button type="button" className={styles.launch} onClick={onOpenCompare}>↔ Open A vs B setup</button>
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
        <button type="button" className={styles.x} aria-label="Close" onClick={onClose}>✕</button>
      </div>
      {body}
      <div className={styles.foot}>
        <span className={styles.hint}>{hint}</span>
        <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={onClose}>Done</button>
      </div>
    </div>
  );
}