// src/hooks/usePodcastStudio.js
//
// Podcast Studio state + API calls.
// Mirrors useContentGeneration.js exactly — same state shape, same polling
// pattern, same fetch-with-CSRF approach. No separate API file layer.
//
// NAMING CONVENTIONS (Frontend Hook ←→ Backend Response):
//
//   Hook state / param      Backend field         Endpoint
//   ─────────────────────────────────────────────────────────────────────────
//   environments[].envId    env_id                GET  /api/podcast/environments
//   environments[].name     name                  GET  /api/podcast/environments
//   environments[].previewUrl preview_url         GET  /api/podcast/environments
//   environments[].displayOrder display_order     GET  /api/podcast/environments
//
//   photoFile (File obj)    photo (form field)    POST /api/podcast/photo/upload
//   photoUrl                photo_url             POST /api/podcast/photo/upload ← response
//
//   avatarId                avatar_id             POST /api/podcast/avatar/build ← response
//   avatarRefUrl            avatar_ref_url        POST /api/podcast/avatar/build ← response
//   envId                   env_id                POST /api/podcast/avatar/build body
//   position                position              POST /api/podcast/avatar/build body
//   displayName             display_name          POST /api/podcast/avatar/build body
//
//   characterKey            character_key         GET  /api/podcast/character/<key>/ref
//   characterRefUrl         avatar_ref_url        GET  /api/podcast/character/<key>/ref ← response
//   characterVoiceId        voice_id              GET  /api/podcast/character/<key>/ref ← response
//   characterDisplayName    display_name          GET  /api/podcast/character/<key>/ref ← response
//
//   audioBlob (Blob)        audio (form field)    POST /api/podcast/audio/upload
//   audioUrl                audio_url             POST /api/podcast/audio/upload ← response
//
//   session.speakers[].speakerId   speaker_id     POST /api/podcast/session body
//   session.speakers[].displayName display_name   POST /api/podcast/session body
//   session.speakers[].avatarRefUrl avatar_ref_url POST /api/podcast/session body
//   session.speakers[].voiceMode   voice_mode     POST /api/podcast/session body
//   session.speakers[].voiceId     voice_id       POST /api/podcast/session body
//   session.lines[].speakerId      speaker_id     POST /api/podcast/session body
//   session.lines[].text           text           POST /api/podcast/session body
//   session.lines[].audioUrl       audio_url      POST /api/podcast/session body
//   sessionId               session_id            POST /api/podcast/session ← response
//
//   state.activeJob.sessionId session_id          GET  /api/podcast/session/<id>
//   state.progress          progress              GET  /api/podcast/session/<id>
//   state.activeJob.finalUrl final_url            GET  /api/podcast/session/<id>
//   state.status            status                GET  /api/podcast/session/<id>

import { useState, useCallback, useEffect, useRef } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

const POLL_INTERVAL_MS = 5000;          // poll every 5s — matches useContentGeneration
const POLL_TIMEOUT_MS  = 45 * 60 * 1000; // 45min hard stop — matches useContentGeneration

// Mirrors INITIAL_STATE in useContentGeneration exactly.
// status values:
//   'idle'       — nothing happening
//   'uploading'  — photo or audio file uploading to Spaces
//   'building'   — avatar being composed by Nano (POST /api/podcast/avatar/build)
//   'ready'      — avatar built, user is on Script tab
//   'rendering'  — session render job queued/processing (polling)
//   'complete'   — final video ready
//   'failed'     — any stage failed

const INITIAL_STATE = {
  status:    'idle',
  activeJob: null,   // { sessionId, finalUrl, totalSeconds } when rendering/complete
  error:     null,
  progress:  0,      // 0.0 → 1.0 during rendering poll
};

// ── CSRF helper — same pattern as useContentGeneration ────────────────────────
const getCsrf = () =>
  document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';

export default function usePodcastStudio() {

  const [state,        setState]        = useState(INITIAL_STATE);
  const [environments, setEnvironments] = useState([]);   // list from GET /environments
  const [envsLoading,  setEnvsLoading]  = useState(false);
  const [avatars,      setAvatars]      = useState([]);   // user's saved avatars

  const pollingRef   = useRef(null);
  const startTimeRef = useRef(null);

  // ── Polling cleanup — mirrors useContentGeneration ────────────────────────

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
      console.log('🛑 Podcast studio polling stopped');
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  // ── Load environments ─────────────────────────────────────────────────────

  const loadEnvironments = useCallback(async () => {
    try {
      setEnvsLoading(true);
      const res = await fetch(`${API_BASE}/api/podcast/environments`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        // Normalise backend snake_case → frontend camelCase
        setEnvironments(
          (data.environments || []).map(e => ({
            envId:        e.env_id,
            name:         e.name,
            description:  e.description,
            previewUrl:   e.preview_url,
            displayOrder: e.display_order,
          }))
        );
        console.log(`🏗️  Environments loaded: ${data.environments?.length}`);
      } else {
        console.warn('⚠️ Failed to load environments:', res.status);
      }
    } catch (e) {
      console.warn('⚠️ loadEnvironments error:', e.message);
    } finally {
      setEnvsLoading(false);
    }
  }, []);

  // ── Load user's saved avatars ─────────────────────────────────────────────

  const loadAvatars = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/podcast/avatars`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setAvatars(
          (data.avatars || []).map(a => ({
            avatarId:      a.avatar_id,
            displayName:   a.display_name,
            avatarRefUrl:  a.avatar_ref_url,
            defaultEnvId:  a.default_env_id,
            position:      a.position,
            createdAt:     a.created_at,
            bakedEnvs:     (a.baked_envs || []).map(b => ({
              envId:       b.env_id,
              bakedRefUrl: b.baked_ref_url,
            })),
          }))
        );
        console.log(`👤 Avatars loaded: ${data.avatars?.length}`);
      }
    } catch (e) {
      console.warn('⚠️ loadAvatars error:', e.message);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadEnvironments();
    loadAvatars();
  }, [loadEnvironments, loadAvatars]);

  // ── Polling loop — mirrors useContentGeneration exactly ───────────────────

  const startPolling = useCallback((sessionId) => {
    stopPolling();
    startTimeRef.current = Date.now();
    console.log(`⏳ Polling podcast session ${sessionId}…`);

    pollingRef.current = setInterval(async () => {

      // Hard timeout guard
      if (Date.now() - startTimeRef.current > POLL_TIMEOUT_MS) {
        stopPolling();
        setState(prev => ({
          ...prev,
          status: 'failed',
          error:  'Render timed out. Please try again.',
        }));
        return;
      }

      try {
        const res = await fetch(
          `${API_BASE}/api/podcast/session/${sessionId}`,
          { credentials: 'include' }
        );

        if (!res.ok) {
          console.warn('⚠️ Poll request failed:', res.status);
          return;
        }

        const job = await res.json();
        const jobStatus = job.status;

        // Always update progress
        setState(prev => ({
          ...prev,
          progress:  job.progress ?? prev.progress,
          activeJob: {
            ...prev.activeJob,
            sessionId,
            finalUrl:     job.final_url     || null,
            totalSeconds: job.total_seconds || null,
          },
        }));

        console.log(
          `📊 Poll: session=${sessionId} status=${jobStatus} ` +
          `progress=${Math.round((job.progress || 0) * 100)}%`
        );

        if (jobStatus === 'complete') {
          stopPolling();
          setState({
            status: 'complete',
            activeJob: {
              sessionId,
              finalUrl:     job.final_url,
              totalSeconds: job.total_seconds,
            },
            error:    null,
            progress: 1,
          });

        } else if (jobStatus === 'failed') {
          stopPolling();
          setState({
            status:    'failed',
            activeJob: null,
            error:     job.error || 'Render failed — please try again.',
            progress:  0,
          });
        }
        // 'queued' | 'processing' → keep polling

      } catch (e) {
        console.warn('⚠️ Polling error (will retry):', e.message);
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling]);

  // ── Upload photo — mirrors ScanLegendModal.handleScan pattern ────────────
  //
  // Frontend: photoFile (File object from <input type="file">)
  // Backend:  'photo' form field → returns { photo_url }
  // Returns:  photoUrl string (Spaces CDN URL)

  const uploadPhoto = useCallback(async (photoFile) => {
    if (!photoFile) throw new Error('No photo file provided');

    // Client-side validation — mirrors ScanLegendModal
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(photoFile.type)) {
      throw new Error('Please upload a JPEG, PNG, or WebP image.');
    }
    if (photoFile.size > 10 * 1024 * 1024) {
      throw new Error('Photo must be under 10MB.');
    }

    setState(prev => ({ ...prev, status: 'uploading', error: null }));

    const formData = new FormData();
    formData.append('photo', photoFile);

    try {
      const res = await fetch(`${API_BASE}/api/podcast/photo/upload`, {
        method:      'POST',
        headers:     { 'X-CSRF-Token': getCsrf() },
        credentials: 'include',
        body:        formData,
        // No Content-Type header — browser sets multipart boundary automatically
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Upload failed: ${res.status}`);

      console.log(`📸 Photo uploaded → ${data.photo_url}`);
      setState(prev => ({ ...prev, status: 'idle' }));
      return data.photo_url;  // photoUrl

    } catch (e) {
      console.error('❌ uploadPhoto failed:', e);
      setState(prev => ({ ...prev, status: 'failed', error: e.message }));
      throw e;
    }
  }, []);

  // ── Upload audio blob — record mode ──────────────────────────────────────
  //
  // Frontend: audioBlob (Blob from MediaRecorder)
  // Backend:  'audio' form field → returns { audio_url }
  // Returns:  audioUrl string

  const uploadAudio = useCallback(async (audioBlob) => {
    if (!audioBlob) throw new Error('No audio blob provided');

    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.mp3');

    try {
      const res = await fetch(`${API_BASE}/api/podcast/audio/upload`, {
        method:      'POST',
        headers:     { 'X-CSRF-Token': getCsrf() },
        credentials: 'include',
        body:        formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Audio upload failed: ${res.status}`);

      console.log(`🎤 Audio uploaded → ${data.audio_url}`);
      return data.audio_url;  // audioUrl

    } catch (e) {
      console.error('❌ uploadAudio failed:', e);
      throw e;
    }
  }, []);

  // ── Build avatar ──────────────────────────────────────────────────────────
  //
  // Frontend params:
  //   photoUrl     → photo_url     (from uploadPhoto)
  //   displayName  → display_name
  //   envId        → env_id
  //   position     → position      ("left" | "right" | "center")
  //
  // Backend response → normalised:
  //   avatar_id       → avatarId
  //   avatar_ref_url  → avatarRefUrl
  //   env_id          → envId
  //   preview_url     → previewUrl

  const buildAvatar = useCallback(async ({
    photoUrl,
    displayName,
    envId    = 'studio_tech',
    position = 'center',
  }) => {
    if (!photoUrl)    throw new Error('photoUrl is required');
    if (!displayName) throw new Error('displayName is required');

    setState(prev => ({ ...prev, status: 'building', error: null }));
    console.log(`👤 Building avatar: ${displayName} in ${envId}…`);

    try {
      const res = await fetch(`${API_BASE}/api/podcast/avatar/build`, {
        method:      'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrf(),
        },
        credentials: 'include',
        body: JSON.stringify({
          photo_url:    photoUrl,
          display_name: displayName,
          env_id:       envId,
          position:     position,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Avatar build failed: ${res.status}`);

      console.log(`✅ Avatar built: ${data.avatar_id}`);

      // Refresh avatars list
      await loadAvatars();

      setState(prev => ({ ...prev, status: 'ready', error: null }));

      // Return normalised avatar object
      return {
        avatarId:    data.avatar_id,
        avatarRefUrl: data.avatar_ref_url,
        displayName: displayName,
        envId:       data.env_id,
        previewUrl:  data.preview_url,
      };

    } catch (e) {
      console.error('❌ buildAvatar failed:', e);
      setState(prev => ({ ...prev, status: 'failed', error: e.message }));
      throw e;
    }
  }, [loadAvatars]);

  // ── Get AI character ref ──────────────────────────────────────────────────
  //
  // Frontend: characterKey (e.g. "shakespeare")
  // Backend response → normalised:
  //   avatar_ref_url  → characterRefUrl
  //   voice_id        → characterVoiceId
  //   display_name    → characterDisplayName

  const getCharacterRef = useCallback(async (characterKey) => {
    if (!characterKey) throw new Error('characterKey is required');
    console.log(`🎭 Fetching character ref: ${characterKey}…`);

    try {
      const res = await fetch(
        `${API_BASE}/api/podcast/character/${characterKey}/ref`,
        { credentials: 'include' }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Character ref failed: ${res.status}`);

      return {
        characterKey:         characterKey,
        characterRefUrl:      data.avatar_ref_url,
        characterVoiceId:     data.voice_id,
        characterDisplayName: data.display_name,
      };

    } catch (e) {
      console.error('❌ getCharacterRef failed:', e);
      throw e;
    }
  }, []);

  // ── Create session (submit render job) ───────────────────────────────────
  //
  // Frontend session shape:
  // {
  //   environmentId: "studio_tech",
  //   speakers: [
  //     {
  //       speakerId:    "s1",
  //       displayName:  "Chichi",
  //       avatarRefUrl: "https://…",
  //       voiceMode:    "tts",
  //       voiceId:      "21m00Tcm4TlvDq8ikWAM",
  //       gender:       "female"
  //     }
  //   ],
  //   lines: [
  //     { speakerId: "s1", text: "Hello…",     audioUrl: null },
  //     { speakerId: "s2", text: "",            audioUrl: "https://…" }
  //   ]
  // }
  //
  // Serialised to backend snake_case before POST.
  // Response → { session_id } → start polling.

  const createSession = useCallback(async (session) => {
    if (!session?.speakers?.length) throw new Error('speakers are required');
    if (!session?.lines?.length)    throw new Error('lines are required');

    stopPolling();
    setState({
      status:    'rendering',
      activeJob: { sessionId: null },
      error:     null,
      progress:  0,
    });

    console.log('🎙️ Submitting podcast session…');

    // Serialise frontend camelCase → backend snake_case
    const payload = {
      environment_id: session.environmentId || null,
      speakers: session.speakers.map(s => ({
        speaker_id:     s.speakerId,
        display_name:   s.displayName,
        avatar_ref_url: s.avatarRefUrl,
        voice_mode:     s.voiceMode,
        voice_id:       s.voiceId     || null,
        gender:         s.gender      || 'neutral',
        accent:         s.accent      || '',
      })),
      lines: session.lines.map(l => ({
        speaker_id: l.speakerId,
        text:       l.text      || '',
        audio_url:  l.audioUrl  || null,
      })),
    };

    try {
      const res = await fetch(`${API_BASE}/api/podcast/session`, {
        method:      'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrf(),
        },
        credentials: 'include',
        body:        JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Session failed: ${res.status}`);

      const sessionId = data.session_id;
      console.log(`⏳ Podcast session queued: ${sessionId}`);

      setState(prev => ({
        ...prev,
        status:    'rendering',
        activeJob: { sessionId },
        progress:  0,
      }));

      startPolling(sessionId);
      return sessionId;

    } catch (e) {
      console.error('❌ createSession failed:', e);
      stopPolling();
      setState({ status: 'failed', activeJob: null, error: e.message, progress: 0 });
      throw e;
    }
  }, [stopPolling, startPolling]);

  // ── Reset — mirrors useContentGeneration.resetContent ────────────────────

  const resetStudio = useCallback(() => {
    stopPolling();
    setState(INITIAL_STATE);
    console.log('🔄 Podcast studio reset');
  }, [stopPolling]);

  // ── Return API — mirrors useContentGeneration shape ───────────────────────

  return {
    // State
    state,          // { status, activeJob, error, progress }
    environments,   // normalised env objects
    envsLoading,
    avatars,        // user's saved avatars

    // Avatar + photo
    uploadPhoto,    // (File)   → photoUrl
    buildAvatar,    // (params) → { avatarId, avatarRefUrl, envId, previewUrl }
    getCharacterRef,// (key)    → { characterRefUrl, characterVoiceId, characterDisplayName }

    // Audio (record mode)
    uploadAudio,    // (Blob)   → audioUrl

    // Session (render job)
    createSession,  // (session) → sessionId (starts polling)

    // Utilities
    loadEnvironments, // () → void — manual refresh
    loadAvatars,      // () → void — manual refresh
    resetStudio,      // () → void
  };
}