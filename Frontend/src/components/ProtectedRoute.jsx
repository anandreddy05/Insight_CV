import React from 'react';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    // Redirect to login if no token exists
    return <Navigate to="/login" replace />;
  }
  
  // If token exists, render the children components
  return children;
};