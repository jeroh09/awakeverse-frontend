// src/hooks/useScenarioChat.js - WITH USAGE TRACKING & LIMITS
import { useState, useCallback, useRef } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

export default function useScenarioChat() {
  
  const [debateId, setDebateId] = useState(null);
  const [scenarioId, setScenarioId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [activeSpeakers, setActiveSpeakers] = useState(new Set());
  const [queuedSpeakers, setQueuedSpeakers] = useState(new Set());
  
  const [usageData, setUsageData] = useState({
    questionsAsked: 0,
    tier: 'free',
    limit: 2,
    limitReached: false,
    remaining: 2
  });
  const [usageLoading, setUsageLoading] = useState(false);
  
  const [circuitBreakerState, setCircuitBreakerState] = useState({
    errorCount: 0,
    lastError: null,
    status: 'healthy'
  });

  const controllerRef = useRef(null);
  const animationIntervalsRef = useRef(new Set());
  const messageIdCounter = useRef(0);

  const generateMessageId = useCallback(() => {
    return messageIdCounter.current++;
  }, []);

  const fetchUsage = useCallback(async (scenarioIdToFetch) => {
    if (!scenarioIdToFetch) return;
    try {
      setUsageLoading(true);
      
      const response = await fetch(`${API_BASE}/api/debate/scenarios/${scenarioIdToFetch}/usage`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        
        setUsageData({
          questionsAsked: data.questions_asked || 0,
          tier: data.tier || 'free',
          limit: data.limit,
          limitReached: data.limit_reached || false,
          remaining: data.remaining !== null ? data.remaining : 2
        });

        console.log('📊 Usage data loaded:', data);
        // ✅ ADD THIS DEBUG LOG
        console.log('📊 Usage updated:', {
          questionsAsked: usageData.questionsAsked + 1,
          limit: usageData.limit,
          remaining: usageData.remaining,
          limitReached: usageData.limitReached
        });
      }
    } catch (error) {
      console.error('⚠️ Failed to fetch usage:', error);
    } finally {
      setUsageLoading(false);
    }
  }, []);

  const startScenario = useCallback(async (scenario) => {
    if (!scenario) {
      console.error('❌ startScenario: Missing token or scenario');
      return null;
    }

    try {
      const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';
      console.log('🎭 Starting scenario:', scenario.id);
      const response = await fetch(`${API_BASE}/api/debate/scenarios/${scenario.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf
        },
        credentials: 'include'

      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Failed to start scenario: ${response.status}`);
      }

      const data = await response.json();
      const newDebateId = data.debate_id;

      if (!newDebateId) {
        throw new Error('No debate_id returned from server');
      }

      setDebateId(newDebateId);
      setScenarioId(scenario.id);
      // ✅ Load existing messages if resuming, otherwise start fresh
      if (data.messages && data.messages.length > 0) {
        console.log('📚 Loading existing messages:', data.messages.length);
        setMessages(data.messages);
        messageIdCounter.current = data.messages.length;
      } else {
        setMessages([]);
        messageIdCounter.current = 0;
      }

      console.log('✅ Scenario started, debate_id:', newDebateId);

      await fetchUsage(scenario.id);

      return newDebateId;

    } catch (error) {
      console.error('❌ Failed to start scenario:', error);
      
      setCircuitBreakerState(prev => ({
        errorCount: prev.errorCount + 1,
        lastError: error.message,
        status: prev.errorCount >= 2 ? 'tripped' : 'warning'
      }));

      throw error;
    }
  }, [fetchUsage]);

  const sendMessage = useCallback(async (messageText) => {
    if (!debateId || !messageText.trim()) {
      console.error('❌ sendMessage: Missing required params');
      return;
    }

    if (circuitBreakerState.status === 'tripped') {
      throw new Error('Circuit breaker tripped. Too many errors. Please refresh and try again.');
    }

    if (usageData.limitReached) {
      throw new Error('MESSAGE_LIMIT_REACHED');
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    setIsSending(true);

    try {
      const userMessageId = generateMessageId();
      const userMessage = {
        id: userMessageId,
        user: true,
        text: messageText,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, userMessage]);
      console.log('📤 Sending message:', { id: userMessageId, text: messageText });

      const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';
      const response = await fetch(`${API_BASE}/api/debate/${debateId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf
        },
        credentials: 'include',
        body: JSON.stringify({ message: messageText }),
        signal: controller.signal
      });

      if (!response.ok || !response.body) {
        throw new Error(`Debate API failed: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      const speakerBuffers = new Map();
      const completedSpeakers = new Set();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.trim().split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            const { type, speaker, content, display_name } = data;

            if (type === 'error') {
              console.error('❌ Backend error:', data.error);
              continue;
            }

            if (type === 'complete') {
              console.log('✅ Stream complete:', data);
              break;
            }

            if (type === 'response' && speaker && content) {
              if (!speakerBuffers.has(speaker)) {
                const messageId = generateMessageId();
                
                speakerBuffers.set(speaker, {
                  fullText: content,
                  displayedText: '',
                  messageId: messageId,
                  displayName: display_name || speaker
                });

                setActiveSpeakers(prev => new Set([...prev, speaker]));

                setMessages(prev => [...prev, {
                  id: messageId,
                  user: false,
                  speaker: speaker,
                  display_name: display_name || speaker,  // ✅ ADD THIS SINGLE LINE
                  text: '',
                  timestamp: Date.now()
                }]);

                animateResponse(speaker, content, speakerBuffers, completedSpeakers);
              }
            }

          } catch (parseError) {
            console.warn('⚠️ JSON parse error:', parseError);
          }
        }
      }

      await waitForAnimations(speakerBuffers);

      setUsageData(prev => ({
        ...prev,
        questionsAsked: prev.questionsAsked + 1,
        remaining: prev.limit !== null ? Math.max(0, prev.limit - prev.questionsAsked - 1) : null,
        limitReached: prev.limit !== null && (prev.questionsAsked + 1) >= prev.limit
      }));

      if (scenarioId) {
        await fetchUsage(scenarioId);
      }

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
          speaker: 'system',
          text: `Failed to get response: ${error.message}`,
          timestamp: Date.now(),
          error: true
        }]);
      }

      throw error;

    } finally {
      setIsSending(false);
      setActiveSpeakers(new Set());
      setQueuedSpeakers(new Set());
      controllerRef.current = null;
    }

    function animateResponse(speaker, fullText, buffers, completed) {
      const words = fullText.split(' ');
      let wordIndex = 0;
      const WORDS_PER_TICK = 2;
      const DELAY_MS = 100;

      const interval = setInterval(() => {
        if (wordIndex >= words.length) {
          clearInterval(interval);
          animationIntervalsRef.current.delete(interval);
          completed.add(speaker);
          
          setActiveSpeakers(prev => {
            const next = new Set(prev);
            next.delete(speaker);
            return next;
          });
          
          console.log(`✅ ${speaker} animation complete`);
          return;
        }

        const batch = words.slice(wordIndex, wordIndex + WORDS_PER_TICK).join(' ');
        wordIndex += WORDS_PER_TICK;

        const buffer = buffers.get(speaker);
        if (buffer) {
          buffer.displayedText += (buffer.displayedText ? ' ' : '') + batch;

          setMessages(prev => {
            const copy = [...prev];
            const msgIndex = copy.findIndex(m => m.id === buffer.messageId);
            
            if (msgIndex !== -1) {
              copy[msgIndex] = {
                ...copy[msgIndex],
                text: buffer.displayedText
              };
            }
            
            return copy;
          });
        }
      }, DELAY_MS);

      animationIntervalsRef.current.add(interval);

      if (buffers.has(speaker)) {
        buffers.get(speaker).interval = interval;
      }
    }

    async function waitForAnimations(buffers) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          let allComplete = true;
          
          for (const [speaker, buffer] of buffers.entries()) {
            if (buffer.displayedText !== buffer.fullText) {
              allComplete = false;
              break;
            }
          }

          if (allComplete) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, 30000);
      });
    }
  }, [debateId, circuitBreakerState.status, usageData, scenarioId, fetchUsage, generateMessageId]);

// =============================================================================
// ADD TO: useScenarioChat.js
// LOCATION: After the sendMessage function, before stopStream
// =============================================================================

  const continueConversation = useCallback(async (lastSpeaker) => {
    if (!debateId || !scenarioId || isSending) {
      console.warn('⚠️ continueConversation: Invalid state', { 
        debateId, 
        scenarioId, 
        isSending 
      });
      return;
    }

    if (circuitBreakerState.status === 'tripped') {
      throw new Error('Circuit breaker tripped. Too many errors. Please refresh and try again.');
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    setIsSending(true);

    try {
      console.log('🔄 Continue conversation:', { lastSpeaker, debateId });

      const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';
      const response = await fetch(`${API_BASE}/api/debate/${debateId}/continue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf
        },
        credentials: 'include',
        body: JSON.stringify({ 
          debate_id: debateId,
          last_speaker: lastSpeaker 
        }),
        signal: controller.signal
      });

      if (!response.ok || !response.body) {
        throw new Error(`Continue API failed: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      const speakerBuffers = new Map();
      const completedSpeakers = new Set();
      let nextSpeaker = null;
      let decisionReason = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.trim().split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            const { type, speaker, content, display_name, decision } = data;

            if (type === 'error') {
              console.error('❌ Backend error:', data.error);
              continue;
            }

            if (type === 'complete') {
              console.log('✅ Continue complete:', { speaker, decision });
              nextSpeaker = speaker;
              decisionReason = decision;
              break;
            }

            if (type === 'response' && speaker && content) {
              // Same streaming logic as sendMessage
              if (!speakerBuffers.has(speaker)) {
                const messageId = generateMessageId();
                
                speakerBuffers.set(speaker, {
                  fullText: content,
                  displayedText: '',
                  messageId: messageId,
                  displayName: display_name || speaker
                });

                setActiveSpeakers(prev => new Set([...prev, speaker]));

                setMessages(prev => [...prev, {
                  id: messageId,
                  user: false,
                  speaker: speaker,
                  display_name: display_name || speaker,
                  text: '',
                  timestamp: Date.now()
                }]);

                animateResponse(speaker, content, speakerBuffers, completedSpeakers);
              }
            }

          } catch (parseError) {
            console.warn('⚠️ JSON parse error:', parseError);
          }
        }
      }

      await waitForAnimations(speakerBuffers);

      // 📊 Log decision for analytics
      console.log('📊 Continue decision:', { nextSpeaker, decisionReason, lastSpeaker });

      setCircuitBreakerState({
        errorCount: 0,
        lastError: null,
        status: 'healthy'
      });

      console.log('✅ Continue complete');

    } catch (error) {
      console.error('❌ Continue conversation failed:', error);

      setCircuitBreakerState(prev => ({
        errorCount: prev.errorCount + 1,
        lastError: error.message,
        status: prev.errorCount >= 2 ? 'tripped' : 'warning'
      }));

      const errorMessageId = generateMessageId();
      setMessages(prev => [...prev, {
        id: errorMessageId,
        user: false,
        speaker: 'system',
        text: `Failed to continue: ${error.message}`,
        timestamp: Date.now(),
        error: true
      }]);

      throw error;

    } finally {
      setIsSending(false);
      setActiveSpeakers(new Set());
      setQueuedSpeakers(new Set());
      controllerRef.current = null;
    }

    // ⚠️ IMPORTANT: These helper functions must be accessible
    // Either define them here or ensure they're shared with sendMessage
    function animateResponse(speaker, fullText, buffers, completed) {
      const words = fullText.split(' ');
      let wordIndex = 0;
      const WORDS_PER_TICK = 2;
      const DELAY_MS = 100;

      const interval = setInterval(() => {
        if (wordIndex >= words.length) {
          clearInterval(interval);
          animationIntervalsRef.current.delete(interval);
          completed.add(speaker);
          
          setActiveSpeakers(prev => {
            const next = new Set(prev);
            next.delete(speaker);
            return next;
          });
          
          console.log(`✅ ${speaker} animation complete`);
          return;
        }

        const batch = words.slice(wordIndex, wordIndex + WORDS_PER_TICK).join(' ');
        wordIndex += WORDS_PER_TICK;

        const buffer = buffers.get(speaker);
        if (buffer) {
          buffer.displayedText += (buffer.displayedText ? ' ' : '') + batch;

          setMessages(prev => {
            const copy = [...prev];
            const msgIndex = copy.findIndex(m => m.id === buffer.messageId);
            
            if (msgIndex !== -1) {
              copy[msgIndex] = {
                ...copy[msgIndex],
                text: buffer.displayedText
              };
            }
            
            return copy;
          });
        }
      }, DELAY_MS);

      animationIntervalsRef.current.add(interval);

      if (buffers.has(speaker)) {
        buffers.get(speaker).interval = interval;
      }
    }

    async function waitForAnimations(buffers) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          let allComplete = true;
          
          for (const [speaker, buffer] of buffers.entries()) {
            if (buffer.displayedText !== buffer.fullText) {
              allComplete = false;
              break;
            }
          }

          if (allComplete) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, 30000);
      });
    }
  }, [debateId, scenarioId, circuitBreakerState.status, isSending, generateMessageId]);

//=============================================================================
//ADD TO: useScenarioChat.js
// LOCATION: After continueConversation function (around line 480)
//=============================================================================

  const nextSpeaker = useCallback(async (currentSpeaker) => {
    if (!debateId || !scenarioId || isSending) {
      console.warn('⚠️ nextSpeaker: Invalid state', { 
        debateId, 
        scenarioId, 
        isSending 
      });
      return;
    }

    if (circuitBreakerState.status === 'tripped') {
      throw new Error('Circuit breaker tripped. Too many errors. Please refresh and try again.');
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    setIsSending(true);

    try {
      console.log('➕ Next speaker:', { currentSpeaker, debateId });

      const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';
      const response = await fetch(`${API_BASE}/api/debate/${debateId}/next-speaker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf
        },
        credentials: 'include',
        body: JSON.stringify({ 
          current_speaker: currentSpeaker 
        }),
        signal: controller.signal
      });

      if (!response.ok || !response.body) {
        throw new Error(`Next Speaker API failed: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      const speakerBuffers = new Map();
      const completedSpeakers = new Set();
      let selectedSpeaker = null;
      let decisionReason = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.trim().split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            const { type, speaker, content, display_name, decision, excluded } = data;

            if (type === 'error') {
              console.error('❌ Backend error:', data.error);
              continue;
            }

            if (type === 'complete') {
              console.log('✅ Next speaker complete:', { speaker, decision, excluded });
              selectedSpeaker = speaker;
              decisionReason = decision;
              console.log('📊 Next speaker decision:', { 
                nextSpeaker: speaker, 
                decisionReason: decision,
                excluded: excluded
              });
              continue;
            }

            if (type === 'response' && speaker && content) {
              if (!speakerBuffers.has(speaker)) {
                const messageId = generateMessageId();
                
                speakerBuffers.set(speaker, {
                  fullText: content,
                  displayedText: '',
                  messageId: messageId,
                  displayName: display_name || speaker
                });

                setActiveSpeakers(prev => new Set([...prev, speaker]));

                setMessages(prev => [...prev, {
                  id: messageId,
                  user: false,
                  speaker: speaker,
                  display_name: display_name || speaker,
                  text: '',
                  timestamp: Date.now()
                }]);

                animateResponse(speaker, content, speakerBuffers, completedSpeakers);
              }
            }

          } catch (parseError) {
            console.warn('⚠️ JSON parse error:', parseError);
          }
        }
      }

      await waitForAnimations(speakerBuffers);

      setCircuitBreakerState({
        errorCount: 0,
        lastError: null,
        status: 'healthy'
      });

      console.log('✅ Next speaker message complete');

    } catch (error) {
      console.error('❌ Next speaker failed:', error);

      setCircuitBreakerState(prev => ({
        errorCount: prev.errorCount + 1,
        lastError: error.message,
        status: prev.errorCount >= 2 ? 'tripped' : 'warning'
      }));

      const errorMessageId = generateMessageId();
      setMessages(prev => [...prev, {
        id: errorMessageId,
        user: false,
        speaker: 'system',
        text: `Failed to get next speaker: ${error.message}`,
        timestamp: Date.now(),
        error: true
      }]);

      throw error;

    } finally {
      setIsSending(false);
      setActiveSpeakers(new Set());
      setQueuedSpeakers(new Set());
      controllerRef.current = null;
    }

    // Reuse the same animation helper functions
    function animateResponse(speaker, fullText, buffers, completed) {
      const words = fullText.split(' ');
      let wordIndex = 0;
      const WORDS_PER_TICK = 2;
      const DELAY_MS = 100;

      const interval = setInterval(() => {
        if (wordIndex >= words.length) {
          clearInterval(interval);
          animationIntervalsRef.current.delete(interval);
          completed.add(speaker);
          
          setActiveSpeakers(prev => {
            const next = new Set(prev);
            next.delete(speaker);
            return next;
          });
          
          console.log(`✅ ${speaker} animation complete`);
          return;
        }

        const batch = words.slice(wordIndex, wordIndex + WORDS_PER_TICK).join(' ');
        wordIndex += WORDS_PER_TICK;

        const buffer = buffers.get(speaker);
        if (buffer) {
          buffer.displayedText += (buffer.displayedText ? ' ' : '') + batch;
          
          setMessages(prev => prev.map(msg =>
            msg.id === buffer.messageId
              ? { ...msg, text: buffer.displayedText }
              : msg
          ));
        }
      }, DELAY_MS);

      animationIntervalsRef.current.add(interval);
    }

    async function waitForAnimations(buffers) {
      const checkComplete = () => {
        for (const interval of animationIntervalsRef.current) {
          clearInterval(interval);
        }
        animationIntervalsRef.current.clear();
        
        setMessages(prev => prev.map(msg => {
          for (const [speaker, buffer] of buffers.entries()) {
            if (msg.id === buffer.messageId) {
              return { ...msg, text: buffer.fullText };
            }
          }
          return msg;
        }));
      };

      await new Promise(resolve => setTimeout(resolve, 500));
      checkComplete();
    }
  }, [debateId, scenarioId, isSending, circuitBreakerState.status, generateMessageId]);


  const stopStream = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    
    animationIntervalsRef.current.forEach(interval => clearInterval(interval));
    animationIntervalsRef.current.clear();
    
    setIsSending(false);
    setActiveSpeakers(new Set());
    setQueuedSpeakers(new Set());
    console.log('⏸️ Streaming stopped');
  }, []);

  const resetScenario = useCallback(() => {
    stopStream();
    setDebateId(null);
    setScenarioId(null);
    setMessages([]);
    messageIdCounter.current = 0;
    setUsageData({
      questionsAsked: 0,
      tier: 'free',
      limit: 2,
      limitReached: false,
      remaining: 2
    });
    setCircuitBreakerState({
      errorCount: 0,
      lastError: null,
      status: 'healthy'
    });
    console.log('🔄 Scenario reset');
  }, [stopStream]);

  return {
    debateId,
    messages,
    isSending,
    activeSpeakers: Array.from(activeSpeakers),
    queuedSpeakers: Array.from(queuedSpeakers),
    circuitBreakerState,
    usageData,
    usageLoading,
    startScenario,
    continueConversation,
    nextSpeaker,   // ✅ ADD THIS
    sendMessage,
    stopStream,
    resetScenario
  };
}