// src/components/StoryMode/StoryWindow/index.jsx - STEP 3: Persistence + Keyboard Shortcuts
import React, { useState, useEffect, useRef } from 'react';
import { characterCategories } from '../../../data/characterCategories';
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

// Helper: format era display name
const formatEra = (era) => {
  if (!era) return 'Modern';
  const map = {
    ancient: 'Ancient Times',
    medieval: 'Medieval Era',
    renaissance: 'Renaissance',
    '1800s': '1800s',
    '1890s': 'Victorian Era',
    '1900s': 'Early 1900s',
    '1950s': '1950s',
    modern: 'Modern Day',
    '2050s': 'Near Future',
    far_future: 'Far Future'
  };
  const key = String(era || '').toLowerCase().trim();
  return map[key] || era;
};

// Helper: get character display name
const getDisplayNameFromKey = (charKey) => {
  return getCharacterInfo(charKey).name;
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

// LocalStorage key for panel preference
const PANEL_PREFERENCE_KEY = 'awakeverse_story_panel_open';

export default function StoryWindow({ story, onClose }) {
  const [messages, setMessages] = useState([]);
  const [openingBanner, setOpeningBanner] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [progressData, setProgressData] = useState(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  
  // Initialize panel state from localStorage (default: false)
  const [isPanelOpen, setIsPanelOpen] = useState(() => {
    try {
      const saved = localStorage.getItem(PANEL_PREFERENCE_KEY);
      return saved === 'true';
    } catch (e) {
      console.warn('localStorage unavailable:', e);
      return false;
    }
  });

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

  // Persist panel state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PANEL_PREFERENCE_KEY, isPanelOpen.toString());
    } catch (e) {
      console.warn('Failed to save panel preference:', e);
    }
  }, [isPanelOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Esc to close panel
      if (e.key === 'Escape' && isPanelOpen) {
        setIsPanelOpen(false);
        e.preventDefault();
      }

      // Cmd/Ctrl + P to toggle panel
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        setIsPanelOpen(!isPanelOpen);
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPanelOpen]);

  // Fetch progress data
  const fetchProgressData = async (storyId) => {
    if (!storyId) return;

    setIsLoadingProgress(true);
    try {
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

  // ============================================================================
  // DATA EXTRACTION FOR DISPLAY
  // ============================================================================

  // Use progressData if available, otherwise fall back to story data
  const objectiveStatus = progressData?.objective_status;
  const structureStatus = progressData?.structure_status;

  // Primary objective (from story or progressData)
  const primaryObjective =
    progressData?.primary_objective ||
    story?.primary_objective ||
    'Follow the thread of the story toward a satisfying conclusion.';

  // Act information
  const currentAct = structureStatus?.current_act || story?.current_act || 1;
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
    const turns = story?.total_turns || 0;
    const estimatedTotal = 30;
    progressPercent = turns ? Math.min(100, Math.round((turns / estimatedTotal) * 100)) : 0;
    progressSource = 'estimated';
  }

  // Milestone data
  const milestones = objectiveStatus?.milestones;
  const currentMilestoneId = objectiveStatus?.current_milestone?.id;

  // Turn count
  const turns = story?.total_turns || 0;

  // ============================================================================
  // LOADING & ERROR STATES
  // ============================================================================

  // Loading state – full-frame
  if (loading && messages.length === 0) {
    return (
      <div className={styles.storyWindow}>
        <div className={styles.storyContainer}>
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

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className={styles.storyWindow}>
      <div className={styles.storyContainer}>
        <div className={styles.storyInner}>
          {/* ===== HEADER WITH COMPACT OBJECTIVE CHIP ===== */}
          <header className={styles.storyHeader}>
            {/* Left side: Title + badges */}
            <div className={styles.headerLeft}>
              <h1 className={styles.storyTitle}>
                {story?.title || 'Untitled Story'}
              </h1>

              <div className={styles.storyMeta}>
                <span className={styles.eraBadge}>
                  <span>📅</span> {formatEra(story?.era)}
                </span>

                <span className={styles.characterBadge}>
                  <span>👤</span> {getDisplayNameFromKey(story?.main_character_key)}
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
              </div>
            </div>

            {/* Right side: Compact objective chip */}
            <div className={styles.objectiveChip}>
              <div className={styles.objectiveMiniLabel}>Story Objective</div>
              <div className={styles.objectiveSummary}>
                {primaryObjective}
              </div>
              <button
                className={styles.objectiveStatusPill}
                onClick={togglePanel}
                aria-label="Open objectives panel"
                title="Click to view progress (Cmd/Ctrl+P)"
              >
                <span>{actMeta.title.split('·')[0].trim()}</span>
                {progressSource !== 'estimated' && (
                  <span className={styles.objectivePercentBadge}>
                    {progressPercent}%
                  </span>
                )}
              </button>
            </div>
          </header>

          {/* ===== MAIN CONTENT: MESSAGES + INPUT (ALWAYS FULL WIDTH) ===== */}
          <div className={styles.storyMain}>
            <StoryMessages
              messages={messages}
              characterKey={story?.main_character_key}
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

          {/* ===== BACKDROP (when panel open) ===== */}
          {isPanelOpen && (
            <div 
              className={styles.panelBackdrop}
              onClick={() => setIsPanelOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* ===== OBJECTIVES PANEL (FLOATING OVERLAY) ===== */}
          <aside 
            className={`${styles.objectivesPanel} ${isPanelOpen ? styles.open : ''}`}
            aria-label="Story objectives panel"
          >
            {/* Panel header */}
            <div className={styles.panelHeader}>
              <div className={styles.panelTitle}>Objectives & Acts</div>
              <button
                className={styles.panelClose}
                onClick={() => setIsPanelOpen(false)}
                aria-label="Close objectives panel"
                title="Close (Esc)"
              >
                Close ✕
              </button>
            </div>

            {/* Main objective */}
            <div className={styles.panelMainObjective}>
              <strong>Story Objective:</strong>
              <br />
              {primaryObjective}
            </div>

            {/* Progress section */}
            <div className={styles.panelProgressSection}>
              <div className={styles.panelActLine}>
                <span className={styles.panelActTitle}>{actMeta.title}</span>
                <span className={styles.panelActBadge}>
                  Act {currentAct} / {totalActs}
                </span>
              </div>

              {/* Progress track */}
              <div className={styles.panelProgressTrack}>
                <div
                  className={styles.panelProgressFill}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Meta row */}
              <div className={styles.panelMetaRow}>
                {turns > 0 && (
                  <span>💬 {turns} turn{turns === 1 ? '' : 's'} so far</span>
                )}
                
                {progressSource !== 'estimated' && (
                  <span className={styles.panelMetaPill}>
                    {progressPercent}% complete
                  </span>
                )}
              </div>
            </div>

            {/* Milestones */}
            {milestones && milestones.length > 0 && (
              <>
                <div className={styles.milestonesHeader}>Milestones</div>
                <div className={styles.milestonesList}>
                  <MilestoneChips 
                    milestones={milestones}
                    currentMilestoneId={currentMilestoneId}
                  />
                </div>
              </>
            )}

            {/* Loading indicator */}
            {isLoadingProgress && (
              <div className={styles.loadingIndicator}>
                <span className={styles.loadingDot} />
                Updating progress...
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}