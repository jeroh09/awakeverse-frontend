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
import styles from './PodcastStudioPage.module.css';

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
};

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
    uploadPhoto,
    buildAvatar,
    getCharacterRef,
    uploadAudio,
    createSession,
    resetStudio,
  } = usePodcastStudio();

  // ── Navigation ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('avatar');

  // ── Environment ───────────────────────────────────────────────────────────
  const [selectedEnvId, setSelectedEnvId] = useState('studio_tech');

  // ── Speakers ──────────────────────────────────────────────────────────────
  const [speakers, setSpeakers] = useState([]);

  // ── Avatar build ──────────────────────────────────────────────────────────
  const [photoFile,     setPhotoFile]     = useState(null);
  const [photoPreview,  setPhotoPreview]  = useState(null);
  const [avatarRefUrl,  setAvatarRefUrl]  = useState(null);
  const [avatarBuilt,   setAvatarBuilt]   = useState(false);
  const [buildStage,    setBuildStage]    = useState(null); // null | 'uploading'|'composing'|'baking'|'done'
  const [buildError,    setBuildError]    = useState(null);
  const [avatarDragOver, setAvatarDragOver] = useState(false);
  const fileInputRef     = useRef(null);

  // ── Custom guest (real person, user-provided photo) ───────────────────────
  const [guestFile,      setGuestFile]      = useState(null);
  const [guestPreview,   setGuestPreview]   = useState(null);
  const [guestName,      setGuestName]      = useState('');
  const [guestBuilding,  setGuestBuilding]  = useState(false);
  const [guestBuilt,     setGuestBuilt]     = useState(false);
  const [guestError,     setGuestError]     = useState(null);
  const guestFileRef = useRef(null);

  // ── Script ────────────────────────────────────────────────────────────────
  const [lines, dispatchLines] = useReducer(linesReducer, []);
  const [topic, setTopic]      = useState('');
  const linesInitialised = useRef(false);  // guard: only SET lines once on mount

  // ── My Podcasts ───────────────────────────────────────────────────────────
  const [sessions,        setSessions]        = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // ── Generate ──────────────────────────────────────────────────────────────
  const [submitted, setSubmitted] = useState(false);
  const [dragIdx,   setDragIdx]   = useState(null);  // index being dragged
  const [dragOver,  setDragOver_l] = useState(null);  // index being hovered

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
        voiceId:      null,
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
    if (!speakers.length || !lines.length) return;

    // Debug: log exactly what speakers and lines are being sent
    console.log('🎙️ Generate — speakers:', JSON.stringify(speakers.map(s => ({ id: s.speakerId, name: s.displayName, hasAvatar: !!s.avatarRefUrl }))));
    console.log('🎙️ Generate — lines:', JSON.stringify(lines.map(l => ({ id: l.speakerId, text: l.text?.slice(0,30) }))));

    // Block if host lines exist but no user avatar built
    const hasHostLines   = lines.some(l => l.speakerId === 'user');
    const hasUserSpeaker = speakers.some(s => s.speakerId === 'user');
    if (hasHostLines && !hasUserSpeaker) {
      setBuildError('Please build your avatar first — go to the Avatar tab to upload your photo.');
      setActiveTab('avatar');
      return;
    }

    setSubmitted(true);
    try {
      await createSession({
        environmentId: selectedEnvId,
        speakers: speakers.map((s, i) => ({
          speakerId: s.speakerId || `s${i+1}`, displayName: s.displayName,
          avatarRefUrl: s.avatarRefUrl, voiceMode: s.voiceMode,
          voiceId: s.voiceId, gender: s.gender,
        })),
        // Only send lines that have text AND whose speakerId matches a speaker
        lines: lines
          .filter(l => (l.text || '').trim() || l.audioUrl)
          .map(l => ({ speakerId: l.speakerId, text: l.text || '', audioUrl: l.audioUrl || null })),
      });
      // Refresh My Podcasts after completion
      if (state.status === 'complete') loadSessions();
    } catch (e) { setSubmitted(false); }
  }, [speakers, lines, selectedEnvId, createSession, state.status, loadSessions]);

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

              {/* Hidden file input — always mounted so ref is never null */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={e => { processFile(e.target.files[0]); e.target.value = ''; }}
              />

              {/* Build stage fullscreen overlay */}
              {buildStage && buildStage !== 'done' && (
                <div className={styles.buildOverlay}>
                  <div className={styles.buildOverlayCard}>
                    <div className={styles.buildPreviewRing}>
                      {photoPreview && <img src={photoPreview} alt="Building" className={styles.buildPreviewImg} />}
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

              {/* Speaker cards */}
              <div className={styles.speakerCards}>

                {/* User card */}
                <div className={styles.glassCard}>
                  <div className={styles.cardLabel}>Your avatar</div>

                  {avatarBuilt && avatarRefUrl ? (
                    <div className={styles.builtWrap}>
                      <img src={avatarRefUrl} alt="Your avatar" className={styles.builtImg} />
                      <div className={styles.builtBadge}><Ic.Check /> Avatar ready</div>
                      <button className={styles.rebuildLink} onClick={() => { setAvatarBuilt(false); setBuildStage(null); setPhotoFile(null); setPhotoPreview(null); }}>
                        Change photo
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Saved avatar quick-use — user picks env first, then clicks Build */}
                      {avatars?.length > 0 && !photoFile && !avatarBuilt && (
                        <div className={styles.savedAvatarBanner}>
                          <img src={avatars[0].avatarRefUrl} alt="Saved avatar" className={styles.savedAvatarThumb} />
                          <div className={styles.savedAvatarInfo}>
                            <div className={styles.savedAvatarLabel}>You have a saved avatar</div>
                            <div className={styles.savedAvatarSub}>Pick a background → click Build to use it</div>
                          </div>
                          <button
                            className={styles.useSavedBtn}
                            onClick={() => {
                              // Use saved photo URL to re-bake into selected env
                              const saved = avatars[0];
                              if (saved.photoUrl) {
                                fetch(saved.photoUrl)
                                  .then(r => r.blob())
                                  .then(blob => {
                                    const file = new File([blob], 'saved_photo.jpg', { type: 'image/jpeg' });
                                    processFile(file);
                                  })
                                  .catch(() => console.warn('Could not load saved photo'));
                              }
                            }}
                          >
                            Use saved
                          </button>
                        </div>
                      )}
                      <div
                        className={`${styles.dropZone} ${avatarDragOver ? styles.dropZoneDrag : ''}`}
                        onDragOver={e => { e.preventDefault(); setAvatarDragOver(true); }}
                        onDragLeave={() => setAvatarDragOver(false)}
                        onDrop={onAvatarDrop}
                        onClick={() => !photoPreview && fileInputRef.current?.click()}
                        role="button" tabIndex={0}
                      >
                        {photoPreview ? (
                          <div className={styles.photoPreviewWrap}>
                            <img src={photoPreview} alt="Preview" className={styles.photoPreview} />
                            <button className={styles.changePhotoBtn} onClick={e => { e.stopPropagation(); setPhotoFile(null); setPhotoPreview(null); fileInputRef.current?.click(); }}>
                              Change
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className={styles.dropIcon}><Ic.Upload /></div>
                            <p>Drop your photo here</p>
                            <button className={styles.browseBtn} onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                              Browse files
                            </button>
                            <small>JPEG, PNG, WebP · Max 10MB</small>
                          </>
                        )}
                      </div>
                      {/* file input moved to top of avatarPage — always mounted */}
                      {buildError && <div className={styles.errorBox}>{buildError}</div>}
                      {photoFile && (
                        <button className={styles.buildBtn} onClick={handleBuildAvatar} disabled={!!buildStage}>
                          {buildStage ? <><span className={styles.spin}><Ic.Spin /></span> Building…</> : '✦ Build my avatar'}
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* AI character cards */}
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

                {/* Custom guest speaker cards (real person, user-provided photo) */}
                {speakers.filter(s => !s.isCharacter && s.speakerId !== 'user').map(spk => (
                  <div key={spk.speakerId} className={styles.glassCard}>
                    <div className={styles.cardLabel}>Real Guest</div>
                    <div className={styles.charCard}>
                      <div className={styles.charAvatar} style={{ background: `linear-gradient(135deg, ${spk.color}, ${spk.color}88)` }}>
                        {spk.displayName?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className={styles.charName}>{spk.displayName}</div>
                        <div className={styles.charRole}>Real person · TTS voice</div>
                      </div>
                      <span className={`${styles.badge} ${styles.badgeGuest}`}>Guest</span>
                      {spk.avatarRefUrl && <div className={styles.readyTick}><Ic.Check /></div>}
                    </div>
                  </div>
                ))}

                {/* Custom guest — lightweight add (no build step, worker handles at render) */}
                {!speakers.some(s => s.isCharacter) && (
                  <div className={styles.glassCard}>
                    <input
                      ref={guestFileRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setGuestFile(f);
                        const reader = new FileReader();
                        reader.onload = ev => setGuestPreview(ev.target.result);
                        reader.readAsDataURL(f);
                        setGuestBuilt(false);
                      }}
                    />

                    {guestBuilt ? (
                      /* Guest added — show summary card */
                      <div className={styles.charCard}>
                        {guestPreview && (
                          <img src={guestPreview} alt={guestName}
                            style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                        )}
                        <div>
                          <div className={styles.charName}>{guestName}</div>
                          <div className={styles.charRole}>Real person · guest</div>
                        </div>
                        <span className={`${styles.badge} ${styles.badgeGuest}`}>Guest</span>
                        <button className={styles.rebuildLink} onClick={() => {
                          setGuestBuilt(false); setGuestFile(null);
                          setGuestPreview(null); setGuestName('');
                          setSpeakers(prev => prev.filter(s => s.role !== 'guest' || s.isCharacter));
                        }}>Remove</button>
                      </div>
                    ) : (
                      /* Add guest form */
                      <div className={styles.addGuestForm}>
                        <input
                          className={styles.guestNameInput}
                          placeholder="Guest name…"
                          value={guestName}
                          onChange={e => setGuestName(e.target.value)}
                        />
                        <button
                          className={styles.addGuestPhotoBtn}
                          onClick={() => guestFileRef.current?.click()}
                        >
                          {guestPreview
                            ? <><img src={guestPreview} alt="Guest"
                                style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', marginRight: 6 }} />
                                Change photo</>
                            : <><Ic.Upload /> Upload photo</>
                          }
                        </button>
                        {guestError && <div className={styles.errorBox}>{guestError}</div>}
                        {guestFile && guestName.trim() && (
                          <button className={styles.actionChip} onClick={handleAddGuest}>
                            <Ic.Add /> Add guest
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Empty state */}
                {speakers.length === 0 && !photoPreview && (
                  <div className={styles.emptyHint}>
                    Upload your photo above to get started.
                    {context?.character && ` ${context.character.name} will join as your guest.`}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════ SCRIPT TAB ════ */}
          {activeTab === 'script' && (
            <div className={styles.scriptPage}>

              {/* Topic + AI generate */}
              <div className={styles.topicBar}>
                <div className={styles.topicInputWrap}>
                  <input
                    className={styles.topicInput}
                    placeholder="Topic: e.g. The future of AI in Africa…"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                  />
                  <button className={styles.aiBtn} disabled={!topic.trim()}>
                    ✦ Generate
                  </button>
                </div>
                <div className={styles.scriptActions}>
                  <button className={styles.actionChip} onClick={() => {
                    if (!context?.chatHistory?.length) return;
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
                  <button className={styles.actionChip} onClick={() => dispatchLines({ type: 'ADD', speakerId: speakers[0]?.speakerId || 'user' })}>
                    <Ic.Add /> Add line
                  </button>
                </div>
              </div>

              {/* Lines */}
              <div className={styles.lineScroll}>
                {lines.length === 0 && (
                  <div className={styles.emptyLines}>
                    No lines yet — generate from topic, import from chat, or add manually.
                  </div>
                )}
                {lines.map((line, i) => {
                  // Read display info directly from line — no speakers[] lookup.
                  // speakers[] is only used at session submit for avatar/voice.
                  const isHost    = line.speakerId === 'user';
                  const lineColor = isHost ? '#6366F1' : '#10B981';
                  const lineName  = line.displayName || (isHost ? 'You' : 'Guest');
                  const lineRole  = isHost ? 'Host' : 'Guest';
                  return (
                    <div
                    key={line.id}
                    className={`${styles.lineCard} ${dragOver === i ? styles.lineCardDragOver : ''}`}
                    draggable
                    onDragStart={e => handleDragStart(e, i)}
                    onDragOver={e => handleDragOver(e, i)}
                    onDrop={e => handleDrop(e, i)}
                    onDragEnd={handleDragEnd}
                  >
                      <div className={styles.dragHandle} title="Drag to reorder">
                      <Ic.Drag />
                    </div>
                    <div className={styles.lineDot} style={{ background: lineColor }} />
                      <div className={styles.lineBody}>
                        <div className={styles.lineTag} style={{ color: lineColor }}>
                          {lineName} · {lineRole}
                        </div>
                        <textarea
                          className={styles.lineTextarea}
                          value={line.text}
                          placeholder="Type the line…"
                          onChange={e => dispatchLines({ type: 'UPDATE', id: line.id, patch: { text: e.target.value } })}
                          rows={2}
                        />
                        {line.audioUrl && <div className={styles.audioTag}>🎤 Recorded</div>}
                      </div>
                      <div className={styles.lineButtons}>
                        <button className={styles.lineBtn} title="Record"><Ic.Record /></button>
                        <button className={styles.lineBtn} title="Delete" onClick={() => dispatchLines({ type: 'REMOVE', id: line.id })}><Ic.Trash /></button>
                      </div>
                    </div>
                  );
                })}
                <button className={styles.addLineBtn} onClick={() => dispatchLines({ type: 'ADD', speakerId: speakers[0]?.speakerId || 'user' })}>
                  <Ic.Add /> Add line
                </button>
              </div>
            </div>
          )}

          {/* ════ GENERATE TAB ════ */}
          {activeTab === 'generate' && (
            <div className={styles.generatePage}>

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
              <div className={styles.podcastGrid}>
                {sessions.map(session => (
                  <div key={session.session_id} className={styles.podcastCard}>
                    {session.final_url ? (
                      <video src={session.final_url} className={styles.podcastThumb} muted />
                    ) : (
                      <div className={styles.podcastThumbPlaceholder}><Ic.Video /></div>
                    )}
                    <div className={styles.podcastMeta}>
                      <div className={styles.podcastSpeakers}>
                        {session.speakers?.map(s => s.display_name).join(' + ') || 'Unknown'}
                      </div>
                      <div className={styles.podcastDetails}>
                        {fmtDate(session.created_at)}
                        {session.total_seconds && ` · ${fmtDuration(session.total_seconds)}`}
                      </div>
                    </div>
                    {session.final_url && (
                      <a href={session.final_url} target="_blank" rel="noreferrer" className={styles.podcastPlayBtn}>
                        <Ic.Play /> Play
                      </a>
                    )}
                  </div>
                ))}
              </div>
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

        {/* ── RIGHT: environment picker (always visible) ── */}
        <div className={styles.envPanel}>
          <div className={styles.glassCard} style={{ height: '100%' }}>
            <div className={styles.cardLabel}>Studio Backgrounds</div>
            {envsLoading ? (
              <div className={styles.loadingHint}>Loading…</div>
            ) : (
              <div className={styles.envGrid}>
                {environments.map(env => (
                  <div
                    key={env.envId}
                    className={`${styles.envCardWrap} ${selectedEnvId === env.envId ? styles.envCardWrapSelected : ''}`}
                    onClick={() => activeTab !== 'generate' && setSelectedEnvId(env.envId)}
                  >
                    <div className={`${styles.envCard} ${selectedEnvId === env.envId ? styles.envCardSelected : ''} ${activeTab === 'generate' ? styles.envCardReadOnly : ''}`}>
                      {env.previewUrl
                        ? <img src={env.previewUrl} alt={env.name} className={styles.envImg} />
                        : <div className={styles.envPlaceholder} />
                      }
                    </div>
                    <span className={styles.envName}>{env.name}</span>
                  </div>
                ))}
              </div>
            )}
            {selectedEnv && (
              <div className={styles.envSelected}>
                Selected: <strong>{selectedEnv.name}</strong>
              </div>
            )}
          </div>
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