import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import { BARISTA_OPERATIONS_ITEMS, BARISTA_WORKFORCE_ITEMS } from '../../constants/navigation';
import LoadingFallback from '../common/LoadingFallback';

/**
 * Layout for barista pages: Sidebar + content area.
 * Redirects to /login if not authenticated, or / if not barista.
 */
function BaristaLayout() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const userRoles = Array.isArray(user?.roles)
    ? user.roles
    : user?.roles ? Object.values(user.roles) : [];

  if (!userRoles.includes('barista')) return <Navigate to="/" replace />;

  return (
    <div className="d-flex">
      <Sidebar
        title="Barista"
        groups={[
          { label: 'Operations', items: BARISTA_OPERATIONS_ITEMS },
          { label: 'Workforce', items: BARISTA_WORKFORCE_ITEMS },
        ]}
      />
      <div className="flex-grow-1 min-vh-100 barista-content-area" style={{minWidth: 0}}>
        <Outlet />
      </div>
    </div>
  );
}

export default BaristaLayout;
