// src/hooks/useVerseStudio.js - Verse Studio Hook with Handoff Detection + LLM Options
import { useState, useCallback, useRef } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

// Safe UI fallback if backend endpoint doesn't exist yet
const FALLBACK_LLM_OPTIONS = [
  {
    id: 'gpt-4o',
    label: 'GPT-4o',
    provider: 'OpenAI',
    tier: 'pro',
    capabilities: ['Generalist', 'Reasoning'],
    description: 'Balanced reasoning + speed.'
  },
  {
    id: 'gpt-4o-mini',
    label: 'GPT-4o mini',
    provider: 'OpenAI',
    tier: 'free',
    capabilities: ['Fast', 'Affordable'],
    description: 'Quick drafts and iterations.'
  },
  {
    id: 'claude-3.5-sonnet',
    label: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    tier: 'pro',
    capabilities: ['Writing', 'Analysis'],
    description: 'Strong writing and structured thinking.'
  },
  {
    id: 'llama-3.1-70b',
    label: 'Llama 3.1 70B',
    provider: 'Open',
    tier: 'lab',
    capabilities: ['Open', 'Generalist'],
    description: 'Great general-purpose open model.'
  }
];

export default function useVerseStudio() {
  // Task state
  const [taskId, setTaskId] = useState(null);
  const [team, setTeam] = useState([]);
  const [messages, setMessages] = useState([]);

  // LLM options (for TaskCreator / selection UX)
  const [llmOptions, setLlmOptions] = useState([]);
  const [llmOptionsLoading, setLlmOptionsLoading] = useState(false);

  // Streaming state
  const [isSending, setIsSending] = useState(false);
  const [activeRole, setActiveRole] = useState(null);

  // Handoff suggestion state
  const [handoffSuggestion, setHandoffSuggestion] = useState(null);
  const [showHandoffPrompt, setShowHandoffPrompt] = useState(false);

  // Usage tracking
  const [usageData, setUsageData] = useState({
    messages_count: 0,
    tokens_used: 0,
    tier: 'free',
    limit: 150,
    remaining: 150,
    limitReached: false
  });
  const [usageLoading, setUsageLoading] = useState(false);

  // Circuit breaker
  const [circuitBreakerState, setCircuitBreakerState] = useState({
    errorCount: 0,
    lastError: null,
    status: 'healthy'
  });

  // Refs
  const controllerRef = useRef(null);
  const animationIntervalRef = useRef(null);
  const messageIdCounter = useRef(0);

  const generateMessageId = useCallback(() => {
    return messageIdCounter.current++;
  }, []);

  // ========================================================================
  // LLM OPTIONS (tries backend first, falls back to static list)
  // ========================================================================
  const refreshLLMOptions = useCallback(async () => {
    if (llmOptionsLoading) return;

    try {
      setLlmOptionsLoading(true);

      // If you later add a backend route, this will start working automatically.
      // Suggested future endpoint: GET /api/verse-studio/llms
      const res = await fetch(`${API_BASE}/api/verse-studio/llms`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        const options = data.llms || data.models || data.options || [];

        if (Array.isArray(options) && options.length) {
          setLlmOptions(options);
          return options;
        }
      }

      // If endpoint missing or returns empty
      setLlmOptions(FALLBACK_LLM_OPTIONS);
      return FALLBACK_LLM_OPTIONS;
    } catch (e) {
      console.warn('⚠️ LLM options endpoint unavailable; using fallback list.');
      setLlmOptions(FALLBACK_LLM_OPTIONS);
      return FALLBACK_LLM_OPTIONS;
    } finally {
      setLlmOptionsLoading(false);
    }
  }, [llmOptionsLoading]);

  // ========================================================================
  // FETCH USAGE
  // ========================================================================
  const fetchUsage = useCallback(async (taskIdToFetch) => {
    if (!taskIdToFetch) return;

    try {
      setUsageLoading(true);

      const response = await fetch(
        `${API_BASE}/api/verse-studio/task/${taskIdToFetch}/usage`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();

        setUsageData({
          messages_count: data.messages_count || 0,
          tokens_used: data.tokens_used || 0,
          tier: data.tier || 'free',
          limit: data.limit || 150,
          remaining: data.remaining || 0,
          limitReached: data.limit_reached || false
        });

        console.log('📊 Usage loaded:', data);
      }
    } catch (error) {
      console.error('⚠️ Failed to fetch usage:', error);
    } finally {
      setUsageLoading(false);
    }
  }, []);

  // ========================================================================
  // CREATE TASK
  // ========================================================================
  const createTask = useCallback(
    async (taskData) => {
      try {
        const csrf =
          document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';

        // ----------------------------
        // Normalize payload for backend
        // ----------------------------
        const payload = {
          name: taskData?.name,
          description: taskData?.description || '',
        };

        // Template-based
        if (taskData?.template_id) {
          payload.template_id = taskData.template_id;

          // Prefer llm_preferences (2–3 models), but accept a few caller variants safely
          const prefs =
            taskData.llm_preferences ||
            taskData.llm_ids ||
            taskData.models ||
            taskData.selected_models ||
            [];

          if (Array.isArray(prefs) && prefs.length) {
            payload.llm_preferences = prefs;
            // harmless alias (backend ignores if not used)
            payload.llm_ids = prefs;
          }

          // Optional per-role overrides (future: UI swaps per role)
          if (taskData.llm_swaps && typeof taskData.llm_swaps === 'object') {
            payload.llm_swaps = taskData.llm_swaps;
          }
        }

        // Custom team-based (existing behavior)
        if (taskData?.llm_assignments && typeof taskData.llm_assignments === 'object') {
          payload.llm_assignments = taskData.llm_assignments;
        }

        // Clean undefined/null keys (keeps JSON tidy)
        Object.keys(payload).forEach((k) => {
          if (payload[k] === undefined || payload[k] === null) delete payload[k];
        });

        console.log('🎯 Creating task:', payload.name, payload);

        const response = await fetch(`${API_BASE}/api/verse-studio/task`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrf,
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || `Failed to create task: ${response.status}`);
        }

        const data = await response.json();

        // ✅ backend returns { task: { task_id: ... }, team: ... }
        const newTaskId = data?.task?.task_id || data?.task_id;

        if (!newTaskId) {
          throw new Error('No task_id returned from server');
        }

        setTaskId(newTaskId);
        setTeam(data.team || []);
        setMessages([]);
        messageIdCounter.current = 0;

        console.log('✅ Task created:', newTaskId);

        await fetchUsage(newTaskId);

        return newTaskId;
      } catch (error) {
        console.error('❌ Failed to create task:', error);

        setCircuitBreakerState((prev) => ({
          errorCount: prev.errorCount + 1,
          lastError: error.message,
          status: prev.errorCount >= 2 ? 'tripped' : 'warning',
        }));

        throw error;
      }
    },
    [fetchUsage]
  );


    // ========================================================================
  // LOAD TASK (Resume)
  // ========================================================================
  const loadTask = useCallback(
    async (taskIdToLoad) => {
      if (!taskIdToLoad) throw new Error('Missing task id');

      try {
        const response = await fetch(`${API_BASE}/api/verse-studio/task/${taskIdToLoad}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || `Failed to load task (${response.status})`);
        }

        const data = await response.json();

        const loadedTaskId = data?.task?.task_id || data?.task_id || taskIdToLoad;

        // Team + messages may be at top-level or inside context payload
        const loadedTeam = data?.team || [];
        const loadedMessages =
          data?.messages ||
          data?.context?.messages ||
          data?.history ||
          [];

        // ✅ map role_id -> role_name from team
        const teamRoleNameById = {};
        (loadedTeam || []).forEach((r) => {
          const rid = r.role_id || r.id || r.key;
          const rname = r.role_name || r.name || r.display_name;
          if (rid && rname) teamRoleNameById[rid] = rname;
        });

        const normalizedMessages = Array.isArray(loadedMessages)
          ? loadedMessages.map((m, idx) => {
              const roleId =
                m.role_id ??
                m.speaker_id ??
                m.agent_id ??
                m.from_role_id ??
                m.role ??
                (m.user || m.is_user ? 'user' : 'assistant');

              const isUser = m.user ?? m.is_user ?? m.role === 'user';

              const roleName =
                m.role_name ??
                m.speaker_name ??
                teamRoleNameById[roleId] ??
                (isUser ? 'You' : 'Assistant');

              return {
                id: m.id ?? idx,
                user: isUser,
                role_id: roleId,
                role_name: roleName,
                text: m.text ?? m.content ?? '',
                timestamp: m.timestamp ?? m.created_at ?? Date.now()
              };
            })
          : [];
        setTaskId(loadedTaskId);
        setTeam(loadedTeam);
        setMessages(normalizedMessages);

        // Reset counter so new messages get unique ids above existing list
        messageIdCounter.current = normalizedMessages.length
          ? normalizedMessages.length + 1
          : 0;

        // Load usage from response if present, else fetch usage endpoint
        if (data?.usage) {
          setUsageData({
            messages_count: data.usage.messages_count || 0,
            tokens_used: data.usage.tokens_used || 0,
            tier: data.usage.tier || 'free',
            limit: data.usage.limit || 150,
            remaining: data.usage.remaining ?? 0,
            limitReached: data.usage.limit_reached || false
          });
        } else {
          await fetchUsage(loadedTaskId);
        }

        console.log('✅ Task loaded:', loadedTaskId);
        return loadedTaskId;
      } catch (error) {
        console.error('❌ Failed to load task:', error);
        throw error;
      }
    },
    [fetchUsage]
  );


  // ========================================================================
  // SEND MESSAGE (SSE Streaming)
  // ========================================================================
  const sendMessage = useCallback(
    async (messageText, mention = null) => {
      if (!taskId || !messageText.trim()) {
        // Note: we still allow empty sends for mention handoffs elsewhere.
        if (!taskId) {
          console.error('❌ sendMessage: Missing taskId');
          return;
        }
      }

      if (circuitBreakerState.status === 'tripped') {
        throw new Error('Circuit breaker tripped. Too many errors. Please refresh.');
      }

      if (usageData.limitReached) {
        throw new Error('MESSAGE_LIMIT_REACHED');
      }

      const controller = new AbortController();
      controllerRef.current = controller;
      setIsSending(true);

      // Clear previous handoff suggestion
      setHandoffSuggestion(null);
      setShowHandoffPrompt(false);

      try {
        // Add user message (only if there is actual content)
        if (messageText && messageText.trim()) {
          const userMessageId = generateMessageId();
          const userMessage = {
            id: userMessageId,
            user: true,
            text: messageText,
            timestamp: Date.now()
          };

          setMessages((prev) => [...prev, userMessage]);
          console.log('📤 Sending message:', { id: userMessageId, text: messageText });
        }

        // Send to API
        const csrf =
          document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';
        const response = await fetch(
          `${API_BASE}/api/verse-studio/task/${taskId}/message`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrf
            },
            credentials: 'include',
            body: JSON.stringify({
              content: messageText,
              mention: mention // Direct @mention if specified
            }),
            signal: controller.signal
          }
        );

        if (!response.ok || !response.body) {
          throw new Error(`API failed: ${response.status} ${response.statusText}`);
        }

        // Parse SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let currentMessageId = null;
        let currentBuffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk
            .split('\n\n')
            .filter((line) => line.startsWith('data:'));

          for (const line of lines) {
            try {
              const jsonStr = line.replace('data: ', '');
              const data = JSON.parse(jsonStr);

              const { type } = data;

              // Response start - new role speaking
              if (type === 'response_start') {
                const { role_id, role_name } = data;

                currentMessageId = generateMessageId();
                currentBuffer = '';

                setActiveRole(role_id);

                setMessages((prev) => [
                  ...prev,
                  {
                    id: currentMessageId,
                    user: false,
                    role_id: role_id,
                    role_name: role_name,
                    text: '',
                    timestamp: Date.now()
                  }
                ]);

                console.log(`🎤 ${role_name} started speaking`);
              }

              // Token - stream content
              else if (type === 'token' && currentMessageId !== null) {
                const { content } = data;
                currentBuffer += content;

                setMessages((prev) => {
                  const copy = [...prev];
                  const msgIndex = copy.findIndex((m) => m.id === currentMessageId);

                  if (msgIndex !== -1) {
                    copy[msgIndex] = {
                      ...copy[msgIndex],
                      text: currentBuffer
                    };
                  }

                  return copy;
                });
              }

              // Response complete
              else if (type === 'response_complete') {
                const { role_id, tokens_used } = data;

                console.log(`✅ ${role_id} completed (${tokens_used} tokens)`);

                setActiveRole(null);
                currentMessageId = null;
                currentBuffer = '';
              }

              // Done event with handoff suggestion
              else if (type === 'done') {
                const { warnings, suggested_next } = data;

                console.log('✅ Stream complete');

                if (warnings && warnings.length > 0) {
                  console.warn('⚠️ Warnings:', warnings);
                }

                if (suggested_next) {
                  console.log('💡 Handoff suggestion:', suggested_next);

                  setHandoffSuggestion(suggested_next);

                  if (suggested_next.source === 'handoff') {
                    setShowHandoffPrompt(true);
                  }
                }
              }

              // Error
              else if (type === 'error') {
                console.error('❌ Backend error:', data.error);
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.warn('⚠️ JSON parse error:', parseError);
            }
          }
        }

        // Update usage (optimistic)
        setUsageData((prev) => ({
          ...prev,
          messages_count: prev.messages_count + 1,
          remaining: Math.max(0, prev.limit - prev.messages_count - 1),
          limitReached: prev.messages_count + 1 >= prev.limit
        }));

        await fetchUsage(taskId);

        setCircuitBreakerState({
          errorCount: 0,
          lastError: null,
          status: 'healthy'
        });

        console.log('✅ Message complete');
      } catch (error) {
        console.error('❌ Send message failed:', error);

        if (error.message !== 'MESSAGE_LIMIT_REACHED') {
          setCircuitBreakerState((prev) => ({
            errorCount: prev.errorCount + 1,
            lastError: error.message,
            status: prev.errorCount >= 2 ? 'tripped' : 'warning'
          }));

          const errorMessageId = generateMessageId();
          setMessages((prev) => [
            ...prev,
            {
              id: errorMessageId,
              user: false,
              role_id: 'system',
              role_name: 'System',
              text: `Error: ${error.message}`,
              timestamp: Date.now(),
              error: true
            }
          ]);
        }

        throw error;
      } finally {
        setIsSending(false);
        setActiveRole(null);
        controllerRef.current = null;
      }
    },
    [taskId, circuitBreakerState.status, usageData, fetchUsage, generateMessageId]
  );

  // ========================================================================
  // HANDOFF ACTIONS
  // ========================================================================
  const confirmHandoff = useCallback(() => {
    if (!handoffSuggestion) return;

    console.log('✅ User confirmed handoff to:', handoffSuggestion.to_role_id);

    sendMessage('', handoffSuggestion.to_role_id);

    setHandoffSuggestion(null);
    setShowHandoffPrompt(false);
  }, [handoffSuggestion, sendMessage]);

  const switchToRole = useCallback(
    (roleId) => {
      console.log('🔄 User switching to:', roleId);

      sendMessage('', roleId);

      setHandoffSuggestion(null);
      setShowHandoffPrompt(false);
    },
    [sendMessage]
  );

  const cancelHandoff = useCallback(() => {
    console.log('❌ User canceled handoff');
    setShowHandoffPrompt(false);
  }, []);

  // ========================================================================
  // STOP STREAM
  // ========================================================================
  const stopStream = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }

    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }

    setIsSending(false);
    setActiveRole(null);
    console.log('⏸️ Streaming stopped');
  }, []);

  // ========================================================================
  // RESET TASK
  // ========================================================================
  const resetTask = useCallback(() => {
    stopStream();
    setTaskId(null);
    setTeam([]);
    setMessages([]);
    messageIdCounter.current = 0;
    setHandoffSuggestion(null);
    setShowHandoffPrompt(false);
    setUsageData({
      messages_count: 0,
      tokens_used: 0,
      tier: 'free',
      limit: 150,
      remaining: 150,
      limitReached: false
    });
    setCircuitBreakerState({
      errorCount: 0,
      lastError: null,
      status: 'healthy'
    });
    console.log('🔄 Task reset');
  }, [stopStream]);

  return {
    // Task state
    taskId,
    team,
    messages,

    // LLM options
    llmOptions,
    llmOptionsLoading,
    refreshLLMOptions,

    // Streaming state
    isSending,
    activeRole,

    // Handoff state
    handoffSuggestion,
    showHandoffPrompt,

    // Usage
    usageData,
    usageLoading,

    // Circuit breaker
    circuitBreakerState,

    // Actions
    createTask,
    sendMessage,
    stopStream,
    resetTask,
    loadTask,

    // Handoff actions
    confirmHandoff,
    switchToRole,
    cancelHandoff
  };
}
