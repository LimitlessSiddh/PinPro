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
    const token = localStorage.getItem('token');

    // Simulate loading delay (e.g., for real API call or smoother UI)
    setTimeout(() => {
      setAuthenticated(!!token);
      setLoading(false);
    }, 500); // 0.5s delay
  }, []);

  if (loading) return <Loader />;
  return authenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
