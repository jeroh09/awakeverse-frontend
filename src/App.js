// src/App.js
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LandingPage     from './landing/pages/LandingPage';
import Login           from './pages/Login';
import Register        from './pages/Register';
import ChatApp         from './ChatApp';
import ProfileSettings from './pages/ProfileSettings';
import UploadAvatar    from './pages/UploadAvatar';
import ContactUs       from './pages/ContactUs';
import TermsOfService  from './pages/TermsOfService';  // 🆕 Added
import PrivacyPolicy   from './pages/PrivacyPolicy';   // 🆕 Added
import CommunityGuidelines from './pages/CommunityGuidelines'; // 🆕 Added
import CopyrightPolicy from './pages/CopyrightPolicy'; // 🆕 Added
import SecurityPolicy from './pages/SecurityPolicy';   // 🆕 Added
import AIDisclaimer from './pages/AIDisclaimer';       // 🆕 Added
import ContractorAgreements from './pages/ContractorAgreements'; // 🆕 Added
import ProtectedRoute  from './components/ProtectedRoute';
import MinimalUsageTest from './components/MinimalUsageTest';
import TestUsageComponents from './components/TestUsageComponents';
// Add these imports to your existing App.js
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import EmailVerification from './pages/EmailVerification';



import './styles.css';

export default function App() {
  const { token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // 🛡️ NEW: Navigation guard for authenticated users
  useEffect(() => {
    // Only apply guard when authenticated and on protected routes
    if (!token || !location.pathname.startsWith('/app')) {
      return;
    }

    const handlePopState = (event) => {
      // Check if user is trying to navigate back past the app
      const isAppRoot = event.state?.isAppRoot;
      
      // If we're in the app and there's no app root marker,
      // or if we detect navigation back to auth routes
      if (location.pathname.startsWith('/app') && 
          (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/')) {
        
        console.log('🛡️ Navigation guard: Preventing back navigation to auth');
        
        // Prevent going back to auth, redirect to app instead
        event.preventDefault();
        navigate('/app', { replace: true });
        
        // Re-establish the app root marker
        window.history.pushState({ isAppRoot: true }, '', '/app');
      }
    };

    // Listen for back navigation attempts
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [token, location.pathname, navigate]);

  // 🔧 NEW: Set up app root marker when entering protected routes
  useEffect(() => {
    if (token && location.pathname.startsWith('/app') && !window.history.state?.isAppRoot) {
      // Mark this as the app root for the navigation guard
      window.history.replaceState({ isAppRoot: true }, '', location.pathname);
    }
  }, [token, location.pathname]);

  return (
    <Routes>
      {/* New landing page at root */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* NEW: Email authentication routes */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<EmailVerification />} />
      <Route path="/verify-email" element={<Login />} /> {/* Login handles verification */}

      {/* Legal pages - 🆕 Added these routes */}
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/community-guidelines" element={<CommunityGuidelines />} />
      <Route path="/copyright" element={<CopyrightPolicy />} />
      <Route path="/security" element={<SecurityPolicy />} />
      <Route path="/ai-disclaimer" element={<AIDisclaimer />} />
      <Route path="/contractor-agreements" element={<ContractorAgreements />} />
      <Route path="/minimal-test" element={<MinimalUsageTest />} />
      <Route path="/test-usage" element={<TestUsageComponents />} />

      

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