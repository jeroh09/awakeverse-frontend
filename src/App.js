// src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Landing page (new module)
import LandingPage     from './landing/pages/LandingPage';
import Login           from './pages/Login';
import Register        from './pages/Register';
import ChatApp         from './ChatApp';
import ProfileSettings from './pages/ProfileSettings';
import UploadAvatar    from './pages/UploadAvatar';
import ContactUs       from './pages/ContactUs';
import ProtectedRoute  from './components/ProtectedRoute';

import './styles.css';

export default function App() {
  return (
    <Routes>
      {/* New landing page at root */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Main app (protected) */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <ChatApp />
          </ProtectedRoute>
        }
      />

      {/* Profile settings (protected) */}
      <Route
        path="/profile-settings"
        element={
          <ProtectedRoute>
            <ProfileSettings />
          </ProtectedRoute>
        }
      />

      {/* Avatar upload (protected) */}
      <Route
        path="/upload-avatar"
        element={
          <ProtectedRoute>
            <UploadAvatar />
          </ProtectedRoute>
        }
      />

      {/* Contact us */}
      <Route path="/contact-us" element={<ContactUs />} />

      {/* Aliases for legacy menu links */}
      <Route path="/settings" element={<Navigate to="/profile-settings" replace />} />
      <Route path="/contact"  element={<Navigate to="/contact-us"      replace />} />

      {/* Fallback: redirect everything else back to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
