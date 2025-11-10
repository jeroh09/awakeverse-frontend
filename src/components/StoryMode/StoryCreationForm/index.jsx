// src/components/StoryMode/StoryCreationForm/index.jsx - PLACEHOLDER
import React from 'react';
import styles from './StoryCreationForm.module.css';

export default function StoryCreationForm({ 
  template,
  isOpen,
  onClose = () => {},
  onSuccess = () => {}
}) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.creationModal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Create Story</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.modalContent}>
          <div className={styles.placeholderContent}>
            <p>📝 Story creation form coming in Step 3-4</p>
            <p className={styles.hint}>
              This will allow you to customize title, character, and starting situation
            </p>
            {template && (
              <p className={styles.templateInfo}>
                Template: {template.title}
              </p>
            )}
          </div>
        </div>
        
        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.cancelButton}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}