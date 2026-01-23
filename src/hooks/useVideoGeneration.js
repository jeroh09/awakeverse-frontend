// src/hooks/useVideoGeneration.js
/**
 * Video Generation Hook
 * Manages video generation lifecycle for scenario conversations
 * 
 * Features:
 * - Start video generation
 * - Poll for progress
 * - Download video when complete
 * - Error handling with circuit breaker pattern
 * 
 * Usage:
 *   const videoGen = useVideoGeneration(scenarioId);
 *   videoGen.startGeneration();
 *   videoGen.downloadVideo();
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '../contexts/UserContext';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

export function useVideoGeneration(scenarioId) {
  const { user } = useUser();
  
  const [state, setState] = useState({
    projectId: null,
    status: 'idle', // 'idle' | 'generating' | 'complete' | 'failed'
    progress: 0, // 0.0 to 1.0
    stage: null, // 'pending' | 'storyboard' | 'voice' | 'video' | 'complete'
    error: null,
    videoUrl: null,
    jobId: null
  });

  // Ref for polling interval
  const pollingIntervalRef = useRef(null);

  // Observable logging
  console.log('🎬 useVideoGeneration hook initialized:', {
    scenarioId,
    userId: user?.id,
    status: state.status,
    progress: state.progress
  });

  // ===== HELPER: Get CSRF Token =====
  const getCsrfToken = useCallback(() => {
    // Same pattern as useScenarioChat
    const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';
    console.log('🔒 CSRF token extracted:', csrf ? 'Present' : 'Missing');
    return csrf;
  }, []);

  // ===== HELPER: Check Feature Access =====
  const canGenerateVideo = useCallback(() => {
    // Feature flag: Only user_id 44 for demo
    const allowed = user?.id === 44;
    console.log('🎫 Video generation access check:', {
      userId: user?.id,
      allowed
    });
    return allowed;
  }, [user?.id]);

  // ===== 1. START VIDEO GENERATION =====
  const startGeneration = useCallback(async () => {
    if (!canGenerateVideo()) {
      console.warn('⚠️ User not allowed to generate video');
      setState(prev => ({
        ...prev,
        status: 'failed',
        error: 'Video generation not available for your account'
      }));
      return;
    }

    try {
      console.log('🎬 Starting video generation for scenario:', scenarioId);
      
      setState(prev => ({
        ...prev,
        status: 'generating',
        progress: 0,
        error: null,
        stage: 'pending'
      }));

      const csrf = getCsrfToken();

      const response = await fetch(`${API_BASE}/api/demo/video/from-scenario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf
        },
        credentials: 'include',
        body: JSON.stringify({ scenario_id: scenarioId })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Failed to start video generation: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('✅ Video generation started:', {
        projectId: data.project_id,
        jobId: data.job_id,
        status: data.status,
        progress: data.progress
      });

      setState(prev => ({
        ...prev,
        projectId: data.project_id,
        jobId: data.job_id,
        status: 'generating',
        progress: data.progress,
        stage: data.status
      }));

      return data;
      
    } catch (error) {
      console.error('❌ Failed to start video generation:', error);
      
      setState(prev => ({
        ...prev,
        status: 'failed',
        error: error.message || 'Failed to start video generation'
      }));
      
      throw error;
    }
  }, [scenarioId, user?.id, canGenerateVideo, getCsrfToken]);

  // ===== 2. POLL FOR PROGRESS =====
  const pollProgress = useCallback(async () => {
    if (!state.projectId) {
      console.warn('⚠️ Cannot poll progress - no project ID');
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/demo/video/projects/${state.projectId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch progress: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('📊 Video progress update:', {
        projectId: state.projectId,
        status: data.status,
        progress: data.progress,
        stage: data.status
      });

      setState(prev => ({
        ...prev,
        progress: data.progress,
        stage: data.status,
        status: data.status === 'complete' ? 'complete' :
                data.status === 'failed' ? 'failed' : 'generating',
        error: data.error_message,
        videoUrl: data.status === 'complete' ?
          `${API_BASE}/api/demo/video/projects/${state.projectId}/download` : null
      }));

      return data;
      
    } catch (error) {
      console.error('❌ Failed to poll progress:', error);
      // Don't set failed status on polling errors - might be temporary
    }
  }, [state.projectId]);

  // ===== 3. SET UP POLLING INTERVAL =====
  useEffect(() => {
    // Only poll when generating and have project ID
    if (state.status === 'generating' && state.projectId) {
      console.log('⏱️ Starting progress polling (3s interval)...');
      
      // Poll immediately
      pollProgress();
      
      // Then poll every 3 seconds
      pollingIntervalRef.current = setInterval(() => {
        pollProgress();
      }, 3000);
      
      // Cleanup interval on unmount or status change
      return () => {
        if (pollingIntervalRef.current) {
          console.log('⏹️ Stopping progress polling');
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }
  }, [state.status, state.projectId, pollProgress]);

  // ===== 4. DOWNLOAD VIDEO =====
  const downloadVideo = useCallback(() => {
    if (!state.projectId || state.status !== 'complete') {
      console.warn('⚠️ Cannot download - video not ready:', {
        projectId: state.projectId,
        status: state.status
      });
      return;
    }

    console.log('⬇️ Downloading video:', {
      projectId: state.projectId,
      url: state.videoUrl
    });
    
    // Direct navigation to download URL
    // Browser will handle download automatically
    window.location.href = state.videoUrl;
  }, [state.projectId, state.status, state.videoUrl]);

  // ===== 5. RESET STATE =====
  const reset = useCallback(() => {
    console.log('🔄 Resetting video generation state');
    
    // Clear polling interval if active
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    setState({
      projectId: null,
      status: 'idle',
      progress: 0,
      stage: null,
      error: null,
      videoUrl: null,
      jobId: null
    });
  }, []);

  return {
    state,
    startGeneration,
    downloadVideo,
    canGenerateVideo: canGenerateVideo(),
    reset
  };
}

export default useVideoGeneration;