/**
 * NotificationCenter Page – Modern Redesign
 *
 * Full-page notification history with filter tabs,
 * date grouping, bulk actions, and modern card layout.
 *
 * @module pages/notifications/NotificationCenter
 */

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import {
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
import {
  HiOutlineCog6Tooth,
  HiOutlineCheck,
  HiOutlineTrash,
  HiOutlineInboxStack,
} from 'react-icons/hi2';
import useNotifications from '../../hooks/useNotifications';
import { NOTIFICATION_TYPES } from '../../context/NotificationContext';
import SEO from '../../components/SEO';

/* ── icon & colour maps ─────────────────────────────────── */
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

const CLR_MAP = {
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

/* ── helpers ─────────────────────────────────────────────── */
const fmtDate = (d) => {
  const dt = new Date(d);
  const now = new Date();
  const ystr = new Date(now); ystr.setDate(ystr.getDate() - 1);
  if (dt.toDateString() === now.toDateString()) return 'Today';
  if (dt.toDateString() === ystr.toDateString()) return 'Yesterday';
  return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
};

const fmtTime = (d) =>
  new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

/* ── tabs ────────────────────────────────────────────────── */
const TABS = [
  { key: 'all',           label: 'All' },
  { key: 'unread',        label: 'Unread' },
  { key: 'orders',        label: 'Orders',        icon: FaShoppingBag },
  { key: 'announcements', label: 'Announcements',  icon: FaBullhorn },
  { key: 'tasks',         label: 'Tasks',          icon: FaTasks },
];

const ORDER_TYPES    = [NOTIFICATION_TYPES.ORDER_STATUS, NOTIFICATION_TYPES.ORDER_READY, NOTIFICATION_TYPES.NEW_ORDER];
const ANN_TYPES      = [NOTIFICATION_TYPES.ANNOUNCEMENT, NOTIFICATION_TYPES.PROMOTION];
const TASK_TYPES     = [NOTIFICATION_TYPES.TASK_ASSIGNED, NOTIFICATION_TYPES.TASK_COMPLETED, NOTIFICATION_TYPES.LEAVE_REQUEST, NOTIFICATION_TYPES.LEAVE_APPROVED, NOTIFICATION_TYPES.LEAVE_REJECTED];

/* ══════════════════════════════════════════════════════════ */
const NotificationCenter = () => {
  const [tab, setTab] = useState('all');
  const [selected, setSelected] = useState(new Set());

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  /* ── filtered list ── */
  const filtered = useMemo(() => {
    switch (tab) {
      case 'unread':        return notifications.filter(n => !n.read);
      case 'orders':        return notifications.filter(n => ORDER_TYPES.includes(n.type));
      case 'announcements': return notifications.filter(n => ANN_TYPES.includes(n.type));
      case 'tasks':         return notifications.filter(n => TASK_TYPES.includes(n.type));
      default:              return notifications;
    }
  }, [notifications, tab]);

  /* ── group by date ── */
  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach(n => {
      const k = fmtDate(n.createdAt);
      (g[k] = g[k] || []).push(n);
    });
    return g;
  }, [filtered]);

  /* ── selection helpers ── */
  const toggle = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const markSelRead  = () => { selected.forEach(id => markAsRead(id)); setSelected(new Set()); };
  const delSel       = () => { selected.forEach(id => deleteNotification(id)); setSelected(new Set()); };

  return (
    <>
      <SEO title="Notifications" description="View and manage your notifications" />

      <main className="nc-page">
        <Container className="nc-container">
          {/* ── Header ── */}
          <header className="nc-header">
            <div className="nc-header-left">
              <h1 className="nc-title">Notifications</h1>
              <p className="nc-subtitle">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                  : 'All caught up!'}
              </p>
            </div>
            <div className="nc-header-right">
              {unreadCount > 0 && (
                <button className="nc-action-btn" onClick={markAllAsRead}>
                  <FaCheckDouble /> <span>Mark all read</span>
                </button>
              )}
              <Link to="/notifications/settings" className="nc-action-btn nc-action-btn--outline">
                <HiOutlineCog6Tooth /> <span>Settings</span>
              </Link>
            </div>
          </header>

          {/* ── Tabs ── */}
          <nav className="nc-tabs" role="tablist">
            {TABS.map(t => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                className={`nc-tab ${tab === t.key ? 'nc-tab--active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.icon && <t.icon className="nc-tab-icon" />}
                {t.label}
                {t.key === 'all' && <span className="nc-tab-count">{notifications.length}</span>}
                {t.key === 'unread' && unreadCount > 0 && <span className="nc-tab-count nc-tab-count--alert">{unreadCount}</span>}
              </button>
            ))}
          </nav>

          {/* ── Bulk bar ── */}
          <AnimatePresence>
            {selected.size > 0 && (
              <motion.div
                className="nc-bulk"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <span className="nc-bulk-label">{selected.size} selected</span>
                <div className="nc-bulk-actions">
                  <button className="nc-bulk-btn" onClick={markSelRead}><HiOutlineCheck /> Mark read</button>
                  <button className="nc-bulk-btn nc-bulk-btn--danger" onClick={delSel}><HiOutlineTrash /> Delete</button>
                  <button className="nc-bulk-btn nc-bulk-btn--ghost" onClick={() => setSelected(new Set())}>Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── List ── */}
          {filtered.length > 0 ? (
            <div className="nc-groups">
              {Object.entries(grouped).map(([date, items]) => (
                <section key={date} className="nc-group">
                  <div className="nc-group-head">
                    <span className="nc-group-date">{date}</span>
                    <span className="nc-group-line" />
                  </div>

                  <div className="nc-group-card">
                    <AnimatePresence>
                      {items.map((n, i) => {
                        const Icon = ICON_MAP[n.type] || FaInfoCircle;
                        const clr  = CLR_MAP[n.type] || 'nt-clr-muted';
                        const isSel = selected.has(n.id);

                        return (
                          <motion.div
                            key={n.id}
                            className={`nc-item ${!n.read ? 'nc-item--unread' : ''} ${isSel ? 'nc-item--sel' : ''}`}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 12 }}
                            transition={{ delay: i * 0.03 }}
                          >
                            <input
                              type="checkbox"
                              className="nc-check"
                              checked={isSel}
                              onChange={() => toggle(n.id)}
                              aria-label={`Select: ${n.title}`}
                            />

                            <span className={`nc-item-icon ${clr}`}><Icon /></span>

                            <div className="nc-item-body">
                              <div className="nc-item-head">
                                <span className="nc-item-title">{n.title}</span>
                                <span className="nc-item-time">{fmtTime(n.createdAt)}</span>
                              </div>
                              <p className="nc-item-msg">{n.message}</p>
                              {n.action && (
                                <Link to={n.action.url} className="nc-item-link" onClick={() => markAsRead(n.id)}>
                                  {n.action.label} &rarr;
                                </Link>
                              )}
                            </div>

                            <div className="nc-item-actions">
                              {!n.read && (
                                <button className="nt-tiny-btn" onClick={() => markAsRead(n.id)} title="Mark read">
                                  <HiOutlineCheck />
                                </button>
                              )}
                              <button className="nt-tiny-btn nt-tiny-btn--del" onClick={() => deleteNotification(n.id)} title="Delete">
                                <HiOutlineTrash />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="nc-empty">
              <div className="nc-empty-circle">
                <HiOutlineInboxStack className="nc-empty-icon" />
              </div>
              <h3 className="nc-empty-title">No notifications</h3>
              <p className="nc-empty-sub">
                {tab === 'all'
                  ? "You don't have any notifications yet"
                  : `No ${tab} notifications`}
              </p>
            </div>
          )}

          {/* ── Clear all ── */}
          {notifications.length > 0 && (
            <div className="nc-footer">
              <button
                className="nc-clear-btn"
                onClick={() => { if (window.confirm('Clear all notifications?')) clearAll(); }}
              >
                <HiOutlineTrash /> Clear all notifications
              </button>
            </div>
          )}
        </Container>
      </main>
    </>
  );
};

export default NotificationCenter;
