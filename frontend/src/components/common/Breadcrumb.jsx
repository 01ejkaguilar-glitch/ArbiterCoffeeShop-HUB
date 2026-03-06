/**
 * Breadcrumb Navigation Component
 * Provides hierarchical navigation for the application
 */

import React from 'react';
import { Breadcrumb as BSBreadcrumb } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';

const Breadcrumb = ({ customPaths = {} }) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  // Default path name mapping
  const defaultPathNames = {
    admin: 'Admin',
    barista: 'Barista',
    dashboard: 'Dashboard',
    orders: 'Orders',
    products: 'Products',
    users: 'Users',
    employees: 'Employees',
    attendance: 'Attendance',
    shifts: 'Shifts',
    tasks: 'Tasks',
    'leave-requests': 'Leave Requests',
    performance: 'Performance',
    analytics: 'Analytics',
    reports: 'Reports',
    inventory: 'Inventory',
    'coffee-beans': 'Coffee Beans',
    ...customPaths
  };

  // Don't show breadcrumb on home page
  if (pathnames.length === 0) {
    return null;
  }

  return (
    <BSBreadcrumb className="bg-light px-3 py-2 rounded mb-3">
      <BSBreadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
        <FaHome className="me-1" />
        Home
      </BSBreadcrumb.Item>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const displayName = defaultPathNames[name] || name.charAt(0).toUpperCase() + name.slice(1);

        return isLast ? (
          <BSBreadcrumb.Item key={name} active>
            {displayName}
          </BSBreadcrumb.Item>
        ) : (
          <BSBreadcrumb.Item
            key={name}
            linkAs={Link}
            linkProps={{ to: routeTo }}
          >
            {displayName}
          </BSBreadcrumb.Item>
        );
      })}
    </BSBreadcrumb>
  );
};

export default Breadcrumb;
