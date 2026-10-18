// src/components/PodcastStudio/PodcastStudioPage.jsx
//
// Podcast Studio — full page, glassmorphic, no scroll.
// Layout:
//   Top center:  floating pill nav  [ Avatar · Script · Generate · My Podcasts · Guide ]
//   Left/center: active step content (fills all remaining space)
//   Right col:   environment picker (always visible, own double-border glass panel)
//   Bottom:      floating footer pill [ ← Back ] ●●● [ Continue → ]
//
// Deep stages (avatar building, script detail) swap to their own full-screen view.
// Everything: double border ring + rounded + translucent glass.
//
// NAMING CONVENTIONS (Hook state ←→ Backend field):
//   photoFile        → photo (form field)      POST /api/podcast/photo/upload
//   photoUrl         → photo_url               POST /api/podcast/photo/upload ← response
//   avatarRefUrl     → avatar_ref_url           POST /api/podcast/avatar/build ← response
//   avatarId         → avatar_id               POST /api/podcast/avatar/build ← response
//   envId            → env_id                  selected environment
//   displayName      → display_name
//   characterKey     → character_key           GET  /api/podcast/character/<key>/ref
//   characterRefUrl  → avatar_ref_url          GET  /api/podcast/character/<key>/ref ← response
//   characterVoiceId → voice_id               GET  /api/podcast/character/<key>/ref ← response
//   lines[].audioUrl → audio_url              session payload
//   sessionId        → session_id             POST /api/podcast/session ← response
//   sessionProgress  → progress               GET  /api/podcast/session/<id>
//   finalUrl         → final_url              GET  /api/podcast/session/<id>
//   sessions[]       → sessions[]             GET  /api/podcast/sessions

import React, {
  useState, useEffect, useRef, useCallback, useReducer, useMemo
} from 'react';
import usePodcastStudio from '../../hooks/usePodcastStudio';
import { useAppView } from '../../contexts/AppViewContext';
import useCredits from '../../hooks/useCredits';
import InsufficientCreditsBanner from './InsufficientCreditsBanner';
import styles from './PodcastStudioPage.module.css';
import ApiErrorService from '../../services/ApiErrorService';
import VoiceBrowser from './VoiceBrowser';
import OutfitPicker from './OutfitPicker';
import ComparisonSetup from './ComparisonSetup';
import OverlayTypePopover from './OverlayTypePopover';
import { RECIPE_OPTIONS, currentRecipe } from './overlayStyle';
import SourcesPanel from './SourcesPanel';
import CitationChips from './CitationChips';
import HookPopover from './HookPopover';
import SoundPopover from './SoundPopover';
import CaptionPopover, { CAPTION_STYLES } from './CaptionPopover';
import { ASPECTS, mapPreset, PRESETS_VERTICAL, IMAGE_HINT_VERTICAL, PRESET_RECT_VERTICAL } from './podcastFormat';
import { loadExtras, suggestHook, hookSummary, designDataCard } from './podcastExtras';
import DataCardPopover, { dataCardReady, dataCardPayload, dataCardSummary, PRESET_RECT } from './DataCardPopover';
import SettingRow, { SettingGroup } from './SettingRow';
import {
  IconGlassCard, IconCutout, IconInHand, IconDataCard, IconChart, IconCompare, IconHook,
  IconSound, IconCaptions, IconOutfit, IconVoice, IconUpload, IconGenerate, IconDetach,
  IconAiPortrait, IconAiScene, IconRegenerate, IconGrip, IconAddVisual, IconAddLine,
  IconRecord, IconDeleteLine, IconRecorded, IconImportChat, IconAiWrite, IconLines,
  IconSources, IconPodMic, IconConversation, IconEpisode, IconPerson, IconBin,
  IconDownload, IconAlert, IconCheck, IconClose, IconPlus, IconChevronLeft,
  IconChevronRight, IconChevronDown, IconArrowRight, IconPlay, IconStop, IconLoader,
} from './StudioIcons';

// ── Constants ────────────────────────────────────────────────────────────────
const TABS        = ['avatar', 'script', 'generate', 'podcasts', 'guide'];
const TAB_LABELS  = {
  avatar:   'Avatar',
  script:   'Script',
  generate: 'Generate',
  podcasts: 'My Podcasts',
  guide:    'Guide',
};
const SPEAKER_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444'];
const PAGE_SIZE = 8; // avatar and session pagination — 8 cards + 1 upload slot = 9 max

// Reference script shown during voice-clone recording (focus overlay). Mixes
// sharp consonants, smooth vowels, numbers, and a question to vary rhythm —
// standard voice-sample coverage. ~115 words ≈ 45s at a natural pace, fits
// the "record 30–60s" guidance already shown in the panel.
const VOICE_CLONE_SCRIPT = `Hi, I'm recording my voice for AwakeVerse. This sample includes a mix of sounds — sharp consonants like p, t, and k, along with smooth vowels and natural pauses. The quick brown fox jumps over the lazy dog, while a curious cat watches quietly from the windowsill. I like to speak in a natural, conversational tone — not too fast, not too slow, the way I'd talk to a friend over coffee. A few numbers help too: one, two, three, four, five. And here's a question, just to change the rhythm — how's the weather where you are today? Thanks for listening, and welcome to my podcast.`;
const DEFAULT_GUEST_VOICE = 'pNInz6obpgDQGcFmaJgB'; // Adam — ElevenLabs neutral male
const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

// Maps each overlay preset to a thumbnail shape key, so the position picker
// draws where the visual actually lands (corner card, tall side panel, or the
// wide lower-third bar) rather than an ambiguous dot.
const POSITION_SHAPE = {
  side_panel_left: 'panel-l', side_panel_right: 'panel-r',
  corner_card_tl: 'tl', corner_card_tr: 'tr', corner_card_bl: 'bl', corner_card_br: 'br',
  corner_small_tl: 'tl', corner_small_tr: 'tr', corner_small_bl: 'bl', corner_small_br: 'br',
  lower_third: 'bar', lower_third_small_left: 'bar-l', lower_third_small_right: 'bar-r',
  top_card: 'top',   // vertical (9:16) only
};

// Ideal image size per card shape (from real card geometry at 1280x720).
// Shown as guidance so uploaded images fill the card cleanly under cover-fit.
const IMAGE_SIZE_HINT = {
  tl: 'wide 16:9 (~660×370)', tr: 'wide 16:9 (~660×370)',
  bl: 'wide 16:9 (~660×370)', br: 'wide 16:9 (~660×370)',
  'panel-l': 'portrait (~435×520)', 'panel-r': 'portrait (~435×520)',
  bar: 'very wide banner (~1280×160)',
  'bar-l': 'wide banner (~700×110)', 'bar-r': 'wide banner (~700×110)',
};

// ── Avatar build stages (mirrors ScanLegendModal stage pattern) ───────────────
const BUILD_STAGES = [
  { key: 'uploading',  label: 'Uploading photo…'          },
  { key: 'composing',  label: 'Composing avatar…'         },
  { key: 'baking',     label: 'Baking into environment…'  },
  { key: 'done',       label: 'Avatar ready'               },
];

// ── Icons ─────────────────────────────────────────────────────────────────────
// The studio's own icon set lives in StudioIcons.jsx (2026-10-18). `Ic` keeps
// the old call sites working at their old sizes.
const Ic = {
  Drag:       () => <IconGrip size={14} />,
  Upload:     () => <IconUpload size={24} style={{ color: '#818CF8' }} />,
  Check:      () => <IconCheck size={11} strokeWidth={2.6} />,
  Spin:       () => <IconLoader size={13} />,
  Play:       () => <IconPlay size={16} />,
  Trash:      () => <IconDeleteLine size={14} />,
  Record:     () => <IconRecord size={15} />,
  Add:        () => <IconPlus size={14} />,
  Import:     () => <IconImportChat size={15} />,
  Mic:        () => <IconPodMic size={22} />,
  Video:      () => <IconEpisode size={22} />,
  Refresh:    () => <IconRegenerate size={14} />,
  Alert:      () => <IconAlert size={14} />,
  ImageFrame: () => <IconAiPortrait size={15} />,
};

// Tiny frame showing where a card lands — drawn from the real preset rects
// ([left%, top%, width%, height%], same numbers the renderer uses).
function PositionThumb({ rect, vertical = false }) {
  return (
    <span className={`${styles.vpThumb} ${vertical ? styles.vpThumbTall : ''}`} aria-hidden="true">
      <span className={styles.vpThumbHost} />
      {rect ? (
        <span className={styles.vpThumbZone}
              style={{ left: `${rect[0]}%`, top: `${rect[1]}%`, width: `${rect[2]}%`, height: `${rect[3]}%` }} />
      ) : null}
    </span>
  );
}

// ── Auto-grow helper — shared by the AI assistant input and every line
// textarea. Grows height to fit content up to the CSS max-height, then lets
// the textarea scroll internally past that. Defensive: wrapped in try/catch
// so a measurement quirk (e.g. el not yet in the DOM) never blocks typing —
// worst case, the textarea just keeps its normal CSS-defined height. ─────────
function autoGrowTextarea(el) {
  if (!el) return;
  try {
    el.style.height = 'auto';
    const max = parseFloat(getComputedStyle(el).maxHeight) || Infinity;
    const next = Math.min(el.scrollHeight, max);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden';
  } catch (e) {
    // fail silently — textarea just behaves like a normal fixed-height box
  }
}

// ── Assembles the avatar-generation dropdown selections + free text into a
// single natural-language sentence. Sent through the existing `description`
// field the backend already accepts — the backend itself needs no changes.
// Every field is optional; entirely-empty attrs + empty text yields ''.
// ── Custom dropdown — replaces native <select>. Native select popups are
// OS/browser-rendered and mostly ignore author CSS (no rounded corners,
// background often forced white regardless of styling), which is exactly
// what broke the generate-avatar form. This is a small self-contained
// listbox: closed-state button + an absolutely-positioned rounded menu,
// fully within our own design system. Click-outside closes it defensively.
function GenDropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const selectedLabel = options.find(o => o.value === value)?.label || 'Any';

  return (
    <div className={styles.genFieldCol} ref={wrapRef} style={{ position: 'relative' }}>
      <label className={styles.genFieldLabel}>{label}</label>
      <button
        type="button"
        className={styles.genDropdownTrigger}
        onClick={() => setOpen(o => !o)}
      >
        <span>{selectedLabel}</span>
        <span className={styles.genDropdownChevron}><IconChevronDown size={12} /></span>
      </button>
      {open && (
        <div className={styles.genDropdownMenu}>
          <button
            type="button"
            className={`${styles.genDropdownItem} ${!value ? styles.genDropdownItemActive : ''}`}
            onClick={() => { onChange(''); setOpen(false); }}
          >
            Any
          </button>
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.genDropdownItem} ${value === opt.value ? styles.genDropdownItemActive : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function buildAssembledDescription(attrs, freeText) {
  const traits = [];
  if (attrs.ethnicity) traits.push(attrs.ethnicity);
  if (attrs.build)     traits.push(`${attrs.build} build`);
  if (attrs.hair)      traits.push(`${attrs.hair} hair`);

  let sentence = attrs.age ? `A person in their ${attrs.age}` : (traits.length || attrs.style) ? 'A person' : '';
  if (sentence && traits.length) sentence += `, ${traits.join(', ')}`;
  if (sentence && attrs.style)   sentence += `, dressed in a ${attrs.style} style`;
  if (sentence) sentence += '.';

  const free = (freeText || '').trim();
  if (sentence && free) return `${sentence} ${free}`;
  return sentence || free;
}

// ── Lines reducer ─────────────────────────────────────────────────────────────
const linesReducer = (state, action) => {
  switch (action.type) {
    case 'SET':    return action.lines;
    case 'ADD':    return [...state, { speakerId: action.speakerId, text: '', audioUrl: null, id: Date.now() }];
    case 'UPDATE': return state.map(l => l.id === action.id ? { ...l, ...action.patch } : l);
    case 'REMOVE': return state.filter(l => l.id !== action.id);
    // Drag-to-reorder: take the line at `from` out and put it back at `to`.
    case 'MOVE': {
      const { from, to } = action;
      if (from === to || from < 0 || to < 0 || from >= state.length || to >= state.length) return state;
      const next = state.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    }
    default:       return state;
  }
};

// ── Helper: format seconds ────────────────────────────────────────────────────
const fmtDuration = (s) => {
  if (!s) return '';
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};

// ── Helper: format date ───────────────────────────────────────────────────────
const fmtDate = (iso) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return ''; }
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function PodcastStudioPage({ context, onClose }) {
  const { setActivePodcastRender } = useAppView();

  // Load the reading serif (Newsreader) so podcast lines match the film's
  // reading treatment. Injected as a <link> rather than a CSS @import (which is
  // unreliable once a component stylesheet is bundled). Idempotent + shares the
  // same id as the film loader, so the font is fetched at most once app-wide.
  useEffect(() => {
    const id = 'fw-room-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap';
    document.head.appendChild(link);
  }, []);
  const {
    state,
    environments,
    envsLoading,
    avatars,
    voices,
    consented,
    voiceClone,
    uploadPhoto,
    buildAvatar,
    generateAvatarPreview,
    confirmAvatarPreview,
    bakeAvatarEnv,
    loadOutfits,
    loadWardrobe,
    ensureOriginalFullbody,
    generateOutfitPreview,
    confirmOutfit,
    deleteOutfit,
    generateEnvironmentPreview,
    generateEnvironmentFromImage,
    deleteEnvironment,
    getCharacterRef,
    uploadAudio,
    createSession,
    startPollingSession,
    resetStudio,
    deleteAvatar,
    deleteSession,
    sendScriptMessage,
    recordConsent,
    cloneVoice,
    loadVoiceClone,
    uploadInsert,
    suggestOverlays,
    generateOverlayImage,
  } = usePodcastStudio();

  const credits = useCredits();
  const [creditBlock, setCreditBlock] = useState(null);   // 402 insufficient-credits info

  // ── Navigation ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('avatar');

  // ── Environment ───────────────────────────────────────────────────────────
  const [selectedEnvId, setSelectedEnvId] = useState('studio_tech');
  // envMode: 'standard' = two-chair (max 1 guest), 'panel' = three-chair (max 2 guests)
  const [envMode, setEnvMode] = useState('standard');

  // ── Environment — GENERATE mode (text description → custom background) ────
  // envPanelMode is a UI-layer toggle only ('browse' the existing grid vs
  // 'generate' a new one) — it does NOT carry capacity. Capacity is set by
  // picking a sub-choice (handlePickGenCapacity), which also calls
  // handleEnvModeSwitch so envMode/maxGuests/the guest slots all stay in
  // sync app-wide, exactly as if the format toggle itself had been clicked.
  const [envPanelMode,     setEnvPanelMode]     = useState('browse'); // 'browse' | 'generate'
  const [genEnvCapacity,   setGenEnvCapacity]   = useState(null);     // null (sub-choice screen) | 2 | 3
  const [genEnvId,         setGenEnvId]         = useState(null);     // set after first save — passed to regenerate IN PLACE
  const [genEnvDisplayName, setGenEnvDisplayName] = useState('');
  const [genEnvDescription, setGenEnvDescription] = useState('');
  // Background create sub-mode: 'describe' (text→plate) | 'upload' (photo→plate).
  const [envCreateMode, setEnvCreateMode] = useState('describe');
  const [envImgBusy,    setEnvImgBusy]    = useState(false);
  const [envImgError,   setEnvImgError]   = useState(null);
  const [genEnvPreviewUrl, setGenEnvPreviewUrl] = useState(null);
  const [genEnvLoading,    setGenEnvLoading]    = useState(false);
  const [genEnvError,      setGenEnvError]      = useState(null);

  // ── Speakers ──────────────────────────────────────────────────────────────
  const [speakers, setSpeakers] = useState([]);
  // Derived AFTER speakers — max guests and current count based on envMode
  const maxGuests         = envMode === 'panel' ? 2 : envMode === 'solo' ? 0 : 1;
  const currentGuestCount = speakers.filter(s => s.speakerId !== 'user').length;

  // ── Avatar build ──────────────────────────────────────────────────────────
  const [photoFile,     setPhotoFile]     = useState(null);
  const [photoPreview,  setPhotoPreview]  = useState(null);
  const [avatarRefUrl,  setAvatarRefUrl]  = useState(null);
  const [avatarBuilt,   setAvatarBuilt]   = useState(false);
  const [buildStage,    setBuildStage]    = useState(null); // null | 'uploading'|'composing'|'baking'|'done'
  const [buildError,    setBuildError]    = useState(null);
  const [avatarDragOver, setAvatarDragOver] = useState(false);
  const fileInputRef     = useRef(null);

  // ── Avatar build — GENERATE mode (text description → Nano preview) ───────
  // Mirrors the upload path 1:1 after a previewUrl exists — see
  // handleUseGeneratedAvatar, which is handleBuildAvatar with the upload
  // step skipped (previewUrl is already a Spaces CDN URL).
  const [avatarInputMode, setAvatarInputMode] = useState('upload'); // 'upload' | 'generate'
  const [genDescription,  setGenDescription]  = useState('');
  const [genDisplayName,  setGenDisplayName]  = useState('');
  // Optional dropdown selections for the generate-mode prompt builder —
  // assembled with genDescription via buildAssembledDescription() at
  // generate time. Never reset programmatically, same lifecycle as
  // genDescription (only user interaction clears it).
  const [genAttrs,        setGenAttrs]        = useState({ age: '', ethnicity: '', hair: '', build: '', style: '' });
  const [genPreviewUrl,   setGenPreviewUrl]   = useState(null);
  const [genAttempt,      setGenAttempt]      = useState(0);   // 0..3 — attempts used
  const [genLoading,      setGenLoading]      = useState(false);
  const [genError,        setGenError]        = useState(null);
  const [genRejected,     setGenRejected]     = useState(false);

  // ── Custom guest (real person, user-provided photo) ───────────────────────
  // ── Guest 1 ────────────────────────────────────────────────────────────────
  const [guestFile,      setGuestFile]      = useState(null);
  const [guestPreview,   setGuestPreview]   = useState(null);
  const [guestName,      setGuestName]      = useState('');
  const [guestBuilding,  setGuestBuilding]  = useState(false);
  const [guestBuilt,     setGuestBuilt]     = useState(false);
  const [guestError,     setGuestError]     = useState(null);
  const guestFileRef = useRef(null);

  // ── Guest 2 (panel mode only) ────────────────────────────────────────────
  const [guest2File,     setGuest2File]     = useState(null);
  const [guest2Preview,  setGuest2Preview]  = useState(null);
  const [guest2Name,     setGuest2Name]     = useState('');
  const [guest2Building, setGuest2Building] = useState(false);
  const [guest2Built,    setGuest2Built]    = useState(false);
  const [guest2Error,    setGuest2Error]    = useState(null);
  const guest2FileRef = useRef(null);

  // ── Script ────────────────────────────────────────────────────────────────
  const [lines, dispatchLines] = useReducer(linesReducer, []);
  const linesRef = useRef(lines);          // always-current lines for handleGenerate
  useEffect(() => { linesRef.current = lines; }, [lines]);

  // ── Credits: pre-render cost. Podcast is priced by SPOKEN DURATION (parity with
  // film), estimated from the script text — mirrors credits_hooks._podcast_est_seconds
  // exactly (TTS ~150 wpm = 2.5 words/sec, + wide bookends) so the shown cost equals
  // what the backend reserves.
  const estSeconds = useMemo(() => {
    const spoken = lines.filter(l => (l.text || '').trim() || l.audioUrl);
    const n = spoken.length;
    if (n === 0) return 0;
    let words = 0, audioOnly = 0;
    spoken.forEach(l => {
      const t = (l.text || '').trim();
      if (t) words += t.split(/\s+/).filter(Boolean).length;
      else if (l.audioUrl) audioOnly += 1;
    });
    const wides = n <= 5 ? 2 : 3;
    return Math.ceil(words / 2.5 + audioOnly * 8 + wides * 4);
  }, [lines]);
  const [renderCost, setRenderCost] = useState(null);   // { price, affordable, ... }

  // ── Render quality: Standard (480p lip-sync) / HD (720p) ─────────────────
  // HD costs HD_MULTIPLIER × the Standard price, rounded UP — the same maths as
  // credits_hooks._apply_multiplier (PODCAST_HD_MULTIPLIER on the server, 1.5).
  // Keep the two in step: if the server value changes, change it here too.
  const HD_MULTIPLIER = 1.5;
  const [quality, setQuality] = useState('standard');   // 'standard' | 'hd'
  const basePrice = renderCost?.price != null ? Number(renderCost.price) : null;
  const hdPrice   = basePrice != null ? Math.ceil(basePrice * HD_MULTIPLIER) : null;
  const hdExtra   = basePrice != null ? hdPrice - basePrice : null;
  const effectivePrice = quality === 'hd' ? hdPrice : basePrice;
  // Affordability must follow the price actually shown — recompute from the
  // balance (the server's `affordable` flag is for the Standard price only).
  const effectiveAffordable = effectivePrice == null ? null
    : credits.balance != null ? Number(credits.balance) >= effectivePrice
    : renderCost?.affordable;

  // ── Comparison mode (solo): two glass rails, points reveal line-by-line ──
  const [compareOn,     setCompareOn]     = useState(false);
  const [compareOpen,   setCompareOpen]   = useState(false);   // pop-out panel visible
  const [compareLeft,   setCompareLeft]   = useState({ name: '', logo: '', logoUrl: '' });
  const [compareRight,  setCompareRight]  = useState({ name: '', logo: '', logoUrl: '' });
  const [comparePoints, setComparePoints] = useState([{ label: '', left: '', right: '', revealAtLine: '' }]);
  // compareStyle: the rails look (comparison.style). null = module default; a
  // recipe object { recipe } overrides it for the whole episode.
  const [compareStyle,  setCompareStyle]  = useState(null);

  // ── Optional extras (2026-10-17): AI opening hook + sound effects ────────
  // Both live on the new overlay stage; `extras.available` is false for users
  // not on it yet, and then every entry point below stays hidden. Everything
  // here is OFF until the user turns it on (captions are the only always-on).
  const [extras, setExtras] = useState({ available: false, sounds: [], levels: ['subtle', 'normal', 'bold'], defaultLevel: 'subtle' });
  useEffect(() => { loadExtras().then(setExtras); }, []);
  // Opening hook — the AI designs it from the opening lines; the user decides.
  const [hookDraft,      setHookDraft]      = useState(null);   // {kind, eyebrow, text, number, label, left, right, dur}
  const [hookOn,         setHookOn]         = useState(false);  // user switched it on
  const [hookSuggestion, setHookSuggestion] = useState(null);   // {options:[hook…], reason, recommend}
  const [hookSuggesting, setHookSuggesting] = useState(false);
  const [hookTouched,    setHookTouched]    = useState(false);  // user edited → AI won't overwrite
  const [hookDismissed,  setHookDismissed]  = useState(false);  // ✕ on the line-1 chip
  const [hookOpen,       setHookOpen]       = useState(false);  // pop-out visible
  const [planHook,       setPlanHook]       = useState(null);   // planner's hook (Sources scripts)
  // Sound effects — episode switch + level; the per-line choice rides on each line (line.sfx).
  const [sfxOn,     setSfxOn]     = useState(false);
  const [sfxLevel,  setSfxLevel]  = useState('subtle');
  const [soundOpen, setSoundOpen] = useState(false);
  // Data cards (2026-10-18): designed stat / chart graphics on a line (overlay.mode 'data').
  const [dataOpen,     setDataOpen]     = useState(false);   // pop-out for the open line
  const [dataFilling,  setDataFilling]  = useState(false);
  const [dataFillNote, setDataFillNote] = useState(null);
  // Caption style (2026-10-18): captions are always on; this picks the look (episode-wide).
  const [captionStyle, setCaptionStyle] = useState('glass');
  const [captionOpen,  setCaptionOpen]  = useState(false);

  // ── Frame shape (2026-10-18): Landscape 16:9 (default) or Vertical 9:16 ────
  // Vertical is for solo episodes (any plan). Card positions are shown and sent
  // mapped to the shape (podcastFormat.mapPreset) — a line keeps what was picked,
  // so switching back and forth never loses a choice. The ffmpeg path can't draw
  // the comparison table in a vertical frame, so for users not on the overlay
  // stage, Vertical waits until the comparison is off.
  const [aspect, setAspect] = useState('16:9');
  const isSoloEpisode = speakers.length <= 1;
  const verticalBlocked = !isSoloEpisode
    ? 'Vertical is for solo episodes'
    : (compareOn && !extras.available ? 'Turn off the comparison to go vertical' : null);
  useEffect(() => {
    if (aspect === '9:16' && verticalBlocked) setAspect('16:9');
  }, [aspect, verticalBlocked]);
  const vertical = aspect === '9:16';

  // ── Voice enforcement (frontend gate) ────────────────────────────────────
  // A speaker's voice is VALID only if its voiceId is present in the loaded
  // voices list. This catches BOTH a phantom default id (never in the list) and
  // a defunct id (removed from the list) — same rule the backend enforces.
  // 'record' speakers need no voice. Until voices load, don't flag (avoid a
  // false "invalid" flash).
  const voiceGate = useMemo(() => {
    if (!voices || voices.length === 0) return { ready: true, missing: [] };
    const validIds = new Set(voices.map(v => v.voiceId));
    const missing = speakers.filter(s =>
      (s.voiceMode || 'tts') === 'tts' && !validIds.has(s.voiceId)
    );
    return { ready: missing.length === 0, missing };
  }, [speakers, voices]);
  useEffect(() => {
    if (estSeconds > 0) credits.priceFor('podcast', 'default', estSeconds).then(setRenderCost);
    else setRenderCost(null);
  }, [estSeconds, credits.balance]);
  const [topic, setTopic]      = useState('');
  const linesInitialised = useRef(false);  // guard: only SET lines once on mount

  // ── My Podcasts ───────────────────────────────────────────────────────────
  const [sessions,        setSessions]        = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // ── Pagination — client-side, 8 per page (+ upload button = 9 slots) ─────
  const [avatarPage,  setAvatarPage]  = useState(0);
  const [sessionPage, setSessionPage] = useState(0);

  // ── Delete confirm state ──────────────────────────────────────────────────
  // confirmDelete: { type: 'avatar'|'session', id: string } | null
  // First click sets this. Second click (on "Sure?") executes delete.
  const [confirmDelete, setConfirmDelete] = useState(null);

  // ── Generate ──────────────────────────────────────────────────────────────
  const [submitted, setSubmitted] = useState(false);
  const [dragIdx,   setDragIdx]   = useState(null);  // index being dragged
  const [dragOver,  setDragOver_l] = useState(null);  // index being hovered
  // A line is only draggable while its grip is held — so selecting text inside
  // the line's textarea never starts a drag by accident.
  const [gripLineId, setGripLineId] = useState(null);
  useEffect(() => {
    if (gripLineId === null) return undefined;
    const release = () => setGripLineId(null);   // let go anywhere → not draggable again
    window.addEventListener('mouseup', release);
    window.addEventListener('touchend', release);
    return () => { window.removeEventListener('mouseup', release); window.removeEventListener('touchend', release); };
  }, [gripLineId]);
  const [generateError,  setGenerateError]  = useState(null); // user-friendly error for Generate tab

  // ── Podcast player state ──────────────────────────────────────────────────
  const [activeSession,    setActiveSession]    = useState(null);
  const podcastVideoRef    = useRef(null);

  // ── Mode picker ───────────────────────────────────────────────────────────
  // Shown on cold entry (no context.character). 'solo'|'interview'|null(not chosen yet).
  // null = picker visible. Skipping sets 'solo' as default.
  const [podcastMode, setPodcastMode] = useState(
    context?.character ? 'interview' : null
  );
  // Consent checkboxes — local UI state only, shown once ever.
  // consentGiven = both boxes checked (enables mode cards).
  const [consentPhoto, setConsentPhoto] = useState(false);
  const [consentVoice, setConsentVoice] = useState(false);
  const consentGiven = consentPhoto && consentVoice;

  // ── Mode select with consent recording ───────────────────────────────────
  const handleModeSelect = useCallback(async (mode) => {
    if (!consented) {
      const ok = await recordConsent();
      if (!ok) return;
    }
    if (mode === 'docs') {
      // Sources Mode ("From your docs"): format defaults to interview
      // (host + guest) — the solo/interview segue stays the single source of
      // format truth; a solo doc-briefing = pick Solo, then the Sources pill.
      // NOTE: setScriptMode is intentionally NOT in the deps — it's a stable
      // useState setter declared later in the file (TDZ if referenced in the
      // deps array at render time; safe inside the closure body).
      setPodcastMode('interview');
      setActiveTab('script');
      setScriptMode('sources');
      return;
    }
    setPodcastMode(mode);
    if (mode === 'solo') {
      setActiveTab('script');
      setSelectedEnvId('solo_studio');   // default env for solo, like panel/standard do
    }
  }, [consented, recordConsent, setPodcastMode, setActiveTab, setSelectedEnvId]);

  // Switch between standard (2-chair) and panel (3-chair) env modes
  const handleEnvModeSwitch = useCallback((mode) => {
    setEnvMode(mode);
    if (mode === 'panel') {
      setSelectedEnvId('panel_living_c');
    } else if (mode === 'solo') {
      setSelectedEnvId('solo_studio');
      // Solo = host only — drop every guest.
      setSpeakers(prev => prev.filter(s => s.speakerId === 'user'));
      setGuest2File(null); setGuest2Preview(null);
      setGuest2Name('');   setGuest2Built(false); setGuest2Error(null);
    } else {
      setSelectedEnvId('studio_tech');
      // Trim to max 1 guest when switching down
      setSpeakers(prev => {
        const guests = prev.filter(s => s.speakerId !== 'user');
        if (guests.length > 1) {
          const keepId = guests[0]?.speakerId;
          return prev.filter(s => s.speakerId === 'user' || s.speakerId === keepId);
        }
        return prev;
      });
      setGuest2File(null); setGuest2Preview(null);
      setGuest2Name('');   setGuest2Built(false); setGuest2Error(null);
    }
  }, []);

  // ── Generate-environment: pick a sub-choice (2 or 3 guests) ───────────────
  // Reuses handleEnvModeSwitch so the rest of the app (maxGuests, guest
  // slots, env grid filter) is already in sync the moment a sub-choice is
  // picked — identical to what clicking the format toggle itself would do.
  const handlePickGenCapacity = useCallback((capacity) => {
    handleEnvModeSwitch(capacity === 3 ? 'panel' : capacity === 1 ? 'solo' : 'standard');
    setGenEnvCapacity(capacity);
  }, [handleEnvModeSwitch]);

  // ── Generate-environment: change format — abandons the in-progress one ───
  // A capacity change means a fundamentally different background, not an
  // edit of the current one — reset genEnvId too so the next Generate
  // creates a fresh row rather than overwriting the old one with a
  // mismatched capacity.
  const handleChangeGenFormat = useCallback(() => {
    setGenEnvCapacity(null);
    setGenEnvId(null);
    setGenEnvPreviewUrl(null);
    setGenEnvError(null);
  }, []);

  // ── Generate-environment: generate — AUTO-SAVES, usable immediately ───────
  // No separate "Use this" step — backgrounds carry none of the
  // likeness/rejection risk that gate exists for on the avatar side.
  // Selecting it immediately means it's already the active choice the
  // moment generation finishes; Regenerate below overwrites this same
  // saved row rather than creating a new one each time.
  const handleGenerateEnvironment = useCallback(async () => {
    if (!genEnvDescription.trim() || !genEnvCapacity) return;
    setGenEnvLoading(true);
    setGenEnvError(null);
    try {
      const result = await generateEnvironmentPreview({
        description:    genEnvDescription.trim(),
        guestCapacity:  genEnvCapacity,
        displayName:    genEnvDisplayName.trim() || undefined,
        envId:          genEnvId || undefined, // present on regenerate → overwrite in place
      });
      setGenEnvId(result.envId);
      setGenEnvPreviewUrl(result.plateUrl);
      setSelectedEnvId(result.envId); // already usable — select it right away
    } catch (e) {
      setGenEnvError(e.message || 'Background generation failed. Please try again.');
    } finally {
      setGenEnvLoading(false);
    }
  }, [genEnvDescription, genEnvCapacity, genEnvDisplayName, genEnvId, generateEnvironmentPreview]);

  // ── Generate-environment from an uploaded photo — mirrors handleGenerateEnvironment ──
  // Step 1: uploadPhoto(file) → CDN source_url. Step 2: async build+poll. On
  // complete: refresh grid + select, then drop back to Browse (tagged "Yours").
  const handleUploadEnvironment = useCallback(async (file) => {
    if (!file || !genEnvCapacity) return;
    setEnvImgBusy(true); setEnvImgError(null);
    try {
      const sourceUrl = await uploadPhoto(file);
      const result = await generateEnvironmentFromImage({
        sourceUrl,
        displayName:   genEnvDisplayName.trim() || undefined,
        guestCapacity: genEnvCapacity,
      });
      setSelectedEnvId(result.envId);   // already usable — select it right away
      setEnvPanelMode('browse');        // back to the grid, tagged "Yours"
      setGenEnvCapacity(null);          // reset the create flow
    } catch (e) {
      setEnvImgError(e.message || 'Could not build a background from that photo. Please try another.');
    } finally {
      setEnvImgBusy(false);
    }
  }, [genEnvCapacity, genEnvDisplayName, uploadPhoto, generateEnvironmentFromImage]);

  // ── Generate-environment: regenerate — overwrites the SAME saved row ─────
  const handleRegenerateEnvironment = useCallback(() => {
    setGenEnvPreviewUrl(null);
    setGenEnvError(null);
    handleGenerateEnvironment();
  }, [handleGenerateEnvironment]);

  // ── Generate-environment: done — back to browse, already saved+selected ──
  const handleDoneGeneratingEnvironment = useCallback(() => {
    setGenEnvCapacity(null);
    setGenEnvId(null);
    setGenEnvPreviewUrl(null);
    setGenEnvDescription('');
    setGenEnvDisplayName('');
    setEnvPanelMode('browse'); // back to the grid — it's already there, tagged "Yours"
  }, []);

  // ── Delete a custom (user-generated) environment ──────────────────────────
  const handleDeleteEnvironment = useCallback(async (envId) => {
    try {
      await deleteEnvironment(envId);
      if (selectedEnvId === envId) setSelectedEnvId('studio_tech'); // fall back to a preset
    } catch (e) {
      setGenEnvError(e.message || 'Failed to delete background.');
    }
  }, [deleteEnvironment, selectedEnvId]);

  // ── Script chat assistant ─────────────────────────────────────────────────
  // 'chat' = AI write mode (chat bubbles). 'lines' = edit lines mode (line cards).
  // Entry from chat pill with preloadedLines starts in 'lines'.
  const [scriptMode,       setScriptMode]       = useState(
    context?.preloadedLines?.length ? 'lines' : 'chat'
  );
  const [scriptMessages,   setScriptMessages]   = useState([]); // [{role,content}]
  const [scriptInput,      setScriptInput]      = useState('');
  const [scriptLoading,    setScriptLoading]    = useState(false);
  const [latestScriptBlock, setLatestScriptBlock] = useState(null); // from ---SCRIPT--- marker
  const chatBubblesRef = useRef(null);
  const scriptInputElRef = useRef(null);

  // Auto-grow the AI input bar on every value change — covers live typing
  // AND the programmatic setScriptInput('') reset after sending a message.
  useEffect(() => {
    autoGrowTextarea(scriptInputElRef.current);
  }, [scriptInput]);

  // ── Recording state ───────────────────────────────────────────────────────
  // Per-line recording: one line records at a time.
  // recordingLineId: which line is currently recording (null = idle)
  // mediaRecorderRef: holds the active MediaRecorder instance
  // recordingChunks: accumulates audio data chunks during recording
  const [recordingLineId,  setRecordingLineId]  = useState(null);
  const [recordingError,   setRecordingError]   = useState(null);
  const [uploadingLineId,  setUploadingLineId]  = useState(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);   // live counter while recording
  const [lineDurations,    setLineDurations]    = useState({});  // { [lineId]: "0:08" } after stop
  const [lineBlobUrls,     setLineBlobUrls]     = useState({});  // { [lineId]: blobUrl } for playback
  const [playingLineId,    setPlayingLineId]    = useState(null);// which line audio is playing
  const mediaRecorderRef   = useRef(null);
  const recordingChunks    = useRef([]);
  const recordingTimerRef  = useRef(null);
  const lineAudioRef       = useRef(null);                       // current playback Audio object

  // ── Voice picker state ────────────────────────────────────────────────────
  // voiceGenderFilter: which gender tab is active in the picker ('female'|'male')
  // playingPreviewId: which voice is currently playing a preview
  // selectedVoices: { [speakerId]: voiceId } — persisted on speakers[] at selection
  const [voiceGenderFilter, setVoiceGenderFilter] = useState('female');
  const [playingPreviewId,  setPlayingPreviewId]  = useState(null);
  const previewAudioRef = useRef(null);

  // ── Voice confirmation (generate tab right panel) ────────────────────────────
  // Which speaker's inline picker is expanded (null = all collapsed).
  // One open at a time — clicking a different row closes the previous.
  const [voiceConfirmOpen, setVoiceConfirmOpen] = useState(null);

  // Which speaker the voice-browser overlay is open for (null = closed).
  const [browserSpeakerId, setBrowserSpeakerId] = useState(null);
  // Which speaker the outfit picker is open for (null = closed).
  const [outfitSpeakerId, setOutfitSpeakerId] = useState(null);

  // ── Overlay editor state (on-screen media per line) ──────────────────────────
  // overlayLineId: which line's visual editor is open. When set, the right
  // panel swaps from Voice → Overlay for that line. null = panel shows Voice.
  const [overlayLineId, setOverlayLineId] = useState(null);
  // typePopoverOpen: the per-type options pop-out (position + look) for the
  // active card/cutout. Opened by the Type buttons; closed on Done / X / backdrop.
  const [typePopoverOpen, setTypePopoverOpen] = useState(false);
  useEffect(() => { setTypePopoverOpen(false); }, [overlayLineId]);
  // overlaySuggestions: { [lineId]: { type, term, reason } } from /suggest-overlays.
  // Populated debounced after script edits (recommendation B). type 'none' = no chip.
  const [overlaySuggestions, setOverlaySuggestions] = useState({});
  const [overlayUploading, setOverlayUploading] = useState(false);
  const [overlayGenPrompt, setOverlayGenPrompt] = useState('');
  const [overlayGenerating, setOverlayGenerating] = useState(false);
  const [overlayGenError, setOverlayGenError] = useState(null);
  const [overlayGenOpen, setOverlayGenOpen] = useState(false);   // Visual panel: prompt box shown

  // ── Tab done state ────────────────────────────────────────────────────────
  const tabsDone = {
    avatar:   avatarBuilt || speakers.some(s => s.isCharacter && s.avatarRefUrl),
    script:   lines.length > 0,
    generate: state.status === 'complete',
    podcasts: false,
    guide:    false,
  };

  // ── Load sessions ─────────────────────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/podcast/sessions`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (e) {
      console.warn('⚠️ loadSessions:', e.message);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // ── Saved avatar — available but NOT auto-applied ───────────────────────
  // User sees saved avatars as a quick option but must confirm env + click Build.
  // Auto-applying locked them into studio_tech regardless of env choice.

  // ── Init from context ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!context) return;
if (context.topic) setTopic(context.topic);
    if (context.character) {
      const key = context.characterKey || context.character?.key;
      if (key) {
        getCharacterRef(key).then(ref => {
          setSpeakers(prev => prev.find(s => s.speakerId === key) ? prev : [...prev, {
            speakerId:    key,
            displayName:  ref.characterDisplayName || context.character?.name || 'Guest',
            avatarRefUrl: ref.characterRefUrl,
            voiceId:      ref.characterVoiceId,
            voiceMode:    'tts',
            gender:       'neutral',
            color:        SPEAKER_COLORS[1],
            isCharacter:  true,
            role:         'guest',
          }]);
        }).catch((err) => {
          // Ref fetch failed — still add speaker with fallback so lines stay valid
          console.warn('⚠️ getCharacterRef failed for', key, err);
          setSpeakers(prev => prev.find(s => s.speakerId === key) ? prev : [...prev, {
            speakerId:    key,
            displayName:  context.character?.name || 'Guest',
            avatarRefUrl: null,
            voiceId:      null,
            voiceMode:    'tts',
            gender:       'neutral',
            color:        SPEAKER_COLORS[1],
            isCharacter:  true,
            role:         'guest',
          }]);
        });
      }
    }
    if (context.preloadedLines?.length && !linesInitialised.current) {
      linesInitialised.current = true;
      const charKey = context.characterKey || 'guest';
      // Seed default host speaker so line labels resolve to "You · Host"
      // even before the user builds their avatar.
      setSpeakers(prev => {
        if (prev.find(s => s.speakerId === 'user')) return prev;
        return [{ speakerId: 'user', displayName: 'You', role: 'host',
                  isCharacter: false, color: SPEAKER_COLORS[0],
                  voiceMode: 'tts', voiceId: '21m00Tcm4TlvDq8ikWAM', gender: 'female',
                  avatarRefUrl: null }, ...prev];
      });
      dispatchLines({
        type: 'SET',
        lines: context.preloadedLines.map((l, i) => ({
          ...l,
          id: Date.now() + i,
          audioUrl: null,
          // Normalise backend role → frontend speakerId
          // backend sends speaker_id: 'host'|'guest'
          // frontend speakers use speakerId: 'user' | characterKey
          speakerId: (l.speaker_id || l.speakerId) === 'host'
            ? 'user'
            : charKey,
          displayName: (l.speaker_id || l.speakerId) === 'host'
            ? 'You'
            : (l.display_name || context.character?.name || charKey),
        })),
      });
    }
    // startTab — open Studio at a specific tab (e.g. 'script' from ScriptViewerModal)
    if (context.startTab) {
      setActiveTab(context.startTab);
    }
  }, [context, getCharacterRef]);

  // ── Script chat assistant ─────────────────────────────────────────────────
  // Seed opener message when entering chat mode with empty history.
  useEffect(() => {
    if (scriptMode !== 'chat' || scriptMessages.length > 0) return;
    const guestName = speakers.find(s => s.isCharacter || (s.speakerId !== 'user' && s.role === 'guest'))?.displayName;
    const opener = guestName
      ? `What should you and ${guestName} talk about? I can write the script and refine it with you.`
      : `What's your podcast about? I'll help you write a natural monologue, line by line.`;
    setScriptMessages([{ role: 'assistant', content: opener }]);
  }, [scriptMode]); // eslint-disable-line

  // Auto-scroll chat bubbles to bottom on new messages
  useEffect(() => {
    if (chatBubblesRef.current) {
      chatBubblesRef.current.scrollTop = chatBubblesRef.current.scrollHeight;
    }
  }, [scriptMessages, scriptLoading]);

  const handleSendScriptMessage = useCallback(async () => {
    const text = scriptInput.trim();
    if (!text || scriptLoading) return;

    const newMessages = [...scriptMessages, { role: 'user', content: text }];
    setScriptMessages(newMessages);
    setScriptInput('');
    setScriptLoading(true);

    // Resolve all guests for script-chat — supports 1 or 2 guests
    // Naming: Frontend allGuests[].displayName → Backend guest_name / guest2_name
    const allGuests       = speakers.filter(s => s.speakerId !== 'user');
    const guestName       = allGuests[0]?.displayName || '';
    const guest2Name      = allGuests[1]?.displayName || '';
    const userDisplayName = context?.user?.displayName || 'You';

    try {
      const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';
      const res = await fetch(`${API_BASE}/api/podcast/script-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'include',
        body: JSON.stringify({
          messages:     newMessages,
          speaker_name: userDisplayName,
          topic:        topic || text,
          ...(guestName  ? { guest_name:  guestName  } : {}),
          ...(guest2Name ? { guest2_name: guest2Name } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Script assistant failed');

      setScriptMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      if (data.script_block) setLatestScriptBlock(data.script_block);

    } catch (e) {
      console.error('❌ script-chat:', e);
      setScriptMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I hit an error. Please try again.',
      }]);
    } finally {
      setScriptLoading(false);
    }
  }, [scriptInput, scriptMessages, scriptLoading, speakers, topic, context]);

  const handleConvertToLines = useCallback(async () => {
    if (!latestScriptBlock) return;
    try {
      const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';

      // Resolve guests from speakers[]
      // Naming: speakers[].speakerId → speakerId on each line
      //   'host'   → 'user'     (host)
      //   'guest'  → charKey    (guest1.speakerId)
      //   'guest2' → char2Key   (guest2.speakerId)
      const allGuests  = speakers.filter(s => s.speakerId !== 'user');
      const guest1     = allGuests[0];
      const guest2     = allGuests[1];
      const guestName  = guest1?.displayName || 'Guest';
      const guest2Name = guest2?.displayName || '';
      const charKey    = guest1?.speakerId   || 'guest';
      const char2Key   = guest2?.speakerId   || 'guest2';

      const res = await fetch(`${API_BASE}/api/podcast/parse-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'include',
        body: JSON.stringify({
          script_text:  latestScriptBlock,
          host_name:    context?.user?.displayName || 'You',
          guest_name:   guestName,
          guest2_name:  guest2Name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Parse failed');

      // Remap backend role strings → actual speakerIds
      dispatchLines({
        type: 'SET',
        lines: (data.lines || []).map((l, i) => {
          const role = l.speaker_id || l.speakerId;
          let speakerId, displayName;
          if (role === 'host') {
            speakerId   = 'user';
            displayName = context?.user?.displayName || 'You';
          } else if (role === 'guest2') {
            speakerId   = char2Key;
            displayName = guest2Name || char2Key;
          } else {
            speakerId   = charKey;
            displayName = guestName;
          }
          return { ...l, id: Date.now() + i, audioUrl: null, speakerId, displayName };
        }),
      });
      setScriptMode('lines');
    } catch (e) {
      console.error('❌ convert-to-lines:', e);
    }
  }, [latestScriptBlock, speakers, context, dispatchLines]);

  // ── Sources Mode → Edit Lines handoff ──────────────────────────────────────
  // Deliberate mirror of handleConvertToLines' remap, minus the parse fetch —
  // SourcesPanel delivers lines already structured, with citations riding on
  // each line (so chips survive reorder/delete; no index-keyed map).
  // ONE GUEST: generation emits a single GUEST voice (expansion notes live in
  // podcast_generate.py). No guest avatar yet → speakerId 'guest' fallback,
  // exactly like the chat path's charKey fallback; render validation holds
  // the gate until a real speaker exists.
  const handleSourcesScriptReady = useCallback((genLines, meta) => {
    const allGuests = speakers.filter(sp => sp.speakerId !== 'user');
    const guest1    = allGuests[0];
    const guestName = guest1?.displayName || 'Guest';
    const charKey   = guest1?.speakerId   || 'guest';
    const hostName  = context?.user?.displayName || 'You';

    dispatchLines({
      type: 'SET',
      lines: genLines.map((l, i) => ({
        id:          Date.now() + i,
        text:        l.text,
        audioUrl:    null,
        speakerId:   l.speaker === 'host' ? 'user' : charKey,
        displayName: l.speaker === 'host' ? hostName : guestName,
        citations:   l.citations || [],
        citationsEdited: false,
      })),
    });
    setScriptMode('lines');
    console.log(`📚 Sources script "${meta?.title || 'Untitled'}" → ${genLines.length} lines (scriptId ${meta?.scriptId})`);
    setPlanHook(meta?.plan?.hook || null);   // a strong hint for the opening-hook designer
    // meta.scriptId persists server-side (GET /api/podcast/source-script/<id>)
    // if a "regenerate from the same sources" affordance is wanted later.
  }, [speakers, context, dispatchLines]);

  // ── Per-line recording ────────────────────────────────────────────────────
  // Toggle record on a line. Press once to start, press again to stop + upload.
  // Uses MediaRecorder API. Audio goes through POST /api/podcast/audio/upload
  // (noise reduction applied server-side). Returns audioUrl stored on the line.

  const handleRecord = useCallback(async (lineId) => {
    setRecordingError(null);

    // ── Stop current recording ────────────────────────────────────────────
    if (recordingLineId === lineId) {
      mediaRecorderRef.current?.stop();
      clearInterval(recordingTimerRef.current);
      return;
    }

    // Stop a different line's recording first
    if (recordingLineId && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      clearInterval(recordingTimerRef.current);
    }

    // ── Request mic ───────────────────────────────────────────────────────
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      setRecordingError('Microphone access denied. Please allow microphone in browser settings.');
      return;
    }

    recordingChunks.current = [];
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus' : 'audio/webm';

    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;

    // ── Start live counter ────────────────────────────────────────────────
    setRecordingSeconds(0);
    setRecordingLineId(lineId);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds(s => s + 1);
    }, 1000);

    recorder.ondataavailable = e => {
      if (e.data.size > 0) recordingChunks.current.push(e.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      clearInterval(recordingTimerRef.current);
      setRecordingLineId(null);
      setRecordingSeconds(0);

      const blob = new Blob(recordingChunks.current, { type: mimeType });
      if (blob.size < 100) {
        setRecordingError('Recording too short — please try again.');
        return;
      }

      // ── Derive accurate duration via AudioContext ──────────────────────
      try {
        const arrayBuf = await blob.arrayBuffer();
        const ctx      = new AudioContext();
        const decoded  = await ctx.decodeAudioData(arrayBuf);
        const secs     = Math.round(decoded.duration);
        const fmt      = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
        setLineDurations(prev => ({ ...prev, [lineId]: fmt }));
        ctx.close();
      } catch (_) {
        // fallback: use counter value
        setLineDurations(prev => ({ ...prev, [lineId]: `0:${String(recordingSeconds).padStart(2, '0')}` }));
      }

      // ── Store blob URL for local playback (no upload needed for preview) ─
      const blobUrl = URL.createObjectURL(blob);
      setLineBlobUrls(prev => ({ ...prev, [lineId]: blobUrl }));

      // ── Upload (noise reduction server-side) ──────────────────────────
      setUploadingLineId(lineId);
      try {
        const audioUrl = await uploadAudio(blob);
        dispatchLines({ type: 'UPDATE', id: lineId, patch: { audioUrl } });
        console.log(`🎤 Line ${lineId} recorded → ${audioUrl}`);
      } catch (e) {
        setRecordingError(`Upload failed: ${e.message}`);
      } finally {
        setUploadingLineId(null);
      }
    };

    recorder.start();
  }, [recordingLineId, recordingSeconds, uploadAudio, dispatchLines]);

  // ── Line audio playback ───────────────────────────────────────────────────
  const handlePlayLine = useCallback((lineId) => {
    // Stop current playback
    if (lineAudioRef.current) {
      lineAudioRef.current.pause();
      lineAudioRef.current = null;
    }
    if (playingLineId === lineId) {
      setPlayingLineId(null);
      return;
    }
    const blobUrl = lineBlobUrls[lineId];
    if (!blobUrl) return;
    const audio = new Audio(blobUrl);
    lineAudioRef.current = audio;
    setPlayingLineId(lineId);
    audio.play().catch(() => setPlayingLineId(null));
    audio.onended = () => {
      setPlayingLineId(null);
      lineAudioRef.current = null;
    };
  }, [playingLineId, lineBlobUrls]);

  // ── Overlay: accept an AI suggestion → seed the overlay spec + open editor ──
  // product → product_in_hand mode (name pre-filled from the term).
  // stat/chart → overlay mode, card shape, default small preset for the layout.
  // Data card: the AI fills it from the line (only numbers the line says).
  // The fill answer arrives later: it merges into the line's CURRENT overlay (via the
  // page's always-current linesRef), so a position picked meanwhile survives.
  const fillDataCard = useCallback(async (lineId, hint = null) => {
    const idx = lines.findIndex(l => l.id === lineId);
    const line = lines[idx];
    if (!line || !(line.text || '').trim()) return;
    setDataFilling(true); setDataFillNote(null);
    try {
      const context = [lines[idx - 2], lines[idx - 1], lines[idx + 1]]
        .filter(Boolean).map(l => l.text || '').filter(t => t.trim());
      const card = await designDataCard({ line: line.text, context, hint });
      const now = linesRef.current.find(l => l.id === lineId);
      if (card && now?.overlay?.mode === 'data') {
        const next = card.kind === 'chart'
          ? { ...card, bars: card.bars.map(b => ({ label: b.label, value: String(b.value) })) }
          : card;
        dispatchLines({ type: 'UPDATE', id: lineId,
          patch: { overlay: { ...now.overlay, data: next } } });
      } else if (!card) {
        setDataFillNote("This line doesn't say a number we can show — type it in, or try a line with figures.");
      }
    } finally {
      setDataFilling(false);
    }
  }, [lines, dispatchLines]);

  const acceptSuggestion = useCallback((lineId, sug) => {
    const multi = speakers.length > 1;
    // On the overlay stage, "Show stat / Show chart" makes a designed data card
    // (free, exact numbers) instead of generating an image.
    if (extras.available && (sug.type === 'stat' || sug.type === 'chart')) {
      const data = sug.type === 'stat'
        ? { kind: 'stat', number: sug.term || '', label: '' }
        : { kind: 'chart', title: sug.term || '', bars: [{ label: '', value: '' }, { label: '', value: '' }], highlight: 1 };
      dispatchLines({ type: 'UPDATE', id: lineId,
        patch: { overlay: { mode: 'data', preset: multi ? 'corner_small_tr' : 'side_panel_right', data } } });
      setOverlayLineId(lineId);
      setDataOpen(true);
      fillDataCard(lineId, sug.type);
      return;
    }
    const seed = sug.type === 'product'
      ? { mode: 'product_in_hand', shape: 'card', productName: sug.term || '', imageUrl: null,
          preset: null }
      : { mode: 'overlay', shape: 'card', productName: '', imageUrl: null,
          preset: multi ? 'corner_small_tr' : 'corner_card_tr' };
    dispatchLines({ type: 'UPDATE', id: lineId, patch: { overlay: seed } });
    setOverlayLineId(lineId);
  }, [speakers, dispatchLines, extras.available, fillDataCard]);

  // Patch the open line's overlay spec.
  const patchOverlay = useCallback((patch) => {
    if (!overlayLineId) return;
    dispatchLines({ type: 'UPDATE', id: overlayLineId,
      patch: { overlay: { ...(lines.find(l => l.id === overlayLineId)?.overlay || {}), ...patch } } });
  }, [overlayLineId, lines, dispatchLines]);

  const clearOverlay = useCallback((lineId) => {
    dispatchLines({ type: 'UPDATE', id: lineId, patch: { overlay: null } });
    setOverlayLineId(null);
  }, [dispatchLines]);

  // Upload an overlay image → /insert/upload → set imageUrl on the open line.
  const handleOverlayUpload = useCallback(async (file) => {
    if (!file || !overlayLineId) return;
    setOverlayUploading(true);
    try {
      const url = await uploadInsert(file);
      patchOverlay({ imageUrl: url });
    } catch (e) {
      console.warn('⚠️ overlay upload:', e.message);
    } finally {
      setOverlayUploading(false);
    }
  }, [overlayLineId, uploadInsert, patchOverlay]);

  // Generate an overlay image from a prompt, shape-matched to the position.
  const handleOverlayGenerate = useCallback(async () => {
    if (!overlayLineId || !overlayGenPrompt.trim()) return;
    const oLine = lines.find(l => l.id === overlayLineId);
    const ov = oLine?.overlay || {};
    setOverlayGenerating(true);
    setOverlayGenError(null);
    try {
      const url = await generateOverlayImage({
        prompt: overlayGenPrompt.trim(),
        preset: ov.preset || null,
        shape:  ov.shape || 'card',
        mode:   ov.mode || 'overlay',
      });
      patchOverlay({ imageUrl: url });
      setOverlayGenPrompt('');
    } catch (e) {
      setOverlayGenError(e.message || 'Generation failed');
    } finally {
      setOverlayGenerating(false);
    }
  }, [overlayLineId, overlayGenPrompt, lines, generateOverlayImage, patchOverlay]);

  // ── Overlay: debounced auto-suggest (recommendation B) ──────────────────────
  // ~1.5s after the user stops editing the script, ask the backend which lines
  // could use a visual. Silent — populates chips, never blocks. Skips lines the
  // user already gave an overlay or already dismissed.
  // scriptSignature changes only when line TEXT changes (not on every render),
  // so the effect re-runs on real edits, not on unrelated state updates.
  const scriptSignature = useMemo(
    () => lines.map(l => l.text || '').join('\u0001'),
    [lines]
  );
  useEffect(() => {
    const withText = lines.filter(l => (l.text || '').trim().length > 0);
    if (withText.length === 0) return;
    const t = setTimeout(async () => {
      try {
        const texts = lines.map(l => l.text || '');
        const suggestions = await suggestOverlays(texts);
        if (!Array.isArray(suggestions)) return;
        setOverlaySuggestions(prev => {
          const next = { ...prev };
          suggestions.forEach((s, i) => {
            const line = lines[i];
            if (!line) return;
            // don't override a dismissed ('none') or an already-attached line
            if (line.overlay) return;
            if (prev[line.id]?.type === 'none') return;
            next[line.id] = { type: s.type, term: s.term, reason: s.reason };
          });
          return next;
        });
      } catch (e) {
        // suggestions are optional — never surface an error
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [scriptSignature]);

  // ── Opening hook: the AI designs it from the opening lines ────────────────
  // ~2.5s after the opening (first 8 lines) stops changing, ask for a hook.
  // Silent and optional: fills the line-1 chip, never switches anything on, and
  // never overwrites a hook the user has edited.
  const compareNames = compareOn && compareLeft.name.trim() && compareRight.name.trim()
    ? { left: compareLeft.name.trim(), right: compareRight.name.trim() } : null;
  const openingSignature = useMemo(
    () => lines.slice(0, 8).map(l => l.text || '').join('\u0001'),
    [lines]
  );
  const runHookSuggest = useCallback(async ({ adopt = false } = {}) => {
    const texts = lines.map(l => (l.text || '').trim()).filter(Boolean).slice(0, 8);
    if (!texts.length) return;
    setHookSuggesting(true);
    try {
      const out = await suggestHook({
        lines: texts,
        comparison: compareNames ? { left: { name: compareNames.left }, right: { name: compareNames.right } } : null,
        planHook,
      });
      if (!out.hook) return;
      const options = [out.hook, ...(out.alternatives || [])];
      setHookSuggestion({ options, reason: out.reason, recommend: out.recommend });
      if (adopt || !hookTouched) setHookDraft(out.hook);
      if (adopt) setHookTouched(false);
    } finally {
      setHookSuggesting(false);
    }
  }, [lines, compareNames?.left, compareNames?.right, planHook, hookTouched]);
  useEffect(() => {
    if (!extras.available || hookTouched) return undefined;
    if (!lines.some(l => (l.text || '').trim())) return undefined;
    const t = setTimeout(() => { runHookSuggest(); }, 2500);
    return () => clearTimeout(t);
  }, [openingSignature, extras.available, planHook]);

  // ── Podcast download — proxy through backend to avoid Spaces CORS ───────
  // Direct fetch() to DigitalOcean Spaces CDN is blocked by CORS.
  // Backend endpoint GET /api/podcast/session/<id>/download streams the file
  // back same-origin — identical pattern to content_routes.download_video.
  const handleDownloadPodcast = useCallback(async (session) => {
    if (!session?.session_id) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/podcast/session/${session.session_id}/download`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      const speakers = session.speakers?.map(s => s.display_name).join('_') || 'podcast';
      a.href     = url;
      a.download = `awakeverse_${speakers}_${session.session_id?.slice(0, 8)}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      console.error('❌ Download failed:', e);
    }
  }, []);
  // ── Voice clone recording state ───────────────────────────────────────────
  const [cloningVoice,    setCloningVoice]    = useState(false);
  const [cloneRecSeconds, setCloneRecSeconds] = useState(0);
  const [cloneError,      setCloneError]      = useState(null);
  const [cloneSubmitting, setCloneSubmitting] = useState(false);
  const cloneRecorderRef  = useRef(null);
  const cloneChunksRef    = useRef([]);
  const cloneTimerRef     = useRef(null);

  const handleCloneRecord = useCallback(async () => {
    setCloneError(null);
    if (cloningVoice) {
      cloneRecorderRef.current?.stop();
      clearInterval(cloneTimerRef.current);
      return;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      setCloneError('Microphone access denied.'); return;
    }
    cloneChunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus' : 'audio/webm';
    const recorder = new MediaRecorder(stream, { mimeType });
    cloneRecorderRef.current = recorder;
    setCloneRecSeconds(0);
    setCloningVoice(true);
    cloneTimerRef.current = setInterval(() => setCloneRecSeconds(s => s + 1), 1000);
    recorder.ondataavailable = e => { if (e.data.size > 0) cloneChunksRef.current.push(e.data); };
    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      clearInterval(cloneTimerRef.current);
      setCloningVoice(false);
      setCloneRecSeconds(0);
      const blob = new Blob(cloneChunksRef.current, { type: mimeType });
      if (blob.size < 1000) { setCloneError('Too short — aim for 30+ seconds.'); return; }
      setCloneSubmitting(true);
      try { await cloneVoice(blob, 'My Voice'); }
      catch (e) { setCloneError(e.message); }
      finally { setCloneSubmitting(false); }
    };
    recorder.start();
  }, [cloningVoice, cloneVoice]);

  // Play/stop ElevenLabs preview MP3 for a voice card.
  // Only one preview plays at a time.

  const handlePlayPreview = useCallback((voiceId, previewUrl) => {
    // Stop current
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (playingPreviewId === voiceId) {
      setPlayingPreviewId(null);
      return;
    }
    // Play new
    const audio = new Audio(previewUrl);
    previewAudioRef.current = audio;
    setPlayingPreviewId(voiceId);
    audio.play().catch(() => setPlayingPreviewId(null));
    audio.onended = () => {
      setPlayingPreviewId(null);
      previewAudioRef.current = null;
    };
  }, [playingPreviewId]);

  // ── Assign voice to speaker ───────────────────────────────────────────────
  const handleSelectVoice = useCallback((speakerId, voiceId) => {
    setSpeakers(prev => prev.map(s =>
      s.speakerId === speakerId ? { ...s, voiceId } : s
    ));
    // Stop any playing preview
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
      setPlayingPreviewId(null);
    }
  }, []);

  // Per-episode outfit choice for a real-person speaker. refUrl=null → Original
  // (no outfit). Stored on the speaker; serialized as outfit_ref_url at generate.
  const handleSelectOutfit = useCallback((speakerId, refUrl, label) => {
    setSpeakers(prev => prev.map(s =>
      s.speakerId === speakerId ? { ...s, outfitRefUrl: refUrl || null, outfitLabel: label || null } : s
    ));
  }, []);

  // ── File handling ─────────────────────────────────────────────────────────
  const processFile = useCallback((file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) { setBuildError('Please upload a JPEG, PNG, or WebP image.'); return; }
    if (file.size > 10 * 1024 * 1024) { setBuildError('Photo must be under 10MB.'); return; }
    setBuildError(null);
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = e => setPhotoPreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  const onAvatarDrop = useCallback(e => {
    e.preventDefault(); setAvatarDragOver(false);
    processFile(e.dataTransfer.files[0]);
  }, [processFile]);

  // ── Build avatar ──────────────────────────────────────────────────────────
  const handleBuildAvatar = useCallback(async () => {
    if (!photoFile) return;
    setBuildError(null);
    try {
      setBuildStage('uploading');
      const photoUrl = await uploadPhoto(photoFile);

      setBuildStage('composing');
      const displayName = context?.user?.displayName || 'You';
      const result = await buildAvatar({ photoUrl, displayName, envId: selectedEnvId, position: 'right' });

      setBuildStage('baking');
      await new Promise(r => setTimeout(r, 600)); // brief pause so user sees the stage

      setBuildStage('done');
      setAvatarRefUrl(result.avatarRefUrl);
      setAvatarBuilt(true);

      setSpeakers(prev => {
        const already = prev.find(s => s.speakerId === 'user');
        if (already) return prev.map(s => s.speakerId === 'user' ? { ...s, avatarRefUrl: result.avatarRefUrl } : s);
        return [{
          speakerId: 'user', displayName, avatarRefUrl: result.avatarRefUrl,
          voiceId: '21m00Tcm4TlvDq8ikWAM', voiceMode: 'tts',
          gender: 'female', color: SPEAKER_COLORS[0], isCharacter: false, role: 'host',
        }, ...prev];
      });

    } catch (e) {
      setBuildError(e.message || 'Avatar build failed. Please try again.');
      setBuildStage(null);
    }
  }, [photoFile, uploadPhoto, buildAvatar, selectedEnvId, context]);

  // ── Generate avatar — call Nano with a text description ──────────────────
  // Produces a preview only (genPreviewUrl). Nothing saved, nothing baked.
  // 3 attempts max — enforced client-side, genAttempt tracks usage.
  const handleGenerateAvatar = useCallback(async () => {
    const assembled = buildAssembledDescription(genAttrs, genDescription);
    if (!assembled || genAttempt >= 3) return;
    setGenLoading(true);
    setGenError(null);
    setGenRejected(false);
    try {
      const displayName = genDisplayName.trim() || context?.user?.displayName || 'You';
      const result = await generateAvatarPreview({
        description:    assembled,
        displayName,
        attemptNumber:  genAttempt + 1,
      });
      setGenPreviewUrl(result.previewUrl);
      setGenAttempt(result.attemptNumber);
    } catch (e) {
      // Rejection (Fal content policy) still consumes an attempt.
      setGenAttempt(e.attemptNumber || genAttempt + 1);
      setGenRejected(!!e.rejected);
      setGenError(e.message || 'Avatar generation failed. Please try again.');
      setGenPreviewUrl(null);
    } finally {
      setGenLoading(false);
    }
  }, [genDescription, genAttrs, genDisplayName, genAttempt, generateAvatarPreview, context]);

  // ── Regenerate — clear the rejected preview, keep description, try again ─
  const handleRegenerateAvatar = useCallback(() => {
    setGenPreviewUrl(null);
    setGenError(null);
    setGenRejected(false);
    handleGenerateAvatar();
  }, [handleGenerateAvatar]);

  // ── Use generated avatar — IDENTICAL to handleBuildAvatar, upload skipped ─
  // genPreviewUrl is already a Spaces CDN URL (from generateAvatarPreview),
  // so we go straight to confirmAvatarPreview — same bake pipeline,
  // same buildStage progression, same final state writes as the photo path.
  const handleUseGeneratedAvatar = useCallback(async () => {
    if (!genPreviewUrl) return;
    setBuildError(null);
    try {
      setBuildStage('composing'); // no 'uploading' stage — preview is already hosted
      const displayName = genDisplayName.trim() || context?.user?.displayName || 'You';
      const result = await confirmAvatarPreview({
        previewUrl: genPreviewUrl,
        displayName,
        envId:      selectedEnvId,
        position:   'right',
      });

      setBuildStage('baking');
      await new Promise(r => setTimeout(r, 600)); // same pause as upload path, for parity

      setBuildStage('done');
      setAvatarRefUrl(result.avatarRefUrl);
      setAvatarBuilt(true);

      setSpeakers(prev => {
        const already = prev.find(s => s.speakerId === 'user');
        if (already) return prev.map(s => s.speakerId === 'user' ? { ...s, avatarRefUrl: result.avatarRefUrl } : s);
        return [{
          speakerId: 'user', displayName, avatarRefUrl: result.avatarRefUrl,
          voiceId: '21m00Tcm4TlvDq8ikWAM', voiceMode: 'tts',
          gender: 'female', color: SPEAKER_COLORS[0], isCharacter: false, role: 'host',
        }, ...prev];
      });

    } catch (e) {
      setBuildError(e.message || 'Avatar build failed. Please try again.');
      setBuildStage(null);
    }
  }, [genPreviewUrl, genDisplayName, confirmAvatarPreview, selectedEnvId, context]);

  // ── Add custom guest (lightweight — no build, worker handles at render) ──
  const handleAddGuest = useCallback(async () => {
    if (!guestFile || !guestName.trim()) return;
    setGuestBuilding(true);
    setGuestError(null);
    try {
      // Just upload the photo — no avatar baking here
      // Worker _resolve_refs detects is_character=false + avatar_ref_url
      // and runs fullbody gen + bake at render time
      const photoUrl = await uploadPhoto(guestFile);
      const guestId  = `custom_guest_${Date.now()}`;
      setSpeakers(prev => [...prev.filter(s => s.role !== 'guest' || s.isCharacter), {
        speakerId:    guestId,
        displayName:  guestName.trim(),
        avatarRefUrl: photoUrl,   // raw photo — worker generates fullbody + bakes
        voiceId:      DEFAULT_GUEST_VOICE,
        voiceMode:    'tts',
        gender:       'neutral',
        color:        SPEAKER_COLORS[1],
        isCharacter:  false,
        role:         'guest',
      }]);
      setGuestBuilt(true);
    } catch (e) {
      setGuestError(e.message || 'Failed to add guest');
    } finally {
      setGuestBuilding(false);
    }
  }, [guestFile, guestName, uploadPhoto]);

  // Add guest 2 — panel mode only
  const handleAddGuest2 = useCallback(async () => {
    if (!guest2File || !guest2Name.trim()) return;
    setGuest2Building(true);
    setGuest2Error(null);
    try {
      const photoUrl = await uploadPhoto(guest2File);
      const guestId  = `custom_guest2_${Date.now()}`;
      setSpeakers(prev => [
        ...prev.filter(s => !s.speakerId.startsWith('custom_guest2_')),
        {
          speakerId:    guestId,
          displayName:  guest2Name.trim(),
          avatarRefUrl: photoUrl,
          voiceId:      DEFAULT_GUEST_VOICE,
          voiceMode:    'tts',
          gender:       'neutral',
          color:        SPEAKER_COLORS[2],
          isCharacter:  false,
          role:         'guest',
        },
      ]);
      setGuest2Built(true);
    } catch (e) {
      setGuest2Error(e.message || 'Failed to add guest');
    } finally {
      setGuest2Building(false);
    }
  }, [guest2File, guest2Name, uploadPhoto]);

  // ── Line drag-to-reorder ──────────────────────────────────────────────────
  const handleDragStart = useCallback((e, idx) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    // Firefox only starts a drag when data is set; a private type so dropping
    // on a textarea never pastes anything.
    try { e.dataTransfer.setData('application/x-av-line', String(idx)); } catch (_e) { /* old browsers */ }
  }, []);

  const handleDragOver = useCallback((e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver_l(idx);
  }, []);

  const handleDrop = useCallback((e, idx) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    dispatchLines({ type: 'MOVE', from: dragIdx, to: idx });
    setDragIdx(null);
    setDragOver_l(null);
  }, [dragIdx, dispatchLines]);

  const handleDragEnd = useCallback(() => {
    setDragIdx(null);
    setDragOver_l(null);
    setGripLineId(null);
  }, []);

  // ── Submit session ────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    const currentLines = linesRef.current;
    if (!speakers.length || !currentLines.length) return;

    // Block if host lines exist but no user avatar built
    const hasHostLines   = currentLines.some(l => l.speakerId === 'user');
    const hasUserSpeaker = speakers.some(s => s.speakerId === 'user');
    if (hasHostLines && !hasUserSpeaker) {
      setBuildError('Please build your avatar first — go to the Avatar tab to upload your photo.');
      setActiveTab('avatar');
      return;
    }

    // Hard voice guard — never submit a render with a speaker missing a real
    // voice (matches the backend gate). The button is normally disabled for
    // this, but guard here too so nothing slips through.
    if (voices && voices.length > 0) {
      const validIds = new Set(voices.map(v => v.voiceId));
      const noVoice = speakers.filter(s => (s.voiceMode || 'tts') === 'tts' && !validIds.has(s.voiceId));
      if (noVoice.length) {
        setBuildError(`${noVoice.map(s => s.displayName || 'A speaker').join(', ')} needs a voice. Pick one on the Script tab before generating.`);
        setActiveTab('script');
        return;
      }
    }

    // Clear any previous credit block before a new attempt
    setCreditBlock(null);
    setGenerateError(null);
    setSubmitted(true);

    try {
      const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';

      // Build payload in snake_case — matches backend _validate_session exactly.
      const payload = {
        environment_id: selectedEnvId,
        quality,                         // 'standard' | 'hd' — HD bills 1.5×
        speakers: speakers.map((s, i) => {
          // Always send a voice_id — never null or empty.
          // Host default: Rachel (21m00Tcm4TlvDq8ikWAM)
          // Guest default: Adam  (pNInz6obpgDQGcFmaJgB)
          const isHost       = s.speakerId === 'user' || s.role === 'host';
          const defaultVoice = isHost
            ? '21m00Tcm4TlvDq8ikWAM'   // Rachel — matches host seed at line 392
            : DEFAULT_GUEST_VOICE;       // Adam   — matches guest seed at line 807
          return {
            speaker_id:     s.speakerId     || `s${i + 1}`,
            display_name:   s.displayName,
            avatar_ref_url: s.avatarRefUrl,
            avatar_id:      s.savedAvatarId || null,
            voice_mode:     s.voiceMode     || 'tts',
            voice_id:       s.voiceId       || defaultVoice,
            gender:         s.gender        || 'neutral',
            accent:         s.accent        || '',
            // Per-episode outfit; absent → original avatar look (unchanged path).
            ...(s.outfitRefUrl ? { outfit_ref_url: s.outfitRefUrl } : {}),
          };
        }),
        lines: currentLines
          .filter(l => (l.text || '').trim() || l.audioUrl)
          .map(l => {
            const row = {
              speaker_id: l.speakerId,
              text:       l.text     || '',
              audio_url:  l.audioUrl || null,
            };
            // Per-line sound choice (Sound panel): auto is the default, so only
            // 'none' or a picked sound is sent — and only when sounds are on.
            if (extras.available && sfxOn && l.sfx && l.sfx !== 'auto') row.sfx = l.sfx;
            // Per-line overlay (on-screen media) → snake_case for the backend.
            // Only include a complete, valid spec so a half-filled editor never
            // sends a broken overlay that the session validator would reject.
            const o = l.overlay;
            if (o && o.mode === 'data') {
              // Data card — overlay stage only; sent only when complete.
              if (extras.available && o.preset && dataCardReady(o.data)) {
                row.overlay = { mode: 'data', preset: mapPreset(o.preset, aspect), data: dataCardPayload(o.data) };
              }
            } else if (o && o.imageUrl) {
              if (o.mode === 'product_in_hand') {
                if ((o.productName || '').trim()) {
                  row.overlay = {
                    image_url:    o.imageUrl,
                    mode:         'product_in_hand',
                    shape:        'card',
                    product_name: o.productName.trim(),
                  };
                }
              } else if (o.preset) {
                row.overlay = {
                  image_url: o.imageUrl,
                  mode:      'overlay',
                  shape:     o.shape || 'card',
                  preset:    mapPreset(o.preset, aspect),
                  // Per-beat look ({ recipe, ...overrides }); omitted = inherit
                  // the episode default. Consumed by build_overlay(style=).
                  ...(o.style ? { style: o.style } : {}),
                };
              }
            }
            return row;
          }),
      };

      // ── Comparison mode → session-level "comparison" block (snake_case) ──
      // Only sent when enabled with both subjects named and ≥1 titled point.
      // reveal_at_line is optional per point; the backend auto-distributes any
      // left blank. Guarded so a half-filled editor never sends a broken spec.
      if (compareOn && compareLeft.name.trim() && compareRight.name.trim()) {
        const pts = comparePoints
          .filter(p => (p.label || '').trim())
          .slice(0, 6)
          .map(p => {
            const row = {
              label: p.label.trim(),
              left:  (p.left  || '').trim(),
              right: (p.right || '').trim(),
            };
            const rl = String(p.revealAtLine).trim();
            if (rl !== '' && !Number.isNaN(parseInt(rl, 10))) {
              row.reveal_at_line = parseInt(rl, 10);
            }
            return row;
          });
        if (pts.length) {
          const subj = (s) => {
            const o = { name: s.name.trim(),
                        logo: (s.logo || s.name.trim()[0] || '').slice(0, 2) };
            if ((s.logoUrl || '').trim()) o.logo_url = s.logoUrl.trim();
            return o;
          };
          payload.comparison = {
            layout: 'extended',
            left:   subj(compareLeft),
            right:  subj(compareRight),
            points: pts,
          };
          // Rails look — omitted when Default, so rails inherit the module look.
          if (compareStyle) payload.comparison.style = compareStyle;
        }
      }

      // ── Optional extras (only when switched on) ──────────────────────────
      if (extras.available && hookOn && hookDraft) {
        const h = { kind: hookDraft.kind || 'headline', dur: hookDraft.dur || 4 };
        ['eyebrow', 'text', 'number', 'label', 'left', 'right'].forEach(k => {
          const v = (hookDraft[k] || '').trim();
          if (v) h[k] = v;
        });
        payload.hook = h;
      }
      if (extras.available && sfxOn) {
        payload.sound_effects = true;
        payload.sfx_level     = sfxLevel;
      }
      if (extras.available && captionStyle && captionStyle !== 'glass') {
        payload.caption_style = captionStyle;
      }
      if (aspect === '9:16' && speakers.length === 1) {
        payload.aspect_ratio = '9:16';
      }

      const res = await fetch(`${API_BASE}/api/podcast/session`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'include',
        body:        JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      // Insufficient credits (402) — show the top-up banner, not a generic error.
      if (res.status === 402 || data.error === 'insufficient_credits') {
        setCreditBlock({
          needed: data.needed, available: data.available, shortBy: data.short_by,
          title: data.title, message: data.message,
        });
        setSubmitted(false);
        return;
      }

      // Credits couldn't be verified (503) — nothing was charged; show the
      // server's own wording rather than a generic error.
      if (data.error === 'credit_check_failed') {
        ApiErrorService.log('PodcastStudioPage.handleGenerate', res.status, data);
        setGenerateError(data.message || "We couldn't verify your credits — nothing was charged. Please try again.");
        setSubmitted(false);
        return;
      }

      if (!res.ok) {
        ApiErrorService.log('PodcastStudioPage.handleGenerate', res.status, data);
        setGenerateError(ApiErrorService.getMessage(res.status, data));
        setSubmitted(false);
        return;
      }

      // Hand off to poll loop — NO second POST.
      // startPollingSession sets state to 'rendering' and begins the poll interval.
      startPollingSession(data.session_id);
      // Universal tracker — separate from the line above, lets the pill in
      // ChatApp show render status even after navigating away from this page.
      setActivePodcastRender({ sessionId: data.session_id, status: 'processing', progress: 0 });
      setSubmitted(false);
      // Sessions list refreshed by the useEffect watching state.status === 'complete'

    } catch (e) {
      ApiErrorService.log('PodcastStudioPage.handleGenerate [catch]', 0, { error: e.message });
      setGenerateError(ApiErrorService.getNetworkMessage(e));
      setSubmitted(false);
    }
  }, [
    speakers, selectedEnvId, voices, quality,
    compareOn, compareLeft, compareRight, comparePoints, compareStyle,
    extras.available, hookOn, hookDraft, sfxOn, sfxLevel, captionStyle, aspect,
    startPollingSession, loadSessions, setActivePodcastRender,
  ]);

  // ── Reload sessions when generate completes ───────────────────────────────
  useEffect(() => {
    if (state.status === 'complete') loadSessions();
    // Refresh the balance once the render settles (charged) or fails (refunded).
    if (state.status === 'complete' || state.status === 'failed') credits.refresh();
  }, [state.status, loadSessions]);

  // ── Shared env (selected env object) ─────────────────────────────────────
  const selectedEnv = environments.find(e => e.envId === selectedEnvId);

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className={styles.page}>

      {/* ── Ambient light (slow drift) — behind all panels ── */}
      <div className={styles.ambient} aria-hidden="true" />

      {/* ── Floating tab pill ── */}
      <div className={styles.tabPill}>
        {TABS.map((tab, i) => (
          <button
            key={tab}
            className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            <span className={`${styles.tabStep} ${tabsDone[tab] ? styles.tabStepDone : activeTab === tab ? styles.tabStepActive : ''}`}>
              {tabsDone[tab] ? <Ic.Check /> : i + 1}
            </span>
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* ── Main area ── */}
      <div className={styles.body}>

        {/* ── LEFT: step content ── */}
        <div className={styles.content}>

          {/* ════ AVATAR TAB ════ */}
          {activeTab === 'avatar' && (
            <div className={styles.avatarPage}>

              {/* Hidden file inputs — always mounted */}
              <input ref={fileInputRef} type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp" style={{ display: 'none' }}
                onChange={e => { processFile(e.target.files[0]); e.target.value = ''; }} />

              {/* ── Mode picker overlay — cold entry only ── */}
              {podcastMode === null && (
                <div className={styles.pickerOverlay}>
                  <div className={styles.pickerCard}>
                    <div>
                      <p className={styles.pickerEyebrow}>Podcast Studio</p>
                      <h2 className={styles.pickerHeading}>What are you creating today?</h2>
                      <p className={styles.pickerSub}>Choose your format — you can change this later.</p>
                    </div>
                    <div className={styles.pickerOptions}>
                      {/* Solo voice */}
                      <button
                        className={styles.pickerOption}
                        onClick={() => handleModeSelect('solo')}
                        disabled={!consented && !consentGiven}
                        style={{ opacity: (!consented && !consentGiven) ? 0.45 : 1, cursor: (!consented && !consentGiven) ? 'not-allowed' : 'pointer' }}
                      >
                        <div className={styles.pickerOptionImg}>
                          <img src="/images/solo_voice.jpg" alt="Solo voice"
                            onError={e => { e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='flex'; }} />
                          <div className={styles.pickerOptionImgFallback} style={{ display: 'none' }}>
                            <span><IconPodMic size="1em" /></span>
                            <span className={styles.pickerOptionImgFilename}>solo_voice.jpg</span>
                          </div>
                        </div>
                        <div className={styles.pickerOptionBody}>
                          <div className={styles.pickerOptionName}>Solo voice</div>
                          <div className={styles.pickerOptionDesc}>Just you. An AI assistant helps craft your monologue, line by line.</div>
                          <div className={styles.pickerOptionCta}>
                            Start writing
                            <IconArrowRight size={12} strokeWidth={2.4} />
                          </div>
                        </div>
                      </button>
                      {/* Open conversation */}
                      <button
                        className={styles.pickerOption}
                        onClick={() => handleModeSelect('interview')}
                        disabled={!consented && !consentGiven}
                        style={{ opacity: (!consented && !consentGiven) ? 0.45 : 1, cursor: (!consented && !consentGiven) ? 'not-allowed' : 'pointer' }}
                      >
                        <div className={styles.pickerOptionImg}>
                          <img src="/images/open_conversation.jpg" alt="Open conversation"
                            onError={e => { e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='flex'; }} />
                          <div className={styles.pickerOptionImgFallback} style={{ display: 'none' }}>
                            <span><IconConversation size="1em" /></span>
                            <span className={styles.pickerOptionImgFilename}>open_conversation.jpg</span>
                          </div>
                        </div>
                        <div className={styles.pickerOptionBody}>
                          <div className={styles.pickerOptionName}>Open conversation</div>
                          <div className={styles.pickerOptionDesc}>You and a guest. Trade lines from chat or write the script fresh.</div>
                          <div className={styles.pickerOptionCta}>
                            Add a guest
                            <IconArrowRight size={12} strokeWidth={2.4} />
                          </div>
                        </div>
                      </button>
                      {/* From your docs — Sources Mode */}
                      <button
                        className={styles.pickerOption}
                        onClick={() => handleModeSelect('docs')}
                        disabled={!consented && !consentGiven}
                        style={{ opacity: (!consented && !consentGiven) ? 0.45 : 1, cursor: (!consented && !consentGiven) ? 'not-allowed' : 'pointer' }}
                      >
                        <div className={styles.pickerOptionImg}>
                          <img src="/images/from_your_docs.jpg" alt="From your docs"
                            onError={e => { e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='flex'; }} />
                          <div className={styles.pickerOptionImgFallback} style={{ display: 'none' }}>
                            <span><IconSources size="1em" /></span>
                            <span className={styles.pickerOptionImgFilename}>from_your_docs.jpg</span>
                          </div>
                        </div>
                        <div className={styles.pickerOptionBody}>
                          <div className={styles.pickerOptionName}>From your docs</div>
                          <div className={styles.pickerOptionDesc}>Drop in a report, link, or recording. We turn it into the episode.</div>
                          <div className={styles.pickerOptionCta}>
                            Add sources
                            <IconArrowRight size={12} strokeWidth={2.4} />
                          </div>
                        </div>
                      </button>
                    </div>

                    {/* Consent checkboxes — only shown if not yet consented */}
                    {!consented && (
                      <div className={styles.pickerConsent}>
                        <p className={styles.pickerConsentLabel}>Before we begin:</p>
                        <label className={styles.pickerConsentRow}>
                          <input
                            type="checkbox"
                            checked={consentPhoto}
                            onChange={e => setConsentPhoto(e.target.checked)}
                            className={styles.pickerCheckbox}
                          />
                          <span>My photo is of me, or I have the rights to use it</span>
                        </label>
                        <label className={styles.pickerConsentRow}>
                          <input
                            type="checkbox"
                            checked={consentVoice}
                            onChange={e => setConsentVoice(e.target.checked)}
                            className={styles.pickerCheckbox}
                          />
                          <span>Any voice I record is my own voice</span>
                        </label>
                      </div>
                    )}

                    <div className={styles.pickerFooter}>
                      <button className={styles.pickerSkip} onClick={() => {
                        if (!consented && !consentGiven) return;
                        handleModeSelect('solo');
                      }}
                        style={{ opacity: (!consented && !consentGiven) ? 0.35 : 1 }}
                      >
                        Not sure yet — explore first
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Build stage fullscreen overlay */}
              {buildStage && buildStage !== 'done' && (
                <div className={styles.buildOverlay}>
                  <div className={styles.buildOverlayCard}>
                    <div className={styles.buildPreviewRing}>
                      {(photoPreview || genPreviewUrl) && (
                        <img src={photoPreview || genPreviewUrl} alt="Building" className={styles.buildPreviewImg} />
                      )}
                      <div className={styles.buildRingAnim} />
                    </div>
                    <div className={styles.buildStages}>
                      {BUILD_STAGES.filter(s => s.key !== 'done').map((s, i) => {
                        const stageIdx = BUILD_STAGES.findIndex(x => x.key === buildStage);
                        const thisIdx  = BUILD_STAGES.findIndex(x => x.key === s.key);
                        const done     = thisIdx < stageIdx;
                        const active   = thisIdx === stageIdx;
                        return (
                          <div key={s.key} className={`${styles.buildStageRow} ${done ? styles.bsDone : active ? styles.bsActive : styles.bsPending}`}>
                            <span className={styles.bsIcon}>
                              {done ? <Ic.Check /> : active ? <span className={styles.spin}><Ic.Spin /></span> : <span>{thisIdx + 1}</span>}
                            </span>
                            <span>{s.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Avatar grid — square cards, horizontal wrap ── */}
              <div className={`${styles.glassCard} ${styles.avatarGridCard} ${!avatarBuilt && (avatarInputMode === 'generate' || (avatarInputMode === 'upload' && !photoFile)) ? styles.avatarGridCardExpanded : ''}`}>
                <div className={styles.cardLabel}>Your avatar</div>

                {/* Upload / Generate toggle — reuses scriptModeToggle exactly (same pill used by Studio Backgrounds' 1-2 Guests/Panel-3 toggle) */}
                {!avatarBuilt && (
                  <div className={styles.scriptModeToggle} style={{ marginBottom: '0.2rem', flexShrink: 0 }}>
                    <button
                      className={`${styles.scriptModeBtn} ${avatarInputMode === 'upload' ? styles.scriptModeBtnActive : ''}`}
                      onClick={() => setAvatarInputMode('upload')}
                    >
                      <IconUpload size={15} /> Upload photo
                    </button>
                    <button
                      className={`${styles.scriptModeBtn} ${avatarInputMode === 'generate' ? styles.scriptModeBtnActive : ''}`}
                      onClick={() => setAvatarInputMode('generate')}
                    >
                      <Ic.ImageFrame /> Generate
                    </button>
                  </div>
                )}

                {/* Upload tips — shown whenever upload mode is open with no photo chosen yet.
                    Purely informational, checkmarks are decorative (not a to-do list). */}
                {!avatarBuilt && avatarInputMode === 'upload' && !photoFile && (
                  <div className={styles.tipsBox}>
                    <div className={styles.tipsTitle}>Tips for best results</div>
                    <div className={styles.tipsList}>
                      <div className={styles.tipItem}><span className={styles.tipCheck}><IconCheck size={11} strokeWidth={2.6} /></span> Photo is clear and in focus</div>
                      <div className={styles.tipItem}><span className={styles.tipCheck}><IconCheck size={11} strokeWidth={2.6} /></span> Face is clearly visible</div>
                      <div className={styles.tipItem}><span className={styles.tipCheck}><IconCheck size={11} strokeWidth={2.6} /></span> Well-lit — natural or bright indoor light works best</div>
                      <div className={styles.tipItem}><span className={styles.tipCheck}><IconCheck size={11} strokeWidth={2.6} /></span> Full body or waist-up shown</div>
                      <div className={styles.tipItem}><span className={styles.tipCheck}><IconCheck size={11} strokeWidth={2.6} /></span> A plain, simple background works better than a busy one</div>
                    </div>
                  </div>
                )}

                <div className={styles.avatarGrid}>

                  {/* Saved avatars — paginated, 10 per page */}
                  {(avatars || []).slice(avatarPage * PAGE_SIZE, (avatarPage + 1) * PAGE_SIZE).map(av => {
                    const isActive   = av.avatarId === speakers.find(s => s.speakerId === 'user')?.savedAvatarId;
                    const isConfirm  = confirmDelete?.type === 'avatar' && confirmDelete?.id === av.avatarId;
                    return (
                      <div
                        key={av.avatarId}
                        className={`${styles.avatarSquareCard} ${isActive ? styles.avatarSquareSelected : ''}`}
                        style={{ position: 'relative' }}
                      >
                        {/* Clickable image area */}
                        <div style={{ flex: 1, overflow: 'hidden', cursor: 'pointer' }}
                          onClick={async () => {
                            if (confirmDelete) { setConfirmDelete(null); return; }
                            const displayName = context?.user?.displayName || av.displayName || 'You';

                            // ── Check cache first ──────────────────────────
                            // If this avatar has already been baked into the
                            // selected environment, use the cached URL directly.
                            // No Nano call needed.
                            const cached = (av.bakedEnvs || []).find(b => b.envId === selectedEnvId);
                            if (cached?.bakedRefUrl) {
                              console.log(`⚡ Using cached bake: ${av.avatarId} × ${selectedEnvId}`);
                              setAvatarBuilt(true);
                              setAvatarRefUrl(cached.bakedRefUrl);
                              setSpeakers(prev => {
                                const entry = { speakerId: 'user', displayName,
                                  avatarRefUrl: cached.bakedRefUrl,
                                  voiceMode: 'tts', voiceId: '21m00Tcm4TlvDq8ikWAM',
                                  gender: 'female', color: SPEAKER_COLORS[0],
                                  isCharacter: false, role: 'host', savedAvatarId: av.avatarId };
                                const already = prev.find(s => s.speakerId === 'user');
                                return already ? prev.map(s => s.speakerId === 'user' ? entry : s) : [entry, ...prev];
                              });
                              return;
                            }

                            // ── Not cached — bake THIS avatar into the new env ──
                            // bakeAvatarEnv reuses av.avatarId and is deduped
                            // server-side — it will never create a duplicate
                            // avatar record. (Do not use buildAvatar here: that
                            // path is for building a brand-new avatar from a
                            // fresh photo, and mints a new avatarId every call.)
                            setBuildStage('baking');
                            const result = await bakeAvatarEnv({ avatarId: av.avatarId, envId: selectedEnvId })
                              .catch(e => { setBuildError(e.message); return null; })
                              .finally(() => setBuildStage(null));
                            if (!result) return;
                            setAvatarBuilt(true);
                            setAvatarRefUrl(result.bakedRefUrl);
                            setSpeakers(prev => {
                              const entry = { speakerId: 'user', displayName, avatarRefUrl: result.bakedRefUrl,
                                voiceMode: 'tts', voiceId: '21m00Tcm4TlvDq8ikWAM', gender: 'female',
                                color: SPEAKER_COLORS[0], isCharacter: false, role: 'host', savedAvatarId: av.avatarId };
                              const already = prev.find(s => s.speakerId === 'user');
                              return already ? prev.map(s => s.speakerId === 'user' ? entry : s) : [entry, ...prev];
                            });
                          }}
                        >
                          {av.avatarRefUrl
                            ? <img src={av.avatarRefUrl} alt={av.displayName} className={styles.avatarSquareImg} />
                            : <div className={styles.avatarSquareImgFallback}><IconPerson size={36} /></div>
                          }
                        </div>

                        <div className={styles.avatarSquareName}>{av.displayName}</div>

                        {isActive && (
                          <span className={`${styles.avatarSquareBadge} ${styles.avatarSquareBadgeHost}`}>Active</span>
                        )}

                        {/* Delete control — bottom-right corner */}
                        {isConfirm ? (
                          <button
                            style={{
                              position: 'absolute', bottom: 28, right: 4,
                              fontSize: '0.58rem', fontWeight: 700, padding: '0.15rem 0.4rem',
                              background: 'rgba(239,68,68,0.85)', color: '#fff',
                              border: '1px solid rgba(239,68,68,0.5)', borderRadius: 6,
                              cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                            }}
                            onClick={async e => {
                              e.stopPropagation();
                              try {
                                await deleteAvatar(av.avatarId);
                                setConfirmDelete(null);
                                // Reset page if we deleted the last item on this page
                                const remaining = (avatars?.length || 1) - 1;
                                if (avatarPage > 0 && avatarPage * PAGE_SIZE >= remaining) {
                                  setAvatarPage(p => p - 1);
                                }
                              } catch (err) { setBuildError(err.message); }
                            }}
                          >
                            Sure?
                          </button>
                        ) : (
                          <button
                            style={{
                              position: 'absolute', bottom: 28, right: 4,
                              fontSize: '0.58rem', fontWeight: 700, padding: '0.15rem 0.4rem',
                              background: 'rgba(10,15,30,0.7)', color: '#64748b',
                              border: '1px solid rgba(148,163,184,0.15)', borderRadius: 6,
                              cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                              opacity: 0,
                            }}
                            className={styles.avatarDeleteBtn}
                            onClick={e => { e.stopPropagation(); setConfirmDelete({ type: 'avatar', id: av.avatarId }); }}
                            title="Delete avatar"
                            aria-label="Delete avatar"
                          >
                            <IconBin size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Upload new — always last, upload mode only */}
                  {!avatarBuilt && avatarInputMode === 'upload' && (
                    <div
                      className={styles.avatarSquareAdd}
                      onClick={() => { setConfirmDelete(null); fileInputRef.current?.click(); }}
                      title="Upload a new photo"
                    >
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 13 }} />
                      ) : (
                        <>
                          <div className={styles.avatarSquareAddIcon}><Ic.Upload /></div>
                          <span className={styles.avatarSquareAddLabel}>Upload photo</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Built — show as active selected card */}
                  {avatarBuilt && avatarRefUrl && (
                    <div className={`${styles.avatarSquareCard} ${styles.avatarSquareSelected}`}>
                      <img src={avatarRefUrl} alt="Your avatar" className={styles.avatarSquareImg} />
                      <div className={styles.avatarSquareName}>You</div>
                      <span className={`${styles.avatarSquareBadge} ${styles.avatarSquareBadgeHost}`}>Host</span>
                    </div>
                  )}
                </div>

                {/* Pagination controls */}
                {(avatars?.length || 0) > PAGE_SIZE && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid rgba(148,163,184,0.08)' }}>
                    <button
                      className={styles.actionChip}
                      disabled={avatarPage === 0}
                      onClick={() => { setAvatarPage(p => p - 1); setConfirmDelete(null); }}
                      style={{ opacity: avatarPage === 0 ? 0.35 : 1 }}
                    >
                      ← Prev
                    </button>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'Inter,sans-serif' }}>
                      {avatarPage * PAGE_SIZE + 1}–{Math.min((avatarPage + 1) * PAGE_SIZE, avatars.length)} of {avatars.length}
                    </span>
                    <button
                      className={styles.actionChip}
                      disabled={(avatarPage + 1) * PAGE_SIZE >= (avatars?.length || 0)}
                      onClick={() => { setAvatarPage(p => p + 1); setConfirmDelete(null); }}
                      style={{ opacity: (avatarPage + 1) * PAGE_SIZE >= (avatars?.length || 0) ? 0.35 : 1 }}
                    >
                      Next →
                    </button>
                  </div>
                )}

                {/* ── Generate-mode widget — 4 states, mirrors mockup exactly ── */}
                {!avatarBuilt && avatarInputMode === 'generate' && (
                  <div className={styles.genPanel}>

                    {/* State 2: preview available (takes priority — user has something to act on) */}
                    {genPreviewUrl && (
                      <>
                        <div className={styles.cardLabel}>Preview — generation {genAttempt} of 3</div>
                        <div className={styles.genPreviewRow}>
                          <div className={styles.genPreviewImgBox}>
                            <img src={genPreviewUrl} alt="Generated avatar preview" className={styles.genPreviewImg} />
                          </div>
                          <div className={styles.genPreviewActions}>
                            <p className={styles.genPreviewPrompt}>Does this look right?</p>
                            <button className={styles.buildBtn} onClick={handleUseGeneratedAvatar} disabled={!!buildStage}>
                              {buildStage ? <><span className={styles.spin}><Ic.Spin /></span> Building…</> : <><Ic.Check /> Use this</>}
                            </button>
                            {genAttempt < 3 && (
                              <button className={styles.genSecondaryBtn} onClick={handleRegenerateAvatar} disabled={genLoading || !!buildStage}>
                                {genLoading ? <><span className={styles.spin}><Ic.Spin /></span> Regenerating…</> : <><Ic.Refresh /> Regenerate</>}
                              </button>
                            )}
                            <span className={styles.genRemaining}>{3 - genAttempt} generation{3 - genAttempt === 1 ? '' : 's'} remaining</span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* State 3/4: rejected — with or without attempts remaining */}
                    {!genPreviewUrl && genRejected && (
                      <>
                        <div className={styles.cardLabel}>Generation {genAttempt} of 3</div>
                        <div className={styles.genRejectBox}>
                          <p className={styles.genRejectTitle}><Ic.Alert /> Couldn't generate this avatar</p>
                          <p className={styles.genRejectDetail}>{genError}</p>
                        </div>
                        {genAttempt < 3 ? (
                          <div className={styles.genFooterRow}>
                            <button className={styles.genSecondaryBtn} onClick={handleRegenerateAvatar} disabled={genLoading}>
                              {genLoading ? <><span className={styles.spin}><Ic.Spin /></span> Trying…</> : <><Ic.Refresh /> Try again</>}
                            </button>
                            <span className={styles.genRemaining}>{3 - genAttempt} generations remaining</span>
                          </div>
                        ) : (
                          <button className={styles.genSecondaryBtn} onClick={() => setAvatarInputMode('upload')}>
                            <IconUpload size={15} /> Upload photo
                          </button>
                        )}
                      </>
                    )}

                    {/* State 4: exhausted, last attempt was NOT a rejection (still no preview though) */}
                    {!genPreviewUrl && !genRejected && genAttempt >= 3 && (
                      <>
                        <div className={styles.cardLabel}>Generation 3 of 3</div>
                        <div className={styles.genExhaustedBox}>
                          <p><Ic.Alert /> No generations left — upload a photo instead</p>
                        </div>
                        <button className={styles.genSecondaryBtn} onClick={() => setAvatarInputMode('upload')}>
                          <IconUpload size={15} /> Upload photo
                        </button>
                      </>
                    )}

                    {/* State 1: initial form — description + name */}
                    {!genPreviewUrl && !genRejected && genAttempt < 3 && (
                      <>
                        <input
                          type="text"
                          className={styles.genNameInput}
                          placeholder="Your display name…"
                          value={genDisplayName}
                          onChange={e => setGenDisplayName(e.target.value)}
                        />

                        {/* Dropdown prompt builder — all optional. Assembled with the
                            free-text box below via buildAssembledDescription() and sent
                            through the same `description` field the backend already
                            accepts, so no backend changes were needed for this. */}
                        <div className={styles.genFieldRow}>
                          <GenDropdown
                            label="Age range"
                            value={genAttrs.age}
                            onChange={v => setGenAttrs(prev => ({ ...prev, age: v }))}
                            options={[
                              { value: '20s', label: '20s' },
                              { value: '30s', label: '30s' },
                              { value: '40s', label: '40s' },
                              { value: '50s', label: '50s+' },
                            ]}
                          />
                          <GenDropdown
                            label="Ethnicity"
                            value={genAttrs.ethnicity}
                            onChange={v => setGenAttrs(prev => ({ ...prev, ethnicity: v }))}
                            options={[
                              { value: 'African', label: 'African' },
                              { value: 'East Asian', label: 'East Asian' },
                              { value: 'South Asian', label: 'South Asian' },
                              { value: 'Latine', label: 'Latine' },
                              { value: 'Middle Eastern', label: 'Middle Eastern' },
                              { value: 'White / European', label: 'White / European' },
                              { value: 'mixed race', label: 'Mixed / Other' },
                            ]}
                          />
                        </div>
                        <div className={styles.genFieldRow}>
                          <GenDropdown
                            label="Hair"
                            value={genAttrs.hair}
                            onChange={v => setGenAttrs(prev => ({ ...prev, hair: v }))}
                            options={[
                              { value: 'short', label: 'Short' },
                              { value: 'long', label: 'Long' },
                              { value: 'curly', label: 'Curly' },
                              { value: 'locs', label: 'Locs' },
                              { value: 'bald', label: 'Bald' },
                            ]}
                          />
                          <GenDropdown
                            label="Build"
                            value={genAttrs.build}
                            onChange={v => setGenAttrs(prev => ({ ...prev, build: v }))}
                            options={[
                              { value: 'slim', label: 'Slim' },
                              { value: 'athletic', label: 'Athletic' },
                              { value: 'average', label: 'Average' },
                              { value: 'heavyset', label: 'Heavyset' },
                            ]}
                          />
                          <GenDropdown
                            label="Style"
                            value={genAttrs.style}
                            onChange={v => setGenAttrs(prev => ({ ...prev, style: v }))}
                            options={[
                              { value: 'casual', label: 'Casual' },
                              { value: 'business', label: 'Business' },
                              { value: 'creative', label: 'Creative' },
                              { value: 'streetwear', label: 'Streetwear' },
                            ]}
                          />
                        </div>

                        <label className={styles.genFieldLabel}>Anything else?</label>
                        <textarea
                          className={styles.genDescInput}
                          rows={2}
                          placeholder="Optional — add anything the dropdowns don't cover, e.g. 'warm smile, wearing glasses'"
                          value={genDescription}
                          onChange={e => setGenDescription(e.target.value)}
                        />
                        <div className={styles.genFooterRow}>
                          <button
                            className={styles.buildBtn}
                            style={{ width: 'auto', padding: '0.5rem 1.1rem' }}
                            onClick={handleGenerateAvatar}
                            disabled={genLoading || (!genDescription.trim() && !Object.values(genAttrs).some(Boolean))}
                          >
                            {genLoading ? <><span className={styles.spin}><Ic.Spin /></span> Generating…</> : <><IconAiPortrait size={15} /> Generate</>}
                          </button>
                          <span className={styles.genRemaining}>{genAttempt} of 3 generations used</span>
                        </div>
                      </>
                    )}

                    {genError && !genRejected && <div className={styles.errorBox}>{genError}</div>}
                  </div>
                )}

                {buildError && <div className={styles.errorBox}>{buildError}</div>}
                {photoFile && !avatarBuilt && (
                  <button className={styles.buildBtn} onClick={handleBuildAvatar} disabled={!!buildStage}>
                    {buildStage ? <><span className={styles.spin}><Ic.Spin /></span> Building…</> : <><IconAiPortrait size={15} /> Build my avatar</>}
                  </button>
                )}
                {avatarBuilt && (
                  <button className={styles.rebuildLink} style={{ alignSelf: 'center' }}
                    onClick={() => {
                      setAvatarBuilt(false); setBuildStage(null);
                      setPhotoFile(null); setPhotoPreview(null);
                      setGenPreviewUrl(null); setGenAttempt(0); setGenError(null); setGenRejected(false);
                      setAvatarInputMode('upload');
                    }}>
                    Upload a different photo
                  </button>
                )}
              </div>

              {/* AI character guest cards */}
              {speakers.filter(s => s.isCharacter).map(spk => (
                <div key={spk.speakerId} className={styles.glassCard}>
                  <div className={styles.cardLabel}>AI Guest</div>
                  <div className={styles.charCard}>
                    <div className={styles.charAvatar} style={{ background: `linear-gradient(135deg, ${spk.color}, ${spk.color}88)` }}>
                      {spk.displayName?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className={styles.charName}>{spk.displayName}</div>
                      <div className={styles.charRole}>AI character · TTS voice</div>
                    </div>
                    <span className={`${styles.badge} ${styles.badgeGuest}`}>Guest</span>
                    {spk.avatarRefUrl && <div className={styles.readyTick}><Ic.Check /></div>}
                  </div>
                </div>
              ))}

              {/* Custom real-person guest */}
              {speakers.filter(s => !s.isCharacter && s.speakerId !== 'user').map(spk => (
                <div key={spk.speakerId} className={styles.glassCard}>
                  <div className={styles.cardLabel}>Real Guest</div>
                  <div className={styles.charCard}>
                    <div className={styles.charAvatar} style={{ background: `linear-gradient(135deg, ${spk.color}, ${spk.color}88)` }}>
                      {spk.displayName?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className={styles.charName}>{spk.displayName}</div>
                      <div className={styles.charRole}>Real person · guest</div>
                    </div>
                    <span className={`${styles.badge} ${styles.badgeGuest}`}>Guest</span>
                    {spk.avatarRefUrl && <div className={styles.readyTick}><Ic.Check /></div>}
                  </div>
                </div>
              ))}

              {/* Real guest slots — standard: 1 slot, panel: 2 slots side by side */}
              {(envMode !== 'solo') && ((envMode === 'panel') ||
                (podcastMode === 'interview' && !speakers.some(s => s.isCharacter))) && (
                <div className={styles.glassCard}>
                  <div className={styles.cardLabel}>
                    {envMode === 'panel' ? 'Real Guests (optional)' : 'Real Guest (optional)'}
                  </div>

                  {/* Hidden file inputs */}
                  <input ref={guestFileRef} type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp" style={{ display: 'none' }}
                    onChange={e => {
                      const f = e.target.files?.[0]; if (!f) return;
                      setGuestFile(f);
                      const reader = new FileReader();
                      reader.onload = ev => setGuestPreview(ev.target.result);
                      reader.readAsDataURL(f); setGuestBuilt(false);
                    }} />
                  <input ref={guest2FileRef} type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp" style={{ display: 'none' }}
                    onChange={e => {
                      const f = e.target.files?.[0]; if (!f) return;
                      setGuest2File(f);
                      const reader = new FileReader();
                      reader.onload = ev => setGuest2Preview(ev.target.result);
                      reader.readAsDataURL(f); setGuest2Built(false);
                    }} />

                  {/* Slot row */}
                  <div className={envMode === 'panel' ? styles.guestRow : ''}>

                    {/* Slot 1 */}
                    <div className={envMode === 'panel' ? styles.guestSlot : ''}>
                      {guestBuilt ? (
                        <div className={styles.charCard}>
                          {guestPreview
                            ? <img src={guestPreview} alt={guestName} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                            : <div className={styles.charAvatar} style={{ background: `linear-gradient(135deg, ${SPEAKER_COLORS[1]}, ${SPEAKER_COLORS[1]}88)` }}>{guestName?.slice(0,2).toUpperCase()}</div>
                          }
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className={styles.charName} style={{ fontSize: '0.75rem' }}>{guestName}</div>
                            <div className={styles.charRole}>{envMode === 'panel' ? 'Guest 1' : 'Guest'}</div>
                          </div>
                          <button className={styles.rebuildLink} onClick={() => {
                            setGuestBuilt(false); setGuestFile(null); setGuestPreview(null); setGuestName('');
                            setSpeakers(prev => prev.filter(s => !s.speakerId.startsWith('custom_guest_') || s.speakerId.startsWith('custom_guest2_')));
                          }} title="Remove guest" aria-label="Remove guest"><IconClose size={12} /></button>
                        </div>
                      ) : (
                        <div className={styles.guestSlotEmpty}>
                          <input className={styles.guestNameInput}
                            placeholder={envMode === 'panel' ? 'Guest 1 name…' : 'Guest name…'}
                            value={guestName} onChange={e => setGuestName(e.target.value)} />
                          <button className={styles.addGuestPhotoBtn} onClick={() => guestFileRef.current?.click()}>
                            {guestPreview
                              ? <><img src={guestPreview} alt="g1" style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover', marginRight: 4 }} />Change</>
                              : <><IconUpload size={15} /> Photo</>}
                          </button>
                          {guestError && <div className={styles.errorBox} style={{ fontSize: '0.65rem' }}>{guestError}</div>}
                          {guestFile && guestName.trim() && (
                            <button className={styles.actionChip} style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }} onClick={handleAddGuest}>
                              <Ic.Add /> Add
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Slot 2 — panel mode only */}
                    {envMode === 'panel' && (
                      <div className={styles.guestSlot}>
                        {guest2Built ? (
                          <div className={styles.charCard}>
                            {guest2Preview
                              ? <img src={guest2Preview} alt={guest2Name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                              : <div className={styles.charAvatar} style={{ background: `linear-gradient(135deg, ${SPEAKER_COLORS[2]}, ${SPEAKER_COLORS[2]}88)` }}>{guest2Name?.slice(0,2).toUpperCase()}</div>
                            }
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className={styles.charName} style={{ fontSize: '0.75rem' }}>{guest2Name}</div>
                              <div className={styles.charRole}>Guest 2</div>
                            </div>
                            <button className={styles.rebuildLink} onClick={() => {
                              setGuest2Built(false); setGuest2File(null); setGuest2Preview(null); setGuest2Name('');
                              setSpeakers(prev => prev.filter(s => !s.speakerId.startsWith('custom_guest2_')));
                            }} title="Remove guest" aria-label="Remove guest"><IconClose size={12} /></button>
                          </div>
                        ) : (
                          <div className={styles.guestSlotEmpty}>
                            <input className={styles.guestNameInput}
                              placeholder="Guest 2 name…"
                              value={guest2Name} onChange={e => setGuest2Name(e.target.value)} />
                            <button className={styles.addGuestPhotoBtn} onClick={() => guest2FileRef.current?.click()}>
                              {guest2Preview
                                ? <><img src={guest2Preview} alt="g2" style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover', marginRight: 4 }} />Change</>
                                : <><IconUpload size={15} /> Photo</>}
                            </button>
                            {guest2Error && <div className={styles.errorBox} style={{ fontSize: '0.65rem' }}>{guest2Error}</div>}
                            {guest2File && guest2Name.trim() && (
                              <button className={styles.actionChip} style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }} onClick={handleAddGuest2}>
                                <Ic.Add /> Add
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {speakers.filter(s => s.speakerId !== 'user').length === 0 && !photoPreview && !genPreviewUrl && podcastMode !== null && (
                <div className={styles.emptyHint}>
                  {podcastMode === 'solo'
                    ? 'Upload a photo or generate one to build your solo avatar.'
                    : `Upload a photo above, or generate one. ${context?.character?.display_name || 'Your guest'} will join as guest.`}
                </div>
              )}
            </div>
          )}

          {/* ════ SCRIPT TAB ════ */}
          {activeTab === 'script' && (
            <div className={styles.scriptPage}>

              {/* Mode toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div className={styles.scriptModeToggle}>
                  <button
                    className={`${styles.scriptModeBtn} ${scriptMode === 'chat' ? styles.scriptModeBtnActive : ''}`}
                    onClick={() => setScriptMode('chat')}
                  >
                    <IconAiWrite size={15} /> AI Write
                  </button>
                  <button
                    className={`${styles.scriptModeBtn} ${scriptMode === 'lines' ? styles.scriptModeBtnActive : ''}`}
                    onClick={() => setScriptMode('lines')}
                  >
                    <IconLines size={15} /> Edit Lines {lines.length > 0 && `(${lines.length})`}
                  </button>
                  <button
                    className={`${styles.scriptModeBtn} ${scriptMode === 'sources' ? styles.scriptModeBtnActive : ''}`}
                    onClick={() => setScriptMode('sources')}
                  >
                    <IconSources size={15} /> Sources
                  </button>
                </div>
                {/* Import from chat — lines mode only */}
                {scriptMode === 'lines' && context?.chatHistory?.length > 0 && (
                  <button className={styles.actionChip} onClick={() => {
                    const msgs = context.chatHistory.slice(-8).filter(m => m.content?.trim());
                    dispatchLines({ type: 'SET', lines: msgs.map((m, i) => ({
                      id: Date.now() + i,
                      speakerId: m.role === 'user'
                        ? (speakers.find(s => !s.isCharacter)?.speakerId || 'user')
                        : (speakers.find(s => s.isCharacter)?.speakerId  || 'guest'),
                      text: m.content, audioUrl: null,
                    }))});
                  }}>
                    <Ic.Import /> Import from chat
                  </button>
                )}
              </div>

              {/* ── SOURCES MODE — docs-to-episode. SourcesPanel owns the whole
                   view (own hook, own CSS module); this page only receives the
                   generated lines via handleSourcesScriptReady. ── */}
              {scriptMode === 'sources' && (
                <SourcesPanel
                  mode={podcastMode === 'solo' ? 'solo' : 'interview'}
                  hostName={context?.user?.displayName || 'You'}
                  guestName={speakers.find(sp => sp.speakerId !== 'user')?.displayName || null}
                  onScriptReady={handleSourcesScriptReady}
                />
              )}

              {/* ── CHAT MODE ── */}
              {scriptMode === 'chat' && (
                <div className={styles.scriptChatArea}>
                  {/* Bubbles scroll */}
                  <div className={styles.chatBubbles} ref={chatBubblesRef}>
                    {scriptMessages.map((msg, i) => {
                      // Strip ONLY the ---SCRIPT--- and ---END--- marker lines.
                      // The script content itself stays fully visible in the bubble
                      // so the user can read it, react, and ask for changes.
                      // The script_block is also extracted separately for "Convert to lines".
                      const hasScript = msg.role === 'assistant' && /---SCRIPT---/.test(msg.content);
                      const visibleText = msg.role === 'assistant'
                        ? msg.content
                            .replace(/---SCRIPT---\n?/g, '')
                            .replace(/---END---\n?/g, '')
                            .trim()
                        : msg.content;
                      return (
                        <div key={i} className={`${styles.bubbleRow} ${msg.role === 'user' ? styles.bubbleRowUser : ''}`}>
                          {msg.role === 'assistant' && (
                            <div className={styles.bubbleAvatar}>AI</div>
                          )}
                          <div className={msg.role === 'assistant' ? styles.bubbleAi : styles.bubbleUser}>
                            {hasScript
                              ? visibleText.split('\n').map((line, li) => {
                                  const isLabel = /^HOST\s*$/.test(line.trim());
                                  return line.trim() === '' ? (
                                    <div key={li} style={{ height: '0.4rem' }} />
                                  ) : (
                                    <div key={li} style={{
                                      fontWeight:  isLabel ? 700 : 400,
                                      fontSize:    isLabel ? '0.62rem' : '0.78rem',
                                      color:       isLabel ? '#6366f1' : 'inherit',
                                      letterSpacing: isLabel ? '0.1em' : 0,
                                      textTransform: isLabel ? 'uppercase' : 'none',
                                      lineHeight:  isLabel ? 1.2 : 1.55,
                                      marginTop:   isLabel ? '0.5rem' : 0,
                                    }}>
                                      {line}
                                    </div>
                                  );
                                })
                              : visibleText
                            }
                            {hasScript && (
                              <div style={{
                                marginTop: '0.65rem',
                                paddingTop: '0.45rem',
                                borderTop: '1px solid rgba(99,102,241,0.2)',
                                fontSize: '0.68rem',
                                color: '#34D399',
                                fontWeight: 600,
                                fontFamily: 'Inter,sans-serif',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                              }}>
                                <IconCheck size={12} strokeWidth={2.6} /> Happy with this? Click Convert to lines below
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {scriptLoading && (
                      <div className={styles.bubbleRow}>
                        <div className={styles.bubbleAvatar}>AI</div>
                        <div className={styles.bubbleAi}>
                          <div className={styles.bubbleThinking}>
                            <div className={styles.bubbleDot} />
                            <div className={styles.bubbleDot} />
                            <div className={styles.bubbleDot} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Convert to lines — appears when a script block is ready */}
                  {latestScriptBlock && (
                    <button className={styles.convertBtn} onClick={handleConvertToLines}>
                      <Ic.Check /> Convert to lines
                    </button>
                  )}

                  {/* Input bar */}
                  <div className={styles.scriptInputBar}>
                    <textarea
                      ref={scriptInputElRef}
                      className={styles.scriptInput}
                      placeholder={scriptMessages.length === 0 ? 'What\'s your podcast about?' : 'Refine the script…'}
                      value={scriptInput}
                      rows={1}
                      onChange={e => setScriptInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendScriptMessage(); }
                      }}
                    />
                    <button
                      className={styles.scriptSendBtn}
                      onClick={handleSendScriptMessage}
                      disabled={!scriptInput.trim() || scriptLoading}
                    >
                      {scriptLoading ? <span className={styles.spin}><Ic.Spin /></span> : <>Send <IconArrowRight size={13} /></>}
                    </button>
                  </div>
                </div>
              )}

              {/* ── LINES MODE ── */}
              {scriptMode === 'lines' && (
                <>
                  <div className={styles.lineScroll}>
                    {lines.length === 0 && (
                      <div className={styles.emptyLines}>
                        No lines yet — switch to AI Write to generate, or add manually.
                      </div>
                    )}
                    {lines.map((line, i) => {
                      const isHost    = line.speakerId === 'user';
                      const lineColor = isHost ? '#6366F1' : '#10B981';
                      const lineName  = line.displayName || (isHost ? 'You' : 'Guest');
                      const lineRole  = isHost ? 'Host' : 'Guest';
                      // Idea 2 — borderless tinted row. Same two speaker colors
                      // already used by lineDot/lineTag, just at low opacity.
                      const lineTint      = isHost ? 'rgba(99,102,241,0.07)' : 'rgba(16,185,129,0.06)';
                      const lineTintHover = isHost ? 'rgba(99,102,241,0.11)' : 'rgba(16,185,129,0.10)';
                      const handleToggleSpeaker = () => {
                        const allSpeakers = speakers.length > 0
                          ? speakers
                          : [{ speakerId: 'user', displayName: 'You', role: 'host' }];
                        const currentIdx = allSpeakers.findIndex(s => s.speakerId === line.speakerId);
                        const nextIdx    = (currentIdx + 1) % allSpeakers.length;
                        const next       = allSpeakers[nextIdx];
                        dispatchLines({ type: 'UPDATE', id: line.id, patch: { speakerId: next.speakerId, displayName: next.displayName } });
                      };
                      return (
                        <div key={line.id}
                          className={`${styles.lineCard} ${dragOver === i ? styles.lineCardDragOver : ''}`}
                          style={{ '--line-tint': lineTint, '--line-tint-hover': lineTintHover }}
                          draggable={gripLineId === line.id}
                          onDragStart={e => handleDragStart(e, i)}
                          onDragOver={e => handleDragOver(e, i)}
                          onDrop={e => handleDrop(e, i)}
                          onDragEnd={handleDragEnd}
                        >
                          <div className={styles.dragHandle} title="Drag to reorder"
                            onMouseDown={() => setGripLineId(line.id)}
                            onMouseUp={() => setGripLineId(null)}
                            onTouchStart={() => setGripLineId(line.id)}
                            onTouchEnd={() => setGripLineId(null)}><Ic.Drag /></div>
                          <div className={styles.lineDot} style={{ background: lineColor }} />
                          <div className={styles.lineBody}>
                            <div
                              className={styles.lineTag}
                              style={{ color: lineColor, cursor: speakers.length > 1 ? 'pointer' : 'default' }}
                              onClick={speakers.length > 1 ? handleToggleSpeaker : undefined}
                              title={speakers.length > 1 ? 'Click to change speaker' : ''}
                            >
                              {lineName} · {lineRole}{speakers.length > 1 ? ' ↕' : ''}
                            </div>
                            <textarea
                              ref={autoGrowTextarea}
                              className={styles.lineTextarea}
                              value={line.text}
                              placeholder="Type the line…"
                              onChange={e => {
                                // Editing a cited line invalidates its verdicts —
                                // chips flip to the dashed "edited, unverified" state.
                                dispatchLines({ type: 'UPDATE', id: line.id,
                                  patch: { text: e.target.value,
                                           ...(line.citations?.length ? { citationsEdited: true } : {}) } });
                                autoGrowTextarea(e.target);
                              }}
                              rows={2}
                            />
                            {/* Citation chips — Sources Mode lines only */}
                            {line.citations?.length ? (
                              <CitationChips citations={line.citations} edited={!!line.citationsEdited} />
                            ) : null}
                            {/* Opening hook — line 1 only: the AI's suggestion (tap to open),
                                or the hook the user switched on */}
                            {i === 0 && extras.available ? (
                              hookOn && hookDraft ? (
                                <button
                                  className={styles.overlayAttached}
                                  onClick={() => setHookOpen(true)}
                                  title="Edit the opening hook"
                                >
                                  <span className={styles.overlayThumb}><IconHook size={13} /></span>
                                  Opening hook: {hookSummary(hookDraft).slice(0, 48)} — first {hookDraft.dur || 4}s
                                </button>
                              ) : hookDraft && !hookDismissed ? (
                                <div className={styles.overlayChip}>
                                  <button
                                    className={styles.overlayChipMain}
                                    onClick={() => setHookOpen(true)}
                                    title="See the hook the AI designed for your opening"
                                  >
                                    <IconHook size={14} /> Open with: “{hookSummary(hookDraft).slice(0, 44)}”?
                                  </button>
                                  <button
                                    className={styles.overlayChipX}
                                    onClick={() => setHookDismissed(true)}
                                    title="Dismiss"
                                    aria-label="Dismiss"
                                  ><IconClose size={11} /></button>
                                </div>
                              ) : null
                            ) : null}
                            {/* Episode comparison — shown on every line since it applies episode-wide */}
                            {compareOn ? (
                              <button
                                className={styles.overlayAttached}
                                onClick={() => setCompareOpen(true)}
                                title="Edit the episode comparison"
                                style={{ borderColor: 'rgba(16,185,129,0.45)' }}
                              >
                                <span className={styles.overlayThumb}><IconCompare size={13} /></span>
                                Comparison: {compareLeft.name || 'A'} vs {compareRight.name || 'B'} — all lines
                              </button>
                            ) : null}
                            {/* Overlay: AI suggestion chip (tap to accept) or attached indicator */}
                            {(() => {
                              const sug = overlaySuggestions[line.id];
                              if (line.overlay) {
                                const modeLabel = line.overlay.mode === 'data'
                                  ? `Data card${line.overlay.data ? ` · ${dataCardSummary(line.overlay.data)}` : ''}`
                                  : line.overlay.mode === 'product_in_hand'
                                  ? 'In hand'
                                  : line.overlay.shape === 'cutout' ? 'Cutout' : 'Card';
                                return (
                                  <button
                                    className={styles.overlayAttached}
                                    onClick={() => { setOverlayLineId(line.id); if (line.overlay.mode === 'data') setDataOpen(true); }}
                                    title="Edit this visual"
                                  >
                                    <span className={styles.overlayThumb}>
                                      {line.overlay.mode === 'data'
                                        ? (line.overlay.data?.kind === 'chart' ? <IconChart size={13} /> : <IconDataCard size={13} />)
                                        : line.overlay.mode === 'product_in_hand' || line.overlay.productName ? <IconInHand size={13} />
                                        : line.overlay.shape === 'cutout' ? <IconCutout size={13} />
                                        : <IconGlassCard size={13} />}
                                    </span>
                                    {modeLabel}{line.overlay.productName ? ` · ${line.overlay.productName}` : ''} — attached
                                  </button>
                                );
                              }
                              if (sug && sug.type && sug.type !== 'none') {
                                const icon = sug.type === 'product' ? <IconInHand size={14} />
                                  : sug.type === 'stat' ? <IconDataCard size={14} /> : <IconChart size={14} />;
                                const verb = sug.type === 'product' ? 'Hold product' : sug.type === 'stat' ? 'Show stat' : 'Show chart';
                                return (
                                  <div className={`${styles.overlayChip} ${styles['overlayChip_' + sug.type] || ''}`}>
                                    <button
                                      className={styles.overlayChipMain}
                                      onClick={() => acceptSuggestion(line.id, sug)}
                                      title="Accept — opens the visual editor"
                                    >
                                      {icon} {verb}{sug.term ? `: ${sug.term}` : ''}?
                                    </button>
                                    <button
                                      className={styles.overlayChipX}
                                      onClick={() => setOverlaySuggestions(prev => ({ ...prev, [line.id]: { type: 'none' } }))}
                                      title="Dismiss"
                                      aria-label="Dismiss"
                                    ><IconClose size={11} /></button>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                            {/* Live recording counter */}
                            {recordingLineId === line.id && (
                              <div className={styles.recordingCounter}>
                                <span className={styles.recordingDot} />
                                {`${Math.floor(recordingSeconds / 60)}:${String(recordingSeconds % 60).padStart(2, '0')}`}
                                <span style={{ opacity: 0.6, fontSize: '0.62rem' }}>— tap stop when done</span>
                              </div>
                            )}
                            {/* Recorded tag with duration + playback + clear */}
                            {line.audioUrl && recordingLineId !== line.id && (
                              <div className={styles.audioTag}>
                                <button
                                  className={`${styles.audioPlayBtn} ${playingLineId === line.id ? styles.audioPlayBtnActive : ''}`}
                                  onClick={() => handlePlayLine(line.id)}
                                  title={playingLineId === line.id ? 'Stop' : 'Play recording'}
                                  disabled={!lineBlobUrls[line.id]}
                                >
                                  {playingLineId === line.id ? <IconStop size={10} /> : <IconPlay size={10} />}
                                </button>
                                <IconRecorded size={14} /> {lineDurations[line.id] || 'Recorded'}
                                <button
                                  className={styles.audioTagClear}
                                  onClick={() => {
                                    dispatchLines({ type: 'UPDATE', id: line.id, patch: { audioUrl: null } });
                                    setLineDurations(prev => { const n = {...prev}; delete n[line.id]; return n; });
                                    setLineBlobUrls(prev => { const n = {...prev}; delete n[line.id]; return n; });
                                    if (playingLineId === line.id) {
                                      lineAudioRef.current?.pause();
                                      setPlayingLineId(null);
                                    }
                                  }}
                                  title="Remove recording — use TTS instead"
                                  aria-label="Remove recording"
                                ><IconClose size={11} /></button>
                              </div>
                            )}
                          </div>
                          <div className={styles.lineButtons}>
                            <button
                              className={`${styles.lineBtn} ${overlayLineId === line.id ? styles.lineBtnActive : ''} ${line.overlay ? styles.lineBtnHasOverlay : ''}`}
                              title={line.overlay ? 'Edit visual' : 'Add a visual'}
                              onClick={() => setOverlayLineId(overlayLineId === line.id ? null : line.id)}
                            >
                              <IconAddVisual size={15} />
                            </button>
                            <button
                              className={`${styles.lineBtn} ${recordingLineId === line.id ? styles.lineBtnRecording : ''}`}
                              title={recordingLineId === line.id ? 'Stop recording' : uploadingLineId === line.id ? 'Uploading…' : 'Record line'}
                              onClick={() => handleRecord(line.id)}
                              disabled={uploadingLineId === line.id}
                            >
                              {uploadingLineId === line.id
                                ? <span className={styles.spin}><Ic.Spin /></span>
                                : <Ic.Record />
                              }
                            </button>
                            <button className={styles.lineBtn} title="Delete line" aria-label="Delete line" onClick={() => dispatchLines({ type: 'REMOVE', id: line.id })}><Ic.Trash /></button>
                          </div>
                        </div>
                      );
                    })}
                    <button className={styles.addLineBtn}
                      onClick={() => dispatchLines({ type: 'ADD', speakerId: speakers[0]?.speakerId || 'user' })}>
                      <IconAddLine size={15} /> Add line
                    </button>
                    {recordingError && (
                      <div className={styles.errorBox} style={{ margin: '0.5rem 0 0' }}>
                        {recordingError}
                        <button style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', verticalAlign: 'middle' }} aria-label="Dismiss" onClick={() => setRecordingError(null)}><IconClose size={11} /></button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ════ GENERATE TAB ════ */}
          {activeTab === 'generate' && (
            <div className={styles.generatePage}>

              {/* Insufficient-credits banner — sits above progress steps, hidden until a 402 */}
              <InsufficientCreditsBanner
                block={creditBlock}
                onUpgrade={() => { window.location.href = '/billing'; }}
                onDismiss={() => setCreditBlock(null)}
              />

              {/* Progress steps */}
              <div className={styles.glassCard}>
                <div className={styles.cardLabel}>Creating your podcast</div>
                {[
                  { label: 'Background', detail: selectedEnv?.name || selectedEnvId, done: true },
                  { label: 'Your speakers', detail: `${speakers.length} speaker${speakers.length !== 1 ? 's' : ''} ready`, done: avatarBuilt },
                  {
                    label: 'Rendering video',
                    detail: state.status === 'rendering' ? `${Math.round(state.progress * 100)}% complete` : 'Waiting to start',
                    active: state.status === 'rendering',
                    done:   state.status === 'complete',
                    progress: state.status === 'rendering' ? state.progress : null,
                  },
                  { label: 'Finishing touches', detail: 'Captions', done: state.status === 'complete' },
                  {
                    label: 'Video quality',
                    detail: quality === 'hd'
                      ? `HD · sharper faces${hdExtra != null ? ` · +${hdExtra.toLocaleString()} credits` : ''}`
                      : 'Standard · included in the price',
                    done: state.status === 'complete',
                    control: (
                      <div className={styles.scriptModeToggle} role="radiogroup" aria-label="Video quality">
                        {[
                          { key: 'standard', label: 'Standard' },
                          { key: 'hd',       label: 'HD' },
                        ].map(opt => {
                          const locked = submitted || state.status === 'rendering' || state.status === 'complete';
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              role="radio"
                              aria-checked={quality === opt.key}
                              disabled={locked}
                              className={`${styles.scriptModeBtn} ${styles.qualityBtn} ${quality === opt.key ? styles.scriptModeBtnActive : ''}`}
                              onClick={() => setQuality(opt.key)}
                            >
                              {opt.label}
                              {opt.key === 'hd' && hdExtra != null && (
                                <span className={styles.qualityExtra}>+{hdExtra.toLocaleString()}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ),
                  },
                  {
                    label: 'Format',
                    detail: verticalBlocked && !vertical
                      ? `Landscape 16:9 · ${verticalBlocked.charAt(0).toLowerCase()}${verticalBlocked.slice(1)}`
                      : (ASPECTS.find(a => a.id === aspect) || ASPECTS[0]).sub + ' · same price',
                    done: state.status === 'complete',
                    control: (
                      <div className={styles.scriptModeToggle} role="radiogroup" aria-label="Format">
                        {ASPECTS.map(opt => {
                          const locked = submitted || state.status === 'rendering' || state.status === 'complete';
                          const blocked = opt.id === '9:16' && !!verticalBlocked;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              role="radio"
                              aria-checked={aspect === opt.id}
                              disabled={locked || blocked}
                              title={blocked ? verticalBlocked : opt.sub}
                              className={`${styles.scriptModeBtn} ${styles.qualityBtn} ${aspect === opt.id ? styles.scriptModeBtnActive : ''}`}
                              onClick={() => setAspect(opt.id)}
                            >
                              <span aria-hidden="true" style={{
                                display: 'inline-block', verticalAlign: '-1px', marginRight: 6,
                                width: opt.id === '9:16' ? 7 : 13, height: opt.id === '9:16' ? 12 : 8,
                                border: '1.5px solid currentColor', borderRadius: 2, opacity: 0.85,
                              }} />
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    ),
                  },
                ].map((step, i) => (
                  <div key={i} className={styles.progStep}>
                    <div className={`${styles.stepIcon} ${step.done ? styles.sDone : step.active ? styles.sActive : styles.sPend}`}>
                      {step.done ? <Ic.Check /> : step.active ? <span className={styles.spin}><Ic.Spin /></span> : i + 1}
                    </div>
                    <div className={styles.stepInfo}>
                      <div className={styles.stepName}>{step.label}</div>
                      <div className={styles.stepDetail}>{step.detail}</div>
                      {step.progress != null && (
                        <div className={styles.pbarWrap}>
                          <div className={styles.pbarFill} style={{ width: `${step.progress * 100}%` }} />
                        </div>
                      )}
                    </div>
                    {step.control}
                  </div>
                ))}
                {state.status === 'failed' && state.error && (
                  <div className={styles.errorBox}>{state.error}</div>
                )}
                {generateError && !creditBlock && (
                  <div className={styles.errorBox} style={{ marginTop: '0.5rem' }}>
                    {generateError}
                    <button
                      style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                      onClick={() => setGenerateError(null)}
                      aria-label="Dismiss"
                    ><IconClose size={11} /></button>
                  </div>
                )}
              </div>

              {/* Video player when done */}
              {state.status === 'complete' && state.activeJob?.finalUrl && (
                <div className={styles.glassCard}>
                  <div className={styles.cardLabel}>Your podcast</div>
                  <video src={state.activeJob.finalUrl} controls className={styles.videoPlayer} />
                  <div className={styles.sessionMeta}>
                    {speakers.map(s => s.displayName).join(' + ')} · {fmtDuration(state.activeJob?.totalSeconds)}
                  </div>
                </div>
              )}

              {/* Video placeholder */}
              {state.status !== 'complete' && (
                <div className={`${styles.glassCard} ${styles.videoPlaceholder}`}>
                  <div className={styles.vpIcon}><Ic.Play /></div>
                  <span>{state.status === 'rendering' ? 'Rendering in progress…' : 'Video will appear here'}</span>
                </div>
              )}
            </div>
          )}

          {/* ════ MY PODCASTS TAB ════ */}
          {activeTab === 'podcasts' && (
            <div className={styles.podcastsPage}>

              {/* ── Video player — shown when a session is active ── */}
              {activeSession && (
                <div
                  className={styles.podcastOverlay}
                  onClick={e => {
                    if (e.target === e.currentTarget) {
                      podcastVideoRef.current?.pause();
                      setActiveSession(null);
                    }
                  }}
                >
                  <div className={styles.podcastOverlayBox}>
                    <button
                      className={styles.podcastOverlayClose}
                      onClick={() => { podcastVideoRef.current?.pause(); setActiveSession(null); }}
                      title="Close"
                      aria-label="Close"
                    ><IconClose size={13} /></button>
                    <video
                      ref={podcastVideoRef}
                      src={activeSession.final_url}
                      className={styles.podcastOverlayVideo}
                      controls
                      autoPlay
                    />
                    <div className={styles.podcastPlayerBar}>
                      <div className={styles.podcastPlayerMeta}>
                        <span className={styles.podcastPlayerTitle}>
                          {activeSession.speakers?.map(s => s.display_name).join(' + ') || 'Podcast'}
                        </span>
                        <span className={styles.podcastPlayerDate}>
                          {fmtDate(activeSession.created_at)}
                          {activeSession.total_seconds && ` · ${fmtDuration(activeSession.total_seconds)}`}
                        </span>
                      </div>
                      <button
                        className={styles.podcastPlayerBtn}
                        onClick={() => handleDownloadPodcast(activeSession)}
                        title="Download MP4"
                      ><IconDownload size={14} /> Download</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Grid header ── */}
              <div className={styles.cardLabel} style={{ padding: '0 0 0.65rem' }}>
                {sessions.length} podcast{sessions.length !== 1 ? 's' : ''} generated
              </div>

              {sessionsLoading && <div className={styles.loadingHint}>Loading your podcasts…</div>}
              {!sessionsLoading && sessions.length === 0 && (
                <div className={styles.emptyPodcasts}>
                  <div className={styles.emptyPodcastsIcon}><Ic.Mic /></div>
                  <p>No podcasts yet.</p>
                  <small>Generate your first one in the Generate tab.</small>
                </div>
              )}

              {/* ── Podcast grid ── */}
              <div className={styles.podcastGrid}>
                {sessions
                  .slice(sessionPage * PAGE_SIZE, (sessionPage + 1) * PAGE_SIZE)
                  .map(session => {
                    const isConfirm  = confirmDelete?.type === 'session' && confirmDelete?.id === session.session_id;
                    const isPlaying  = activeSession?.session_id === session.session_id;
                    return (
                      <div
                        key={session.session_id}
                        className={`${styles.podcastCard} ${isPlaying ? styles.podcastCardActive : ''}`}
                      >
                        {/* Thumbnail — click to play */}
                        <div
                          className={styles.podcastThumbWrap}
                          onClick={() => session.final_url && setActiveSession(session)}
                          title="Play"
                        >
                          {session.final_url ? (
                            <video src={session.final_url} className={styles.podcastThumb} muted />
                          ) : (
                            <div className={styles.podcastThumbPlaceholder}><Ic.Video /></div>
                          )}
                          {session.final_url && (
                            <div className={styles.podcastPlayOverlay}>
                              {isPlaying ? <IconStop size={22} /> : <IconPlay size={24} />}
                            </div>
                          )}
                        </div>

                        {/* Meta */}
                        <div className={styles.podcastMeta}>
                          <div className={styles.podcastSpeakers}>
                            {session.speakers?.map(s => s.display_name).join(' + ') || 'Unknown'}
                          </div>
                          <div className={styles.podcastDetails}>
                            {fmtDate(session.created_at)}
                            {session.total_seconds && ` · ${fmtDuration(session.total_seconds)}`}
                          </div>
                        </div>

                        {/* Actions — uniform sized pill buttons */}
                        <div className={styles.podcastActions}>
                          {session.final_url && (
                            <button
                              className={styles.podcastActionBtn}
                              onClick={() => setActiveSession(session)}
                              title="Play"
                            >
                              <IconPlay size={11} /> Play
                            </button>
                          )}
                          {session.final_url && (
                            <button
                              className={styles.podcastActionBtn}
                              onClick={() => handleDownloadPodcast(session)}
                              title="Download MP4"
                            >
                              <IconDownload size={13} /> Save
                            </button>
                          )}
                          {isConfirm ? (
                            <button
                              className={styles.podcastDeleteConfirm}
                              onClick={async () => {
                                try {
                                  await deleteSession(session.session_id);
                                  setSessions(prev => prev.filter(s => s.session_id !== session.session_id));
                                  if (isPlaying) setActiveSession(null);
                                  setConfirmDelete(null);
                                  const remaining = sessions.length - 1;
                                  if (sessionPage > 0 && sessionPage * PAGE_SIZE >= remaining) {
                                    setSessionPage(p => p - 1);
                                  }
                                } catch (err) { console.error(err); }
                              }}
                            >
                              Sure?
                            </button>
                          ) : (
                            <button
                              className={styles.podcastActionBtn}
                              onClick={() => setConfirmDelete({ type: 'session', id: session.session_id })}
                              title="Delete"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              <IconBin size={13} /> Del
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Pagination */}
              {sessions.length > PAGE_SIZE && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.65rem', borderTop: '1px solid rgba(148,163,184,0.08)' }}>
                  <button
                    className={styles.actionChip}
                    disabled={sessionPage === 0}
                    onClick={() => { setSessionPage(p => p - 1); setConfirmDelete(null); }}
                    style={{ opacity: sessionPage === 0 ? 0.35 : 1 }}
                  >
                    ← Prev
                  </button>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'Inter,sans-serif' }}>
                    {sessionPage * PAGE_SIZE + 1}–{Math.min((sessionPage + 1) * PAGE_SIZE, sessions.length)} of {sessions.length}
                  </span>
                  <button
                    className={styles.actionChip}
                    disabled={(sessionPage + 1) * PAGE_SIZE >= sessions.length}
                    onClick={() => { setSessionPage(p => p + 1); setConfirmDelete(null); }}
                    style={{ opacity: (sessionPage + 1) * PAGE_SIZE >= sessions.length ? 0.35 : 1 }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ════ GUIDE TAB ════ */}
          {activeTab === 'guide' && (
            <div className={styles.guidePage}>
              <div className={styles.glassCard}>
                <div className={styles.cardLabel}>Getting started</div>
                {[
                  { step: '1', title: 'Upload your photo', desc: 'Go to the Avatar tab and upload a clear photo of your face. We\'ll build a photorealistic AI avatar baked into your chosen environment.' },
                  { step: '2', title: 'Choose your environment', desc: 'Pick from 11 studio environments on the right — from a sleek tech studio to a beach setting. Your avatar will be composited directly into the scene.' },
                  { step: '3', title: 'Write your script', desc: 'Go to the Script tab. Type your lines, generate from a topic with AI, or import directly from your chat conversation.' },
                  { step: '4', title: 'Generate your video', desc: 'Hit Generate. Your avatar will lip-sync to each line using Fabric AI. The final video includes ambient sound and captions.' },
                  { step: '5', title: 'Find your podcasts', desc: 'All generated podcasts are saved in the My Podcasts tab. You can play, share, or download them any time.' },
                ].map(item => (
                  <div key={item.step} className={styles.guideStep}>
                    <div className={styles.guideStepNum}>{item.step}</div>
                    <div>
                      <div className={styles.guideStepTitle}>{item.title}</div>
                      <div className={styles.guideStepDesc}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ── RIGHT PANEL — contextual by tab ── */}
        <div className={styles.envPanel}>

          {/* SCRIPT TAB → Voice picker, OR Overlay editor when a line's ＋ is open */}
          {activeTab === 'script' && overlayLineId && (() => {
            const oLine = lines.find(l => l.id === overlayLineId);
            const ov = oLine?.overlay || {};
            const multi = speakers.length > 1;
            const presets = multi
              ? [
                  ['corner_small_tl', 'tl', 'Top left',    'Small card, top-left · fills best with a wide 16:9 image (~460×260)'],
                  ['corner_small_tr', 'tr', 'Top right',   'Small card, top-right · wide 16:9 image (~460×260)'],
                  ['corner_small_bl', 'bl', 'Bottom left', 'Small card, bottom-left · wide 16:9 image (~460×260)'],
                  ['corner_small_br', 'br', 'Bottom right','Small card, bottom-right · wide 16:9 image (~460×260)'],
                  ['lower_third_small_left',  'lt-l', 'Lower left',  'Short caption strip, lower-left · very wide banner (~700×110)'],
                  ['lower_third_small_right', 'lt-r', 'Lower right', 'Short caption strip, lower-right · very wide banner (~700×110)'],
                ]
              : [
                  ['side_panel_left',  'sp-l', 'Left panel',  'Tall panel down the left · portrait image (~435×520) — best for charts'],
                  ['side_panel_right', 'sp-r', 'Right panel', 'Tall panel down the right · portrait image (~435×520) — best for charts'],
                  ['corner_card_tl', 'tl', 'Top left',    'Card top-left · wide 16:9 image (~660×370)'],
                  ['corner_card_tr', 'tr', 'Top right',   'Card top-right · wide 16:9 image (~660×370)'],
                  ['corner_card_bl', 'bl', 'Bottom left', 'Card bottom-left · wide 16:9 image (~660×370)'],
                  ['corner_card_br', 'br', 'Bottom right','Card bottom-right · wide 16:9 image (~660×370)'],
                  ['lower_third', 'lt', 'Bottom bar', 'Wide strip across the bottom · very wide banner (~1280×160) — best for a headline or stat'],
                ];
            // Vertical (solo): its own positions; the line's choice is shown mapped.
            const vert = vertical && !multi;
            const presetsShown = vert ? PRESETS_VERTICAL.map(([id, lbl, tip]) => [id, POSITION_SHAPE[id], lbl, tip]) : presets;
            const shownPreset = mapPreset(ov.preset, vert ? '9:16' : '16:9');
            const oLineNo = lines.findIndex(l => l.id === overlayLineId) + 1;
            const genShown = overlayGenOpen || overlayGenerating || !!overlayGenPrompt.trim() || !!overlayGenError;
            return (
              <>
              <div className={`${styles.glassCard} ${styles.vpPanel}`}>
                <div className={styles.vpScroll}>
                <div className={styles.vpHead}>
                  <button type="button" className={styles.vpBack}
                    onClick={() => { setTypePopoverOpen(false); setOverlayLineId(null); }}
                    title="Back to Voice">
                    <IconChevronLeft size={13} /> Voice
                  </button>
                  <div className={styles.vpTitle}>
                    Visual{oLineNo > 0 ? <span> · line {oLineNo}</span> : null}
                  </div>
                </div>
                {oLine?.text && <blockquote className={styles.vpQuote}>{oLine.text}</blockquote>}

                {/* This line — the four visual types, 2 × 2 */}
                <div className={styles.vpSec}>This line</div>
                <div className={styles.vpTypes} role="radiogroup" aria-label="Visual type">
                  {[
                    ['card', <IconGlassCard size={20} />, 'Glass card', 'Frosted panel', 'A tilted frosted-glass panel beside the speaker — best for charts, stats, or quotes'],
                    ['cutout', <IconCutout size={20} />, 'Cutout', 'Floats free', 'The image with its background removed, floating free (no card) — best for products or logos'],
                    ['product_in_hand', <IconInHand size={20} />, 'In hand', 'Speaker holds it', 'The speaker is composed holding the product as they talk — best for a physical item'],
                    ...(extras.available
                      ? [['data', <IconDataCard size={20} />, 'Data card', 'Stat or chart · free', 'A designed stat or bar chart from the numbers in this line — free, exact, no image needed']]
                      : []),
                  ].map(([val, icon, lbl, short, hint]) => {
                    const isOn = val === 'product_in_hand' ? ov.mode === 'product_in_hand'
                      : val === 'data' ? ov.mode === 'data'
                      : ov.mode !== 'product_in_hand' && ov.mode !== 'data' && (ov.shape || 'card') === val;
                    return (
                      <button key={val} type="button" role="radio" aria-checked={isOn}
                        className={`${styles.vpTile} ${isOn ? styles.vpTileOn : ''}`}
                        title={hint}
                        onClick={() => {
                          if (val === 'data') {
                            const seeded = ov.mode === 'data' && ov.data;
                            patchOverlay({ mode: 'data',
                              preset: ov.mode === 'data' && ov.preset ? ov.preset : (multi ? 'corner_small_tr' : 'side_panel_right'),
                              data: seeded ? ov.data : { kind: 'stat', number: '', label: '' } });
                            setTypePopoverOpen(false); setDataOpen(true);
                            if (!seeded) fillDataCard(overlayLineId);
                            return;
                          }
                          if (val === 'product_in_hand') { patchOverlay({ mode: 'product_in_hand', shape: 'card' }); setTypePopoverOpen(false); return; }
                          patchOverlay({ mode: 'overlay', shape: val, preset: ov.preset || (multi ? 'corner_small_tr' : 'corner_card_tr'), data: undefined });
                          setTypePopoverOpen(true);   // open this type's position + look pop-out
                        }}>
                        <span className={styles.vpTileIc}>{icon}</span>
                        <span className={styles.vpTileTxt}><b>{lbl}</b><small>{short}</small></span>
                      </button>
                    );
                  })}
                </div>

                {/* Product name (product_in_hand only) */}
                {ov.mode === 'product_in_hand' && (
                  <div className={styles.vpField}>
                    <label htmlFor="vp-product-name">Product name</label>
                    <input
                      id="vp-product-name"
                      className={styles.overlayInput}
                      value={ov.productName || ''}
                      placeholder="e.g. AURA serum"
                      onChange={e => patchOverlay({ productName: e.target.value })}
                    />
                    {(!ov.imageUrl || !(ov.productName || '').trim()) && (
                      <p className={styles.vpWarn}>
                        <IconAlert size={13} />
                        <span>
                          In-hand needs a product image and a name to render —
                          {!(ov.productName || '').trim() ? ' add a product name' : ''}
                          {(!ov.imageUrl && !(ov.productName || '').trim()) ? ' and' : ''}
                          {!ov.imageUrl ? ' upload the product image below' : ''}.
                        </span>
                      </p>
                    )}
                  </div>
                )}

                {/* Data card → one summary row: where it lands + what it says */}
                {ov.mode === 'data' && (() => {
                  const pid = vert ? shownPreset : (ov.preset || (multi ? 'corner_small_tr' : 'side_panel_right'));
                  const posLabel = (presetsShown.find(p => p[0] === pid) || [])[2] || 'Right panel';
                  const ready = dataCardReady(ov.data);
                  return (
                    <button type="button" className={styles.vpSum}
                      onClick={() => setDataOpen(true)}
                      title="Edit the numbers, kind and position">
                      <PositionThumb rect={vert ? (PRESET_RECT_VERTICAL[pid] || PRESET_RECT_VERTICAL.top_card) : PRESET_RECT[pid]} vertical={vert} />
                      <span className={styles.vpSumTxt}>
                        <b>{ov.data?.kind === 'chart' ? 'Chart' : 'Stat'}{ready ? ` · ${dataCardSummary(ov.data)}` : ''}</b>
                        <small>{ready ? `${posLabel} · ${ov.data?.kind === 'chart' ? 'bars grow on cue' : 'counts up on cue'}` : 'Add the numbers'}</small>
                      </span>
                      <span className={styles.vpGo}>Edit <IconChevronRight size={13} /></span>
                    </button>
                  );
                })()}

                {/* Card / cutout → one summary row: where it lands + its look */}
                {ov.mode !== 'product_in_hand' && ov.mode !== 'data' && (() => {
                  const posLabel = (presetsShown.find(p => p[0] === shownPreset) || [])[2] || 'Pick a position';
                  const recId = currentRecipe(ov.style);
                  const recLabel = (RECIPE_OPTIONS.find(r => r.id === recId) || {}).label || 'Episode default';
                  const rect = shownPreset ? (vert ? PRESET_RECT_VERTICAL[shownPreset] : PRESET_RECT[shownPreset]) : null;
                  return (
                    <button type="button" className={styles.vpSum}
                      onClick={() => setTypePopoverOpen(true)}
                      title="Open position and look options">
                      <PositionThumb rect={rect} vertical={vert} />
                      <span className={styles.vpSumTxt}>
                        <b>{posLabel}</b>
                        <small>{ov.shape === 'cutout' ? 'Floats free · contact shadow' : `Look · ${recLabel}`}</small>
                      </span>
                      <span className={styles.vpGo}>Edit <IconChevronRight size={13} /></span>
                    </button>
                  );
                })()}

                {/* Image (not for data cards — they're drawn, not pictured) */}
                {ov.mode !== 'data' && (<>
                <div className={styles.overlaySeg}>Image
                  {ov.mode !== 'product_in_hand' && ov.preset && (
                    <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>
                      {' · '}{(vert ? IMAGE_HINT_VERTICAL[shownPreset] : IMAGE_SIZE_HINT[POSITION_SHAPE[ov.preset]]) || ''}
                    </span>
                  )}
                </div>
                {ov.imageUrl ? (
                  <div className={styles.overlayImageSet}>
                    <img src={ov.imageUrl} alt="overlay" className={styles.overlayImagePreview} />
                    <button className={styles.overlayReplace} onClick={() => patchOverlay({ imageUrl: null })}>Replace image</button>
                  </div>
                ) : (
                  <>
                    <div className={styles.vpImgRow}>
                      <label className={styles.vpImgBtn} tabIndex={0}
                        title={ov.mode === 'product_in_hand' ? 'Upload the product image' : 'Upload chart or image'}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.querySelector('input')?.click(); } }}>
                        {overlayUploading ? <span className={styles.spin}><Ic.Spin /></span> : <IconUpload size={20} />}
                        <span>{overlayUploading ? 'Uploading…' : 'Upload'}</span>
                        <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }}
                          onChange={e => handleOverlayUpload(e.target.files?.[0])} />
                      </label>
                      <button type="button"
                        className={`${styles.vpImgBtn} ${genShown ? styles.vpImgBtnOn : ''}`}
                        aria-expanded={genShown}
                        title="Describe it and the AI draws it, sized to this position"
                        onClick={() => setOverlayGenOpen(o => !o)}>
                        <IconGenerate size={20} />
                        <span>Generate</span>
                      </button>
                    </div>
                    {!genShown && (
                      <p className={styles.vpHint}>
                        {ov.mode === 'product_in_hand' ? 'A product photo · ' : ''}PNG, JPG or WebP · up to 10MB
                      </p>
                    )}
                    {/* Generate — the prompt box opens from the Generate button */}
                    {genShown && (
                    <div className={styles.overlayGenCard}>
                      <textarea
                        className={styles.overlayGenPrompt}
                        value={overlayGenPrompt}
                        placeholder={ov.mode === 'product_in_hand'
                          ? 'Describe the product…\ne.g. a sleek matte-black water bottle, studio lighting'
                          : ov.shape === 'cutout'
                            ? 'Describe the object…\ne.g. a glowing blue AI robot mascot, friendly pose'
                            : 'Describe the visual…\ne.g. a clean bar chart trending upward, indigo bars'}
                        rows={3}
                        onChange={e => setOverlayGenPrompt(e.target.value)}
                      />
                      {overlayGenError && <div className={styles.overlayGenError}>{overlayGenError}</div>}
                      <button
                        className={styles.overlayGenBtn}
                        disabled={overlayGenerating || !overlayGenPrompt.trim()}
                        onClick={handleOverlayGenerate}
                      >
                        {overlayGenerating
                          ? <><span className={styles.spin}><Ic.Spin /></span> Generating… (~2 min)</>
                          : <><IconGenerate size={15} /> Generate image</>}
                      </button>
                      <div className={styles.overlayGenHint}>
                        {ov.mode === 'product_in_hand'
                          ? 'Composed into the shot — the avatar will hold it'
                          : ov.preset
                            ? `Sized to fill ${vert ? (shownPreset === 'top_card' ? 'the top card' : shownPreset === 'lower_third' ? 'the lower band' : 'the 16:9 card') : (POSITION_SHAPE[ov.preset] || '').startsWith('panel') ? 'the tall panel' : (POSITION_SHAPE[ov.preset] || '').startsWith('bar') ? 'the wide bar' : 'the 16:9 card'} · free`
                            : 'Pick a position first to match the shape'}
                      </div>
                    </div>
                    )}
                  </>
                )}

                </>)}

                {/* Whole episode — compact rows; on/off lives in each pop-out */}
                <div className={styles.vpSec}>Whole episode</div>
                <SettingGroup>
                  {(() => {
                    const hasNames = !!(compareLeft.name.trim() && compareRight.name.trim());
                    const nPts = comparePoints.filter(p => (p.label || '').trim()).length;
                    return (
                      <SettingRow
                        icon={<IconCompare size={19} />}
                        title="Comparison"
                        sub={hasNames
                          ? `${compareLeft.name.trim()} vs ${compareRight.name.trim()}${nPts ? ` · ${nPts} point${nPts === 1 ? '' : 's'}` : ''}`
                          : 'Two rails, A vs B, across the episode'}
                        status={hasNames ? (compareOn ? 'on' : 'off') : null}
                        action={hasNames ? null : 'Set up'}
                        on={compareOn}
                        tip="Two glass rails comparing A vs B across the whole episode"
                        onClick={() => { setTypePopoverOpen(false); setCompareOpen(true); }}
                      />
                    );
                  })()}
                  {extras.available && (
                    <SettingRow
                      icon={<IconHook size={19} />}
                      title="Opening hook"
                      sub={hookDraft
                        ? `“${hookSummary(hookDraft)}” · first ${hookDraft.dur || 4}s`
                        : 'The AI writes it from your opening'}
                      status={hookOn ? 'on' : hookDraft ? 'draft' : 'off'}
                      statusLabel={hookOn ? 'On' : hookDraft ? 'AI draft' : 'Off'}
                      on={hookOn}
                      tip="A designed graphic for the first 3–5 seconds — the AI writes it from your opening"
                      onClick={() => { setTypePopoverOpen(false); setHookOpen(true); }}
                    />
                  )}
                </SettingGroup>
                </div>

                {/* Remove — pinned to the foot so it's always in the same place */}
                <div className={styles.vpFoot}>
                  <button type="button" className={styles.vpRemove} onClick={() => clearOverlay(overlayLineId)}>
                    <IconDetach size={15} /> Remove visual from this line
                  </button>
                </div>
              </div>

              {/* Per-type options pop-out (position + look) for card / cutout */}
              {/* Data card pop-out (portal) */}
              {dataOpen && ov.mode === 'data' && (
                <DataCardPopover
                  ov={vert ? { ...ov, preset: shownPreset } : ov}
                  multi={multi}
                  vertical={vert}
                  backdropUrl={speakers.find(s => s.speakerId === 'user')?.avatarRefUrl || selectedEnv?.previewUrl || null}
                  lineText={oLine?.text || ''}
                  filling={dataFilling}
                  fillNote={dataFillNote}
                  onPatch={(patch) => { patchOverlay(patch); setDataFillNote(null); }}
                  onFill={() => fillDataCard(overlayLineId, ov.data?.kind)}
                  onRemove={() => { setDataOpen(false); clearOverlay(overlayLineId); }}
                  onClose={() => setDataOpen(false)}
                />
              )}

              {typePopoverOpen && ov.mode !== 'product_in_hand' && ov.mode !== 'data' && (
                <div
                  onMouseDown={(e) => { if (e.target === e.currentTarget) setTypePopoverOpen(false); }}
                  style={{
                    position: 'fixed', inset: 0, zIndex: 1100,
                    background: 'rgba(2,6,23,0.74)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 22,
                  }}>
                  <div style={{ width: 'min(720px, 94vw)', maxHeight: '88vh', overflow: 'auto' }}>
                    <OverlayTypePopover
                      type={ov.shape === 'cutout' ? 'cutout' : 'card'}
                      ov={vert ? { ...ov, preset: shownPreset } : ov}
                      multi={multi}
                      vertical={vert}
                      onPatch={patchOverlay}
                      onClose={() => setTypePopoverOpen(false)}
                      onOpenCompare={() => { setTypePopoverOpen(false); setCompareOpen(true); }}
                    />
                  </div>
                </div>
              )}
              </>
            );
          })()}

          {/* SCRIPT TAB → Voice picker (compact rows; browsing happens in the overlay) */}
          {activeTab === 'script' && !overlayLineId && (() => {
            const spks = speakers.length === 0
              ? [{ speakerId: 'user', displayName: 'You', role: 'host', gender: 'female', voiceId: null }]
              : speakers;
            const cap = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : '');
            const picked = lines.filter(l => l.sfx && l.sfx !== 'auto').length;
            return (
            <div className={`${styles.glassCard} ${styles.vpPanel}`}>
              <div className={styles.vpScroll}>
                <div className={styles.vpHead}>
                  <div className={styles.vpTitle}>Voice <span>· {spks.length} speaker{spks.length === 1 ? '' : 's'}</span></div>
                </div>

                {spks.map(spk => {
                  const v = spk.voiceId
                    ? (voices.find(x => x.voiceId === spk.voiceId)
                        || (voiceClone && voiceClone.voiceId === spk.voiceId
                              ? { displayName: voiceClone.cloneName || 'My Voice', accent: 'your voice', voiceId: voiceClone.voiceId, previewUrl: null }
                              : null))
                    : null;
                  const isPlaying = v && playingPreviewId === v.voiceId;
                  const hasOutfit = !spk.isCharacter && spk.savedAvatarId;
                  return (
                    <React.Fragment key={spk.speakerId}>
                      <div className={styles.vpSec}>{spk.displayName} · {spk.role === 'host' ? 'Host' : 'Guest'}</div>
                      <SettingGroup>
                        <SettingRow
                          icon={<IconVoice size={19} />}
                          title={v ? v.displayName : 'Choose a voice'}
                          sub={v ? `${cap(v.accent)}${spk.gender ? ` · ${spk.gender}` : ''}` : 'Tap to browse & preview'}
                          on={!!v}
                          warn={!v}
                          status={v ? null : 'warn'}
                          tip={v ? 'Change this voice' : 'Browse and preview voices'}
                          onClick={() => setBrowserSpeakerId(spk.speakerId)}
                          trailing={v && v.previewUrl ? (
                            <button type="button"
                              className={`${styles.vpPlay} ${isPlaying ? styles.vpPlayOn : ''}`}
                              aria-label={isPlaying ? `Stop ${v.displayName}` : `Preview ${v.displayName}`}
                              title={isPlaying ? 'Stop' : 'Preview'}
                              onClick={() => handlePlayPreview(v.voiceId, v.previewUrl)}>
                              {isPlaying ? <IconStop size={10} /> : <IconPlay size={11} />}
                            </button>
                          ) : null}
                        />
                        {/* Outfit — real-person avatars only (needs a saved avatar_id);
                            AI characters carry their own wardrobe and are skipped. */}
                        {hasOutfit && (
                          <SettingRow
                            icon={<IconOutfit size={19} />}
                            title="Outfit"
                            sub={spk.outfitRefUrl ? (spk.outfitLabel || 'Custom') : 'Original'}
                            on={!!spk.outfitRefUrl}
                            tip="Choose or create an outfit for this episode"
                            onClick={() => setOutfitSpeakerId(spk.speakerId)}
                          />
                        )}
                      </SettingGroup>
                    </React.Fragment>
                  );
                })}

                {/* Sound + captions — episode-wide. On/off and the look live in each pop-out. */}
                {extras.available && (
                  <>
                    <div className={styles.vpSec}>Whole episode</div>
                    <SettingGroup>
                      <SettingRow
                        icon={<IconSound size={19} />}
                        title="Sound effects"
                        sub={sfxOn
                          ? `${cap(sfxLevel)}${picked ? ` · ${picked} picked` : ' · follows your graphics'}`
                          : 'Subtle sounds that move with your graphics'}
                        status={sfxOn ? 'on' : 'off'}
                        on={sfxOn}
                        tip="Subtle sound effects that move with your graphics"
                        onClick={() => setSoundOpen(true)}
                      />
                      <SettingRow
                        icon={<IconCaptions size={19} />}
                        title="Captions"
                        sub={`${(CAPTION_STYLES.find(s => s.id === captionStyle) || CAPTION_STYLES[0]).name} · always on`}
                        on={captionStyle !== 'glass'}
                        tip="Pick how your captions look"
                        onClick={() => setCaptionOpen(true)}
                      />
                    </SettingGroup>
                  </>
                )}
              </div>
            </div>
            );
          })()}

          {/* Opening hook pop-out (position:fixed) */}
          {hookOpen && (
            <HookPopover
              draft={hookDraft}
              enabled={hookOn}
              suggestion={hookSuggestion}
              suggesting={hookSuggesting}
              comparison={compareNames}
              backdropUrl={speakers.find(s => s.speakerId === 'user')?.avatarRefUrl || selectedEnv?.previewUrl || null}
              onChange={(next) => { setHookDraft(next); setHookTouched(true); }}
              onToggle={(on) => { setHookOn(on); if (on) setHookDismissed(false); }}
              onSuggest={() => runHookSuggest({ adopt: true })}
              onClose={() => setHookOpen(false)}
            />
          )}

          {/* Sound effects pop-out (position:fixed) */}
          {soundOpen && (
            <SoundPopover
              library={extras.sounds}
              enabled={sfxOn}
              level={sfxLevel}
              levels={extras.levels}
              onEnable={setSfxOn}
              onLevel={setSfxLevel}
              lines={lines
                .filter(l => (l.text || '').trim() || l.audioUrl)
                .map((l, idx) => ({
                  id: l.id, n: idx + 1, text: (l.text || '').trim(),
                  hasCard: !!(l.overlay && ((l.overlay.mode === 'data' && dataCardReady(l.overlay.data))
                                           || (l.overlay.imageUrl && l.overlay.mode !== 'product_in_hand'))),
                }))}
              choiceFor={(id) => lines.find(l => l.id === id)?.sfx || 'auto'}
              onChoice={(id, v) => dispatchLines({ type: 'UPDATE', id, patch: { sfx: v === 'auto' ? undefined : v } })}
              onClose={() => setSoundOpen(false)}
            />
          )}

          {/* Caption style pop-out (position:fixed) */}
          {captionOpen && (
            <CaptionPopover
              value={captionStyle}
              backdropUrl={speakers.find(s => s.speakerId === 'user')?.avatarRefUrl || selectedEnv?.previewUrl || null}
              onChange={setCaptionStyle}
              onClose={() => setCaptionOpen(false)}
            />
          )}

          {/* Voice browser overlay — position:fixed, so DOM location doesn't matter */}
          <VoiceBrowser
            speaker={
              (speakers.length === 0
                ? [{ speakerId: 'user', displayName: 'You', role: 'host', gender: 'female', voiceId: null }]
                : speakers
              ).find(s => s.speakerId === browserSpeakerId) || null
            }
            voices={voices}
            voiceClone={voiceClone}
            playingPreviewId={playingPreviewId}
            onPreview={handlePlayPreview}
            onSelect={handleSelectVoice}
            onClose={() => setBrowserSpeakerId(null)}
            cloningVoice={cloningVoice}
            cloneRecSeconds={cloneRecSeconds}
            cloneSubmitting={cloneSubmitting}
            cloneError={cloneError}
            onCloneRecord={handleCloneRecord}
          />

          {/* Outfit picker overlay — per real-person speaker (position:fixed) */}
          {(() => {
            const spk = speakers.find(s => s.speakerId === outfitSpeakerId);
            if (!spk) return null;
            return (
              <OutfitPicker
                open={!!outfitSpeakerId}
                onClose={() => setOutfitSpeakerId(null)}
                avatarId={spk.savedAvatarId}
                speakerLabel={spk.displayName || (spk.role === 'host' ? 'Host' : 'Guest')}
                currentRefUrl={spk.outfitRefUrl || null}
                onSelect={(refUrl, label) => handleSelectOutfit(spk.speakerId, refUrl, label)}
                loadOutfits={loadOutfits}
                loadWardrobe={loadWardrobe}
                ensureOriginalFullbody={ensureOriginalFullbody}
                generateOutfitPreview={generateOutfitPreview}
                confirmOutfit={confirmOutfit}
                deleteOutfit={deleteOutfit}
              />
            );
          })()}

          {/* Comparison setup pop-out (opens from the Comparison trigger) */}
          <ComparisonSetup
            open={compareOpen}
            onClose={() => setCompareOpen(false)}
            enabled={compareOn}
            setEnabled={setCompareOn}
            left={compareLeft}
            setLeft={setCompareLeft}
            right={compareRight}
            setRight={setCompareRight}
            points={comparePoints}
            setPoints={setComparePoints}
            railStyle={compareStyle}
            setRailStyle={setCompareStyle}
            uploadInsert={uploadInsert}
          />

          {/* GENERATE TAB → Voice confirmation panel */}
          {activeTab === 'generate' && (
            <div className={styles.glassCard} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div className={styles.cardLabel}>Confirm voices</div>
              <p style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'Inter,sans-serif', margin: 0, lineHeight: 1.5 }}>
                Review and change each speaker's voice before rendering.
              </p>

              {/* Per-speaker voice rows */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: 0 }}>
                {(speakers.length === 0
                  ? [{ speakerId: 'user', displayName: 'You', role: 'host', voiceId: null }]
                  : speakers
                ).map(spk => {
                  const assignedVoice  = voices.find(v => v.voiceId === spk.voiceId);
                  const isExpanded     = voiceConfirmOpen === spk.speakerId;
                  const isLocked       = state.status === 'rendering' || state.status === 'complete';
                  const filteredVoices = voices.filter(v => v.gender === voiceGenderFilter);

                  return (
                    <div key={spk.speakerId} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>

                      {/* Speaker header row */}
                      <div style={{
                        fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em',
                        textTransform: 'uppercase', color: spk.color || '#6366f1',
                        fontFamily: 'Inter,sans-serif',
                      }}>
                        {spk.displayName} · {spk.role === 'host' ? 'Host' : 'Guest'}
                      </div>

                      {/* Current voice chip + change button */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {assignedVoice ? (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.3rem 0.65rem', borderRadius: 999,
                            background: 'rgba(99,102,241,0.12)',
                            border: '1px solid rgba(99,102,241,0.3)',
                            fontSize: '0.72rem', fontFamily: 'Inter,sans-serif', color: '#c7d2fe',
                          }}>
                            <IconVoice size={13} />
                            <span>{assignedVoice.displayName}</span>
                            <span style={{ color: '#6366f1', opacity: 0.7 }}>·</span>
                            <span style={{ color: '#94a3b8' }}>{assignedVoice.accent}</span>
                          </div>
                        ) : (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.35rem',
                            fontSize: '0.7rem', color: '#F59E0B', fontFamily: 'Inter,sans-serif',
                          }}>
                            <IconAlert size={13} /> No voice selected
                          </div>
                        )}

                        {/* Preview button — only when voice assigned */}
                        {assignedVoice?.previewUrl && (
                          <button
                            onClick={() => handlePlayPreview(assignedVoice.voiceId, assignedVoice.previewUrl)}
                            style={{
                              background: 'none', border: '1px solid rgba(148,163,184,0.2)',
                              borderRadius: 6, color: '#94a3b8', cursor: 'pointer',
                              fontSize: '0.65rem', padding: '0.2rem 0.5rem',
                              fontFamily: 'Inter,sans-serif',
                            }}
                          >
                            {playingPreviewId === assignedVoice.voiceId
                              ? <><IconStop size={9} /> Stop</>
                              : <><IconPlay size={9} /> Preview</>}
                          </button>
                        )}

                        {/* Change toggle */}
                        {!isLocked && (
                          <button
                            onClick={() => setVoiceConfirmOpen(isExpanded ? null : spk.speakerId)}
                            style={{
                              background: isExpanded ? 'rgba(99,102,241,0.15)' : 'transparent',
                              border: '1px solid rgba(99,102,241,0.3)',
                              borderRadius: 6, color: '#818cf8', cursor: 'pointer',
                              fontSize: '0.65rem', padding: '0.2rem 0.5rem',
                              fontFamily: 'Inter,sans-serif', fontWeight: 600,
                            }}
                          >
                            {isExpanded ? <><IconClose size={10} /> Close</> : <><IconChevronDown size={11} /> Change</>}
                          </button>
                        )}
                      </div>

                      {/* Inline picker — expands on Change click */}
                      {isExpanded && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

                          {/* Gender filter */}
                          <div className={styles.scriptModeToggle} style={{ alignSelf: 'stretch' }}>
                            {['female', 'male'].map(g => (
                              <button
                                key={g}
                                className={`${styles.scriptModeBtn} ${voiceGenderFilter === g ? styles.scriptModeBtnActive : ''}`}
                                style={{ flex: 1, justifyContent: 'center' }}
                                onClick={() => setVoiceGenderFilter(g)}
                              >
                                {g === 'female' ? '♀ Female' : '♂ Male'}
                              </button>
                            ))}
                          </div>

                          {/* Voice grid — compact */}
                          <div className={styles.voiceGrid}>
                            {filteredVoices.map(v => {
                              const isSel     = spk.voiceId === v.voiceId;
                              const isPlaying = playingPreviewId === v.voiceId;
                              return (
                                <div
                                  key={v.voiceId}
                                  className={`${styles.voiceCard} ${isSel ? styles.voiceCardSelected : ''}`}
                                  onClick={() => {
                                    handleSelectVoice(spk.speakerId, v.voiceId);
                                    setVoiceConfirmOpen(null); // collapse after selection
                                  }}
                                >
                                  <div className={styles.voiceCardTop}>
                                    <div className={styles.voiceCardName}>{v.displayName}</div>
                                    <button
                                      className={`${styles.voicePreviewBtn} ${isPlaying ? styles.voicePreviewBtnPlaying : ''}`}
                                      onClick={e => { e.stopPropagation(); handlePlayPreview(v.voiceId, v.previewUrl); }}
                                      title={isPlaying ? 'Stop' : 'Preview'}
                                      aria-label={isPlaying ? 'Stop' : 'Preview'}
                                    >
                                      {isPlaying ? <IconStop size={9} /> : <IconPlay size={9} />}
                                    </button>
                                  </div>
                                  <div className={styles.voiceCardAccent}>{v.accent}</div>
                                  <div className={styles.voiceCardVibe}>{v.vibe}</div>
                                  {isSel && <div className={styles.voiceCardCheck}><Ic.Check /></div>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

              {/* All-good indicator */}
              {speakers.length > 0 && speakers.every(s => s.voiceId) && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  fontSize: '0.7rem', color: '#10B981', fontFamily: 'Inter,sans-serif',
                  padding: '0.45rem 0.7rem',
                  background: 'rgba(16,185,129,0.07)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: 8,
                }}>
                  <Ic.Check /> All voices confirmed — ready to render
                </div>
              )}
            </div>
          )}

          {/* ALL OTHER TABS → Environment picker */}
          {activeTab !== 'script' && activeTab !== 'podcasts' && activeTab !== 'guide' && activeTab !== 'generate' && (
            <div className={styles.glassCard} style={{ height: '100%' }}>
              <div className={styles.cardLabel}>Studio Backgrounds</div>

              {/* Toggle pill — reuses existing scriptModeToggle CSS, now 3 options */}
              <div className={styles.scriptModeToggle} style={{ marginBottom: '0.6rem', flexShrink: 0 }}>
                <button
                  className={`${styles.scriptModeBtn} ${envPanelMode === 'browse' && envMode === 'solo' ? styles.scriptModeBtnActive : ''}`}
                  onClick={() => { handleEnvModeSwitch('solo'); setEnvPanelMode('browse'); }}
                  title="Solo host — one chair">Solo</button>
                <button
                  className={`${styles.scriptModeBtn} ${envPanelMode === 'browse' && envMode === 'standard' ? styles.scriptModeBtnActive : ''}`}
                  onClick={() => { handleEnvModeSwitch('standard'); setEnvPanelMode('browse'); }}
                  title="You + one guest">Duo</button>
                <button
                  className={`${styles.scriptModeBtn} ${envPanelMode === 'browse' && envMode === 'panel' ? styles.scriptModeBtnActive : ''}`}
                  onClick={() => { handleEnvModeSwitch('panel'); setEnvPanelMode('browse'); }}
                  title="3-person panel">Panel</button>
                <button
                  className={`${styles.scriptModeBtn} ${envPanelMode === 'generate' ? styles.scriptModeBtnActive : ''}`}
                  onClick={() => {
                    // Only reset on a genuine fresh entry from browse mode —
                    // re-clicking Generate while already in it (e.g. after
                    // tabbing over to peek at the browse grid and back)
                    // must NOT wipe an in-progress or already-generated preview.
                    if (envPanelMode !== 'generate') {
                      setGenEnvCapacity(null);
                      setGenEnvId(null);
                      setGenEnvPreviewUrl(null);
                      setGenEnvError(null);
                    }
                    setEnvPanelMode('generate');
                  }}
                  title="Generate your own background"><IconAiScene size={15} /> Generate</button>
              </div>

              {envPanelMode === 'browse' ? (
                <>
                  {envsLoading ? (
                    <div className={styles.loadingHint}>Loading…</div>
                  ) : (
                    <div className={styles.envGrid}>
                      {environments
                        .filter(env => {
                          const cap = env.guestCapacity ?? 2;
                          if (envMode === 'solo')  return cap === 1;
                          if (envMode === 'panel') return cap === 3;
                          return cap === 2;
                        })
                        .map(env => {
                          const isEnvConfirm = confirmDelete?.type === 'environment' && confirmDelete?.id === env.envId;
                          return (
                          <div
                            key={env.envId}
                            className={`${styles.envCardWrap} ${selectedEnvId === env.envId ? styles.envCardWrapSelected : ''}`}
                            onClick={() => {
                              if (confirmDelete) { setConfirmDelete(null); return; }
                              if (activeTab !== 'generate') setSelectedEnvId(env.envId);
                            }}
                          >
                            <div className={`${styles.envCard} ${selectedEnvId === env.envId ? styles.envCardSelected : ''} ${activeTab === 'generate' ? styles.envCardReadOnly : ''}`} style={{ position: 'relative' }}>
                              {env.previewUrl
                                ? <img src={env.previewUrl} alt={env.name} className={styles.envImg} />
                                : <div className={styles.envPlaceholder} />
                              }
                              {env.isCustom && <span className={styles.envCustomBadge}>Yours</span>}

                              {/* Delete control — custom environments only, same pattern as the avatar grid */}
                              {env.isCustom && (isEnvConfirm ? (
                                <button
                                  style={{
                                    position: 'absolute', bottom: 4, right: 4,
                                    fontSize: '0.58rem', fontWeight: 700, padding: '0.15rem 0.4rem',
                                    background: 'rgba(239,68,68,0.85)', color: '#fff',
                                    border: '1px solid rgba(239,68,68,0.5)', borderRadius: 6,
                                    cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                                  }}
                                  onClick={async e => {
                                    e.stopPropagation();
                                    await handleDeleteEnvironment(env.envId);
                                    setConfirmDelete(null);
                                  }}
                                >
                                  Sure?
                                </button>
                              ) : (
                                <button
                                  style={{
                                    position: 'absolute', bottom: 4, right: 4,
                                    fontSize: '0.58rem', fontWeight: 700, padding: '0.15rem 0.4rem',
                                    background: 'rgba(10,15,30,0.7)', color: '#64748b',
                                    border: '1px solid rgba(148,163,184,0.15)', borderRadius: 6,
                                    cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                                    opacity: 0,
                                  }}
                                  className={styles.avatarDeleteBtn}
                                  onClick={e => { e.stopPropagation(); setConfirmDelete({ type: 'environment', id: env.envId }); }}
                                  title="Delete background"
                                  aria-label="Delete background"
                                >
                                  <IconBin size={12} />
                                </button>
                              ))}
                            </div>
                            <span className={styles.envName}>{env.name}</span>
                          </div>
                        );})}
                    </div>
                  )}
                  {selectedEnv && (
                    <div className={styles.envSelected}>
                      Selected: <strong>{selectedEnv.name}</strong>
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.genPanel}>

                  {/* Sub-choice screen — capacity not picked yet */}
                  {genEnvCapacity === null && (
                    <>
                      <p className={styles.genEnvIntro}>Choose a format for your background:</p>
                      <div className={styles.genEnvCapacityChoices}>
                        <button className={styles.genEnvCapacityCard} onClick={() => handlePickGenCapacity(1)}>
                          <div className={styles.genEnvCapacityTitle}>Solo · 1</div>
                          <div className={styles.genEnvCapacityDesc}>A single-chair close-up for a solo host — no empty seats behind you.</div>
                        </button>
                        <button className={styles.genEnvCapacityCard} onClick={() => handlePickGenCapacity(2)}>
                          <div className={styles.genEnvCapacityTitle}>Duo · 2</div>
                          <div className={styles.genEnvCapacityDesc}>A cozy medium shot for you and one guest, side by side.</div>
                        </button>
                        <button className={styles.genEnvCapacityCard} onClick={() => handlePickGenCapacity(3)}>
                          <div className={styles.genEnvCapacityTitle}>Panel · 3</div>
                          <div className={styles.genEnvCapacityDesc}>A wider panel shot with room for two guests alongside you.</div>
                        </button>
                      </div>
                    </>
                  )}

                  {/* Form — capacity picked, no preview yet */}
                  {genEnvCapacity !== null && !genEnvPreviewUrl && (
                    <>
                      {/* Describe / Upload toggle — reuses the scriptModeToggle pill */}
                      <div className={styles.scriptModeToggle} style={{ marginBottom: '0.4rem', flexShrink: 0 }}>
                        <button
                          className={`${styles.scriptModeBtn} ${envCreateMode === 'describe' ? styles.scriptModeBtnActive : ''}`}
                          onClick={() => { setEnvCreateMode('describe'); setEnvImgError(null); }}
                        >Describe it</button>
                        <button
                          className={`${styles.scriptModeBtn} ${envCreateMode === 'upload' ? styles.scriptModeBtnActive : ''}`}
                          onClick={() => { setEnvCreateMode('upload'); setGenEnvError(null); }}
                        >Upload a photo</button>
                      </div>

                      <input
                        type="text"
                        className={styles.genNameInput}
                        placeholder="Name this background…"
                        value={genEnvDisplayName}
                        onChange={e => setGenEnvDisplayName(e.target.value)}
                      />

                      {envCreateMode === 'describe' ? (
                        <>
                          <textarea
                            className={styles.genDescInput}
                            rows={3}
                            placeholder="Describe the setting — e.g. 'A modern loft with exposed brick and string lights'"
                            value={genEnvDescription}
                            onChange={e => setGenEnvDescription(e.target.value)}
                          />
                          <div className={styles.genFooterRow}>
                            <button
                              className={styles.buildBtn}
                              style={{ width: 'auto', padding: '0.5rem 1.1rem' }}
                              onClick={handleGenerateEnvironment}
                              disabled={genEnvLoading || !genEnvDescription.trim()}
                            >
                              {genEnvLoading ? <><span className={styles.spin}><Ic.Spin /></span> Generating…</> : <><IconAiScene size={15} /> Generate</>}
                            </button>
                            <button className={styles.genSecondaryBtn} onClick={handleChangeGenFormat}>
                              ← Change format
                            </button>
                          </div>
                          {genEnvError && <div className={styles.errorBox}>{genEnvError}</div>}
                        </>
                      ) : (
                        <>
                          <label
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                              width: '100%', minHeight: 96, textAlign: 'center', cursor: envImgBusy ? 'default' : 'pointer',
                              border: '1.5px dashed rgba(99,102,241,0.4)', borderRadius: 12, padding: '1rem',
                              background: 'rgba(99,102,241,0.06)', color: '#A5B4FC', fontSize: '0.8rem',
                              fontFamily: 'Inter,sans-serif', fontWeight: 600,
                            }}
                          >
                            <input type="file" accept="image/*" hidden disabled={envImgBusy}
                              onChange={e => handleUploadEnvironment(e.target.files?.[0])} />
                            {envImgBusy
                              ? <><span className={styles.spin}><Ic.Spin /></span> Building your studio… (~1–2 min)</>
                              : <><IconUpload size={15} /> Upload a photo of your space</>}
                          </label>
                          <p className={styles.genEnvIntro} style={{ margin: '0.4rem 0' }}>
                            We rebuild your photo as a studio with {genEnvCapacity === 1 ? 'a camera-facing chair' : `${genEnvCapacity} camera-facing chairs`}. You’re responsible for rights to images you upload.
                          </p>
                          <div className={styles.genFooterRow}>
                            <button className={styles.genSecondaryBtn} onClick={handleChangeGenFormat} disabled={envImgBusy}>
                              ← Change format
                            </button>
                          </div>
                          {envImgError && <div className={styles.errorBox}>{envImgError}</div>}
                        </>
                      )}
                    </>
                  )}

                  {/* Preview — already saved and selected the moment it appears */}
                  {genEnvPreviewUrl && (
                    <>
                      <div className={styles.genPreviewImgBox} style={{ width: '100%', height: 140 }}>
                        <img src={genEnvPreviewUrl} alt="Generated background preview" className={styles.genPreviewImg} />
                      </div>
                      <p className={styles.genEnvIntro} style={{ margin: '0.4rem 0' }}>
                        Saved and selected — regenerate if you want a different result.
                      </p>
                      <div className={styles.genFooterRow}>
                        <button className={styles.buildBtn} onClick={handleDoneGeneratingEnvironment} disabled={genEnvLoading}>
                          <Ic.Check /> Done
                        </button>
                        <button className={styles.genSecondaryBtn} onClick={handleRegenerateEnvironment} disabled={genEnvLoading}>
                          {genEnvLoading ? <><span className={styles.spin}><Ic.Spin /></span> Regenerating…</> : <><Ic.Refresh /> Regenerate</>}
                        </button>
                      </div>
                      {genEnvError && <div className={styles.errorBox}>{genEnvError}</div>}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* ── Floating footer pill ── */}
      <div className={styles.footer}>
        {activeTab === 'avatar' ? (
          <button className={styles.backBtn} onClick={onClose}>← Back to chat</button>
        ) : (
          <button className={styles.backBtn} onClick={() => setActiveTab(TABS[TABS.indexOf(activeTab) - 1])}>
            ← {TAB_LABELS[TABS[TABS.indexOf(activeTab) - 1]]}
          </button>
        )}

        <div className={styles.pips}>
          {TABS.map(tab => (
            <div
              key={tab}
              className={`${styles.pip} ${tabsDone[tab] ? styles.pipDone : activeTab === tab ? styles.pipActive : ''}`}
              onClick={() => setActiveTab(tab)}
            />
          ))}
        </div>

        {activeTab === 'generate' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            {renderCost && effectivePrice != null && (
              <span style={{
                fontFamily: "'Inter', sans-serif", fontSize: '0.72rem', fontWeight: 600,
                whiteSpace: 'nowrap',
                color: effectiveAffordable === false ? '#f59e0b' : '#818cf8',
              }}>
                ~{effectivePrice.toLocaleString()} credits{quality === 'hd' && ' · HD'}
                {estSeconds > 0 && ` · ~${estSeconds >= 60 ? `${Math.round(estSeconds / 60)} min` : `${estSeconds}s`}`}
                {credits.balance != null && ` · ${Number(credits.balance).toLocaleString()} left`}
              </span>
            )}
            {!voiceGate.ready && (
              <div className={styles.voiceGateWarn}>
                <IconAlert size={13} style={{ marginRight: 4, marginTop: -2 }} />{voiceGate.missing.map(s => s.displayName || 'A speaker').join(', ')}
                {voiceGate.missing.length === 1 ? ' needs' : ' need'} a voice — pick one on the Script tab before generating.
              </div>
            )}
            <button
              className={styles.generateBtn}
              onClick={handleGenerate}
              disabled={submitted || state.status === 'rendering' || state.status === 'complete' || !speakers.length || !lines.length || !voiceGate.ready}
            >
              {state.status === 'rendering'
                ? <><span className={styles.spin}><Ic.Spin /></span> Rendering…</>
                : state.status === 'complete' ? <><IconCheck size={12} strokeWidth={2.6} /> Complete</>
                : <><IconPlay size={11} /> Generate video</>
              }
            </button>
          </div>
        ) : activeTab === 'podcasts' || activeTab === 'guide' ? (
          <button className={styles.nextBtn} onClick={() => setActiveTab('avatar')}>
            ← Start creating
          </button>
        ) : (
          <button className={styles.nextBtn} onClick={() => setActiveTab(TABS[TABS.indexOf(activeTab) + 1])}>
            Continue to {TAB_LABELS[TABS[TABS.indexOf(activeTab) + 1]]} →
          </button>
        )}
      </div>

      {/* Voice-clone recording focus overlay — shows only while actively
          recording (cloningVoice), gives the script room to be readable. */}
      {cloningVoice && (
        <div className={styles.recordFocusOverlay}>
          <div className={styles.recordFocusCard}>
            <div className={styles.recordFocusTimer}>
              <span className={styles.recordingDot} />
              Recording — {Math.floor(cloneRecSeconds / 60)}:{String(cloneRecSeconds % 60).padStart(2, '0')}
            </div>
            <p className={styles.recordFocusScript}>{VOICE_CLONE_SCRIPT}</p>
            <p className={styles.recordFocusHint}>Read naturally, like you're talking to a friend. Aim for 30–60 seconds.</p>
            <button className={styles.recordFocusStopBtn} onClick={handleCloneRecord}>
              <IconStop size={12} /> Stop recording
            </button>
          </div>
        </div>
      )}

    </div>
  );
}