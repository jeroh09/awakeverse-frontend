// src/components/StoryMode/StoryWindow/index.jsx - SIDE PANEL IMPLEMENTATION
import React, { useState, useEffect, useRef } from 'react';
import { BarChart2, X } from 'lucide-react';
import { characterCategories } from '../../../data/characterCategories';
import StoryHeader from './StoryHeader';
import StoryMessages from './StoryMessages';
import StoryInput from './StoryInput';
import useStoryApi from '../../../hooks/useStoryApi';
import MilestoneChips from './MilestoneChips';
import styles from './StoryWindow.module.css';

// Helper: map char key → name/thumbnail
const getCharacterInfo = (charKey) => {
  for (const category of characterCategories) {
    const found = category.characters?.find((c) => c.key === charKey);
    if (found) return { name: found.name, thumbnailUrl: found.thumbnailUrl };
  }
  // graceful fallback
  const pretty =
    (charKey || '')
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Unknown Character';

  return { name: pretty, thumbnailUrl: null };
};

// Small helper for act labels
const ACT_LABELS = {
  1: {
    title: 'Act I · Setup',
    summary: 'Establish the world, stakes, and the inciting incident.'
  },
  2: {
    title: 'Act II · Confrontation',
    summary: 'Complications, rising tension, and hard choices.'
  },
  3: {
    title: 'Act III · Resolution',
    summary: 'Climax, consequences, and a new equilibrium.'
  }
};

/**
 * Progress Side Panel Component
 * 
 * Props:
 * - story: Basic story info (always available)
 * - progressData: Rich tracking data from /progress endpoint (may be null initially)
 * - isLoading: Whether progress data is being fetched
 * - isVisible: Whether panel is open
 * - onClose: Close panel handler
 */
function ProgressPanel({ story, progressData, isLoading, isVisible, onClose }) {
  if (!story) return null;

  // ============================================================================
  // DATA EXTRACTION
  // ============================================================================

  // Use progressData if available, otherwise fall back to story data
  const objectiveStatus = progressData?.objective_status;
  const structureStatus = progressData?.structure_status;

  // Primary objective (from story or progressData)
  const primaryObjective =
    progressData?.primary_objective ||
    story.primary_objective ||
    'Follow the thread of the story toward a satisfying conclusion.';

  // Act information
  const currentAct = structureStatus?.current_act || story.current_act || 1;
  const actName = structureStatus?.act_name || ACT_LABELS[currentAct]?.title.split('·')[1]?.trim() || 'Setup';
  const totalActs = 3;

  const actMeta = ACT_LABELS[currentAct] || {
    title: `Act ${currentAct} · ${actName}`,
    summary: 'Drama continues…'
  };

  // Progress calculation
  let progressPercent = 0;
  let progressSource = 'estimated';

  if (objectiveStatus?.overall_progress != null) {
    // Use real milestone progress (most accurate)
    progressPercent = Math.round(objectiveStatus.overall_progress * 100);
    progressSource = 'milestones';
  } else if (structureStatus?.position_pct != null) {
    // Use story structure progress (act/beat based)
    progressPercent = Math.round(structureStatus.position_pct * 100);
    progressSource = 'structure';
  } else {
    // Fallback: estimate from turns
    const turns = story.total_turns || 0;
    const estimatedTotal = 30;
    progressPercent = turns ? Math.min(100, Math.round((turns / estimatedTotal) * 100)) : 0;
    progressSource = 'estimated';
  }

  // Milestone data
  const milestones = objectiveStatus?.milestones;
  const currentMilestoneId = objectiveStatus?.current_milestone?.id;

  // Turn count
  const turns = story.total_turns || 0;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      {/* Mobile backdrop */}
      <div 
        className={`${styles.panelBackdrop} ${isVisible ? styles.visible : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Side panel */}
      <aside 
        className={`${styles.progressPanel} ${isVisible ? styles.visible : styles.hidden}`}
        aria-label="Story progress panel"
      >
        {/* Panel header */}
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>
            <BarChart2 size={20} />
            <span>Progress</span>
          </h2>
          <button
            className={styles.panelCloseButton}
            onClick={onClose}
            aria-label="Close progress panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Panel content */}
        <div className={styles.panelContent}>
          {/* Objective */}
          <section className={styles.objectiveSection}>
            <div className={styles.objectiveLabel}>Story Objective</div>
            <div className={styles.objectiveText}>{primaryObjective}</div>
          </section>

          {/* Act & Progress */}
          <section className={styles.actSection}>
            <div className={styles.actLine}>
              <span className={styles.actTitle}>{actMeta.title}</span>
              <span className={styles.actBadgeMini}>
                Act {currentAct} / {totalActs}
              </span>
            </div>
            <p className={styles.actSummary}>{actMeta.summary}</p>

            {/* Progress bar */}
            <div className={styles.progressTrack} aria-label="Story progress">
              <div
                className={styles.progressFill}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Progress metadata */}
            <div className={styles.progressMeta}>
              {turns > 0 && (
                <span className={styles.turnHint}>
                  💬 {turns} turn{turns === 1 ? '' : 's'} so far
                </span>
              )}
              
              {progressSource !== 'estimated' && (
                <span className={styles.progressBadge}>
                  {progressPercent}% complete
                </span>
              )}
            </div>

            {/* Loading indicator */}
            {isLoading && (
              <div className={styles.loadingIndicator}>
                <span className={styles.loadingDot} />
                Updating progress...
              </div>
            )}
          </section>

          {/* Milestone Chips (if available) */}
          {milestones && milestones.length > 0 && (
            <section className={styles.milestonesSection}>
              <MilestoneChips 
                milestones={milestones}
                currentMilestoneId={currentMilestoneId}
              />
            </section>
          )}
        </div>
      </aside>
    </>
  );
}

export default function StoryWindow({ story, onClose }) {
  const [messages, setMessages] = useState([]);
  const [openingBanner, setOpeningBanner] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [progressData, setProgressData] = useState(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const abortRef = useRef(null);

  const {
    sendMessage,
    sendMessageStream,
    inviteCharacter,
    getStoryContext,
    getStoryProgress, 
    loading,
    error
  } = useStoryApi();

  // Fetch progress data
  const fetchProgressData = async (storyId) => {
    if (!storyId) return;

    setIsLoadingProgress(true);
    try {
      // Use the hook method instead of direct fetch
      const data = await getStoryProgress(storyId);
      setProgressData(data);
    } catch (err) {
      console.warn('⚠️ Progress endpoint unavailable:', err.message);
      // Don't set progressData - will use fallback
    } finally {
      setIsLoadingProgress(false);
    }
  };

  // Initial load – fetch context from backend
  useEffect(() => {
    if (!story?.id) return;

    const initializeStory = async () => {
      try {
        console.log('📖 Loading story context:', story.id);
        const data = await getStoryContext(story.id);

        const msgs = data.messages || [];
        setMessages(msgs);

        const banner =
          data.story?.starting_situation ||
          data.story?.current_situation ||
          null;
        setOpeningBanner(banner);

        // Fetch progress data
        fetchProgressData(story.id);
      } catch (err) {
        console.error('❌ Failed to initialize story:', err);
      }
    };

    initializeStory();
  }, [story?.id, getStoryContext]);

  // Refresh progress after each message
  useEffect(() => {
    if (messages.length > 0 && story?.id) {
      // Debounce progress refresh to avoid too many requests
      const timeoutId = setTimeout(() => {
        fetchProgressData(story.id);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, story?.id]);

  // Streaming send handler
  const handleSendMessage = async (inputValue) => {
    if (!inputValue.trim() || isStreaming) return;

    const userText = inputValue.trim();

    // 1) Append user message immediately
    const userId = `u_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: userId,
        role: 'user',
        content: userText,
        timestamp: new Date().toISOString()
      }
    ]);

    // 2) Append placeholder assistant bubble that we stream into
    const liveId = `a_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: liveId,
        role: 'assistant',
        content: '',
        isLive: true,
        timestamp: new Date().toISOString()
      }
    ]);

    // 3) Kick off stream
    setIsStreaming(true);
    abortRef.current = new AbortController();

    try {
      await sendMessageStream(story.id, userText, {
        onDelta: (accumText) => {
          // Update live assistant bubble
          setMessages((prev) => {
            const next = [...prev];
            const idx = next.findIndex((m) => m.id === liveId);
            if (idx >= 0) {
              next[idx] = { ...next[idx], content: accumText };
            }
            return next;
          });
        },
        onDone: (finalObj, fullText) => {
          setIsStreaming(false);
          abortRef.current = null;

          // Refresh progress data when stream completes
          fetchProgressData(story.id);

          console.log('✅ Story stream completed:', finalObj);
        },
        onError: (msg) => {
          setIsStreaming(false);
          abortRef.current = null;
          setMessages((prev) => {
            const next = [...prev];
            const idx = next.findIndex((m) => m.id === liveId);
            if (idx >= 0) {
              next[idx] = {
                ...next[idx],
                content: '⚠️ Stream failed: ' + msg
              };
            }
            return next;
          });
        },
        signal: abortRef.current.signal
      });
    } catch (e) {
      // onError already handled UI surface
      console.error('❌ Streaming send failed:', e);
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleClose = () => {
    console.log('📖 Closing story window');
    onClose?.();
  };

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  // Loading state – full-frame
  if (loading && messages.length === 0) {
    return (
      <div className={styles.storyWindow}>
        <div className={styles.storyContainer}>
          <StoryHeader story={story} onClose={handleClose} />

          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner} />
            <p>Loading story...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state – full-frame
  if (error && messages.length === 0) {
    return (
      <div className={styles.storyWindow}>
        <div className={styles.storyContainer}>
          <StoryHeader story={story} onClose={handleClose} />

          <div className={styles.errorState}>
            <h3>⚠️ Error Loading Story</h3>
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className={styles.retryButton}
            >
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
        {/* Header: title, era, character, act, turns + progress toggle */}
        <header className={styles.storyHeader}>
          <div className={styles.headerContent}>
            <h1 className={styles.storyTitle}>
              {story?.title || 'Untitled Story'}
            </h1>

            <div className={styles.storyMeta}>
              <span className={styles.eraBadge}>
                <span>📅</span> {story?.era || 'Modern'}
              </span>

              <span className={styles.characterBadge}>
                <span>👤</span> {story?.main_character_key || 'Character'}
              </span>

              {Number.isFinite?.(story?.current_act) && (
                <span className={styles.actBadge}>
                  <span>🎭</span> Act {story.current_act}
                </span>
              )}

              {Number.isFinite?.(story?.total_turns) && story.total_turns > 0 && (
                <span className={styles.turnsBadge}>
                  <span>💬</span> {story.total_turns} turns
                </span>
              )}

              {/* Progress toggle button */}
              <button
                className={styles.progressToggle}
                onClick={togglePanel}
                aria-label={isPanelOpen ? 'Hide progress' : 'Show progress'}
              >
                <BarChart2 size={16} />
                <span>{isPanelOpen ? 'Hide' : 'Progress'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content area: Messages + Progress Panel */}
        <div className={styles.contentArea}>
          {/* Messages column (left) */}
          <div className={styles.messagesColumn}>
            <StoryMessages
              messages={messages}
              characterKey={story.main_character_key}
              openingBanner={openingBanner}
              getCharacterInfo={getCharacterInfo}
            />

            {/* Non-fatal error banner */}
            {error && (
              <div className={styles.errorBanner}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Input */}
            <StoryInput
              onSendMessage={handleSendMessage}
              isSending={loading}
              characterKey={story?.main_character_key}
              isStreaming={isStreaming}
              onCancelStreaming={handleStop}
            />
          </div>

          {/* Progress Panel (right side on desktop, bottom sheet on mobile) */}
          <ProgressPanel
            story={story}
            progressData={progressData}
            isLoading={isLoadingProgress}
            isVisible={isPanelOpen}
            onClose={() => setIsPanelOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}