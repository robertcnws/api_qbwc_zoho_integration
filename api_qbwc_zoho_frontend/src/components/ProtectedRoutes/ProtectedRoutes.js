import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // useEffect(() => {
  //   if (isAuthenticated) {
  //     <Navigate to="/" replace state={{ from: location }} />
  //   }
  // }, [isAuthenticated, location.pathname]);

  if (isAuthenticated === undefined) return "... LOADING ...";

  return isAuthenticated ? (
    children
  ) : (
    <Navigate to="/" replace state={{ from: location }} />
  );
};

export default ProtectedRoute;