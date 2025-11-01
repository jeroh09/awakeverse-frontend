// src/App.js - Enhanced with AppViewProvider for Navigation Integration
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { AppViewProvider } from './contexts/AppViewContext'; // NEW: Import view context
import LandingPage     from './landing/pages/LandingPage';
import Login           from './pages/Login';
import Register        from './pages/Register';
import ChatApp         from './ChatApp';
import ProfileSettings from './pages/ProfileSettings';
import UploadAvatar    from './pages/UploadAvatar';
import ContactUs       from './pages/ContactUs';
import TermsOfService  from './pages/TermsOfService';
import PrivacyPolicy   from './pages/PrivacyPolicy';
import CommunityGuidelines from './pages/CommunityGuidelines';
import CopyrightPolicy from './pages/CopyrightPolicy';
import SecurityPolicy from './pages/SecurityPolicy';
import AIDisclaimer from './pages/AIDisclaimer';
import ContractorAgreements from './pages/ContractorAgreements';
import ProtectedRoute  from './components/ProtectedRoute';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import EmailVerification from './pages/EmailVerification';
import CreatorsLanding from './pages/CreatorsLanding/CreatorsLanding';
import PricingPage from './pages/PricingPage';
import MarketHubPage from './components/MarketHub/MarketHubPage';
import PaymentSuccess from './components/PaymentSuccess';
import PaymentCancelled from './components/PaymentCancelled'; // Add this import
import ErrorBoundary from './components/ErrorBoundary';
import './styles.css';

// NEW: Wrapper component for protected routes that need view context
const ProtectedAppRoute = ({ children }) => (
  <ProtectedRoute>
    <AppViewProvider>
      {children}
    </AppViewProvider>
  </ProtectedRoute>
);

export default function App() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Routes>
      {/* New landing page at root */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Email authentication routes */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<EmailVerification />} />
      <Route path="/verify-email" element={<Login />} />

      {/* Legal pages */}
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/community-guidelines" element={<CommunityGuidelines />} />
      <Route path="/copyright" element={<CopyrightPolicy />} />
      <Route path="/security" element={<SecurityPolicy />} />
      <Route path="/ai-disclaimer" element={<AIDisclaimer />} />
      <Route path="/contractor-agreements" element={<ContractorAgreements />} />
      
      {/* Market Hub - FIXED: Wrapped with ProtectedRoute + ErrorBoundary */}
      <Route path="/creators" element={<CreatorsLanding />} />
      <Route path="/pricing" element={<PricingPage />} />
      
      <Route 
        path="/market-hub" 
        element={
          <ErrorBoundary>
            <MarketHubPage />
          </ErrorBoundary>
        } 
      />

      {/* Payment routes - PROTECTED */}
      <Route path="/payment-success"  element={<PaymentSuccess />} />
      <Route path="/payment-cancelled" element={<PaymentCancelled />} />


      {/* Main app with NEW AppViewProvider wrapper */}
      <Route
        path="/app"
        element={
          <ErrorBoundary>
            <ProtectedAppRoute>
              <ChatApp />
            </ProtectedAppRoute>
          </ErrorBoundary>
        }
      />

      {/* Profile settings (wrapped for consistency) */}
      <Route
        path="/profile-settings"
        element={
          <ProtectedRoute>
            <ProfileSettings />
          </ProtectedRoute>
        }
      />

      {/* Avatar upload (wrapped for consistency) */}
      <Route
        path="/upload-avatar"
        element={
          <ProtectedRoute>
            <UploadAvatar />
          </ProtectedRoute>
        }
      />

      {/* NOTE: No separate /hub route - all navigation happens within /app using view state */}

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