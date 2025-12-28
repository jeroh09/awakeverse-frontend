// src/components/StoryMode/StoryWindow/index.jsx
// Updated to use new two-panel layout with separated rounded panels

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useUser } from '../../../contexts/UserContext';
import useStoryApi from '../../../hooks/useStoryApi';
import DefensiveStoryWrapper from '../DefensiveStoryWrapper';
import StoryWindowLayout from './StoryWindowLayout';
import styles from './StoryWindow.module.css';

/**
 * StoryWindow - Main story chat interface
 * 
 * Props:
 * - story: Story object with metadata
 * - onClose: Callback to return to story list
 */
export default function StoryWindow({ story, onClose }) {
  const { user } = useUser();
  const { sendMessageStream } = useStoryApi();
  
  // State for messages
  const [messages, setMessages] = useState(story?.messages || []);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Abort controller for streaming
  const abortControllerRef = useRef(null);

  // Update messages when story changes
  useEffect(() => {
    if (story?.messages) {
      setMessages(story.messages);
    }
  }, [story?.messages]);

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
              // TODO: Update parent story state
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

  // Prepare story object with messages
  const enhancedStory = React.useMemo(() => ({
    ...story,
    messages: displayMessages
  }), [story, displayMessages]);

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