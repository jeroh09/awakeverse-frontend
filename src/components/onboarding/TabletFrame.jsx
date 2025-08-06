import React from 'react';
import './Onboarding.css';

export default function TabletFrame({ children }) {
  return (
    <div className="tablet-frame">
      <div className="screen">
        {children}
      </div>
    </div>
  );
}