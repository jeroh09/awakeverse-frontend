// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, fallback = null }) {
  const { token } = useAuth();
  if (token) return children;
  if (fallback) return fallback;
  return <Navigate to="/login" replace />;
}
