// src/components/ProtectedRoute.tsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Loader from './Loader';

interface Props {
  children: React.ReactElement;
}

const ProtectedRoute = ({ children }: Props) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('firebaseToken');

    setTimeout(() => {
      setAuthenticated(!!token);
      setLoading(false);
    }, 500); // Simulated delay
  }, []);

  if (loading) return <Loader />;
  return authenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
