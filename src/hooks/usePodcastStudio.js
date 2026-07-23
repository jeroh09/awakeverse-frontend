// src/hooks/usePodcastStudio.js
//
// Podcast Studio state + API calls.
// Mirrors useContentGeneration.js exactly — same state shape, same polling
// pattern, same fetch-with-CSRF approach. No separate API file layer.
//
// ApiErrorService integrated — all user-facing error strings are
// mapped through the service. Raw status codes never reach the UI.
// Backend continues to log everything server-side.
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
//   description             description           POST /api/podcast/avatar/generate-preview body
//   displayName             display_name          POST /api/podcast/avatar/generate-preview body
//   attemptNumber           attempt_number        POST /api/podcast/avatar/generate-preview body
//   previewUrl              preview_url           POST /api/podcast/avatar/generate-preview ← response
//   attemptNumber           attempt_number        POST /api/podcast/avatar/generate-preview ← response
//   (rejected)              rejected: true        POST /api/podcast/avatar/generate-preview ← 422 response
//
//   previewUrl              preview_url           POST /api/podcast/avatar/confirm-preview body
//   displayName             display_name          POST /api/podcast/avatar/confirm-preview body
//   envId                   env_id                POST /api/podcast/avatar/confirm-preview body
//   position                position              POST /api/podcast/avatar/confirm-preview body
//   (internal — polled via shared _pollAvatarJob, same as buildAvatar)
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
//   session.speakers[].savedAvatarId avatar_id     POST /api/podcast/session body  ← fullbody cache key
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
import ApiErrorService from '../services/ApiErrorService';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

const POLL_INTERVAL_MS = 5000;           // poll every 5s — matches useContentGeneration
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

// ── Shared avatar-job poller ───────────────────────────────────────────────
//
// Single source of truth for the 202-and-poll pattern used by both the
// photo-upload path (buildAvatar) and the generate-avatar path
// (confirmAvatarPreview). Kept module-level (not a hook) — it has no
// dependency on component state, only on avatarJobId + API_BASE.
//
// Naming (Frontend Hook ←→ Backend, GET /api/podcast/avatar/job/<id>):
//   status        ←  status         poll response: queued|processing|complete|failed
//   avatarId      ←  avatar_id      poll response (on complete)
//   avatarRefUrl  ←  avatar_ref_url poll response (on complete)
//   defaultEnvId  ←  default_env_id poll response (on complete)
//   error         ←  error          poll response (on failed)
//
// Returns: { avatarId, avatarRefUrl, envId, previewUrl }
// Throws:  Error on failed status, or timeout after MAX_ATTEMPTS.
async function _pollAvatarJob(avatarJobId, fallbackEnvId = 'studio_tech') {
  const POLL_INTERVAL_MS = 3000;
  const MAX_ATTEMPTS     = 40; // 3s × 40 = 120s timeout

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

    const poll = await fetch(
      `${API_BASE}/api/podcast/avatar/job/${avatarJobId}`,
      { credentials: 'include' }
    );
    const pollData = await poll.json();

    if (!poll.ok) throw new Error(pollData.error || 'Poll failed');

    const { status } = pollData;

    if (status === 'complete') {
      console.log(`✅ Avatar job complete: ${pollData.avatar_id}`);
      return {
        avatarId:     pollData.avatar_id,
        avatarRefUrl: pollData.avatar_ref_url,
        envId:        pollData.default_env_id || fallbackEnvId,
        previewUrl:   null,
      };
    }

    if (status === 'failed') {
      throw new Error(pollData.error || 'Avatar build failed');
    }

    // queued|processing — keep polling
    console.log(`⏳ Avatar job ${avatarJobId} — ${status} (attempt ${attempt + 1}/${MAX_ATTEMPTS})`);
  }

  throw new Error('Avatar build timed out — please try again');
}

export default function usePodcastStudio() {

  const [state,        setState]        = useState(INITIAL_STATE);
  const [environments, setEnvironments] = useState([]);   // list from GET /environments
  const [envsLoading,  setEnvsLoading]  = useState(false);
  const [avatars,      setAvatars]      = useState([]);   // user's saved avatars
  const [voices,       setVoices]       = useState([]);   // curated voice list
  const [consented,    setConsented]    = useState(null); // null=loading, true/false
  const [voiceClone,   setVoiceClone]   = useState(null); // { voiceId, cloneName } | null

  const pollingRef      = useRef(null);
  const startTimeRef    = useRef(null);
  // Ref to the active sessionId so visibility/pageshow handlers can read it
  // without stale closure over startPolling's argument.
  const activeSessionId = useRef(null);

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
            envId:         e.env_id,
            name:          e.name,
            description:   e.description,
            previewUrl:    e.preview_url,
            displayOrder:  e.display_order,
            guestCapacity: e.guest_capacity ?? 2,  // 2=standard two-chair, 3=panel three-chair
            isCustom:      !!e.is_custom,          // true = user-generated, only visible to its owner
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
            photoUrl:      a.photo_url,       // raw photo — for re-baking into any env
            avatarRefUrl:  a.avatar_ref_url,  // baked into default env (preview only)
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

  // ── Consent (once-ever per user) ─────────────────────────────────────────
  //
  // Backend → Frontend naming:
  //   consented    → consented     (boolean)
  //   consented_at → consentedAt   (ISO string or null)

  const loadConsent = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/podcast/consent`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setConsented(data.consented);
        console.log(`🔒 Podcast consent: ${data.consented}`);
      }
    } catch (e) {
      console.warn('⚠️ loadConsent error:', e.message);
      setConsented(false); // default to showing checkboxes on error
    }
  }, []);

  const recordConsent = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/podcast/consent`, {
        method:  'POST',
        headers: { 'X-CSRF-Token': getCsrf() },
        credentials: 'include',
      });
      if (res.ok) {
        setConsented(true);
        console.log('✅ Podcast consent recorded');
        return true;
      }
      return false;
    } catch (e) {
      console.warn('⚠️ recordConsent error:', e.message);
      return false;
    }
  }, []);

  // ── Load curated voices ───────────────────────────────────────────────────
  //
  // Fetches active voices from podcast_curated_voices table.
  // Called once on mount. Returns normalised voice objects.
  //
  // Backend → Frontend naming:
  //   voice_id     → voiceId
  //   display_name → displayName
  //   preview_url  → previewUrl
  //   gender       → gender
  //   accent       → accent
  //   vibe         → vibe
  //   slot         → slot

  const loadVoices = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/podcast/voices`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setVoices(
          (data.voices || []).map(v => ({
            voiceId:     v.voice_id,
            displayName: v.display_name,
            gender:      v.gender,
            accent:      v.accent,
            vibe:        v.vibe,
            previewUrl:  v.preview_url,
            slot:        v.slot,
          }))
        );
        console.log(`🎤 Voices loaded: ${data.voices?.length}`);
      } else {
        console.warn('⚠️ Failed to load voices:', res.status);
      }
    } catch (e) {
      console.warn('⚠️ loadVoices error:', e.message);
    }
  }, []);

  // ── Load voice clone status ───────────────────────────────────────────────
  // DECLARATION ORDER NOTE: must be defined before the mount useEffect below
  // so that the dependency array reference is not in the Temporal Dead Zone
  // when Terser evaluates it in the production bundle.

  const loadVoiceClone = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/podcast/voice/clone`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.has_clone) {
          setVoiceClone({ voiceId: data.voice_id, cloneName: data.clone_name });
          console.log(`🎙️ Voice clone loaded: ${data.clone_name} (${data.voice_id})`);
        } else {
          setVoiceClone(null);
        }
      }
    } catch (e) {
      console.warn('⚠️ loadVoiceClone error:', e.message);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadEnvironments();
    loadAvatars();
    loadVoices();
    loadConsent();
    loadVoiceClone();
  }, [loadEnvironments, loadAvatars, loadVoices, loadConsent, loadVoiceClone]);

  // ── Polling loop — mirrors useContentGeneration exactly ───────────────────

  const startPolling = useCallback((sessionId) => {
    stopPolling();
    startTimeRef.current    = Date.now();
    activeSessionId.current = sessionId;
    console.log(`⏳ Polling podcast session ${sessionId}…`);

    pollingRef.current = setInterval(async () => {

      // Hard timeout guard
      if (Date.now() - startTimeRef.current > POLL_TIMEOUT_MS) {
        stopPolling();
        activeSessionId.current = null;
        setState(prev => ({
          ...prev,
          status: 'failed',
          error:  'Render timed out — please try again.',
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

        const job       = await res.json();
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
          activeSessionId.current = null;
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
          activeSessionId.current = null;
          setState({
            status:    'failed',
            activeJob: null,
            // job.error comes from the backend worker — already a safe string
            error:     job.error || 'Render failed — please try again.',
            progress:  0,
          });
        }
        // 'queued' | 'processing' → keep polling

      } catch (e) {
        // Polling errors are transient — log and retry on next interval
        console.warn('⚠️ Polling error (will retry):', e.message);
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling]);

  // ── Tab visibility recovery ───────────────────────────────────────────────
  //
  // Problem: setInterval is throttled (or killed) when the laptop sleeps or
  // the browser tab goes to background. The backend job finishes, but the
  // frontend never receives 'complete' — it shows 'failed' on timeout, while
  // the video is already in My Podcasts.
  //
  // Fix: on visibilitychange (tab comes back into focus) and on pageshow
  // (iOS back-forward cache restore), if we have an active session that is
  // still in 'rendering' state, immediately fire one poll tick and restart
  // the interval cleanly.
  //
  // Recovery flow:
  //   tab hidden / laptop sleeps → setInterval throttles / dies
  //   user returns → visibilitychange fires → immediate poll → if complete,
  //   setState('complete') and done; if still processing, restart interval.
  //
  // Naming:
  //   activeSessionId (ref)  — sessionId being polled, null when idle
  //   startTimeRef    (ref)  — wall-clock start, preserved across recovery
  //                            so the 45min timeout still counts total elapsed

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;

      const sid = activeSessionId.current;
      if (!sid) return; // nothing being polled — nothing to recover

      console.log(`👁️ Tab visible — recovering poll for session ${sid}`);

      // Immediate one-off fetch so we don't wait 5s for the next tick
      fetch(`${API_BASE}/api/podcast/session/${sid}`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(job => {
          if (!job) return;

          console.log(`🔄 Recovery poll: session=${sid} status=${job.status} progress=${Math.round((job.progress || 0) * 100)}%`);

          if (job.status === 'complete') {
            stopPolling();
            activeSessionId.current = null;
            setState({
              status: 'complete',
              activeJob: {
                sessionId: sid,
                finalUrl:     job.final_url,
                totalSeconds: job.total_seconds,
              },
              error:    null,
              progress: 1,
            });

          } else if (job.status === 'failed') {
            stopPolling();
            activeSessionId.current = null;
            setState({
              status:    'failed',
              activeJob: null,
              error:     job.error || 'Render failed — please try again.',
              progress:  0,
            });

          } else {
            // Still queued/processing — restart the interval (it may have died)
            console.log(`⏳ Job still running — restarting poll interval for ${sid}`);
            stopPolling();
            // Preserve the original startTimeRef so the 45min timeout counts
            // total elapsed time, not just since recovery.
            pollingRef.current = setInterval(async () => {
              if (Date.now() - startTimeRef.current > POLL_TIMEOUT_MS) {
                stopPolling();
                activeSessionId.current = null;
                setState(prev => ({
                  ...prev,
                  status: 'failed',
                  error:  'Render timed out — please try again.',
                }));
                return;
              }
              try {
                const res = await fetch(
                  `${API_BASE}/api/podcast/session/${sid}`,
                  { credentials: 'include' }
                );
                if (!res.ok) return;
                const j = await res.json();
                setState(prev => ({
                  ...prev,
                  progress: j.progress ?? prev.progress,
                  activeJob: {
                    ...prev.activeJob,
                    sessionId: sid,
                    finalUrl:     j.final_url     || null,
                    totalSeconds: j.total_seconds || null,
                  },
                }));
                if (j.status === 'complete') {
                  stopPolling();
                  activeSessionId.current = null;
                  setState({
                    status: 'complete',
                    activeJob: { sessionId: sid, finalUrl: j.final_url, totalSeconds: j.total_seconds },
                    error: null, progress: 1,
                  });
                } else if (j.status === 'failed') {
                  stopPolling();
                  activeSessionId.current = null;
                  setState({
                    status:    'failed',
                    activeJob: null,
                    error:     j.error || 'Render failed — please try again.',
                    progress:  0,
                  });
                }
              } catch (e) {
                console.warn('⚠️ Polling error (will retry):', e.message);
              }
            }, POLL_INTERVAL_MS);
          }
        })
        .catch(e => console.warn('⚠️ Recovery poll fetch failed:', e.message));
    };

    // iOS back-forward cache: page is restored from bfcache, not re-mounted.
    // persisted=true means it came from bfcache — treat same as tab focus.
    const handlePageShow = (e) => {
      if (e.persisted) {
        console.log('📱 iOS bfcache restore — triggering visibility recovery');
        handleVisibilityChange();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [stopPolling]); // stopPolling is stable (useCallback with no deps)

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
      if (!res.ok) {
        ApiErrorService.log('usePodcastStudio.uploadPhoto', res.status, data);
        throw new Error(ApiErrorService.getMessage(res.status, data));
      }

      console.log(`📸 Photo uploaded → ${data.photo_url}`);
      setState(prev => ({ ...prev, status: 'idle' }));
      return data.photo_url; // photoUrl

    } catch (e) {
      setState(prev => ({
        ...prev,
        status: 'failed',
        error:  e.message, // already mapped by getMessage above, or client validation string
      }));
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
      if (!res.ok) {
        ApiErrorService.log('usePodcastStudio.uploadAudio', res.status, data);
        throw new Error(ApiErrorService.getMessage(res.status, data));
      }

      console.log(`🎤 Audio uploaded → ${data.audio_url}`);
      return data.audio_url; // audioUrl

    } catch (e) {
      // Re-throw — caller (PodcastStudioPage) handles UI state for audio upload
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

  // buildAvatar — async 202 + polling pattern
  // Naming conventions (Frontend ←→ Backend):
  //   photoUrl        →  photo_url         POST body
  //   displayName     →  display_name      POST body
  //   envId           →  env_id            POST body
  //   position        →  position          POST body
  //   avatarJobId     ←  avatar_job_id     202 response
  //   status          ←  status            poll response: queued|processing|complete|failed
  //   avatarId        ←  avatar_id         poll response (on complete)
  //   avatarRefUrl    ←  avatar_ref_url    poll response (on complete)
  //   defaultEnvId    ←  default_env_id    poll response (on complete)
  //   error           ←  error             poll response (on failed)
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
      // Step 1 — POST to enqueue, returns 202 immediately
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

      const queued = await res.json();
      if (!res.ok) {
        ApiErrorService.log('usePodcastStudio.buildAvatar', res.status, queued);
        throw new Error(ApiErrorService.getMessage(res.status, queued));
      }

      const avatarJobId = queued.avatar_job_id;
      console.log(`🎨 Avatar job queued: ${avatarJobId}`);

      // Step 2 — delegate to shared poller (single source of truth)
      const result = await _pollAvatarJob(avatarJobId, envId);

      await loadAvatars();
      setState(prev => ({ ...prev, status: 'ready', error: null }));
      return { ...result, displayName };

    } catch (e) {
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
      if (!res.ok) {
        ApiErrorService.log('usePodcastStudio.getCharacterRef', res.status, data);
        throw new Error(ApiErrorService.getMessage(res.status, data));
      }

      return {
        characterKey:         characterKey,
        characterRefUrl:      data.avatar_ref_url,
        characterVoiceId:     data.voice_id,
        characterDisplayName: data.display_name,
      };

    } catch (e) {
      // Re-throw — caller (PodcastStudioPage) handles gracefully
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
        avatar_id:      s.savedAvatarId || null, // UUID from podcast_avatars — enables fullbody cache
        voice_mode:     s.voiceMode,
        voice_id:       s.voiceId     || null,
        gender:         s.gender      || 'neutral',
        accent:         s.accent      || '',
      })),
      // Filter out lines with no text (TTS lines must have content)
      lines: session.lines
        .filter(l => (l.text || '').trim() || l.audioUrl)
        .map(l => ({
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
      if (!res.ok) {
        ApiErrorService.log('usePodcastStudio.createSession', res.status, data);
        throw new Error(ApiErrorService.getMessage(res.status, data));
      }

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
      stopPolling();
      setState({ status: 'failed', activeJob: null, error: e.message, progress: 0 });
      throw e;
    }
  }, [stopPolling, startPolling]);

  /**
   * startPollingSession — skip the POST, go straight to polling.
   *
   * Called by PodcastStudioPage.handleGenerate after it has already
   * submitted the session via guardedFetch (budget-gated fetch).
   * Sets the same rendering state createSession would set, then
   * starts the poll loop exactly as createSession does.
   *
   * @param {string} sessionId — session_id returned by the backend
   */
  const startPollingSession = useCallback((sessionId) => {
    if (!sessionId) {
      console.error('❌ startPollingSession: sessionId is required');
      return;
    }
    stopPolling();
    setState({
      status:    'rendering',
      activeJob: { sessionId },
      error:     null,
      progress:  0,
    });
    console.log(`⏳ Podcast poll started (external submit): ${sessionId}`);
    startPolling(sessionId);
  }, [stopPolling, startPolling, setState]);

  // ── Delete avatar ─────────────────────────────────────────────────────────
  //
  // Frontend: avatarId (string UUID)
  // Backend:  DELETE /api/podcast/avatar/<avatar_id>
  // Returns:  void — caller refreshes avatars list
  //
  // Naming:
  //   avatarId → avatar_id  (path param)

  const deleteAvatar = useCallback(async (avatarId) => {
    if (!avatarId) throw new Error('avatarId is required');

    try {
      const res = await fetch(`${API_BASE}/api/podcast/avatar/${avatarId}`, {
        method:  'DELETE',
        headers: { 'X-CSRF-Token': getCsrf() },
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        ApiErrorService.log('usePodcastStudio.deleteAvatar', res.status, data);
        throw new Error(ApiErrorService.getMessage(res.status, data));
      }

      console.log(`🗑️ Avatar deleted: ${avatarId}`);
      // Refresh avatars list so grid updates immediately
      await loadAvatars();

    } catch (e) {
      throw e;
    }
  }, [loadAvatars]);

  // ── Delete session ─────────────────────────────────────────────────────────
  //
  // Frontend: sessionId (string UUID)
  // Backend:  DELETE /api/podcast/session/<session_id>
  // Returns:  void — caller removes from local sessions list
  //
  // Naming:
  //   sessionId → session_id  (path param)

  const deleteSession = useCallback(async (sessionId) => {
    if (!sessionId) throw new Error('sessionId is required');

    try {
      const res = await fetch(`${API_BASE}/api/podcast/session/${sessionId}`, {
        method:  'DELETE',
        headers: { 'X-CSRF-Token': getCsrf() },
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        ApiErrorService.log('usePodcastStudio.deleteSession', res.status, data);
        throw new Error(ApiErrorService.getMessage(res.status, data));
      }

      console.log(`🗑️ Session deleted: ${sessionId}`);

    } catch (e) {
      throw e;
    }
  }, []);

  // ── Voice clone ───────────────────────────────────────────────────────────

  const cloneVoice = useCallback(async (audioBlob, cloneName = 'My Voice') => {
    if (!audioBlob) throw new Error('audioBlob is required');

    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice_sample.webm');
    formData.append('name', cloneName);

    try {
      const res = await fetch(`${API_BASE}/api/podcast/voice/clone`, {
        method:      'POST',
        headers:     { 'X-CSRF-Token': getCsrf() },
        credentials: 'include',
        body:        formData,
      });

      const data = await res.json();
      if (!res.ok) {
        ApiErrorService.log('usePodcastStudio.cloneVoice', res.status, data);
        throw new Error(ApiErrorService.getMessage(res.status, data));
      }

      const clone = { voiceId: data.voice_id, cloneName: data.clone_name };
      setVoiceClone(clone);
      // Refresh voices list so "My Voice" appears in picker immediately
      await loadVoices();
      console.log(`🎙️ Voice cloned: ${data.clone_name} (${data.voice_id})`);
      return clone;

    } catch (e) {
      throw e;
    }
  }, [loadVoices]);

  // ── Script chat assistant ─────────────────────────────────────────────────
  //
  // Stateless — caller sends full message history each turn.
  //
  // Frontend params:
  //   messages[]   → messages     [{role:'user'|'assistant', content:'...'}]
  //   speakerName  → speaker_name  (host display name)
  //   topic        → topic         (optional context hint)
  //   guestName    → guest_name    (optional, interview mode only)
  //
  // Backend response → normalised:
  //   reply        → reply         (AI full message text)
  //   script_block → scriptBlock   (Fountain text between ---SCRIPT--- / ---END---, or null)

  const sendScriptMessage = useCallback(async ({ messages, speakerName, topic, guestName }) => {
    if (!messages?.length) throw new Error('messages are required');

    try {
      const res = await fetch(`${API_BASE}/api/podcast/script-chat`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrf(),
        },
        credentials: 'include',
        body: JSON.stringify({
          messages,
          speaker_name: speakerName || 'You',
          topic:        topic       || '',
          ...(guestName ? { guest_name: guestName } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        ApiErrorService.log('usePodcastStudio.sendScriptMessage', res.status, data);
        throw new Error(ApiErrorService.getMessage(res.status, data));
      }

      console.log(`🤖 Script assistant replied — has_script=${!!data.script_block}`);

      return {
        reply:       data.reply,
        scriptBlock: data.script_block || null,
      };

    } catch (e) {
      throw e;
    }
  }, []);

  // ── Generate avatar preview ────────────────────────────────────────────────
  //
  // Text description → Nano preview image. Preview only — no DB write, no
  // bake job. User eyeballs the result and either approves it
  // (confirmAvatarPreview) or regenerates (call this again, attemptNumber+1).
  //
  // Naming (Frontend Hook ←→ Backend):
  //   description    →  description       text description of look
  //   displayName    →  display_name      used in Spaces key
  //   attemptNumber  →  attempt_number    1-3, tracked by caller (UI)
  //   previewUrl     ←  preview_url       CDN URL — display as <img src>
  //   attemptNumber  ←  attempt_number    echoed back
  // Throws on failure. On Fal rejection (422), throws an Error with
  // .rejected = true and .attemptNumber set, so the caller can distinguish
  // "try a different description" from a hard failure.
  const generateAvatarPreview = useCallback(async ({
    description,
    displayName,
    attemptNumber = 1,
  }) => {
    if (!description?.trim()) throw new Error('Description is required');
    if (!displayName?.trim()) throw new Error('Display name is required');

    const res = await fetch(`${API_BASE}/api/podcast/avatar/generate-preview`, {
      method:      'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrf(),
      },
      credentials: 'include',
      body: JSON.stringify({
        description,
        display_name:   displayName,
        attempt_number: attemptNumber,
      }),
    });

    const data = await res.json();

    if (res.status === 422 && data.rejected) {
      console.warn(`⚠️ Avatar preview rejected: attempt ${attemptNumber}`);
      const err = new Error(
        data.error || "We couldn't generate this avatar. Please try a different description."
      );
      err.rejected      = true;
      err.attemptNumber = data.attempt_number || attemptNumber;
      throw err;
    }

    if (!res.ok) {
      ApiErrorService.log('usePodcastStudio.generateAvatarPreview', res.status, data);
      throw new Error(ApiErrorService.getMessage(res.status, data));
    }

    console.log(`🎨 Avatar preview generated: attempt ${data.attempt_number}`);
    return {
      previewUrl:    data.preview_url,
      attemptNumber: data.attempt_number,
    };
  }, []);


  // ── Confirm avatar preview ─────────────────────────────────────────────────
  //
  // User approved the generated preview → enqueue the same async bake job
  // used by the photo-upload path, then poll to completion via the shared
  // poller. Returns the SAME shape as buildAvatar — callers can treat the
  // two paths identically once a previewUrl/photoUrl exists.
  //
  // Naming (Frontend Hook ←→ Backend):
  //   previewUrl   →  preview_url    approved Spaces CDN URL (from generateAvatarPreview)
  //   displayName  →  display_name
  //   envId        →  env_id
  //   position     →  position
  //   avatarJobId  ←  avatar_job_id  (internal — used to poll, not returned to caller)
  //   status       ←  'queued'       (internal)
  //
  // Returns: { avatarId, avatarRefUrl, envId, previewUrl, displayName }
  const confirmAvatarPreview = useCallback(async ({
    previewUrl,
    displayName,
    envId    = 'studio_tech',
    position = 'center',
  }) => {
    if (!previewUrl)  throw new Error('previewUrl is required');
    if (!displayName) throw new Error('displayName is required');

    setState(prev => ({ ...prev, status: 'building', error: null }));
    console.log(`👤 Confirming generated avatar: ${displayName} in ${envId}…`);

    try {
      const res = await fetch(`${API_BASE}/api/podcast/avatar/confirm-preview`, {
        method:      'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrf(),
        },
        credentials: 'include',
        body: JSON.stringify({
          preview_url:  previewUrl,
          display_name: displayName,
          env_id:       envId,
          position,
        }),
      });

      const queued = await res.json();
      if (!res.ok) {
        ApiErrorService.log('usePodcastStudio.confirmAvatarPreview', res.status, queued);
        throw new Error(ApiErrorService.getMessage(res.status, queued));
      }

      const avatarJobId = queued.avatar_job_id;
      console.log(`🎨 Avatar job queued (from preview): ${avatarJobId}`);

      // Same shared poller as buildAvatar — identical final shape.
      const result = await _pollAvatarJob(avatarJobId, envId);

      await loadAvatars();
      setState(prev => ({ ...prev, status: 'ready', error: null }));
      return { ...result, displayName };

    } catch (e) {
      setState(prev => ({ ...prev, status: 'failed', error: e.message }));
      throw e;
    }
  }, [loadAvatars]);


  // ── Reset — mirrors useContentGeneration.resetContent ────────────────────

  // ── Generate a background — AUTO-SAVES immediately ────────────────────────
  //
  // No separate confirm step (unlike avatars, which gate on approval —
  // backgrounds carry none of the likeness/rejection risk that gate exists
  // for). Usable right away, same as any preset, the moment this resolves.
  //
  // Pass `envId` to regenerate an existing one IN PLACE (same row, same
  // storage key overwritten) — this is what stops Regenerate from
  // creating duplicate saved entries every time it's clicked.
  //
  // No attempt cap, no rejection state — simpler than generateAvatarPreview
  // by design. Seating/chair orientation is handled entirely server-side
  // (guestCapacity is all this needs to send); nothing about it is left
  // to the description.
  //
  // Naming (Frontend Hook ←→ Backend):
  //   description    →  description       free-text scene description
  //   guestCapacity  →  guest_capacity    2 or 3 — matches the sub-choice picked
  //   displayName    →  display_name      defaults to "My Background" server-side
  //   envId          →  env_id            optional — pass to regenerate IN PLACE
  //   envId          ←  env_id            the saved (or updated) row's id
  //   plateUrl       ←  plate_url         CDN URL — usable immediately
  const generateEnvironmentPreview = useCallback(async ({
    description, guestCapacity = 2, displayName, envId,
  }) => {
    if (!description?.trim()) throw new Error('Description is required');

    const res = await fetch(`${API_BASE}/api/podcast/environment/generate-preview`, {
      method:      'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrf(),
      },
      credentials: 'include',
      body: JSON.stringify({
        description,
        guest_capacity: guestCapacity,
        display_name:   displayName,
        env_id:         envId,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      ApiErrorService.log('usePodcastStudio.generateEnvironmentPreview', res.status, data);
      throw new Error(ApiErrorService.getMessage(res.status, data));
    }

    console.log(`🖼️  Environment saved: ${data.env_id} capacity=${guestCapacity}`);
    await loadEnvironments(); // refresh so it shows up in the grid immediately
    return { envId: data.env_id, plateUrl: data.plate_url };
  }, [loadEnvironments]);


  // ── Delete a custom (user-generated) environment ──────────────────────────
  //
  // Presets can't be deleted through this — scoped server-side to rows the
  // caller owns. Refreshes `environments` afterward, same self-refreshing
  // pattern as everything else that mutates the list.
  //
  // Naming (Frontend Hook ←→ Backend):
  //   envId    →  (URL param)
  //   deleted  ←  deleted: true
  const deleteEnvironment = useCallback(async (envId) => {
    if (!envId) throw new Error('envId is required');

    const res = await fetch(`${API_BASE}/api/podcast/environment/${envId}`, {
      method:      'DELETE',
      headers:     { 'X-CSRF-Token': getCsrf() },
      credentials: 'include',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      ApiErrorService.log('usePodcastStudio.deleteEnvironment', res.status, data);
      throw new Error(ApiErrorService.getMessage(res.status, data));
    }

    console.log(`🗑️  Environment deleted: ${envId}`);
    await loadEnvironments();
  }, [loadEnvironments]);


  // ── Bake an existing avatar into a (possibly new) environment ────────────
  //
  // This is the correct call for "select a saved avatar, but it hasn't been
  // baked for the currently-selected environment yet." It hits the dedicated
  // bake endpoint, which checks podcast_avatar_envs for this (avatarId, envId)
  // pair server-side and reuses it if found — no new avatar_id is ever minted.
  //
  // Do NOT use buildAvatar for this — buildAvatar mints a brand-new avatar_id
  // on every call, which is correct for "build a fresh avatar from a photo"
  // but wrong here: it would silently create a duplicate avatar record for
  // a photo that already has one, just because a different env was picked.
  //
  // Naming (Frontend Hook ←→ Backend, POST /api/podcast/avatar/<avatarId>/bake/<envId>):
  //   avatarId     →  (URL param)
  //   envId        →  (URL param)  
  //   avatarId     ←  avatar_id
  //   envId        ←  env_id
  //   bakedRefUrl  ←  baked_ref_url  
  //
  // Synchronous — 200 response, no job/poll (unlike buildAvatar/confirmAvatarPreview).
  const bakeAvatarEnv = useCallback(async ({ avatarId, envId }) => {
    if (!avatarId) throw new Error('avatarId is required');
    if (!envId)    throw new Error('envId is required');

    const res = await fetch(
      `${API_BASE}/api/podcast/avatar/${avatarId}/bake/${envId}`,
      {
        method:      'POST',
        headers: { 'X-CSRF-Token': getCsrf() },
        credentials: 'include',
      }
    );

    const data = await res.json();
    if (!res.ok) {
      ApiErrorService.log('usePodcastStudio.bakeAvatarEnv', res.status, data);
      throw new Error(ApiErrorService.getMessage(res.status, data));
    }

    console.log(`♻️  Avatar baked for env: ${data.avatar_id} × ${data.env_id}`);
    await loadAvatars(); // refresh so this env is cached client-side next time
    return {
      avatarId:    data.avatar_id,
      envId:       data.env_id,
      bakedRefUrl: data.baked_ref_url,
    };
  }, [loadAvatars]);

  const resetStudio = useCallback(() => {
    stopPolling();
    activeSessionId.current = null;
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
    voices,         // curated voice list (includes "My Voice" if clone exists)
    consented,      // boolean | null — has user given podcast consent
    voiceClone,     // { voiceId, cloneName } | null — user's cloned voice

    // Avatar + photo
    uploadPhoto,            // (File)   → photoUrl
    buildAvatar,            // (params) → { avatarId, avatarRefUrl, envId, previewUrl }
    generateAvatarPreview,  // ({description, displayName, attemptNumber}) → { previewUrl, attemptNumber }
    confirmAvatarPreview,   // ({previewUrl, displayName, envId, position}) → { avatarId, avatarRefUrl, envId, previewUrl } — same shape as buildAvatar
    bakeAvatarEnv,          // ({avatarId, envId}) → { avatarId, envId, bakedRefUrl } — for re-baking a SAVED avatar into a new env, dedup'd server-side
    generateEnvironmentPreview, // ({description, guestCapacity, displayName, envId?}) → { envId, plateUrl } — AUTO-SAVES, pass envId to regenerate in place
    deleteEnvironment,          // (envId) → void — refreshes environments list
    getCharacterRef,        // (key)    → { characterRefUrl, characterVoiceId, characterDisplayName }
    deleteAvatar,           // (avatarId) → void (refreshes avatars list)

    // Audio (record mode)
    uploadAudio,      // (Blob)   → audioUrl

    // Voice clone (IVC)
    cloneVoice,       // (audioBlob, cloneName?) → { voiceId, cloneName }
    loadVoiceClone,   // () → void — refresh clone status

    // Session (render job)
    createSession,       // (session) → sessionId (starts polling)
    startPollingSession, // (sessionId) → void — skip POST, start poll loop
    sendScriptMessage,   // ({ messages, speakerName, topic, guestName }) → { reply, scriptBlock }
    deleteSession,       // (sessionId) → void

    // Utilities
    loadEnvironments, // () → void — manual refresh
    loadAvatars,      // () → void — manual refresh
    loadVoices,       // () → void — manual refresh
    loadConsent,      // () → void — check consent status
    recordConsent,    // () → bool — record consent, returns true on success
    resetStudio,      // () → void
  };
}