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
import PaymentCancelled from './components/PaymentCancelled';
import ErrorBoundary from './components/ErrorBoundary';
import PublicCharacterPage from './pages/PublicCharacterPage';
import PublicScenarioPage from './pages/PublicScenarioPage';
import CreatorsCharterPage from './pages/CreatorsCharterPage';
import BillingDashboard from './components/Billing/BillingDashboard';
import QuizPage from './pages/QuizPage';
import QuizResultsPage from './pages/QuizResultsPage';
import SupportWidget from './components/SupportWidget/SupportWidget';
import UseCaseCreative from './pages/UseCases/UseCaseCreative';
import UseCaseEducation from './pages/UseCases/UseCaseEducation';
import UseCaseBusiness from './pages/UseCases/UseCaseBusiness';
import UseCaseDebate from './pages/UseCases/UseCaseDebate';
import VsLLMs from './pages/VsLLMs';
import UseCasesIndex from './pages/UseCases/UseCasesIndex';
import WorldCupPage from './pages/WorldCupPage';




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
    <>
      <Routes>
        {/* Landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Email authentication routes */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/verify-email" element={<Login />} />

        <Route path="/c/:characterId" element={<PublicCharacterPage />} />
        <Route path="/s/:scenarioId" element={<PublicScenarioPage />} />

        {/* Legal pages */}
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/community-guidelines" element={<CommunityGuidelines />} />
        <Route path="/copyright" element={<CopyrightPolicy />} />
        <Route path="/security" element={<SecurityPolicy />} />
        <Route path="/ai-disclaimer" element={<AIDisclaimer />} />
        <Route path="/contractor-agreements" element={<ContractorAgreements />} />

        {/* Creators & pricing */}
        <Route path="/creators" element={<CreatorsLanding />} />
        <Route path="/pricing" element={<PricingPage />} />


        {/* Use-Cases */}
        <Route path="/use-cases/creative" element={<UseCaseCreative />} />
        <Route path="/use-cases/education" element={<UseCaseEducation />} />
        <Route path="/use-cases/business" element={<UseCaseBusiness />} />
        <Route path="/use-cases/debate" element={<UseCaseDebate />} />
        <Route path="/vs/llms" element={<VsLLMs />} />
        <Route path="/use-cases" element={<UseCasesIndex />} />






        {/* Market Hub */}
        <Route
          path="/market-hub"
          element={
            <ErrorBoundary>
              <MarketHubPage />
            </ErrorBoundary>
          }
        />

        {/* Payment routes */}
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-cancelled" element={<PaymentCancelled />} />

        {/* Main app */}
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

        {/* Profile settings */}
        <Route
          path="/profile-settings"
          element={
            <ProtectedRoute>
              <ProfileSettings />
            </ProtectedRoute>
          }
        />

        {/* Avatar upload */}
        <Route
          path="/upload-avatar"
          element={
            <ProtectedRoute>
              <UploadAvatar />
            </ProtectedRoute>
          }
        />

        {/* Billing */}
        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <BillingDashboard />
            </ProtectedRoute>
          }
        />

        {/* NOTE: No separate /hub route - all navigation happens within /app using view state */}
        <Route path="/creators-charter" element={<CreatorsCharterPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/quiz/results" element={<QuizResultsPage />} />
        <Route path="/worldcup" element={<WorldCupPage />} />

        {/* Contact us */}
        <Route path="/contact-us" element={<ContactUs />} />

        {/* Aliases for legacy menu links */}
        <Route path="/settings" element={<Navigate to="/profile-settings" replace />} />
        <Route path="/contact" element={<Navigate to="/contact-us" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Support widget — fixed position, visible on all gated routes */}
      {isAuthenticated && <SupportWidget />}
    </>
  );
}