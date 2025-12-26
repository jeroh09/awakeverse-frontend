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

  // ✅ NEW: Artifacts state (backend-owned)
  const [artifacts, setArtifacts] = useState([]);

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

  // Intelligence Stack state
  const [constitutionalDecisions, setConstitutionalDecisions] = useState([]);
  const [constitutionalLoading, setConstitutionalLoading] = useState(false);
  
  const [semanticStats, setSemanticStats] = useState({
    indexed_messages: 0,
    total_messages: 0,
    search_enabled: false,
    average_savings: 0
  });
  const [semanticStatsLoading, setSemanticStatsLoading] = useState(false);
  
  const [intelligenceStats, setIntelligenceStats] = useState(null);
  const [intelligenceStatsLoading, setIntelligenceStatsLoading] = useState(false);

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

      const res = await fetch(`${API_BASE}/api/verse-studio/llms`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();

        if (data.success && Array.isArray(data.llms) && data.llms.length) {
          // Transform backend format to frontend format
          const options = data.llms.map(llm => ({
            id: llm.id,
            label: llm.label || llm.display_name,
            provider: llm.provider || 'Groq',
            tier: llm.tier || 'free',
            capabilities: Array.isArray(llm.capabilities) 
              ? llm.capabilities 
              : [llm.primary_specialty || 'General'],
            description: llm.description || '',
            cost_per_1m_tokens: llm.cost_per_1m_tokens || 0.0,
            languages: Array.isArray(llm.languages) ? llm.languages : [],
            speed: llm.speed || 'medium',
            quality_score: llm.quality_score || 0.5,
            personality: llm.personality || {},
            avatar_url: llm.avatar_url,
            best_for: Array.isArray(llm.best_for) ? llm.best_for : [],
            limitations: Array.isArray(llm.limitations) ? llm.limitations : []
          }));

          setLlmOptions(options);
          return options;
        }
      }

      // Fallback to your 3 free LLMs if backend fails
      const freeLLMs = [
        {
          id: 'deepseek_coder',
          label: 'DeepSeek Coder',
          provider: 'Groq',
          tier: 'free',
          capabilities: ['Code Generation', 'Debugging'],
          description: 'Lightning-fast code generation specialist',
          cost_per_1m_tokens: 0.0,
          personality: { emoji: '🔧', tagline: 'I build it fast and build it right' }
        },
        {
          id: 'llama_70b',
          label: 'Llama 70B',
          provider: 'Groq',
          tier: 'free',
          capabilities: ['Code Review', 'Debugging'],
          description: 'The best free code reviewer',
          cost_per_1m_tokens: 0.0,
          personality: { emoji: '🔍', tagline: 'I catch bugs before they bite' }
        },
        {
          id: 'llama_8b',
          label: 'Llama 8B',
          provider: 'Groq',
          tier: 'free',
          capabilities: ['Documentation', 'Teaching'],
          description: 'Fast, friendly documenter',
          cost_per_1m_tokens: 0.0,
          personality: { emoji: '📚', tagline: 'I make code easy to understand' }
        }
      ];

      setLlmOptions(freeLLMs);
      return freeLLMs;
    } catch (e) {
      console.warn('⚠️ LLM options endpoint unavailable; using 3 free LLMs.');

      const freeLLMs = [
        {
          id: 'deepseek_coder',
          label: 'DeepSeek Coder',
          provider: 'Groq',
          tier: 'free',
          capabilities: ['Code Generation'],
          description: 'Code generation specialist'
        },
        {
          id: 'llama_70b',
          label: 'Llama 70B',
          provider: 'Groq',
          tier: 'free',
          capabilities: ['Code Review'],
          description: 'Code reviewer and debugger'
        },
        {
          id: 'llama_8b',
          label: 'Llama 8B',
          provider: 'Groq',
          tier: 'free',
          capabilities: ['Documentation'],
          description: 'Documentation specialist'
        }
      ];

      setLlmOptions(freeLLMs);
      return freeLLMs;
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
  // INTELLIGENCE STACK: FETCH CONSTITUTIONAL DECISIONS
  // ========================================================================
  const fetchConstitutionalDecisions = useCallback(async (taskIdToFetch) => {
    if (!taskIdToFetch) return;

    try {
      setConstitutionalLoading(true);

      const response = await fetch(
        `${API_BASE}/api/verse-studio/task/${taskIdToFetch}/constitutional-decisions`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConstitutionalDecisions(data.decisions || []);
        console.log('📜 Constitutional decisions loaded:', data.decisions?.length || 0);
      } else {
        // Graceful degradation - route might not exist yet
        console.warn('⚠️ Constitutional decisions endpoint unavailable');
        setConstitutionalDecisions([]);
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch constitutional decisions:', error);
      setConstitutionalDecisions([]);
    } finally {
      setConstitutionalLoading(false);
    }
  }, []);

  // ========================================================================
  // INTELLIGENCE STACK: FETCH SEMANTIC SEARCH STATS
  // ========================================================================
  const fetchSemanticStats = useCallback(async (taskIdToFetch) => {
    if (!taskIdToFetch) return;

    try {
      setSemanticStatsLoading(true);

      const response = await fetch(
        `${API_BASE}/api/verse-studio/task/${taskIdToFetch}/semantic-stats`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSemanticStats(data.stats || {
          indexed_messages: 0,
          total_messages: 0,
          search_enabled: false,
          average_savings: 0
        });
        console.log('🔍 Semantic stats loaded:', data.stats);
      } else {
        console.warn('⚠️ Semantic stats endpoint unavailable');
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch semantic stats:', error);
    } finally {
      setSemanticStatsLoading(false);
    }
  }, []);

  // ========================================================================
  // INTELLIGENCE STACK: FETCH INTELLIGENCE STATS
  // ========================================================================
  const fetchIntelligenceStats = useCallback(async (taskIdToFetch) => {
    if (!taskIdToFetch) return;

    try {
      setIntelligenceStatsLoading(true);

      const response = await fetch(
        `${API_BASE}/api/verse-studio/task/${taskIdToFetch}/intelligence-stats`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIntelligenceStats(data);
        console.log('📊 Intelligence stats loaded:', data);
      } else {
        console.warn('⚠️ Intelligence stats endpoint unavailable');
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch intelligence stats:', error);
    } finally {
      setIntelligenceStatsLoading(false);
    }
  }, []);

  // ========================================================================
  // ✅ REFRESH ARTIFACTS ONLY (safe; does not overwrite chat state)
  // ========================================================================
  const refreshArtifacts = useCallback(async (taskIdToFetch) => {
    if (!taskIdToFetch) return [];

    try {
      const res = await fetch(`${API_BASE}/api/verse-studio/task/${taskIdToFetch}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to refresh artifacts (${res.status})`);
      }

      const data = await res.json();

      // Backend may return artifacts at data.artifacts or data.task.artifacts
      const nextArtifacts =
        data?.artifacts ||
        data?.task?.artifacts ||
        [];

      if (Array.isArray(nextArtifacts)) {
        setArtifacts(nextArtifacts);
        return nextArtifacts;
      }

      setArtifacts([]);
      return [];
    } catch (e) {
      console.warn('⚠️ refreshArtifacts failed:', e);
      return [];
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

        const payload = {
          name: taskData?.name,
          description: taskData?.description || '',
        };

        if (taskData?.template_id) {
          payload.template_id = taskData.template_id;

          const prefs =
            taskData.llm_preferences ||
            taskData.llm_ids ||
            taskData.models ||
            taskData.selected_models ||
            [];

          if (Array.isArray(prefs) && prefs.length) {
            payload.llm_preferences = prefs;
            payload.llm_ids = prefs;
          }

          if (taskData.llm_swaps && typeof taskData.llm_swaps === 'object') {
            payload.llm_swaps = taskData.llm_swaps;
          }
        }

        // ✅ FIXED: Pass through custom_roles for custom tasks
        if (taskData?.custom_roles && Array.isArray(taskData.custom_roles)) {
          payload.custom_roles = taskData.custom_roles;
        }

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

        const newTaskId = data?.task?.task_id || data?.task_id;

        if (!newTaskId) {
          throw new Error('No task_id returned from server');
        }

        setTaskId(newTaskId);
        setTeam(data.team || []);
        setMessages([]);
        setArtifacts([]); // ✅ reset artifacts
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

        const loadedTeam = data?.team || [];
        const loadedMessages =
          data?.messages ||
          data?.context?.messages ||
          data?.history ||
          [];

        // ✅ NEW: artifacts from backend
        const loadedArtifacts =
          data?.artifacts ||
          data?.task?.artifacts ||
          [];

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
        setArtifacts(Array.isArray(loadedArtifacts) ? loadedArtifacts : []);

        messageIdCounter.current = normalizedMessages.length
          ? normalizedMessages.length + 1
          : 0;

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

        // ✅ INTELLIGENCE STACK: Fetch all intelligence data
        await Promise.all([
          fetchConstitutionalDecisions(loadedTaskId),
          fetchSemanticStats(loadedTaskId),
          fetchIntelligenceStats(loadedTaskId)
        ]);

        console.log('✅ Task loaded:', loadedTaskId);
        return loadedTaskId;
      } catch (error) {
        console.error('❌ Failed to load task:', error);
        throw error;
      }
    },
    [fetchUsage, fetchConstitutionalDecisions, fetchSemanticStats, fetchIntelligenceStats]
  );

  // ========================================================================
  // SEND MESSAGE (SSE Streaming)
  // ========================================================================
  const sendMessage = useCallback(
    async (messageText, mention = null) => {
      if (!taskId || !messageText.trim()) {
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

      setHandoffSuggestion(null);
      setShowHandoffPrompt(false);

      try {
        // In useVerseStudio.js, replace lines 635-647
        if (messageText && messageText.trim()) {
          const userMessageId = generateMessageId();
          const userMessage = {
            id: userMessageId,
            user: true,
            text: messageText,
            timestamp: Date.now()
          };

          // ✅ DEFENSIVE: Prevent duplicate user messages
          setMessages((prev) => {
            // Check for duplicate message in last 2 seconds
            const isDuplicate = prev.some(m => 
              m.user && 
              m.text === messageText && 
              (Date.now() - (m.timestamp || 0)) < 2000
            );

            if (isDuplicate) {
              console.error('🚨 DUPLICATE MESSAGE PREVENTED:', {
                text: messageText.substring(0, 50),
                timestamp: Date.now(),
                stackTrace: new Error().stack // ✅ This shows WHERE the duplicate came from
              });
              return prev; // Don't add duplicate
            }

            console.log('✅ Adding user message:', { id: userMessageId, text: messageText.substring(0, 50) });
            return [...prev, userMessage];
          });
        }
        
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
              mention: mention
            }),
            signal: controller.signal
          }
        );

        if (!response.ok || !response.body) {
          throw new Error(`API failed: ${response.status} ${response.statusText}`);
        }

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
              } else if (type === 'token' && currentMessageId !== null) {
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
              } else if (type === 'response_complete') {
                setActiveRole(null);
                currentMessageId = null;
                currentBuffer = '';
              } else if (type === 'done') {
                const { warnings, suggested_next } = data;

                if (warnings && warnings.length > 0) {
                  console.warn('⚠️ Warnings:', warnings);
                }

                if (suggested_next) {
                  setHandoffSuggestion(suggested_next);
                  if (suggested_next.source === 'handoff') {
                    setShowHandoffPrompt(true);
                  }
                }
              } else if (type === 'error') {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.warn('⚠️ JSON parse error:', parseError);
            }
          }
        }

        setUsageData((prev) => ({
          ...prev,
          messages_count: prev.messages_count + 1,
          remaining: Math.max(0, prev.limit - prev.messages_count - 1),
          limitReached: prev.messages_count + 1 >= prev.limit
        }));

        await fetchUsage(taskId);

        // ✅ NEW: refresh artifacts only after the response is fully created
        await refreshArtifacts(taskId);

        // ✅ INTELLIGENCE STACK: Refresh intelligence data after message
        await Promise.all([
          fetchConstitutionalDecisions(taskId),
          fetchSemanticStats(taskId),
          fetchIntelligenceStats(taskId)
        ]);

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
    [taskId, circuitBreakerState.status, usageData, fetchUsage, generateMessageId, refreshArtifacts, fetchConstitutionalDecisions, fetchSemanticStats, fetchIntelligenceStats]
  );

  // ========================================================================
  // HANDOFF ACTIONS
  // ========================================================================
  const confirmHandoff = useCallback(() => {
    if (!handoffSuggestion) return;

    sendMessage('', handoffSuggestion.to_role_id);

    setHandoffSuggestion(null);
    setShowHandoffPrompt(false);
  }, [handoffSuggestion, sendMessage]);

  const switchToRole = useCallback(
    (roleId) => {
      sendMessage('', roleId);

      setHandoffSuggestion(null);
      setShowHandoffPrompt(false);
    },
    [sendMessage]
  );

  const cancelHandoff = useCallback(() => {
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
    setArtifacts([]); // ✅ reset artifacts
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
    // ✅ INTELLIGENCE STACK: Reset all intelligence state
    setConstitutionalDecisions([]);
    setSemanticStats({
      indexed_messages: 0,
      total_messages: 0,
      search_enabled: false,
      average_savings: 0
    });
    setIntelligenceStats(null);
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
    artifacts, // ✅ expose artifacts

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

    // Intelligence Stack
    constitutionalDecisions,
    constitutionalLoading,
    fetchConstitutionalDecisions,
    semanticStats,
    semanticStatsLoading,
    fetchSemanticStats,
    intelligenceStats,
    intelligenceStatsLoading,
    fetchIntelligenceStats,

    // Circuit breaker
    circuitBreakerState,

    // Actions
    createTask,
    sendMessage,
    stopStream,
    resetTask,
    loadTask,

    // ✅ NEW
    refreshArtifacts,

    // Handoff actions
    confirmHandoff,
    switchToRole,
    cancelHandoff
  };
}