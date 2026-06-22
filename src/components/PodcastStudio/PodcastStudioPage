// src/components/PodcastStudio/PodcastStudioPage.jsx
//
// Podcast Studio — full-page view, glassmorphic floating design.
// Matches the approved mockup (podcast_studio_mockup_v2.html).
//
// Three tabs: Avatar → Script → Generate
// Entry points:
//   A. Nav sidebar "Studio" item   → context=null  (solo mode)
//   B. Chat "🎙️" button            → context={character, chatHistory, topic}
//   C. PodcastIntentCard in chat   → context={character, chatHistory, topic, preloadedLines}
//
// Props:
//   context  {object|null}  — activePodcastContext from AppViewContext
//   onClose  {function}     — called when user clicks "Back to Chat" or ✕
//
// NAMING CONVENTIONS (Frontend ←→ Backend):
//   Hook state         Backend field         Notes
//   ─────────────────────────────────────────────────────────────
//   photoFile          photo (form field)    POST /api/podcast/photo/upload
//   photoUrl           photo_url             response from upload
//   avatarRefUrl       avatar_ref_url        POST /api/podcast/avatar/build response
//   avatarId           avatar_id             POST /api/podcast/avatar/build response
//   envId              env_id                selected environment
//   position           position              left|right|center
//   displayName        display_name          speaker name
//   characterRefUrl    avatar_ref_url        GET  /api/podcast/character/<key>/ref
//   characterVoiceId   voice_id              GET  /api/podcast/character/<key>/ref
//   lines[].speakerId  speaker_id            session payload
//   lines[].text       text                  session payload
//   lines[].audioUrl   audio_url             session payload
//   sessionId          session_id            POST /api/podcast/session response
//   sessionStatus      status                GET  /api/podcast/session/<id>
//   sessionProgress    progress              GET  /api/podcast/session/<id>
//   finalUrl           final_url             GET  /api/podcast/session/<id>

import React, {
  useState, useEffect, useRef, useCallback, useReducer
} from 'react';
import usePodcastStudio from '../../hooks/usePodcastStudio';
import styles from './PodcastStudioPage.module.css';

// ── SVG Icons — no Lucide, no emoji ─────────────────────────────────────────

const MicIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="9" y="2" width="6" height="11" rx="3"/>
    <path d="M5 10a7 7 0 0014 0" strokeLinecap="round"/>
    <line x1="12" y1="19" x2="12" y2="22" strokeLinecap="round"/>
    <line x1="8" y1="22" x2="16" y2="22" strokeLinecap="round"/>
    <path d="M3 8v1.5M6 6.5v3M21 8v1.5M18 6.5v3" strokeLinecap="round"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.8">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const SpinIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
  </svg>
);

const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
);

const RecordIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="6" fill="currentColor" opacity="0.3"/>
    <circle cx="12" cy="12" r="10"/>
  </svg>
);

const ImportIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const AddIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

// ── Speaker colours ──────────────────────────────────────────────────────────
const SPEAKER_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444'];

// ── Tab constants ────────────────────────────────────────────────────────────
const TABS = ['avatar', 'script', 'generate'];
const TAB_LABELS = { avatar: 'Avatar', script: 'Script', generate: 'Generate' };

// ── Line reducer ─────────────────────────────────────────────────────────────
const linesReducer = (state, action) => {
  switch (action.type) {
    case 'SET':    return action.lines;
    case 'ADD':    return [...state, { speakerId: action.speakerId, text: '', audioUrl: null, id: Date.now() }];
    case 'UPDATE': return state.map(l => l.id === action.id ? { ...l, ...action.patch } : l);
    case 'REMOVE': return state.filter(l => l.id !== action.id);
    case 'MOVE':   {
      const arr = [...state];
      const [item] = arr.splice(action.from, 1);
      arr.splice(action.to, 0, item);
      return arr;
    }
    default: return state;
  }
};

// ── Main component ───────────────────────────────────────────────────────────

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

  // ── Tab navigation ────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('avatar');
  const tabsDone = { avatar: false, script: false, generate: false };

  // ── Environment selection ─────────────────────────────────────────────────
  const [selectedEnvId, setSelectedEnvId] = useState('studio_tech');

  // ── Speakers ──────────────────────────────────────────────────────────────
  // speakers[]: { speakerId, displayName, avatarRefUrl, voiceId, voiceMode, gender, color, isCharacter }
  const [speakers, setSpeakers] = useState([]);

  // ── User avatar build ─────────────────────────────────────────────────────
  const [photoFile,    setPhotoFile]    = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoUrl,     setPhotoUrl]     = useState(null);
  const [avatarRefUrl, setAvatarRefUrl] = useState(null);
  const [avatarBuilt,  setAvatarBuilt]  = useState(false);
  const [buildingAvatar, setBuildingAvatar] = useState(false);
  const [buildError,   setBuildError]   = useState(null);
  const [dragOver,     setDragOver]     = useState(false);
  const fileInputRef = useRef(null);

  // ── Script lines ──────────────────────────────────────────────────────────
  const [lines, dispatchLines] = useReducer(linesReducer, []);
  const [topic, setTopic]      = useState('');
  const [generatingScript, setGeneratingScript] = useState(false);

  // ── Generate tab ──────────────────────────────────────────────────────────
  const [submitted, setSubmitted] = useState(false);

  // ── Initialise from context (chat entry point) ────────────────────────────
  useEffect(() => {
    if (!context) return;

    // Pre-fill topic
    if (context.topic) setTopic(context.topic);

    // Pre-load AI character as guest speaker
    if (context.character) {
      const charKey = context.characterKey || context.character?.key;
      if (charKey) {
        getCharacterRef(charKey).then(ref => {
          setSpeakers(prev => {
            const already = prev.find(s => s.speakerId === charKey);
            if (already) return prev;
            return [...prev, {
              speakerId:    charKey,
              displayName:  ref.characterDisplayName || context.character?.name || 'Guest',
              avatarRefUrl: ref.characterRefUrl,
              voiceId:      ref.characterVoiceId,
              voiceMode:    'tts',
              gender:       'neutral',
              color:        SPEAKER_COLORS[1],
              isCharacter:  true,
              role:         'guest',
            }];
          });
        }).catch(e => console.warn('⚠️ Could not load character ref:', e.message));
      }
    }

    // Pre-load lines from chat
    if (context.preloadedLines?.length) {
      dispatchLines({
        type: 'SET',
        lines: context.preloadedLines.map((l, i) => ({
          ...l,
          id: Date.now() + i,
          audioUrl: null,
        })),
      });
    }
  }, [context, getCharacterRef]);

  // ── File handling — mirrors ScanLegendModal ───────────────────────────────
  const processFile = useCallback((file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setBuildError('Please upload a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setBuildError('Photo must be under 10MB.');
      return;
    }
    setBuildError(null);
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = e => setPhotoPreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback(e => {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  }, [processFile]);

  // ── Build avatar ──────────────────────────────────────────────────────────
  const handleBuildAvatar = useCallback(async () => {
    if (!photoFile) return;
    setBuildingAvatar(true);
    setBuildError(null);
    try {
      // 1. Upload photo → photo_url
      const url = await uploadPhoto(photoFile);
      setPhotoUrl(url);

      // 2. Build avatar → avatar_ref_url
      const displayName = context?.user?.displayName || 'You';
      const result = await buildAvatar({
        photoUrl:    url,
        displayName: displayName,
        envId:       selectedEnvId,
        position:    'right',
      });
      setAvatarRefUrl(result.avatarRefUrl);
      setAvatarBuilt(true);

      // Add user as host speaker
      setSpeakers(prev => {
        const already = prev.find(s => s.speakerId === 'user');
        if (already) return prev.map(s => s.speakerId === 'user'
          ? { ...s, avatarRefUrl: result.avatarRefUrl }
          : s
        );
        return [{
          speakerId:    'user',
          displayName:  displayName,
          avatarRefUrl: result.avatarRefUrl,
          voiceId:      '21m00Tcm4TlvDq8ikWAM', // Rachel default
          voiceMode:    'tts',
          gender:       'female',
          color:        SPEAKER_COLORS[0],
          isCharacter:  false,
          role:         'host',
        }, ...prev];
      });

    } catch (e) {
      setBuildError(e.message || 'Avatar build failed. Please try again.');
    } finally {
      setBuildingAvatar(false);
    }
  }, [photoFile, uploadPhoto, buildAvatar, selectedEnvId, context]);

  // ── Submit session ────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!speakers.length || !lines.length) return;
    setSubmitted(true);
    try {
      await createSession({
        environmentId: selectedEnvId,
        speakers: speakers.map((s, i) => ({
          speakerId:    s.speakerId || `s${i + 1}`,
          displayName:  s.displayName,
          avatarRefUrl: s.avatarRefUrl,
          voiceMode:    s.voiceMode,
          voiceId:      s.voiceId,
          gender:       s.gender,
        })),
        lines: lines.map(l => ({
          speakerId: l.speakerId,
          text:      l.text      || '',
          audioUrl:  l.audioUrl  || null,
        })),
      });
    } catch (e) {
      setSubmitted(false);
    }
  }, [speakers, lines, selectedEnvId, createSession]);

  // ── Tab done state ────────────────────────────────────────────────────────
  tabsDone.avatar   = avatarBuilt || speakers.some(s => s.isCharacter && s.avatarRefUrl);
  tabsDone.script   = lines.length > 0;
  tabsDone.generate = state.status === 'complete';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.scene}>

      {/* ── Floating Header ── */}
      <div className={styles.header}>
        <div className={styles.brand}>
          Awake<span>Verse</span>
        </div>
        <div className={styles.headerCenter}>
          <span className={styles.headerDot} />
          Podcast Studio
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close studio">✕</button>
      </div>

      {/* ── Middle row ── */}
      <div className={styles.middle}>

        {/* Floating sidebar — icon strip, expands on hover */}
        <nav className={styles.sidebar}>
          <div className={styles.sidebarLogo}>AV</div>
          {[
            { label: 'Chat',      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
            { label: 'Discover',  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg> },
            { label: 'Story',     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> },
            { label: 'Dialogue', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
          ].map(item => (
            <button key={item.label} className={styles.navItem} onClick={onClose}>
              {item.icon}
              <span className={styles.navLabel}>{item.label}</span>
            </button>
          ))}
          <button className={`${styles.navItem} ${styles.navActive}`}>
            <MicIcon />
            <span className={styles.navLabel}>Studio</span>
          </button>
          <div className={styles.navSpacer} />
          <button className={styles.navItem} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            <span className={styles.navLabel}>Workspace</span>
          </button>
        </nav>

        {/* ── Floating Main Panel ── */}
        <div className={styles.main}>

          {/* Studio top bar */}
          <div className={styles.studioTopbar}>
            <div>
              <div className={styles.studioLabel}>Create your video</div>
              <div className={styles.studioTitle}>Podcast Studio</div>
            </div>
            <button className={styles.studioClose} onClick={onClose} aria-label="Close">✕</button>
          </div>

          {/* Context pill — shown when entering from chat */}
          {context?.topic && (
            <div className={styles.contextPill}>
              <span className={styles.ctxDot} />
              {context.character
                ? `From chat with ${context.character.name} · "${context.topic}"`
                : `Topic: "${context.topic}"`
              }
            </div>
          )}

          {/* Tabs */}
          <div className={styles.tabs}>
            {TABS.map((tab, i) => (
              <button
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                <span className={`${styles.tabNum} ${tabsDone[tab] ? styles.tabNumDone : ''}`}>
                  {tabsDone[tab] ? <CheckIcon /> : i + 1}
                </span>
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>

          {/* ── AVATAR TAB ── */}
          {activeTab === 'avatar' && (
            <div className={styles.tabBody}>
              <div className={styles.avatarCol}>

                {/* Photo upload */}
                <div className={styles.glassCard}>
                  <div className={styles.cardLabel}>Your avatar</div>
                  {avatarBuilt && avatarRefUrl ? (
                    <div className={styles.avatarBuiltWrap}>
                      <img
                        src={avatarRefUrl}
                        alt="Your avatar"
                        className={styles.avatarPreviewImg}
                      />
                      <div className={styles.avatarBuiltBadge}>
                        <CheckIcon /> Avatar ready
                      </div>
                      <button
                        className={styles.rebuildBtn}
                        onClick={() => { setAvatarBuilt(false); setPhotoFile(null); setPhotoPreview(null); }}
                      >
                        Change photo
                      </button>
                    </div>
                  ) : (
                    <>
                      <div
                        className={`${styles.uploadZone} ${dragOver ? styles.uploadZoneDrag : ''} ${photoPreview ? styles.uploadZoneHasFile : ''}`}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={onDrop}
                        onClick={() => !photoPreview && fileInputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                        aria-label="Upload photo"
                      >
                        {photoPreview ? (
                          <div className={styles.photoPreviewWrap}>
                            <img src={photoPreview} alt="Preview" className={styles.photoPreview} />
                            <button
                              className={styles.changePhotoBtn}
                              onClick={e => { e.stopPropagation(); setPhotoFile(null); setPhotoPreview(null); fileInputRef.current?.click(); }}
                            >
                              Change photo
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className={styles.uploadRing}><UploadIcon /></div>
                            <p>Upload your photo<br /><small>Baked into your chosen environment</small></p>
                            <button
                              className={styles.browseBtn}
                              onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                            >
                              Browse files
                            </button>
                            <small>JPEG, PNG, WebP · Max 10MB</small>
                          </>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        style={{ display: 'none' }}
                        onChange={e => processFile(e.target.files[0])}
                      />
                      {buildError && (
                        <div className={styles.errorBox}>{buildError}</div>
                      )}
                      {photoFile && !avatarBuilt && (
                        <button
                          className={styles.buildBtn}
                          onClick={handleBuildAvatar}
                          disabled={buildingAvatar}
                        >
                          {buildingAvatar
                            ? <><span className={styles.spin}><SpinIcon /></span> Building avatar…</>
                            : '✦ Build avatar'
                          }
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Speakers */}
                <div className={styles.glassCard}>
                  <div className={styles.cardLabel}>Speakers in this session</div>
                  {speakers.length === 0 && (
                    <div className={styles.emptySpk}>
                      Upload your photo above to add yourself as host.
                      {context?.character && ' Your chat guest will appear automatically.'}
                    </div>
                  )}
                  {speakers.map((spk, i) => (
                    <div key={spk.speakerId} className={styles.speakerRow}>
                      <div
                        className={styles.spAvatar}
                        style={{ background: `linear-gradient(135deg, ${spk.color}, ${spk.color}aa)` }}
                      >
                        {spk.displayName?.slice(0, 2).toUpperCase()}
                      </div>
                      <div className={styles.spInfo}>
                        <div className={styles.spName}>{spk.displayName}{!spk.isCharacter && ' (You)'}</div>
                        <div className={styles.spRole}>
                          {spk.isCharacter ? 'AI character' : 'Photo upload'} · {spk.voiceMode === 'tts' ? 'TTS voice' : 'Record mode'}
                        </div>
                      </div>
                      <span className={`${styles.spBadge} ${spk.role === 'host' ? styles.badgeHost : styles.badgeGuest}`}>
                        {spk.role === 'host' ? 'Host' : 'Guest'}
                      </span>
                      {spk.avatarRefUrl && (
                        <div className={styles.readyTick}><CheckIcon /></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Environment picker */}
              <div className={styles.envCol}>
                <div className={`${styles.glassCard} ${styles.envCard}`}>
                  <div className={styles.cardLabel}>Environment</div>
                  {envsLoading ? (
                    <div className={styles.envsLoading}>Loading environments…</div>
                  ) : (
                    <div className={styles.envGrid}>
                      {environments.map(env => (
                        <div
                          key={env.envId}
                          className={`${styles.envThumb} ${selectedEnvId === env.envId ? styles.envThumbSelected : ''}`}
                          onClick={() => setSelectedEnvId(env.envId)}
                          title={env.name}
                        >
                          {env.previewUrl ? (
                            <img src={env.previewUrl} alt={env.name} className={styles.envThumbImg} />
                          ) : (
                            <div className={styles.envThumbPlaceholder} />
                          )}
                          <span className={styles.envThumbLabel}>{env.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className={styles.envHint}>
                    {environments.length} environments available. Avatar baked into chosen setting.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── SCRIPT TAB ── */}
          {activeTab === 'script' && (
            <div className={styles.tabBody}>
              <div className={styles.scriptCol}>

                {/* Topic + AI generate */}
                <div className={styles.topicWrap}>
                  <input
                    className={styles.topicInput}
                    placeholder="Topic: e.g. The future of AI in Africa…"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                  />
                  <button
                    className={styles.aiGenBtn}
                    disabled={!topic.trim() || generatingScript}
                    onClick={() => {
                      // TODO: wire to LLM intent detection in Step 7
                      console.log('✦ Generate script from topic:', topic);
                    }}
                  >
                    {generatingScript ? 'Generating…' : '✦ Generate script'}
                  </button>
                </div>

                {/* Import + add */}
                <div className={styles.importBar}>
                  <button
                    className={styles.importBtn}
                    onClick={() => {
                      if (!context?.chatHistory?.length) return;
                      // Import chat messages as lines, alternating speakers
                      const msgs = context.chatHistory.slice(-8); // last 8 messages
                      const imported = msgs
                        .filter(m => m.content?.trim())
                        .map((m, i) => ({
                          id:        Date.now() + i,
                          speakerId: m.role === 'user'
                            ? (speakers.find(s => !s.isCharacter)?.speakerId || 'user')
                            : (speakers.find(s => s.isCharacter)?.speakerId  || 'guest'),
                          text:      m.content,
                          audioUrl:  null,
                        }));
                      dispatchLines({ type: 'SET', lines: imported });
                    }}
                  >
                    <ImportIcon /> Import from chat
                  </button>
                  <button
                    className={styles.importBtn}
                    onClick={() => dispatchLines({
                      type:      'ADD',
                      speakerId: speakers[0]?.speakerId || 'user',
                    })}
                  >
                    <AddIcon /> Add line
                  </button>
                </div>

                {/* Line list */}
                <div className={`${styles.glassCard} ${styles.lineListCard}`}>
                  {lines.length === 0 && (
                    <div className={styles.emptyLines}>
                      No lines yet — generate from a topic, import from chat, or add manually.
                    </div>
                  )}
                  {lines.map((line, i) => {
                    const spk = speakers.find(s => s.speakerId === line.speakerId) || speakers[0];
                    return (
                      <div key={line.id} className={styles.lineItem}>
                        <div
                          className={styles.lineDot}
                          style={{ background: spk?.color || '#6366F1' }}
                        />
                        <div className={styles.lineContent}>
                          <div className={styles.lineTag} style={{ color: spk?.color || '#818CF8' }}>
                            {spk?.displayName || 'Speaker'} — {spk?.role === 'host' ? 'Host' : 'Guest'}
                          </div>
                          <textarea
                            className={styles.lineTextarea}
                            value={line.text}
                            placeholder="Type the line…"
                            onChange={e => dispatchLines({ type: 'UPDATE', id: line.id, patch: { text: e.target.value } })}
                            rows={2}
                          />
                          {line.audioUrl && (
                            <div className={styles.audioIndicator}>
                              🎤 Audio recorded
                            </div>
                          )}
                        </div>
                        <div className={styles.lineActions}>
                          <button className={styles.lineBtn} title="Record audio">
                            <RecordIcon />
                          </button>
                          <button
                            className={styles.lineBtn}
                            title="Remove line"
                            onClick={() => dispatchLines({ type: 'REMOVE', id: line.id })}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    className={styles.addLineBtn}
                    onClick={() => dispatchLines({
                      type: 'ADD',
                      speakerId: speakers[0]?.speakerId || 'user',
                    })}
                  >
                    <AddIcon /> Add line
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── GENERATE TAB ── */}
          {activeTab === 'generate' && (
            <div className={styles.tabBody}>
              <div className={styles.genCol}>
                <div className={styles.glassCard}>
                  <div className={styles.cardLabel}>Render progress</div>

                  {/* Step indicators */}
                  {[
                    {
                      label:  'Environment plate',
                      detail: environments.find(e => e.envId === selectedEnvId)?.name || selectedEnvId,
                      done:   true,
                    },
                    {
                      label:  'Avatar composition',
                      detail: `${speakers.length} speaker${speakers.length !== 1 ? 's' : ''} ready`,
                      done:   avatarBuilt,
                    },
                    {
                      label:  'Rendering beats',
                      detail: state.status === 'rendering'
                        ? `${Math.round(state.progress * 100)}% complete`
                        : 'Waiting to start',
                      active: state.status === 'rendering',
                      done:   state.status === 'complete',
                      progress: state.status === 'rendering' ? state.progress : null,
                    },
                    {
                      label:  'Assembly',
                      detail: 'Concat · ambient bed · captions',
                      done:   state.status === 'complete',
                    },
                  ].map((step, i) => (
                    <div key={i} className={styles.progStep}>
                      <div className={`${styles.stepIcon} ${
                        step.done   ? styles.stepDone   :
                        step.active ? styles.stepActive  :
                                      styles.stepPending
                      }`}>
                        {step.done   ? <CheckIcon /> :
                         step.active ? <span className={styles.spin}><SpinIcon /></span> :
                                       i + 1}
                      </div>
                      <div className={styles.stepInfo}>
                        <div className={styles.stepName}>{step.label}</div>
                        <div className={styles.stepDetail}>{step.detail}</div>
                        {step.progress !== null && step.progress !== undefined && (
                          <div className={styles.pbarWrap}>
                            <div className={styles.pbarFill} style={{ width: `${step.progress * 100}%` }} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Error */}
                  {state.status === 'failed' && state.error && (
                    <div className={styles.errorBox}>{state.error}</div>
                  )}
                </div>
              </div>

              {/* Preview */}
              <div className={styles.prevCol}>
                <div className={`${styles.glassCard} ${styles.previewCard}`}>
                  <div className={styles.cardLabel}>Preview</div>
                  {state.status === 'complete' && state.activeJob?.finalUrl ? (
                    <video
                      src={state.activeJob.finalUrl}
                      controls
                      className={styles.videoPlayer}
                    />
                  ) : (
                    <div className={styles.videoPlaceholder}>
                      <div className={styles.videoPlaceholderIcon}><PlayIcon /></div>
                      <span>
                        {state.status === 'rendering' ? 'Rendering in progress…' : 'Video will appear here'}
                      </span>
                    </div>
                  )}
                  <div className={styles.sessionMeta}>
                    <div className={styles.sessionMetaLabel}>Session</div>
                    <div className={styles.sessionMetaValue}>
                      {speakers.map(s => s.displayName).join(' + ')} · {lines.length} lines · {environments.find(e => e.envId === selectedEnvId)?.name || selectedEnvId}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Floating Footer ── */}
      <div className={styles.footer}>
        {/* Back button */}
        {activeTab === 'avatar' ? (
          <button className={styles.backBtn} onClick={onClose}>← Back to chat</button>
        ) : (
          <button
            className={styles.backBtn}
            onClick={() => setActiveTab(TABS[TABS.indexOf(activeTab) - 1])}
          >
            ← {TAB_LABELS[TABS[TABS.indexOf(activeTab) - 1]]}
          </button>
        )}

        {/* Step pips */}
        <div className={styles.stepPips}>
          {TABS.map((tab, i) => (
            <div
              key={tab}
              className={`${styles.pip} ${
                tabsDone[tab]    ? styles.pipDone   :
                activeTab === tab ? styles.pipActive  :
                                    ''
              }`}
              onClick={() => setActiveTab(tab)}
            />
          ))}
        </div>

        {/* Forward / generate button */}
        {activeTab === 'generate' ? (
          <button
            className={styles.generateBtn}
            onClick={handleGenerate}
            disabled={
              submitted ||
              state.status === 'rendering' ||
              state.status === 'complete' ||
              !speakers.length ||
              !lines.length
            }
          >
            {state.status === 'rendering' ? (
              <><span className={styles.spin}><SpinIcon /></span> Rendering…</>
            ) : state.status === 'complete' ? (
              '✓ Complete'
            ) : (
              '▶ Generate video'
            )}
          </button>
        ) : (
          <button
            className={styles.nextBtn}
            onClick={() => setActiveTab(TABS[TABS.indexOf(activeTab) + 1])}
          >
            Continue to {TAB_LABELS[TABS[TABS.indexOf(activeTab) + 1]]} →
          </button>
        )}
      </div>

    </div>
  );
}