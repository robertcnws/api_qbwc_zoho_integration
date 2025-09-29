import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    localStorage.setItem('redirectPath', location.pathname + location.search);
    return <Navigate to="/" replace />;
  }
  return children;
};

export default ProtectedRoute;