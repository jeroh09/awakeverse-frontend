// src/components/ProfileSettings/AboutSection.js
import React from 'react';
import { Link } from 'react-router-dom';

const AboutSection = () => (
  <div>
    <h2 className="text-2xl mb-4">About</h2>
    <ul className="space-y-2">
      <li><Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link></li>
      <li><Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link></li>
    </ul>
  </div>
);

export default AboutSection;