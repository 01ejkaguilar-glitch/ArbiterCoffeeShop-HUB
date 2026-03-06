import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from './Navbar';
import Footer from './Footer';
import LoadingFallback from '../common/LoadingFallback';

/**
 * Layout for authenticated customer pages: Navbar + content + Footer.
 * Redirects to /login if not authenticated.
 */
function CustomerLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="App d-flex flex-column min-vh-100">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Navbar />
      <div id="main-content" className="flex-grow-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

export default CustomerLayout;
