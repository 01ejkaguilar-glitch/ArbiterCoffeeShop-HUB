/**
 * NotificationBell Component – Modern Redesign
 *
 * Navbar notification bell with badge count and dropdown panel.
 * Shows recent notifications with quick actions.
 *
 * @module components/notifications/NotificationBell
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaBell,
  FaCheckDouble,
  FaShoppingBag,
  FaBullhorn,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaTasks,
  FaCalendarAlt,
  FaBoxes,
} from 'react-icons/fa';
import { HiOutlineCog6Tooth, HiOutlineCheck, HiOutlineTrash } from 'react-icons/hi2';
import useNotifications from '../../hooks/useNotifications';
import { NOTIFICATION_TYPES } from '../../context/NotificationContext';

/* ── icon / colour maps ─────────────────────────────────── */
const ICON_MAP = {
  [NOTIFICATION_TYPES.ORDER_STATUS]: FaShoppingBag,
  [NOTIFICATION_TYPES.ORDER_READY]:  FaShoppingBag,
  [NOTIFICATION_TYPES.NEW_ORDER]:    FaShoppingBag,
  [NOTIFICATION_TYPES.ANNOUNCEMENT]: FaBullhorn,
  [NOTIFICATION_TYPES.PROMOTION]:    FaBullhorn,
  [NOTIFICATION_TYPES.LOW_STOCK]:    FaBoxes,
  [NOTIFICATION_TYPES.TASK_ASSIGNED]:  FaTasks,
  [NOTIFICATION_TYPES.TASK_COMPLETED]: FaTasks,
  [NOTIFICATION_TYPES.LEAVE_REQUEST]:  FaCalendarAlt,
  [NOTIFICATION_TYPES.LEAVE_APPROVED]: FaCalendarAlt,
  [NOTIFICATION_TYPES.LEAVE_REJECTED]: FaCalendarAlt,
  [NOTIFICATION_TYPES.SUCCESS]: FaCheckCircle,
  [NOTIFICATION_TYPES.WARNING]: FaExclamationTriangle,
  [NOTIFICATION_TYPES.ERROR]:   FaTimesCircle,
  [NOTIFICATION_TYPES.INFO]:    FaInfoCircle,
  [NOTIFICATION_TYPES.SYSTEM]:  FaInfoCircle,
};

const COLOR_MAP = {
  [NOTIFICATION_TYPES.ORDER_STATUS]: 'nt-clr-brand',
  [NOTIFICATION_TYPES.ORDER_READY]:  'nt-clr-success',
  [NOTIFICATION_TYPES.NEW_ORDER]:    'nt-clr-brand',
  [NOTIFICATION_TYPES.ANNOUNCEMENT]: 'nt-clr-info',
  [NOTIFICATION_TYPES.PROMOTION]:    'nt-clr-amber',
  [NOTIFICATION_TYPES.LOW_STOCK]:    'nt-clr-amber',
  [NOTIFICATION_TYPES.TASK_ASSIGNED]:  'nt-clr-brand',
  [NOTIFICATION_TYPES.TASK_COMPLETED]: 'nt-clr-success',
  [NOTIFICATION_TYPES.LEAVE_APPROVED]: 'nt-clr-success',
  [NOTIFICATION_TYPES.LEAVE_REJECTED]: 'nt-clr-danger',
  [NOTIFICATION_TYPES.SUCCESS]: 'nt-clr-success',
  [NOTIFICATION_TYPES.WARNING]: 'nt-clr-amber',
  [NOTIFICATION_TYPES.ERROR]:   'nt-clr-danger',
  [NOTIFICATION_TYPES.INFO]:    'nt-clr-info',
  [NOTIFICATION_TYPES.SYSTEM]:  'nt-clr-muted',
};

const relativeTime = (d) => {
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(ms / 3600000);
  if (h < 24) return `${h}h ago`;
  const dy = Math.floor(ms / 86400000);
  if (dy < 7) return `${dy}d ago`;
  return new Date(d).toLocaleDateString();
};

/* ── component ──────────────────────────────────────────── */
const NotificationBell = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getRecent,
  } = useNotifications();

  const recent = getRecent(5);

  /* close on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        bellRef.current && !bellRef.current.contains(e.target)
      ) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* close on Escape */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && isOpen) { setIsOpen(false); bellRef.current?.focus(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  const handleClick = (n) => {
    if (!n.read) markAsRead(n.id);
    if (n.action?.url) setIsOpen(false);
  };

  return (
    <div className={`nt-bell-wrap ${className}`}>
      {/* ── Bell button ── */}
      <button
        ref={bellRef}
        className={`nt-bell-btn ${isOpen ? 'nt-bell-btn--active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <FaBell className="nt-bell-icon" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              className="nt-bell-badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* ── Dropdown ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            className="nt-dropdown"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            role="dialog"
            aria-label="Notifications"
          >
            {/* header */}
            <div className="nt-dropdown-head">
              <h4 className="nt-dropdown-title">Notifications</h4>
              <div className="nt-dropdown-head-actions">
                {unreadCount > 0 && (
                  <button className="nt-icon-btn" onClick={markAllAsRead} title="Mark all read">
                    <FaCheckDouble />
                  </button>
                )}
                <Link to="/notifications/settings" className="nt-icon-btn" onClick={() => setIsOpen(false)} title="Settings">
                  <HiOutlineCog6Tooth />
                </Link>
              </div>
            </div>

            {/* body */}
            <div className="nt-dropdown-body">
              {recent.length > 0 ? (
                <ul className="nt-list">
                  {recent.map((n) => {
                    const Icon = ICON_MAP[n.type] || FaInfoCircle;
                    const clr  = COLOR_MAP[n.type] || 'nt-clr-muted';
                    return (
                      <li key={n.id} className="nt-list-item">
                        <div
                          className={`nt-row ${!n.read ? 'nt-row--unread' : ''}`}
                          onClick={() => handleClick(n)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && handleClick(n)}
                        >
                          <span className={`nt-row-icon ${clr}`}><Icon /></span>
                          <div className="nt-row-body">
                            <span className="nt-row-title">{n.title}</span>
                            <span className="nt-row-msg">{n.message}</span>
                            <span className="nt-row-time">{relativeTime(n.createdAt)}</span>
                          </div>
                          <div className="nt-row-actions">
                            {!n.read && (
                              <button className="nt-tiny-btn" onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }} title="Mark read">
                                <HiOutlineCheck />
                              </button>
                            )}
                            <button className="nt-tiny-btn nt-tiny-btn--del" onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }} title="Delete">
                              <HiOutlineTrash />
                            </button>
                          </div>
                        </div>
                        {n.action && (
                          <Link to={n.action.url} className="nt-row-link" onClick={() => { markAsRead(n.id); setIsOpen(false); }}>
                            {n.action.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="nt-empty">
                  <FaBell className="nt-empty-icon" />
                  <p className="nt-empty-title">No notifications</p>
                  <span className="nt-empty-sub">We'll let you know when something happens</span>
                </div>
              )}
            </div>

            {/* footer */}
            {notifications.length > 5 && (
              <div className="nt-dropdown-foot">
                <Link to="/notifications" className="nt-view-all" onClick={() => setIsOpen(false)}>
                  View all notifications
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
