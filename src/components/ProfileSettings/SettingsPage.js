// src/components/ProfileSettings/SettingsPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SettingsSidebar from './SettingsSidebar';
import SettingsContent from './SettingsContent';
import styles from './ProfileSettings.module.css';

export default function SettingsPage() {
  const [selected, setSelected] = useState('about');
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <button
            onClick={() => navigate(-1)}
            className={styles.backButton}
          >
            <ArrowLeft size={16} className="mr-1" />
            Back
          </button>
        </div>
        <div className={styles.main}>
          <div className={styles.sidebar}>
            <SettingsSidebar
              selected={selected}
              onSelect={setSelected}
            />
          </div>
          <div className={styles.content}>
            <SettingsContent selected={selected} />
          </div>
        </div>
      </div>
    </div>
  );
}
