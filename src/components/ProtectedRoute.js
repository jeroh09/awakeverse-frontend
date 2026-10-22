// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, fallback = null }) {
  const { isAuthenticated, authChecked } = useAuth();

  // Wait until /api/auth/me check completes
  if (!authChecked) {
    // keep this minimal to avoid layout shifts
    return fallback || null;
  }

  if (isAuthenticated) return children;
  if (fallback) return fallback;

  return <Navigate to="/login" replace />;
}
