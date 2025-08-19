// src/components/ProfileSettings/AboutSection.js
import React from 'react';
import { Link } from 'react-router-dom';

const AboutSection = () => (
  <div>
    <h2 className="text-2xl mb-4">About</h2>
    <ul className="space-y-2">
      <li><Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link></li>
      <li><Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link></li>
      <li><Link to="/community-guidelines" className="text-blue-600 hover:underline">Community Guidelines</Link></li>
      <li><Link to="/copyright" className="text-blue-600 hover:underline">Copyright & IP Policy</Link></li>
      <li><Link to="/security" className="text-blue-600 hover:underline">Security & Data Protection</Link></li>
      <li><Link to="/ai-disclaimer" className="text-blue-600 hover:underline">AI Use Disclaimer</Link></li>
      <li><Link to="/contractor-agreements" className="text-blue-600 hover:underline">Contractor Agreements</Link></li>
    </ul>
  </div>
);

export default AboutSection;