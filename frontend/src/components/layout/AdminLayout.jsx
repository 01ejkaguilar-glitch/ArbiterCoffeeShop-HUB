import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import { ADMIN_BUSINESS_ITEMS, ADMIN_WORKFORCE_ITEMS } from '../../constants/navigation';
import LoadingFallback from '../common/LoadingFallback';
import '../../styles/admin.css';

/**
 * Layout for admin pages: Sidebar + content area.
 * Redirects to /login if not authenticated, or / if not admin.
 */
function AdminLayout() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const userRoles = Array.isArray(user?.roles)
    ? user.roles
    : user?.roles ? Object.values(user.roles) : [];

  if (!userRoles.includes('admin')) return <Navigate to="/" replace />;

  return (
    <div className="d-flex">
      <Sidebar
        title="Admin"
        groups={[
          { label: 'Business', items: ADMIN_BUSINESS_ITEMS },
          { label: 'Workforce', items: ADMIN_WORKFORCE_ITEMS },
        ]}
      />
      <div className="flex-grow-1 min-vh-100 admin-content-area" style={{minWidth: 0}}>
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;
