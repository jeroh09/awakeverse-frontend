// src/components/StoryMode/StoryWindow/index.jsx - UPDATED
import React, { useState, useEffect } from 'react';
import StoryHeader from './StoryHeader';
import StoryMessages from './StoryMessages';
import StoryInput from './StoryInput';
import InviteSuggestion from './InviteSuggestion';
import useStoryApi from '../../../hooks/useStoryApi'; // YOUR HOOK
import styles from './StoryWindow.module.css';

export default function StoryWindow({ story, onClose }) {
  const [messages, setMessages] = useState([]);
  const [showInviteSuggestion, setShowInviteSuggestion] = useState(false);
  const [availableCharacters, setAvailableCharacters] = useState([]);
  
  // Use YOUR API hook
  const { 
    sendMessage, 
    inviteCharacter, 
    getStoryContext,
    loading,        // Use hook's loading state
    error           // Use hook's error state
  } = useStoryApi();

  // Load story context on mount
  useEffect(() => {
    if (!story?.id) return;

    const initializeStory = async () => {
      try {
        console.log('📖 Loading story context:', story.id);
        
        // Use YOUR getStoryContext method
        const data = await getStoryContext(story.id);
        
        // Set messages from context (empty array for now per API guide)
        setMessages(data.messages || []);
        
        // TODO: Fetch available characters for invitations
        // For now, use placeholder - you'll need to implement this
        setAvailableCharacters([
          { key: 'watson', name: 'Dr. Watson', description: 'Medical expert' },
          { key: 'lestrade', name: 'Inspector Lestrade', description: 'Scotland Yard detective' }
        ]);
        
        // Show invite suggestion after loading
        setTimeout(() => {
          setShowInviteSuggestion(true);
        }, 2000);
        
      } catch (err) {
        console.error('❌ Failed to initialize story:', err);
      }
    };

    initializeStory();
  }, [story?.id, getStoryContext]);

  // Handle sending messages using YOUR sendMessage API
  const handleSendMessage = async (messageText) => {
    try {
      // Use YOUR sendMessage method - follows exact API mapping
      const data = await sendMessage(story.id, messageText);
      
      console.log('✅ Message sent response:', data);

      // Handle response based on YOUR API structure
      if (data.success) {
        // Add user message to UI immediately
        const userMessage = {
          role: 'user',
          content: messageText,
          timestamp: new Date().toISOString()
        };
        
        // Add character response from API
        if (data.message) {
          const characterMessage = {
            ...data.message,
            timestamp: data.message.created_at || new Date().toISOString()
          };
          setMessages(prev => [...prev, userMessage, characterMessage]);
        } else {
          // Fallback if no message object (shouldn't happen with your API)
          setMessages(prev => [...prev, userMessage]);
        }
      }
    } catch (err) {
      console.error('❌ Message send failed:', err);
    }
  };

  // Handle invite character using YOUR inviteCharacter API
  const handleInviteCharacter = async (characterKey) => {
    try {
      // Use YOUR inviteCharacter method - follows exact API mapping
      const data = await inviteCharacter(story.id, characterKey);
      
      console.log('✅ Character invite response:', data);

      if (data.success) {
        // Add system message about character invitation
        const systemMessage = {
          role: 'system',
          content: `${characterKey} has been invited to join the story.`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, systemMessage]);
        setShowInviteSuggestion(false);
      }
    } catch (err) {
      console.error('❌ Character invite failed:', err);
    }
  };

  // Handle close
  const handleClose = () => {
    console.log('📖 Closing story window');
    onClose();
  };

  // Loading state - using YOUR hook's loading state
  if (loading && messages.length === 0) {
    return (
      <div className={styles.storyWindow}>
        <div className={styles.storyContainer}>
          <StoryHeader story={story} onClose={handleClose} />
          
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading story...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state - using YOUR hook's error state
  if (error && messages.length === 0) {
    return (
      <div className={styles.storyWindow}>
        <div className={styles.storyContainer}>
          <StoryHeader story={story} onClose={handleClose} />
          
          <div className={styles.errorState}>
            <h3>⚠️ Error Loading Story</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className={styles.retryButton}>
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main story window
  return (
    <div className={styles.storyWindow}>
      <div className={styles.storyContainer}>
        <StoryHeader 
          story={story} 
          onClose={handleClose} 
        />
        
        <StoryMessages
          messages={messages}
          characterKey={story.main_character_key}
        />

        {/* Error banner for non-fatal errors */}
        {error && (
          <div className={styles.errorBanner}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Invite Suggestion with dynamic characters */}
        {showInviteSuggestion && availableCharacters.length > 0 && (
          <InviteSuggestion
            story={story}
            availableCharacters={availableCharacters}
            onInvite={handleInviteCharacter}
            onDismiss={() => setShowInviteSuggestion(false)}
          />
        )}

        {/* Story Input */}
        <StoryInput
          onSendMessage={handleSendMessage}
          isSending={loading}
          placeholder={`Continue the story with ${story.main_character_key}...`}
        />
      </div>
    </div>
  );
}