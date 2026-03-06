import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_DASHBOARD } from '../../constants/roles';
import LoadingFallback from '../common/LoadingFallback';

/**
 * Redirects /dashboard to the appropriate role-specific dashboard.
 */
function DashboardRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const userRoles = Array.isArray(user?.roles)
    ? user.roles
    : user?.roles ? Object.values(user.roles) : [];

  // Redirect to first matching role dashboard
  for (const role of Object.keys(ROLE_DASHBOARD)) {
    if (userRoles.includes(role)) {
      return <Navigate to={ROLE_DASHBOARD[role]} replace />;
    }
  }

  // Default to customer dashboard (matches ROLE_DASHBOARD[customer])
  return <Navigate to="/customer/dashboard" replace />;
}

export default DashboardRedirect;
