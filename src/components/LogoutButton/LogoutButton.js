// src/components/LogoutButton/LogoutButton.js
import React from 'react';
import styles from './LogoutButton.module.css';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useCharacter } from '../../contexts/CharacterContext';

const LogoutButton = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { setSelectedCharacterKey, setPreviewCharacterKey } = useCharacter();

  const handleLogout = async () => {
    await logout();
    // Reset UI state so the dropdown list appears on next login
    setSelectedCharacterKey(null);
    setPreviewCharacterKey(null);
    navigate('/login', { replace: true });
  };

  return (
    <button className={styles.button} onClick={handleLogout}>
      Logout
    </button>
  );
};

export default LogoutButton;
