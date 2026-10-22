// src/components/StoryMode/CreateStoryHelpInfo.jsx
// ✅ OVERHAULED: Now matches VerseStudioTab pattern with auto-show logic
import React, { useState, useEffect } from 'react';
// ✅ NEW
import styles from './CreateStoryHelpInfo.module.css';

/**
 * Story Mode Help Info Modal
 * 
 * Features:
 * - Auto-shows on first visit (localStorage tracking)
 * - "Don't show again" checkbox
 * - Sectioned help content like VerseStudioTab
 * - Accessible with keyboard (Escape to close)
 * - Can be triggered manually via "i" button
 * 
 * Props:
 * - isOpen: External control (from parent)
 * - onClose: Callback when modal closes
 * - autoShow: Whether to auto-show on first visit (default: false)
 */
export default function CreateStoryHelpInfo({ 
  isOpen: externalIsOpen, 
  onClose: externalOnClose,
  autoShow = false 
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const STORAGE_KEY = 'awakeverse_story_mode_help_seen';

  // Auto-show logic on mount
  useEffect(() => {
    if (!autoShow) return;

    const hasSeenHelp = localStorage.getItem(STORAGE_KEY) === 'true';
    
    if (!hasSeenHelp) {
      setInternalIsOpen(true);
    }
  }, [autoShow]);

  // Keyboard handling (Escape to close)
  useEffect(() => {
    const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [externalIsOpen, internalIsOpen]);

  // Determine if externally controlled or internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const handleClose = () => {
    // Save preference if checkbox is checked
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }

    // Reset checkbox for next time
    setDontShowAgain(false);

    // Close via external callback or internal state
    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const openInfo = () => {
    if (externalOnClose) {
      // Parent controls state, can't open internally
      console.warn('CreateStoryHelpInfo: Parent controls open state');
    } else {
      setInternalIsOpen(true);
    }
  };

  // If not externally controlled, show "i" button
  const showTriggerButton = externalIsOpen === undefined;

  if (!isOpen) {
    return showTriggerButton ? (
      <button
        type="button"
        className={styles.infoButton}
        onClick={openInfo}
        aria-label="How to use Create Story"
      >
        <InfoIcon />
        <span className={styles.infoLabel}>Help</span>
      </button>
    ) : null;
  }

  return (
    <div
      className={styles.infoOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="Story Mode help"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className={styles.infoModal}>
        {/* Header */}
        <div className={styles.infoHeader}>
          <div>
            <div className={styles.infoTitle}>How to use Create Story</div>
            <div className={styles.infoSubtitle}>
              A quick guide to creating immersive AI-driven stories in AwakeVerse.
            </div>
          </div>

          <button
            type="button"
            className={styles.infoClose}
            onClick={handleClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body - Sectioned Content */}
        <div className={styles.infoBody}>
          <div className={styles.infoSection}>
            <div className={styles.infoSectionTitle}>1) Choose your starting point</div>
            <ul className={styles.infoList}>
              <li>
                Pick a <strong>template</strong> from the gallery (Historical Drama, Sci-Fi Adventure, Mystery…) 
                or click <strong>Create Story</strong> to start from scratch.
              </li>
              <li>
                Templates pre-fill story details to get you started faster. You can customize everything.
              </li>
            </ul>
          </div>

          <div className={styles.infoSection}>
            <div className={styles.infoSectionTitle}>2) Set your world & character</div>
            <ul className={styles.infoList}>
              <li>
                Give your story a <strong>title</strong> and select the <strong>main character</strong> from 
                hundreds of available personas (historical figures, fictional characters, or your own custom creations).
              </li>
              <li>
                Choose the <strong>era</strong> (Medieval, Victorian, Modern, Future…) and <strong>tech level</strong> 
                to keep the AI consistent with your setting.
              </li>
              <li>
                The <strong>Scene Style</strong> field lets you describe the atmosphere — for example: 
                <em>"A fog-drenched Victorian alley lit by a single gas lamp"</em>.
              </li>
            </ul>
          </div>

          <div className={styles.infoSection}>
            <div className={styles.infoSectionTitle}>3) Define your objective & milestones</div>
            <ul className={styles.infoList}>
              <li>
                Set a clear <strong>story objective</strong> (what the protagonist is trying to achieve). 
                The AI will auto-generate <strong>milestones</strong> to guide the narrative.
              </li>
              <li>
                You can edit, add, or regenerate milestones. They're flexible — if you take the story in 
                a different direction, the AI adapts.
              </li>
            </ul>
          </div>

          <div className={styles.infoSection}>
            <div className={styles.infoSectionTitle}>4) Preview & begin</div>
            <ul className={styles.infoList}>
              <li>
                Review the <strong>story summary</strong> to see how your inputs will shape the opening. 
                Adjust anything that doesn't feel right.
              </li>
              <li>
                Click <strong>Create Story</strong> to begin. You'll enter a chat-like interface where 
                you can steer the narrative by talking with your character.
              </li>
            </ul>
          </div>

          <div className={styles.infoCallout}>
            💡 <strong>Tip:</strong> Your choices guide the story, but the AI adapts to your decisions. 
            Don't worry about "breaking" the narrative — embrace unexpected directions!
          </div>
        </div>

        {/* Footer */}
        <div className={styles.infoFooter}>
          <button 
            type="button" 
            className={styles.infoPrimary} 
            onClick={handleClose}
          >
            Got it, let's create!
          </button>

          <label className={styles.infoCheckboxLabel}>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className={styles.infoCheckbox}
            />
            <span>Don't show this again</span>
          </label>
        </div>
      </div>
    </div>
  );
}

// Info icon SVG component (matches VerseStudioTab)
function InfoIcon() {
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      aria-hidden="true" 
      focusable="false"
      style={{ display: 'block' }}
    >
      <circle 
        cx="12" 
        cy="12" 
        r="9" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.8" 
      />
      <path 
        d="M12 10.7v6.2" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.8" 
        strokeLinecap="round" 
      />
      <circle cx="12" cy="7.5" r="1" fill="currentColor" />
    </svg>
  );
}