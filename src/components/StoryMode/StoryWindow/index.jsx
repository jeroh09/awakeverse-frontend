// src/components/StoryMode/StoryWindow/index.jsx
// Updated to use new two-panel layout with progress data integration

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useUser } from '../../../contexts/UserContext';
import useStoryApi from '../../../hooks/useStoryApi';
import DefensiveStoryWrapper from '../DefensiveStoryWrapper';
import StoryWindowLayout from './StoryWindowLayout';

/**
 * StoryWindow - Main story chat interface
 * 
 * Props:
 * - story: Story object with metadata
 * - onClose: Callback to return to story list
 */
export default function StoryWindow({ story, onClose }) {
  const { user } = useUser();
  const { sendMessageStream, getStoryProgress, getStoryContext } = useStoryApi();
  
  // State for messages
  const [messages, setMessages] = useState([]);
  const [openingBanner, setOpeningBanner] = useState(null);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showPulsingCursor, setShowPulsingCursor] = useState(false);
  
  // State for progress data
  const [progressData, setProgressData] = useState(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  
  // Abort controller for streaming
  const abortControllerRef = useRef(null);
  
  // Streaming control refs - FIXED BUFFER APPROACH
  const wordBufferRef = useRef([]);           // Buffer of ALL words (grows as chunks arrive)
  const displayedIndexRef = useRef(0);        // How many words we've displayed so far
  const streamTimerRef = useRef(null);        // Display timer (runs independently)
  const isStreamCompleteRef = useRef(false);  // Track if stream finished

  // Initial load - fetch story context (messages + opening banner)
  useEffect(() => {
    if (!story?.id) return;

    const initializeStory = async () => {
      try {
        console.log('📖 Loading story context:', story.id);
        const data = await getStoryContext(story.id);

        // Set messages from API
        const msgs = data.messages || [];
        setMessages(msgs);

        // Set opening banner from starting_situation or current_situation
        const banner =
          data.story?.starting_situation ||
          data.story?.current_situation ||
          story?.starting_situation ||
          story?.current_situation ||
          null;
        setOpeningBanner(banner);

        console.log('✅ Story initialized:', {
          messages: msgs.length,
          banner: banner ? 'Present' : 'None'
        });
      } catch (err) {
        console.error('❌ Failed to initialize story:', err);
      }
    };

    initializeStory();
  }, [story?.id, getStoryContext]);

  // Fetch progress data
  const fetchProgressData = useCallback(async (storyId) => {
    if (!storyId) return;

    setIsLoadingProgress(true);
    try {
      const data = await getStoryProgress(storyId);
      console.log('📊 Progress data loaded:', data);
      setProgressData(data);
    } catch (err) {
      console.warn('⚠️ Progress endpoint unavailable:', err.message);
      // Don't set progressData - will use fallback
    } finally {
      setIsLoadingProgress(false);
    }
  }, [getStoryProgress]);

  // Initial load - fetch progress data
  useEffect(() => {
    if (story?.id) {
      fetchProgressData(story.id);
    }
  }, [story?.id, fetchProgressData]);

  // Refresh progress after each message
  useEffect(() => {
    if (messages.length > 0 && story?.id) {
      // Debounce progress refresh to avoid too many requests
      const timeoutId = setTimeout(() => {
        fetchProgressData(story.id);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, story?.id, fetchProgressData]);

  // Start the reveal loop (called ONCE at stream start)
  // Regular function - no useCallback needed since it only uses refs
  const startRevealLoop = () => {
    if (streamTimerRef.current) return; // Already running
    
    console.log('🎬 Starting reveal loop');
    
    streamTimerRef.current = setInterval(() => {
      const totalWords = wordBufferRef.current.length;
      const currentIndex = displayedIndexRef.current;
      
      // Check if we're caught up with buffer
      if (currentIndex >= totalWords) {
        // If stream is complete and we've shown everything, stop
        if (isStreamCompleteRef.current) {
          console.log('✅ Reveal complete - stopping timer');
          clearInterval(streamTimerRef.current);
          streamTimerRef.current = null;
          setShowPulsingCursor(true);
        }
        // Otherwise keep timer running, waiting for more chunks
        return;
      }
      
      // Reveal next 3-5 words
      const chunkSize = Math.floor(Math.random() * 3) + 3; // 3-5 words
      const nextIndex = Math.min(currentIndex + chunkSize, totalWords);
      
      // Get words to display
      const wordsToShow = wordBufferRef.current.slice(0, nextIndex);
      setStreamingMessage(wordsToShow.join(' '));
      displayedIndexRef.current = nextIndex;
      
    }, 200); // 200ms between chunks = natural reading pace
  };

  // Update word buffer (called by onDelta as chunks arrive)
  const updateWordBuffer = useCallback((fullText) => {
    // Split into words and update buffer
    const words = fullText.split(/\s+/).filter(w => w.length > 0);
    wordBufferRef.current = words;
    
    // Start reveal loop if not already running
    if (!streamTimerRef.current && !isStreamCompleteRef.current) {
      startRevealLoop();
    }
  }, []); // Empty deps - startRevealLoop is regular function, uses only refs

  // Handle send message
  const handleSendMessage = useCallback(async (content) => {
    if (!content.trim() || !story?.id || isSending || isStreaming) return;

    // Create user message
    const userMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setIsSending(true);
    setIsStreaming(true);
    setStreamingMessage('');
    
    // Reset streaming refs for new message
    wordBufferRef.current = [];
    displayedIndexRef.current = 0;
    isStreamCompleteRef.current = false;
    setShowPulsingCursor(false);

    // Create abort controller for this stream
    abortControllerRef.current = new AbortController();

    try {
      await sendMessageStream(
        story.id,
        content.trim(),
        {
          onDelta: (fullText) => {
            // Just update buffer - don't restart timer!
            updateWordBuffer(fullText);
          },
          onDone: (response, fullText) => {
            console.log('✅ Stream complete:', { fullText, response });
            
            // Mark stream as complete
            isStreamCompleteRef.current = true;
            
            // Update buffer one final time with complete text
            updateWordBuffer(fullText);
            
            // Timer will stop itself when it catches up
            // (see startRevealLoop logic)
            
            // Wait a bit for reveal to finish, then finalize
            setTimeout(() => {
              // Clear timer if still running
              if (streamTimerRef.current) {
                clearInterval(streamTimerRef.current);
                streamTimerRef.current = null;
              }
              
              // Create assistant message
              const assistantMessage = {
                id: response.message_id || `assistant-${Date.now()}`,
                role: 'assistant',
                content: fullText,
                character_key: story.main_character_key,
                timestamp: new Date().toISOString()
              };

              // Add to messages
              setMessages(prev => [...prev, assistantMessage]);
              setStreamingMessage('');
              setIsStreaming(false);
              setIsSending(false);
              setShowPulsingCursor(false);

              // Update story state if provided
              if (response.story_state) {
                console.log('📊 Story state updated:', response.story_state);
              }
            }, 500); // Wait 500ms for reveal to finish
          },
          onError: (error) => {
            console.error('❌ Stream error:', error);
            
            // Clean up streaming state
            if (streamTimerRef.current) {
              clearInterval(streamTimerRef.current);
              streamTimerRef.current = null;
            }
            
            setStreamingMessage('');
            setIsStreaming(false);
            setIsSending(false);
            isStreamCompleteRef.current = false;
            
            // Show error message
            const errorMessage = {
              id: `error-${Date.now()}`,
              role: 'system',
              content: 'Sorry, there was an error processing your message. Please try again.',
              timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
          },
          signal: abortControllerRef.current?.signal
        }
      );
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      
      // Clean up on error
      if (streamTimerRef.current) {
        clearInterval(streamTimerRef.current);
        streamTimerRef.current = null;
      }
      
      setStreamingMessage('');
      setIsStreaming(false);
      setIsSending(false);
      isStreamCompleteRef.current = false;
    }
  }, [story?.id, story?.main_character_key, isSending, isStreaming, sendMessageStream]); // Removed updateWordBuffer - it's stable (empty deps, only uses refs)

  // Handle cancel streaming
  const handleCancelStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Clean up streaming timer and refs
    if (streamTimerRef.current) {
      clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
    
    wordBufferRef.current = [];
    displayedIndexRef.current = 0;
    isStreamCompleteRef.current = false;
    
    setStreamingMessage('');
    setIsStreaming(false);
    setIsSending(false);
    setShowPulsingCursor(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (streamTimerRef.current) {
        clearInterval(streamTimerRef.current);
      }
    };
  }, []);

  // Start the reveal loop (called ONCE at stream start)

  // Prepare messages with live streaming
  const displayMessages = React.useMemo(() => {
    const msgs = [...messages];
    
    // Add streaming message if active
    if (isStreaming && streamingMessage) {
      msgs.push({
        id: 'streaming',
        role: 'assistant',
        content: streamingMessage,
        character_key: story?.main_character_key,
        isLive: true,
        showPulsingCursor: showPulsingCursor  // Add pulsing cursor state
      });
    }
    
    return msgs;
  }, [messages, isStreaming, streamingMessage, showPulsingCursor, story?.main_character_key]);

  // Prepare story object with messages AND progress data
  const enhancedStory = React.useMemo(() => {
    const base = {
      ...story,
      messages: displayMessages,
      opening_banner: openingBanner  // Add opening banner from state
    };
    
    // Merge progress data if available
    if (progressData?.objective_status) {
      base.primary_objective = progressData.objective_status.primary_objective;
      base.overall_progress = progressData.objective_status.overall_progress;
      base.milestones = progressData.objective_status.milestones || [];
      base.current_milestone_id = progressData.objective_status.current_milestone?.id;
      base.act_mapping = progressData.objective_status.act_mapping;
      
      // Override current_act from progress data if available (more accurate)
      if (progressData.current_act) {
        base.current_act = progressData.current_act;
      }
    }
    
    return base;
  }, [story, displayMessages, openingBanner, progressData]);

  return (
    <DefensiveStoryWrapper>
      <StoryWindowLayout
        story={enhancedStory}
        onClose={onClose}
        onSendMessage={handleSendMessage}
        isSending={isSending}
        isStreaming={isStreaming}
        onCancelStreaming={handleCancelStreaming}
      />
    </DefensiveStoryWrapper>
  );
}