// src/components/StoryMode/StoryWindow/index.jsx - UPDATED
import React, { useState, useEffect, useRef } from 'react';
import { characterCategories } from '../../../data/characterCategories';
import StoryHeader from './StoryHeader';
import StoryMessages from './StoryMessages';
import StoryInput from './StoryInput';
import InviteSuggestion from './InviteSuggestion';
import useStoryApi from '../../../hooks/useStoryApi'; // YOUR HOOK
import styles from './StoryWindow.module.css';

// Same helper function as in other components
const getCharacterInfo = (charKey) => {
  for (const category of characterCategories) {
    const found = category.characters?.find(c => c.key === charKey);
    if (found) return { name: found.name, thumbnailUrl: found.thumbnailUrl };
  }
  // graceful fallback
  return { name: (charKey || '').replace(/[_-]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase()), thumbnailUrl: null };
};

export default function StoryWindow({ story, onClose }) {
  const [messages, setMessages] = useState([]);
  const [openingBanner, setOpeningBanner] = useState(null);
  const [showInviteSuggestion, setShowInviteSuggestion] = useState(false);
  const [availableCharacters, setAvailableCharacters] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false); // ADD THIS
  const abortRef = useRef(null); // ADD THIS
  
  // Use YOUR API hook
  const { 
    sendMessage, 
    sendMessageStream,
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
        const msgs = data.messages || [];
         setMessages(msgs);

         // Source of truth: server
         const banner =
           data.story?.starting_situation ||
           data.story?.current_situation ||
           null;
         setOpeningBanner(banner);
        
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

    // Replace the entire handleSendMessage function with this:
  const handleSendMessage = async (inputValue) => {
    if (!inputValue.trim() || isStreaming) return;

    // append user message immediately
    setMessages(prev => [...prev, { id: `u_${Date.now()}`, role: 'user', content: inputValue }]);

    // append placeholder assistant bubble (live-updating)
    const liveId = `a_${Date.now()}`;
    setMessages(prev => [...prev, { id: liveId, role: 'assistant', content: '', isLive: true }]);


    const userText = inputValue;
    setIsStreaming(true);
    abortRef.current = new AbortController();

    try {
      await sendMessageStream(story.id, userText, {
        onDelta: (accumText) => {
          // update the last message (assistant live bubble)
          setMessages(prev => {
            const next = [...prev];
            const idx = next.findIndex(m => m.id === liveId);
            if (idx >= 0) next[idx] = { ...next[idx], content: accumText };
            return next;
          });
        },
        onDone: (finalObj, fullText) => {
          setIsStreaming(false);
          abortRef.current = null;

          // Optionally: reconcile with final envelope (state_update, banners, ending)
          // Example: apply momentum score or banners to local state here using finalObj
        },
        onError: (msg) => {
          setIsStreaming(false);
          abortRef.current = null;
          // turn the live bubble into an error note
          setMessages(prev => {
            const next = [...prev];
            const idx = next.findIndex(m => m.id === liveId);
            if (idx >= 0) next[idx] = { ...next[idx], content: '⚠️ Stream failed: ' + msg };
            return next;
          });
        },
        signal: abortRef.current.signal
      });
    } catch (e) {
      // already handled by onError; nothing else required
    }
  };

  const handleStop = () => abortRef.current?.abort();

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
          openingBanner={openingBanner}
          getCharacterInfo={getCharacterInfo} // Pass the helper to StoryMessages
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
          characterKey={story?.main_character_key}
          isStreaming={isStreaming}
          onCancelStreaming={handleStop}
        />
      </div>
    </div>
  );
}