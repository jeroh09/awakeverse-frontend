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
  useState, useEffect, useRef, useCallback, useReducer
} from 'react';
import usePodcastStudio from '../../hooks/usePodcastStudio';
import useVideoBudget from '../../hooks/useVideoBudget';
import VideoBudgetBanner from './VideoBudgetBanner';
import styles from './PodcastStudioPage.module.css';
import ApiErrorService from '../../services/ApiErrorService';

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
const DEFAULT_GUEST_VOICE = 'pNInz6obpgDQGcFmaJgB'; // Adam — ElevenLabs neutral male
const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

// ── Avatar build stages (mirrors ScanLegendModal stage pattern) ───────────────
const BUILD_STAGES = [
  { key: 'uploading',  label: 'Uploading photo…'          },
  { key: 'composing',  label: 'Composing avatar…'         },
  { key: 'baking',     label: 'Baking into environment…'  },
  { key: 'done',       label: 'Avatar ready'               },
];

// ── SVG Icons ────────────────────────────────────────────────────────────────
const Ic = {
  Drag: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9"  cy="5"  r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="9"  cy="12" r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="9"  cy="19" r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="15" cy="5"  r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="15" cy="19" r="1.2" fill="currentColor" stroke="none"/>
    </svg>
  ),
  Upload: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.8">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round"/>
    </svg>
  ),
  Check: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Spin: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
    </svg>
  ),
  Play: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  Trash: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
    </svg>
  ),
  Record: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="5"/>
    </svg>
  ),
  Add: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Import: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Mic: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="9" y="2" width="6" height="11" rx="3"/>
      <path d="M5 10a7 7 0 0014 0" strokeLinecap="round"/>
      <line x1="12" y1="19" x2="12" y2="22" strokeLinecap="round"/>
      <line x1="8" y1="22" x2="16" y2="22" strokeLinecap="round"/>
    </svg>
  ),
  Video: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polygon points="23 7 16 12 23 17 23 7"/>
      <rect x="1" y="5" width="15" height="14" rx="2"/>
    </svg>
  ),
  Refresh: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="1 4 1 10 7 10"/>
      <polyline points="23 20 23 14 17 14"/>
      <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" strokeLinecap="round"/>
    </svg>
  ),
  Alert: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4" strokeLinecap="round"/>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round"/>
    </svg>
  ),
  ImageFrame: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none"/>
      <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

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

// ── Lines reducer ─────────────────────────────────────────────────────────────
const linesReducer = (state, action) => {
  switch (action.type) {
    case 'SET':    return action.lines;
    case 'ADD':    return [...state, { speakerId: action.speakerId, text: '', audioUrl: null, id: Date.now() }];
    case 'UPDATE': return state.map(l => l.id === action.id ? { ...l, ...action.patch } : l);
    case 'REMOVE': return state.filter(l => l.id !== action.id);
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
    generateEnvironmentPreview,
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
  } = usePodcastStudio();

  const {
    guardedFetch,
    budgetState,
    budgetDisplay,
    handleUpgrade,
    clearBudgetError,
  } = useVideoBudget();

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
  const [genEnvPreviewUrl, setGenEnvPreviewUrl] = useState(null);
  const [genEnvLoading,    setGenEnvLoading]    = useState(false);
  const [genEnvError,      setGenEnvError]      = useState(null);

  // ── Speakers ──────────────────────────────────────────────────────────────
  const [speakers, setSpeakers] = useState([]);
  // Derived AFTER speakers — max guests and current count based on envMode
  const maxGuests         = envMode === 'panel' ? 2 : 1;
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
    setPodcastMode(mode);
    if (mode === 'solo') setActiveTab('script');
  }, [consented, recordConsent, setPodcastMode, setActiveTab]);

  // Switch between standard (2-chair) and panel (3-chair) env modes
  const handleEnvModeSwitch = useCallback((mode) => {
    setEnvMode(mode);
    if (mode === 'panel') {
      setSelectedEnvId('panel_living_c');
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
    handleEnvModeSwitch(capacity === 3 ? 'panel' : 'standard');
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
    if (!genDescription.trim() || genAttempt >= 3) return;
    setGenLoading(true);
    setGenError(null);
    setGenRejected(false);
    try {
      const displayName = genDisplayName.trim() || context?.user?.displayName || 'You';
      const result = await generateAvatarPreview({
        description:    genDescription.trim(),
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
  }, [genDescription, genDisplayName, genAttempt, generateAvatarPreview, context]);

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

    // Clear any previous budget error before a new attempt
    clearBudgetError();
    setGenerateError(null);
    setSubmitted(true);

    try {
      const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';

      // Build payload in snake_case — matches backend _validate_session exactly.
      const payload = {
        environment_id: selectedEnvId,
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
          };
        }),
        lines: currentLines
          .filter(l => (l.text || '').trim() || l.audioUrl)
          .map(l => ({
            speaker_id: l.speakerId,
            text:       l.text     || '',
            audio_url:  l.audioUrl || null,
          })),
      };

      // guardedFetch: same as fetch() but intercepts 403 budget errors.
      // Returns null on budget hit → budgetState.hit → banner renders.
      // Returns Response on success → extract session_id and start polling.
      const res = await guardedFetch(`${API_BASE}/api/podcast/session`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'include',
        body:        JSON.stringify(payload),
      });

      if (!res) {
        // Budget hit — banner rendered via budgetState, re-enable button
        setSubmitted(false);
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        ApiErrorService.log('PodcastStudioPage.handleGenerate', res.status, data);
        setGenerateError(ApiErrorService.getMessage(res.status, data));
        setSubmitted(false);
        return;
      }

      // Hand off to poll loop — NO second POST.
      // startPollingSession sets state to 'rendering' and begins the poll interval.
      startPollingSession(data.session_id);
      setSubmitted(false);
      // Sessions list refreshed by the useEffect watching state.status === 'complete'

    } catch (e) {
      ApiErrorService.log('PodcastStudioPage.handleGenerate [catch]', 0, { error: e.message });
      setGenerateError(ApiErrorService.getNetworkMessage(e));
      setSubmitted(false);
    }
  }, [
    speakers, selectedEnvId,
    startPollingSession, loadSessions,
    clearBudgetError, guardedFetch,
  ]);

  // ── Reload sessions when generate completes ───────────────────────────────
  useEffect(() => {
    if (state.status === 'complete') loadSessions();
  }, [state.status, loadSessions]);

  // ── Shared env (selected env object) ─────────────────────────────────────
  const selectedEnv = environments.find(e => e.envId === selectedEnvId);

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className={styles.page}>

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
                            <span>🎙</span>
                            <span className={styles.pickerOptionImgFilename}>solo_voice.jpg</span>
                          </div>
                        </div>
                        <div className={styles.pickerOptionBody}>
                          <div className={styles.pickerOptionName}>Solo voice</div>
                          <div className={styles.pickerOptionDesc}>Just you. An AI assistant helps craft your monologue, line by line.</div>
                          <div className={styles.pickerOptionCta}>
                            Start writing
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
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
                            <span>🎤</span>
                            <span className={styles.pickerOptionImgFilename}>open_conversation.jpg</span>
                          </div>
                        </div>
                        <div className={styles.pickerOptionBody}>
                          <div className={styles.pickerOptionName}>Open conversation</div>
                          <div className={styles.pickerOptionDesc}>You and a guest. Trade lines from chat or write the script fresh.</div>
                          <div className={styles.pickerOptionCta}>
                            Add a guest
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
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
              <div className={`${styles.glassCard} ${styles.avatarGridCard} ${avatarInputMode === 'generate' && !avatarBuilt ? styles.avatarGridCardExpanded : ''}`}>
                <div className={styles.cardLabel}>Your avatar</div>

                {/* Upload / Generate toggle — reuses scriptModeToggle exactly (same pill used by Studio Backgrounds' 1-2 Guests/Panel-3 toggle) */}
                {!avatarBuilt && (
                  <div className={styles.scriptModeToggle} style={{ marginBottom: '0.2rem', flexShrink: 0 }}>
                    <button
                      className={`${styles.scriptModeBtn} ${avatarInputMode === 'upload' ? styles.scriptModeBtnActive : ''}`}
                      onClick={() => setAvatarInputMode('upload')}
                    >
                      <Ic.Upload /> Upload photo
                    </button>
                    <button
                      className={`${styles.scriptModeBtn} ${avatarInputMode === 'generate' ? styles.scriptModeBtnActive : ''}`}
                      onClick={() => setAvatarInputMode('generate')}
                    >
                      <Ic.ImageFrame /> Generate
                    </button>
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
                            : <div className={styles.avatarSquareImgFallback}>👤</div>
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
                          >
                            ✕
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
                            <Ic.Upload /> Upload photo
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
                          <Ic.Upload /> Upload photo
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
                        <textarea
                          className={styles.genDescInput}
                          rows={3}
                          placeholder="Describe your look — hair, build, style, what you're wearing. e.g. 'A tall woman in her 30s with natural locs, warm smile, wearing a navy blazer'"
                          value={genDescription}
                          onChange={e => setGenDescription(e.target.value)}
                        />
                        <div className={styles.genFooterRow}>
                          <button
                            className={styles.buildBtn}
                            style={{ width: 'auto', padding: '0.5rem 1.1rem' }}
                            onClick={handleGenerateAvatar}
                            disabled={genLoading || !genDescription.trim()}
                          >
                            {genLoading ? <><span className={styles.spin}><Ic.Spin /></span> Generating…</> : <><Ic.ImageFrame /> Generate</>}
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
                    {buildStage ? <><span className={styles.spin}><Ic.Spin /></span> Building…</> : '✦ Build my avatar'}
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
              {((envMode === 'panel') ||
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
                          }}>✕</button>
                        </div>
                      ) : (
                        <div className={styles.guestSlotEmpty}>
                          <input className={styles.guestNameInput}
                            placeholder={envMode === 'panel' ? 'Guest 1 name…' : 'Guest name…'}
                            value={guestName} onChange={e => setGuestName(e.target.value)} />
                          <button className={styles.addGuestPhotoBtn} onClick={() => guestFileRef.current?.click()}>
                            {guestPreview
                              ? <><img src={guestPreview} alt="g1" style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover', marginRight: 4 }} />Change</>
                              : <><Ic.Upload /> Photo</>}
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
                            }}>✕</button>
                          </div>
                        ) : (
                          <div className={styles.guestSlotEmpty}>
                            <input className={styles.guestNameInput}
                              placeholder="Guest 2 name…"
                              value={guest2Name} onChange={e => setGuest2Name(e.target.value)} />
                            <button className={styles.addGuestPhotoBtn} onClick={() => guest2FileRef.current?.click()}>
                              {guest2Preview
                                ? <><img src={guest2Preview} alt="g2" style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover', marginRight: 4 }} />Change</>
                                : <><Ic.Upload /> Photo</>}
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
                    ✦ AI Write
                  </button>
                  <button
                    className={`${styles.scriptModeBtn} ${scriptMode === 'lines' ? styles.scriptModeBtnActive : ''}`}
                    onClick={() => setScriptMode('lines')}
                  >
                    ≡ Edit Lines {lines.length > 0 && `(${lines.length})`}
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
                                ✓ Happy with this? Click Convert to lines below
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
                      {scriptLoading ? <span className={styles.spin}><Ic.Spin /></span> : 'Send ➤'}
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
                          draggable
                          onDragStart={e => handleDragStart(e, i)}
                          onDragOver={e => handleDragOver(e, i)}
                          onDrop={e => handleDrop(e, i)}
                          onDragEnd={handleDragEnd}
                        >
                          <div className={styles.dragHandle} title="Drag to reorder"><Ic.Drag /></div>
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
                                dispatchLines({ type: 'UPDATE', id: line.id, patch: { text: e.target.value } });
                                autoGrowTextarea(e.target);
                              }}
                              rows={2}
                            />
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
                                  {playingLineId === line.id ? '■' : '▶'}
                                </button>
                                🎤 {lineDurations[line.id] || 'Recorded'}
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
                                >✕</button>
                              </div>
                            )}
                          </div>
                          <div className={styles.lineButtons}>
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
                            <button className={styles.lineBtn} title="Delete" onClick={() => dispatchLines({ type: 'REMOVE', id: line.id })}><Ic.Trash /></button>
                          </div>
                        </div>
                      );
                    })}
                    <button className={styles.addLineBtn}
                      onClick={() => dispatchLines({ type: 'ADD', speakerId: speakers[0]?.speakerId || 'user' })}>
                      <Ic.Add /> Add line
                    </button>
                    {recordingError && (
                      <div className={styles.errorBox} style={{ margin: '0.5rem 0 0' }}>
                        {recordingError}
                        <button style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }} onClick={() => setRecordingError(null)}>✕</button>
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

              {/* Budget banner — sits above progress steps, hidden until budget hit */}
              <VideoBudgetBanner
                budgetState={budgetState}
                budgetDisplay={budgetDisplay}
                onUpgrade={handleUpgrade}
                onDismiss={clearBudgetError}
              />

              {/* Progress steps */}
              <div className={styles.glassCard}>
                <div className={styles.cardLabel}>Render progress</div>
                {[
                  { label: 'Environment plate', detail: selectedEnv?.name || selectedEnvId, done: true },
                  { label: 'Avatar composition', detail: `${speakers.length} speaker${speakers.length !== 1 ? 's' : ''} ready`, done: avatarBuilt },
                  {
                    label: 'Rendering beats',
                    detail: state.status === 'rendering' ? `${Math.round(state.progress * 100)}% complete` : 'Waiting to start',
                    active: state.status === 'rendering',
                    done:   state.status === 'complete',
                    progress: state.status === 'rendering' ? state.progress : null,
                  },
                  { label: 'Assembly', detail: 'Concat · ambient bed · captions', done: state.status === 'complete' },
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
                  </div>
                ))}
                {state.status === 'failed' && state.error && (
                  <div className={styles.errorBox}>{state.error}</div>
                )}
                {generateError && !budgetState.hit && (
                  <div className={styles.errorBox} style={{ marginTop: '0.5rem' }}>
                    {generateError}
                    <button
                      style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                      onClick={() => setGenerateError(null)}
                    >✕</button>
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
                    >✕</button>
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
                      >⬇ Download</button>
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
                              {isPlaying ? '■' : '▶'}
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
                              ▶ Play
                            </button>
                          )}
                          {session.final_url && (
                            <button
                              className={styles.podcastActionBtn}
                              onClick={() => handleDownloadPodcast(session)}
                              title="Download MP4"
                            >
                              ⬇ Save
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
                              🗑 Del
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

          {/* SCRIPT TAB → Voice picker */}
          {activeTab === 'script' && (
            <div className={styles.glassCard} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div className={styles.cardLabel}>Voice</div>

              {/* ── My Voice clone card ── */}
              <div style={{
                padding: '0.7rem 0.8rem',
                background: 'rgba(99,102,241,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                boxShadow: '0 0 0 1px rgba(99,102,241,0.08)',
                borderRadius: 12,
                flexShrink: 0,
              }}>
                {voiceClone ? (
                  // Clone exists — show as selectable card
                  <div
                    className={`${styles.voiceCard} ${
                      speakers.some(s => s.voiceId === voiceClone.voiceId) ? styles.voiceCardSelected : ''
                    }`}
                    style={{ margin: 0 }}
                    onClick={() => {
                      const hostSpk = speakers.find(s => s.speakerId === 'user') || speakers[0];
                      if (hostSpk) handleSelectVoice(hostSpk.speakerId, voiceClone.voiceId);
                    }}
                  >
                    <div className={styles.voiceCardTop}>
                      <div className={styles.voiceCardName}>🎙 {voiceClone.cloneName}</div>
                    </div>
                    <div className={styles.voiceCardAccent}>your voice</div>
                    <div className={styles.voiceCardVibe}>Cloned from your recording</div>
                    <button
                      style={{
                        marginTop: '0.45rem', fontSize: '0.65rem', color: '#64748b',
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontFamily: 'Inter,sans-serif', padding: 0, textAlign: 'left',
                      }}
                      onClick={e => { e.stopPropagation(); handleCloneRecord(); }}
                    >
                      {cloningVoice
                        ? `⏹ Stop (${cloneRecSeconds}s)`
                        : cloneSubmitting ? '⏳ Cloning…' : '↺ Re-record voice'}
                    </button>
                  </div>
                ) : (
                  // No clone yet — show record prompt
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#e0e7ff', fontFamily: 'Syne,sans-serif', marginBottom: '0.3rem' }}>
                      🎙 Clone your voice
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'Inter,sans-serif', marginBottom: '0.5rem', lineHeight: 1.45 }}>
                      Record 30–60s of natural speech. We'll clone it for all your podcasts.
                    </div>
                    {cloningVoice && (
                      <div className={styles.recordingCounter} style={{ marginBottom: '0.4rem' }}>
                        <span className={styles.recordingDot} />
                        {`${Math.floor(cloneRecSeconds / 60)}:${String(cloneRecSeconds % 60).padStart(2, '0')}`}
                        <span style={{ opacity: 0.6, fontSize: '0.62rem' }}>— tap stop when done</span>
                      </div>
                    )}
                    {cloneError && (
                      <div style={{ fontSize: '0.68rem', color: '#EF4444', fontFamily: 'Inter,sans-serif', marginBottom: '0.4rem' }}>
                        {cloneError}
                      </div>
                    )}
                    <button
                      className={styles.actionChip}
                      onClick={handleCloneRecord}
                      disabled={cloneSubmitting}
                      style={cloningVoice ? { color: '#EF4444', borderColor: 'rgba(239,68,68,0.4)' } : {}}
                    >
                      {cloneSubmitting ? '⏳ Cloning…'
                        : cloningVoice ? `⏹ Stop recording (${cloneRecSeconds}s)`
                        : '⏺ Record my voice'}
                    </button>
                  </div>
                )}
              </div>

              {/* Gender filter toggle */}
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

              {/* Per-speaker sections */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0 }}>
                {(speakers.length === 0
                  ? [{ speakerId: 'user', displayName: 'You', role: 'host' }]
                  : speakers
                ).map(spk => {
                  const filteredVoices = voices.filter(v => v.gender === voiceGenderFilter);
                  const selectedVoiceId = spk.voiceId;
                  return (
                    <div key={spk.speakerId}>
                      <div style={{
                        fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em',
                        textTransform: 'uppercase', color: '#6366f1',
                        fontFamily: 'Inter,sans-serif', marginBottom: '0.35rem',
                      }}>
                        {spk.displayName} · {spk.role === 'host' ? 'Host' : 'Guest'}
                      </div>
                      {!selectedVoiceId && (
                        <div style={{
                          fontSize: '0.68rem', color: '#F59E0B', fontFamily: 'Inter,sans-serif',
                          marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem',
                        }}>
                          ⚠ Pick a voice below
                        </div>
                      )}
                      <div className={styles.voiceGrid}>
                        {filteredVoices.length === 0 && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'Inter,sans-serif' }}>
                            No voices loaded.
                          </div>
                        )}
                        {filteredVoices.map(v => {
                          const isSelected = selectedVoiceId === v.voiceId;
                          const isPlaying  = playingPreviewId === v.voiceId;
                          return (
                            <div
                              key={v.voiceId}
                              className={`${styles.voiceCard} ${isSelected ? styles.voiceCardSelected : ''}`}
                              onClick={() => handleSelectVoice(spk.speakerId, v.voiceId)}
                            >
                              <div className={styles.voiceCardTop}>
                                <div className={styles.voiceCardName}>{v.displayName}</div>
                                <button
                                  className={`${styles.voicePreviewBtn} ${isPlaying ? styles.voicePreviewBtnPlaying : ''}`}
                                  onClick={e => { e.stopPropagation(); handlePlayPreview(v.voiceId, v.previewUrl); }}
                                  title={isPlaying ? 'Stop' : 'Preview'}
                                >
                                  {isPlaying ? '■' : '▶'}
                                </button>
                              </div>
                              <div className={styles.voiceCardAccent}>{v.accent}</div>
                              <div className={styles.voiceCardVibe}>{v.vibe}</div>
                              {isSelected && <div className={styles.voiceCardCheck}><Ic.Check /></div>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
                            <span>🎙</span>
                            <span>{assignedVoice.displayName}</span>
                            <span style={{ color: '#6366f1', opacity: 0.7 }}>·</span>
                            <span style={{ color: '#94a3b8' }}>{assignedVoice.accent}</span>
                          </div>
                        ) : (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.35rem',
                            fontSize: '0.7rem', color: '#F59E0B', fontFamily: 'Inter,sans-serif',
                          }}>
                            ⚠ No voice selected
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
                            {playingPreviewId === assignedVoice.voiceId ? '■ Stop' : '▶ Preview'}
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
                            {isExpanded ? '✕ Close' : '↕ Change'}
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
                                    >
                                      {isPlaying ? '■' : '▶'}
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
                  className={`${styles.scriptModeBtn} ${envPanelMode === 'browse' && envMode === 'standard' ? styles.scriptModeBtnActive : ''}`}
                  onClick={() => { handleEnvModeSwitch('standard'); setEnvPanelMode('browse'); }}
                  title="1–2 person podcast">1–2 Guests</button>
                <button
                  className={`${styles.scriptModeBtn} ${envPanelMode === 'browse' && envMode === 'panel' ? styles.scriptModeBtnActive : ''}`}
                  onClick={() => { handleEnvModeSwitch('panel'); setEnvPanelMode('browse'); }}
                  title="3-person panel">Panel · 3</button>
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
                  title="Generate your own background"><Ic.ImageFrame /> Generate</button>
              </div>

              {envPanelMode === 'browse' ? (
                <>
                  {envsLoading ? (
                    <div className={styles.loadingHint}>Loading…</div>
                  ) : (
                    <div className={styles.envGrid}>
                      {environments
                        .filter(env => envMode === 'panel'
                          ? env.guestCapacity === 3
                          : (env.guestCapacity ?? 2) !== 3)
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
                                >
                                  ✕
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
                        <button className={styles.genEnvCapacityCard} onClick={() => handlePickGenCapacity(2)}>
                          <div className={styles.genEnvCapacityTitle}>2 Guests</div>
                          <div className={styles.genEnvCapacityDesc}>A cozy medium shot for you and one guest, side by side.</div>
                        </button>
                        <button className={styles.genEnvCapacityCard} onClick={() => handlePickGenCapacity(3)}>
                          <div className={styles.genEnvCapacityTitle}>3 Guests · Panel</div>
                          <div className={styles.genEnvCapacityDesc}>A wider panel shot with room for two guests alongside you.</div>
                        </button>
                      </div>
                    </>
                  )}

                  {/* Form — capacity picked, no preview yet */}
                  {genEnvCapacity !== null && !genEnvPreviewUrl && (
                    <>
                      <input
                        type="text"
                        className={styles.genNameInput}
                        placeholder="Name this background…"
                        value={genEnvDisplayName}
                        onChange={e => setGenEnvDisplayName(e.target.value)}
                      />
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
                          {genEnvLoading ? <><span className={styles.spin}><Ic.Spin /></span> Generating…</> : <><Ic.ImageFrame /> Generate</>}
                        </button>
                        <button className={styles.genSecondaryBtn} onClick={handleChangeGenFormat}>
                          ← Change format
                        </button>
                      </div>
                      {genEnvError && <div className={styles.errorBox}>{genEnvError}</div>}
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
          <button
            className={styles.generateBtn}
            onClick={handleGenerate}
            disabled={submitted || state.status === 'rendering' || state.status === 'complete' || !speakers.length || !lines.length}
          >
            {state.status === 'rendering'
              ? <><span className={styles.spin}><Ic.Spin /></span> Rendering…</>
              : state.status === 'complete' ? '✓ Complete'
              : '▶ Generate video'
            }
          </button>
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

    </div>
  );
}