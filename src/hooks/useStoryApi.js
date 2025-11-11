// src/components/StoryMode/hooks/useStoryApi.js - Story API Hook
import { useState, useCallback } from 'react';
const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

export default function useStoryApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get CSRF token from cookie
  const getCsrfToken = useCallback(() => {
    const match = document.cookie.match(/av_csrf=([^;]+)/);
    return match ? match[1] : '';
  }, []);

  // Generic API request handler
  const request = useCallback(async (url, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(options.method !== 'GET' && {
            'X-CSRF-Token': getCsrfToken()
          }),
          ...options.headers
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('❌ Story API Error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getCsrfToken]);

  // Get story templates (public endpoint)
  const getTemplates = useCallback(async () => {
    return request(`${API_BASE}/api/stories/templates`);
  }, [request]);

  // Create story
  const createStory = useCallback(async (storyData) => {
    return request(`${API_BASE}/api/stories/create`, {
      method: 'POST',
      body: JSON.stringify(storyData)
    });
  }, [request]);

  // Get user's stories
  const getMyStories = useCallback(async (status = 'active', limit = 50) => {
    const params = new URLSearchParams({ status, limit: limit.toString() });
    return request(`${API_BASE}/api/stories/my-stories?${params}`);
  }, [request]);

  // Get story details
  const getStory = useCallback(async (storyId) => {
    return request(`${API_BASE}/api/stories/${storyId}`);
  }, [request]);

  // Get story context (full context for chat)
  const getStoryContext = useCallback(async (storyId) => {
    return request(`${API_BASE}/api/stories/${storyId}/context`);
  }, [request]);

  // Update story
  const updateStory = useCallback(async (storyId, updates) => {
    return request(`${API_BASE}/api/stories/${storyId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }, [request]);

  // Delete story
  const deleteStory = useCallback(async (storyId) => {
    return request(`${API_BASE}/api/stories/${storyId}`, {
      method: 'DELETE'
    });
  }, [request]);

  // Send message in story
  const sendMessage = useCallback(async (storyId, message) => {
    return request(`${API_BASE}/api/stories/${storyId}/message`, {
      method: 'POST',
      body: JSON.stringify({ content: message })
    });
  }, [request]);

    // Send message with true streaming (NDJSON)
  const sendMessageStream = useCallback(async (storyId, content, { onDelta, onDone, onError, signal } = {}) => {
    const params = new URLSearchParams({ stream: '1' });

    const res = await fetch(`${API_BASE}/api/stories/${storyId}/message?` + params.toString(), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrfToken()
      },
      body: JSON.stringify({ content }),
      signal
    });

    if (!res.ok || !res.body) {
      const msg = `HTTP ${res.status}`;
      onError?.(msg);
      throw new Error(msg);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let full = '';

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 1);
          if (!line) continue;

          let obj;
          try { obj = JSON.parse(line); } catch { continue; }

          if (obj.delta != null) {
            full += obj.delta;
            onDelta?.(full);
          } else if (obj.done) {
            onDone?.(obj, full);
          } else if (obj.error) {
            onError?.(obj.detail || 'stream_failed');
          }
        }
      }
    } catch (e) {
      onError?.(e?.message || 'stream_aborted');
      throw e;
    }
  }, [getCsrfToken]);


  // Invite character to story
  const inviteCharacter = useCallback(async (storyId, characterKey) => {
    return request(`${API_BASE}/api/stories/${storyId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ character_key: characterKey })
    });
  }, [request]);

  // Resume paused story
  const resumeStory = useCallback(async (storyId) => {
    return request(`${API_BASE}/api/stories/${storyId}/resume`, {
      method: 'POST'
    });
  }, [request]);

  return {
    loading,
    error,
    getTemplates,
    createStory,
    getMyStories,
    getStory,
    getStoryContext,
    updateStory,
    deleteStory,
    sendMessage,
    sendMessageStream,
    inviteCharacter,
    resumeStory
  };
}