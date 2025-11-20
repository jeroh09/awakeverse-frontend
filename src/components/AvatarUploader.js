// src/components/AvatarUploader.js - ENHANCED WITH DESIGN SYSTEM
import React, { useState } from 'react';
import styles from './AvatarUploader.module.css';

export default function AvatarUploader({ userId, onUpload }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const validateImage = (file) => {
    const rules = {
      maxSize: 2 * 1024 * 1024, // 2MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
      // REMOVED: dimensions validation
    };

    // Check file type
    if (!rules.allowedTypes.includes(file.type)) {
      throw new Error('Please upload JPEG, PNG, or WebP images only');
    }

    // Check file size
    if (file.size > rules.maxSize) {
      throw new Error('Image must be smaller than 2MB');
    }

    return Promise.resolve(true); // Skip dimension validation
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    console.log('Uploading avatar file:', file);
    if (!file) return;

    try {
      setError(null);
      setSuccess(null);

      // Validate image before upload
      await validateImage(file);
      
      // Show local preview immediately
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Prepare form data
      const form = new FormData();
      form.append('avatar', file);
      console.log('🔍 FormData created:', form);
      console.log('🔍 FormData has avatar:', form.has('avatar'));
      console.log('🔍 FormData avatar value:', form.get('avatar'));
      console.log('🔍 File object:', file);

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
      
      const result = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        console.warn('Avatar upload server error:', result.error);
        throw new Error(result.error || 'Upload failed');
      }
      
      console.log('Avatar uploaded, response:', result);
      
      // Invoke callback with final URL
      onUpload(result.avatarUrl);
      setSuccess('Avatar uploaded successfully!');
      
    } catch (err) {
      console.warn('Avatar upload error:', err);
      setError(err.message);
      // Clear preview if validation failed
      if (preview) {
        setPreview(null);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.uploader}>
      <div className={styles.uploadHeader}>
        <h3 className={styles.uploadTitle}>Profile Avatar</h3>
        <p className={styles.uploadSubtitle}>Upload your character's profile image</p>
      </div>

      <div className={styles.previewContainer}>
        <label className={styles.preview}>
          {preview ? (
            <img src={preview} alt="Avatar preview" />
          ) : (
            <div className={styles.placeholder}>
              <div className={styles.placeholderIcon}>📷</div>
              <span>Choose Image</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={loading}
          />
        </label>

        <div className={styles.uploadRules}>
          <h4 className={styles.rulesTitle}>
            <span>📋</span>
            Upload Requirements
          </h4>
          <ul className={styles.rulesList}>
            <li className={styles.ruleItem}>
              <span className={styles.ruleIcon}>✅</span>
              <span>File size under <strong>2 MB</strong></span>
            </li>
            <li className={styles.ruleItem}>
              <span className={styles.ruleIcon}>✅</span>
              <span>Formats: <strong>JPG, PNG, or WebP</strong></span>
            </li>
            <li className={styles.ruleItem}>
              <span className={styles.ruleIcon}>✅</span>
              <span>Clear, well-lit portrait recommended</span>
            </li>
          </ul>
        </div>
      </div>

      <div className={styles.statusContainer}>
        {loading && (
          <div className={styles.status}>
            <div className={styles.statusSpinner}></div>
            <span>Uploading your avatar...</span>
          </div>
        )}
        
        {error && (
          <div className={styles.error}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className={styles.success}>
            <span>✅</span>
            <span>{success}</span>
          </div>
        )}
      </div>
    </div>
  );
}