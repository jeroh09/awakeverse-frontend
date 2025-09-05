// src/components/ProfileSettings/SettingsSidebar.js
import React from 'react';

const menuItems = [
  { key: 'about', label: 'About' },
  { key: 'connectedApps', label: 'Connected Apps' },
  { key: 'profileDetails', label: 'Profile Details' },
];

export default function SettingsSidebar({ selected, onSelect }) {
  return (
    <ul>
      {menuItems.map(item => (
        <li key={item.key}>
          <button
            className={selected === item.key ? 'active' : ''}
            onClick={() => onSelect(item.key)}
          >
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
