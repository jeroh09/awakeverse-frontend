// src/components/AvatarUploader.js
import React, { useState } from 'react';
import styles from './AvatarUploader.module.css';

export default function AvatarUploader({ userId, onUpload }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    console.log('Uploading avatar file:', file);
    if (!file) return;

    // Show local preview immediately
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    setError(null);

    // Prepare form data
    const form = new FormData();
    form.append('avatar', file);
    console.log('🔍 FormData created:', form);
    console.log('🔍 FormData has avatar:', form.has('avatar'));
    console.log('🔍 FormData avatar value:', form.get('avatar'));
    console.log('🔍 File object:', file);

    try {
      setLoading(true);
      console.log('🚀 About to make fetch request...');
      const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';
      console.log('🚀 URL:', `${API_BASE}/api/users/${userId}/avatar-test`);

      const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';
      const response = await fetch(`${API_BASE}/api/users/${userId}/avatar`, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrf
        },
        credentials: 'include',
        body: form
      });
       console.log('✅ Fetch completed, response:', response);
       console.log('✅ Response status:', response.status);
       console.log('✅ Response URL:', response.url);
      console.log('Avatar upload response status:', response.status);
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.warn('Avatar upload server error:', result.error);
        throw new Error(result.error || 'Upload failed');
      }
      console.log('Avatar uploaded, response:', result);
      // Invoke callback with final URL
      onUpload(result.avatarUrl);
    } catch (err) {
      console.warn('Avatar upload error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.uploader}>
      <label className={styles.preview}>
        {preview ? (
          <img src={preview} alt="Avatar preview" className={styles.image} />
        ) : (
          <span className={styles.placeholder}>Choose Avatar</span>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          disabled={loading}
        />
      </label>
      {loading && <p className={styles.status}>Uploading...</p>}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
