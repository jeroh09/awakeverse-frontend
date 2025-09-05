// src/components/ProfileButton.js
import React, { useState, useRef, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MoreVertical } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import { defaultProfileMenu } from './ProfileMenuConfig';
import styles from './ProfileButton.module.css';

export default function ProfileButton({ menuItems = defaultProfileMenu }) {
  const [open, setOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { logout } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const itemRefs = useRef([]);

  const visibleItems = menuItems.filter(item =>
    item.visible ? item.visible(user) : true
  );

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = e => {
      if (open && containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Focus first menu item when opened
  useEffect(() => {
    if (open && itemRefs.current[0]) {
      itemRefs.current[0].focus();
    }
  }, [open]);

  const handleAction = action => {
    setOpen(false);
    if (action === 'toggleDarkMode') {
      toggleDarkMode();
    } else if (action === 'logout') {
      logout();
      navigate('/login');
    }
  };

  const handleKeyDown = e => {
    const { key } = e;
    const idx = itemRefs.current.findIndex(el => el === document.activeElement);
    if (key === 'ArrowDown') {
      e.preventDefault();
      const next = (idx + 1) % itemRefs.current.length;
      itemRefs.current[next].focus();
    } else if (key === 'ArrowUp') {
      e.preventDefault();
      const prev = (idx - 1 + itemRefs.current.length) % itemRefs.current.length;
      itemRefs.current[prev].focus();
    } else if (key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      triggerRef.current.focus();
    }
  };

  return (
    <div ref={containerRef} className={styles.container}>
      <button
        ref={triggerRef}
        onClick={() => setOpen(o => !o)}
        className={styles.trigger}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="profile-menu"
        title="Profile menu"
      >
        <MoreVertical size={24} />
      </button>

      <div
        id="profile-menu"
        className={`${styles.dropdown} ${open ? styles.dropdownOpen : ''}`}
        role="menu"
        onKeyDown={handleKeyDown}
      >
        {visibleItems.map((item, i) => {
          const label =
            typeof item.label === 'function'
              ? item.label(darkMode, user)
              : item.label;

          const commonProps = {
            key: i,
            ref: el => (itemRefs.current[i] = el),
            role: 'menuitem',
            tabIndex: 0,
            title: label,
            'aria-label': label,
            className: styles.menuItem,
          };

          if (item.type === 'link') {
            return (
              <Link
                {...commonProps}
                to={item.to}
                onClick={() => setOpen(false)}
              >
                <item.icon className={styles.icon} size={20} />
              </Link>
            );
          }

          if (item.type === 'action') {
            return (
              <button
                {...commonProps}
                onClick={() => handleAction(item.onClick)}
              >
                <item.icon className={styles.icon} size={20} />
              </button>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
