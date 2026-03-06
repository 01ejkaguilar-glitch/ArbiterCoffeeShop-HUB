import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import { KITCHEN_OPERATIONS_ITEMS, KITCHEN_WORKFORCE_ITEMS } from '../../constants/navigation';
import LoadingFallback from '../common/LoadingFallback';

/**
 * Layout for kitchen staff pages: Sidebar + content area.
 * Redirects to /login if not authenticated, or / if not kitchen-staff.
 */
function KitchenLayout() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const userRoles = Array.isArray(user?.roles)
    ? user.roles
    : user?.roles ? Object.values(user.roles) : [];

  if (!userRoles.includes('kitchen-staff')) return <Navigate to="/" replace />;

  return (
    <div className="d-flex">
      <Sidebar
        title="Kitchen"
        groups={[
          { label: 'Operations', items: KITCHEN_OPERATIONS_ITEMS },
          { label: 'Workforce', items: KITCHEN_WORKFORCE_ITEMS },
        ]}
      />
      <div className="flex-grow-1 min-vh-100 kitchen-content-area" style={{minWidth: 0}}>
        <Outlet />
      </div>
    </div>
  );
}

export default KitchenLayout;
