// src/components/StoryMode/CreateStoryHelpInfo.jsx
import React, { useState } from 'react';
import styles from './StoryMode.module.css';

export default function CreateStoryHelpInfo() {
  const [open, setOpen] = useState(false);

  const openInfo = () => setOpen(true);
  const closeInfo = () => setOpen(false);

  return (
    <>
      {/* Small "i" pill button */}
      <button
        type="button"
        className={styles.infoPill}
        onClick={openInfo}
        aria-label="How to use Create Story"
      >
        i
      </button>

      {/* Lightweight overlay with instructions */}
      {open && (
        <div className={styles.infoBackdrop} onClick={closeInfo}>
          <div
            className={styles.infoPopover}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.infoPopoverHeader}>
              <span className={styles.infoTitle}>How to use Create Story</span>
              <button
                type="button"
                className={styles.infoCloseButton}
                onClick={closeInfo}
                aria-label="Close help"
              >
                ×
              </button>
            </div>

            <div className={styles.infoPopoverBody}>
              <p>
                <strong>Quick guide:</strong> this form lets you start a new
                interactive story in AwakeVerse.
              </p>
              <ol>
                <li>
                  <strong>Choose a starting point.</strong> Either pick a
                  template from the gallery or click the Create Story button to
                  begin from your own idea.
                </li>
                <li>
                  <strong>Set your world.</strong> Give the story a title,
                  choose the main character, era and tech level. This helps the
                  AI stay inside the right time period.
                </li>
                <li>
                  <strong>Describe the opening scene (optional).</strong>{' '}
                  Use the Scene Style field to describe the atmosphere you want
                  — for example:{' '}
                  <em>
                    “A fog-drenched Victorian alley lit by a single gas lamp.”
                  </em>
                </li>
                <li>
                  <strong>Check the summary.</strong> The preview text shows how
                  the story will open. Adjust your inputs until it feels right.
                </li>
                <li>
                  <strong>Begin.</strong> Click <em>Create Story</em> to start.
                  You can always steer the story by chatting with your
                  character.
                </li>
              </ol>
              <p className={styles.infoHint}>
                You can return here any time if you’re unsure what a field
                means or how it affects the story.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
