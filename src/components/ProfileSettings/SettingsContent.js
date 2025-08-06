// src/components/ProfileSettings/SettingsContent.js
import React from 'react';
import AboutSection from './AboutSection';
import ConnectedApps from './ConnectedApps';
import ProfileDetails from './ProfileDetails';

const SettingsContent = ({ selected }) => (
  <div className="w-2/3 p-3">
    {selected === 'about' && <AboutSection />}
    {selected === 'connectedApps' && <ConnectedApps />}
    {selected === 'profileDetails' && <ProfileDetails />}
  </div>
);

export default SettingsContent;