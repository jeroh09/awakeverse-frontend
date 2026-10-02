import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import App from './App';
import LoadingSpinner from './components/LoadingSpinner';

const RouterWrapper = () => {
  const { token, authChecked } = useAuth();

  if (!authChecked) return <LoadingSpinner />;

  return (
    <Routes>
      <Route
        path="/login"
        element={!token ? <Login /> : <Navigate to="/" replace />}
      />
      <Route
        path="/register"
        element={!token ? <Register /> : <Navigate to="/" replace />}
      />
      <Route
        path="/"
        element={token ? <App /> : <Navigate to="/login" replace />}
      />
      <Route
        path="*"
        element={<Navigate to={token ? "/" : "/login"} replace />}
      />
    </Routes>
  );
};

export default RouterWrapper;
