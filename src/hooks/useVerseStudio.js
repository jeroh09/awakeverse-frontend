// src/hooks/useVerseStudio.js - Verse Studio Hook with Handoff Detection
import { useState, useCallback, useRef } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

export default function useVerseStudio() {
  
  // Task state
  const [taskId, setTaskId] = useState(null);
  const [team, setTeam] = useState([]);
  const [messages, setMessages] = useState([]);
  
  // Streaming state
  const [isSending, setIsSending] = useState(false);
  const [activeRole, setActiveRole] = useState(null);
  
  // ✅ NEW: Handoff suggestion state
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
  const createTask = useCallback(async (taskData) => {
    try {
      const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';
      
      console.log('🎯 Creating task:', taskData.name);
      
      const response = await fetch(`${API_BASE}/api/verse-studio/task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf
        },
        credentials: 'include',
        body: JSON.stringify(taskData)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Failed to create task: ${response.status}`);
      }

      const data = await response.json();
      const newTaskId = data.task_id;

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
      
      setCircuitBreakerState(prev => ({
        errorCount: prev.errorCount + 1,
        lastError: error.message,
        status: prev.errorCount >= 2 ? 'tripped' : 'warning'
      }));

      throw error;
    }
  }, [fetchUsage]);

  // ========================================================================
  // SEND MESSAGE (SSE Streaming)
  // ========================================================================
  const sendMessage = useCallback(async (messageText, mention = null) => {
    if (!taskId || !messageText.trim()) {
      console.error('❌ sendMessage: Missing required params');
      return;
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
      // Add user message
      const userMessageId = generateMessageId();
      const userMessage = {
        id: userMessageId,
        user: true,
        text: messageText,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, userMessage]);
      console.log('📤 Sending message:', { id: userMessageId, text: messageText });

      // Send to API
      const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';
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
            mention: mention  // Direct @mention if specified
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
      
      let currentRole = null;
      let currentMessageId = null;
      let currentBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n').filter(line => line.startsWith('data:'));

        for (const line of lines) {
          try {
            const jsonStr = line.replace('data: ', '');
            const data = JSON.parse(jsonStr);
            
            const { type } = data;

            // Response start - new role speaking
            if (type === 'response_start') {
              const { role_id, role_name } = data;
              
              currentRole = role_id;
              currentMessageId = generateMessageId();
              currentBuffer = '';
              
              setActiveRole(role_id);

              setMessages(prev => [...prev, {
                id: currentMessageId,
                user: false,
                role_id: role_id,
                role_name: role_name,
                text: '',
                timestamp: Date.now()
              }]);

              console.log(`🎤 ${role_name} started speaking`);
            }

            // Token - stream content
            else if (type === 'token' && currentMessageId !== null) {
              const { content } = data;
              currentBuffer += content;

              setMessages(prev => {
                const copy = [...prev];
                const msgIndex = copy.findIndex(m => m.id === currentMessageId);
                
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
              currentRole = null;
              currentMessageId = null;
              currentBuffer = '';
            }

            // ✅ NEW: Done event with handoff suggestion
            else if (type === 'done') {
              const { warnings, suggested_next } = data;
              
              console.log('✅ Stream complete');
              
              // Handle warnings
              if (warnings && warnings.length > 0) {
                console.warn('⚠️ Warnings:', warnings);
              }
              
              // ✅ Handle handoff suggestion
              if (suggested_next) {
                console.log('💡 Handoff suggestion:', suggested_next);
                
                setHandoffSuggestion(suggested_next);
                
                // Only show prompt for explicit handoffs (not sequential)
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

      // Update usage
      setUsageData(prev => ({
        ...prev,
        messages_count: prev.messages_count + 1,
        remaining: Math.max(0, prev.limit - prev.messages_count - 1),
        limitReached: (prev.messages_count + 1) >= prev.limit
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
        setCircuitBreakerState(prev => ({
          errorCount: prev.errorCount + 1,
          lastError: error.message,
          status: prev.errorCount >= 2 ? 'tripped' : 'warning'
        }));

        const errorMessageId = generateMessageId();
        setMessages(prev => [...prev, {
          id: errorMessageId,
          user: false,
          role_id: 'system',
          role_name: 'System',
          text: `Error: ${error.message}`,
          timestamp: Date.now(),
          error: true
        }]);
      }

      throw error;

    } finally {
      setIsSending(false);
      setActiveRole(null);
      controllerRef.current = null;
    }
  }, [taskId, circuitBreakerState.status, usageData, fetchUsage, generateMessageId]);

  // ========================================================================
  // ✅ NEW: HANDOFF ACTIONS
  // ========================================================================
  
  // Confirm handoff - send empty message with mention
  const confirmHandoff = useCallback(() => {
    if (!handoffSuggestion) return;
    
    console.log('✅ User confirmed handoff to:', handoffSuggestion.to_role_id);
    
    // Send empty message with mention (triggers next role)
    sendMessage('', handoffSuggestion.to_role_id);
    
    // Clear suggestion
    setHandoffSuggestion(null);
    setShowHandoffPrompt(false);
  }, [handoffSuggestion, sendMessage]);

  // Switch to different role
  const switchToRole = useCallback((roleId) => {
    console.log('🔄 User switching to:', roleId);
    
    // Send empty message with different mention
    sendMessage('', roleId);
    
    // Clear suggestion
    setHandoffSuggestion(null);
    setShowHandoffPrompt(false);
  }, [sendMessage]);

  // Cancel handoff - just hide prompt
  const cancelHandoff = useCallback(() => {
    console.log('❌ User canceled handoff');
    
    setShowHandoffPrompt(false);
    // Keep suggestion in state in case user changes mind
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
    
    // Streaming state
    isSending,
    activeRole,
    
    // ✅ NEW: Handoff state
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
    
    // ✅ NEW: Handoff actions
    confirmHandoff,
    switchToRole,
    cancelHandoff
  };
}