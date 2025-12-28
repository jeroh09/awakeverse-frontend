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
  
  // State for progress data
  const [progressData, setProgressData] = useState(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  
  // Abort controller for streaming
  const abortControllerRef = useRef(null);

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

    // Create abort controller for this stream
    abortControllerRef.current = new AbortController();

    try {
      await sendMessageStream(
        story.id,
        content.trim(),
        {
          onDelta: (fullText) => {
            setStreamingMessage(fullText);
          },
          onDone: (response, fullText) => {
            console.log('✅ Stream complete:', { fullText, response });
            
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

            // Update story state if provided
            if (response.story_state) {
              console.log('📊 Story state updated:', response.story_state);
            }
          },
          onError: (error) => {
            console.error('❌ Stream error:', error);
            setStreamingMessage('');
            setIsStreaming(false);
            setIsSending(false);
            
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
      setStreamingMessage('');
      setIsStreaming(false);
      setIsSending(false);
    }
  }, [story?.id, story?.main_character_key, isSending, isStreaming, sendMessageStream]);

  // Handle cancel streaming
  const handleCancelStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStreamingMessage('');
    setIsStreaming(false);
    setIsSending(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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
        isLive: true
      });
    }
    
    return msgs;
  }, [messages, isStreaming, streamingMessage, story?.main_character_key]);

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