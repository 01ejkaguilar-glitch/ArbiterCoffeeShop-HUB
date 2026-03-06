/**
 * Bottom Navigation Component
 * 
 * Mobile-optimized bottom navigation bar for quick access
 * to main app sections. Only visible on mobile devices.
 * 
 * @module components/mobile/BottomNavigation
 */

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHome, 
  FaCoffee, 
  FaShoppingCart, 
  FaUser, 
  FaClipboardList,
  FaTachometerAlt
} from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import './BottomNavigation.css';

const BottomNavigation = () => {
  const location = useLocation();
  const { cartCount } = useCart();
  const { isAuthenticated } = useAuth();

  // Don't show on auth pages
  const hiddenPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
  if (hiddenPaths.some(path => location.pathname.startsWith(path))) {
    return null;
  }

  // Don't show on admin/barista pages (they have their own nav)
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/barista')) {
    return null;
  }

  const navItems = [
    {
      to: '/',
      icon: FaHome,
      label: 'Home',
      exact: true
    },
    {
      to: '/products',
      icon: FaCoffee,
      label: 'Products'
    },
    {
      to: '/cart',
      icon: FaShoppingCart,
      label: 'Cart',
      badge: cartCount > 0 ? cartCount : null
    },
    {
      to: isAuthenticated ? '/orders' : '/login',
      icon: FaClipboardList,
      label: 'Orders'
    },
    {
      to: isAuthenticated ? '/dashboard' : '/login',
      icon: isAuthenticated ? FaTachometerAlt : FaUser,
      label: isAuthenticated ? 'Profile' : 'Login'
    }
  ];

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact 
          ? location.pathname === item.to 
          : location.pathname.startsWith(item.to);

        return (
          <NavLink
            key={item.label}
            to={item.to}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <motion.div
              className="bottom-nav-icon-wrapper"
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Icon className="bottom-nav-icon" aria-hidden="true" />
              <AnimatePresence>
                {item.badge && (
                  <motion.span
                    className="bottom-nav-badge badge bg-danger"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
            <span className="bottom-nav-label">{item.label}</span>
            {isActive && (
              <motion.div
                className="bottom-nav-indicator"
                layoutId="bottomNavIndicator"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomNavigation;
