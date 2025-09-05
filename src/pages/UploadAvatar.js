// src/pages/UploadAvatar.js
import React, { useState } from 'react';
import { useNavigate }           from 'react-router-dom';
import AvatarUploader            from '../components/AvatarUploader';
import { useUser } from '../contexts/UserContext';
import styles                    from './UploadAvatar.module.css';

export default function UploadAvatar() {
  const { user, setUser } = useUser();
  const [pendingUrl, setPendingUrl] = useState(user?.avatarUrl || '');
  const [hasNewFile, setHasNewFile] = useState(false);
  const navigate = useNavigate();

  // called by AvatarUploader's onUpload to preview & stage the URL
  const handleFilePicked = (previewUrl) => {
    setPendingUrl(previewUrl);
    setHasNewFile(true);
  };

  // when you click “Save”
  const handleSave = () => {
    // AvatarUploader actually did the POST, so just update context
    setUser(u => ({ ...u, avatarUrl: pendingUrl }));
    // Go back to category page:
    navigate('/app');  
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Upload New Avatar</h1>

        <div className={styles.preview}>
          <AvatarUploader
            userId={user.id}
            onUpload={handleFilePicked}
          />
        </div>

        {pendingUrl && (
          <div className={styles.preview}>
            <img
              src={pendingUrl}
              alt="Preview avatar"
              style={{ width: '80px', height: '80px', borderRadius: '50%' }}
            />
          </div>
        )}

        <div className={styles.actions}>
          <button
            className={`${styles.button} ${styles.save}`}
            disabled={!hasNewFile}
            onClick={handleSave}
          >
            Save
          </button>
          <button
            className={`${styles.button} ${styles.cancel}`}
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
);
}
