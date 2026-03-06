/**
 * NotificationPreferences Page – Modern Redesign
 *
 * Settings page for managing notification preferences
 * including categories, sounds, and push notifications.
 *
 * @module pages/notifications/NotificationPreferences
 */

import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  FaBell,
  FaBellSlash,
  FaVolumeUp,
  FaVolumeMute,
  FaShoppingBag,
  FaBullhorn,
  FaTasks,
  FaCalendarAlt,
  FaBoxes,
} from 'react-icons/fa';
import { HiOutlineArrowLeft, HiOutlineDevicePhoneMobile, HiOutlineComputerDesktop, HiOutlineCheckCircle } from 'react-icons/hi2';
import useNotifications from '../../hooks/useNotifications';
import { NOTIFICATION_TYPES } from '../../context/NotificationContext';
import SEO from '../../components/SEO';

/* ── category config ─────────────────────────────────── */
const CATEGORIES = [
  {
    id: 'orders',
    title: 'Order Updates',
    desc: 'Order status, ready for pickup, and new orders',
    icon: FaShoppingBag,
    clr: 'nt-clr-brand',
    types: [NOTIFICATION_TYPES.ORDER_STATUS, NOTIFICATION_TYPES.ORDER_READY, NOTIFICATION_TYPES.NEW_ORDER],
  },
  {
    id: 'announcements',
    title: 'Announcements & Promotions',
    desc: 'Special offers, new products, and store announcements',
    icon: FaBullhorn,
    clr: 'nt-clr-info',
    types: [NOTIFICATION_TYPES.ANNOUNCEMENT, NOTIFICATION_TYPES.PROMOTION],
  },
  {
    id: 'tasks',
    title: 'Tasks & Assignments',
    desc: 'Task assignments, completions, and updates',
    icon: FaTasks,
    clr: 'nt-clr-amber',
    types: [NOTIFICATION_TYPES.TASK_ASSIGNED, NOTIFICATION_TYPES.TASK_COMPLETED],
  },
  {
    id: 'leave',
    title: 'Leave Requests',
    desc: 'Updates on leave requests and approvals',
    icon: FaCalendarAlt,
    clr: 'nt-clr-success',
    types: [NOTIFICATION_TYPES.LEAVE_REQUEST, NOTIFICATION_TYPES.LEAVE_APPROVED, NOTIFICATION_TYPES.LEAVE_REJECTED],
  },
  {
    id: 'inventory',
    title: 'Inventory Alerts',
    desc: 'Low stock warnings and inventory updates',
    icon: FaBoxes,
    clr: 'nt-clr-danger',
    types: [NOTIFICATION_TYPES.LOW_STOCK],
  },
];

/* ══════════════════════════════════════════════════════ */
const NotificationPreferences = () => {
  const { preferences, updatePreferences, requestPushPermission } = useNotifications();
  const [pushStatus, setPushStatus] = useState(() =>
    'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [saved, setSaved] = useState(false);

  const flash = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  /* helpers */
  const isCatEnabled = (cat) => !cat.types.every(t => preferences.disabledTypes?.[t]);

  const toggleCat = (cat, on) => {
    const dt = { ...(preferences.disabledTypes || {}) };
    cat.types.forEach(t => on ? delete dt[t] : (dt[t] = true));
    updatePreferences({ disabledTypes: dt });
    flash();
  };

  const toggleSound = (on) => {
    updatePreferences({ sound: on, soundEnabled: on });
    flash();
  };

  const handlePush = async () => {
    const r = await requestPushPermission();
    setPushStatus(r ? 'granted' : 'denied');
    flash();
  };

  return (
    <>
      <SEO title="Notification Settings" description="Manage your notification preferences" />

      <main className="np-page">
        <Container className="np-container">
          {/* ── Back link ── */}
          <Link to="/notifications" className="np-back">
            <HiOutlineArrowLeft /> Back to Notifications
          </Link>

          {/* ── Header ── */}
          <header className="np-header">
            <h1 className="np-title">Notification Settings</h1>
            <p className="np-subtitle">Choose what notifications you receive and how you receive them</p>
          </header>

          {/* ── Saved toast ── */}
          {saved && (
            <div className="np-toast">
              <HiOutlineCheckCircle /> Settings saved
            </div>
          )}

          {/* ── Push card ── */}
          <section className="np-card">
            <div className="np-card-head">
              <HiOutlineDevicePhoneMobile className="np-card-head-icon" />
              <span>Push Notifications</span>
            </div>
            <div className="np-card-body">
              <div className="np-setting-row">
                <div className="np-setting-info">
                  <h3 className="np-setting-title">Browser Notifications</h3>
                  <p className="np-setting-desc">Receive notifications even when the app is in the background</p>
                </div>
                {pushStatus === 'unsupported' && <span className="np-badge np-badge--muted">Not supported</span>}
                {pushStatus === 'granted' && (
                  <span className="np-badge np-badge--success"><FaBell /> Enabled</span>
                )}
                {pushStatus === 'denied' && (
                  <span className="np-badge np-badge--danger"><FaBellSlash /> Blocked</span>
                )}
                {pushStatus === 'default' && (
                  <button className="np-enable-btn" onClick={handlePush}>Enable</button>
                )}
              </div>
              {pushStatus === 'denied' && (
                <p className="np-warn">Push notifications are blocked. Enable them in your browser settings.</p>
              )}
            </div>
          </section>

          {/* ── Sound card ── */}
          <section className="np-card">
            <div className="np-card-head">
              {preferences.sound ? <FaVolumeUp className="np-card-head-icon" /> : <FaVolumeMute className="np-card-head-icon" />}
              <span>Sound Settings</span>
            </div>
            <div className="np-card-body">
              <div className="np-setting-row">
                <div className="np-setting-info">
                  <h3 className="np-setting-title">Notification Sound</h3>
                  <p className="np-setting-desc">Play a sound when you receive a notification</p>
                </div>
                <label className="np-toggle">
                  <input
                    type="checkbox"
                    checked={!!preferences.sound}
                    onChange={(e) => toggleSound(e.target.checked)}
                  />
                  <span className="np-toggle-track" />
                </label>
              </div>
            </div>
          </section>

          {/* ── Categories card ── */}
          <section className="np-card">
            <div className="np-card-head">
              <HiOutlineComputerDesktop className="np-card-head-icon" />
              <span>Notification Categories</span>
            </div>
            <div className="np-card-body np-card-body--flush">
              {CATEGORIES.map((cat, idx) => {
                const Icon = cat.icon;
                const on = isCatEnabled(cat);
                return (
                  <div key={cat.id} className={`np-cat-row ${idx < CATEGORIES.length - 1 ? 'np-cat-row--border' : ''}`}>
                    <span className={`np-cat-icon ${cat.clr}`}><Icon /></span>
                    <div className="np-cat-info">
                      <h3 className="np-cat-title">{cat.title}</h3>
                      <p className="np-cat-desc">{cat.desc}</p>
                    </div>
                    <label className="np-toggle">
                      <input type="checkbox" checked={on} onChange={(e) => toggleCat(cat, e.target.checked)} />
                      <span className="np-toggle-track" />
                    </label>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Info ── */}
          <div className="np-info-card">
            <h4 className="np-info-title">About Notifications</h4>
            <p className="np-info-text">
              Important system notifications and security alerts cannot be disabled.
              You can manage email notification preferences in your account settings.
            </p>
          </div>
        </Container>
      </main>
    </>
  );
};

export default NotificationPreferences;
