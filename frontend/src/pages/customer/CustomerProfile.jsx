import BottomNavigation from '../../components/mobile/BottomNavigation';
import PullToRefresh from '../../components/mobile/PullToRefresh';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Spinner, Form } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUser, FaCoffee, FaBell, FaShieldAlt, FaCamera,
  FaTrash, FaCalendarAlt, FaCheck, FaExclamationCircle,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api.service';
import { API_ENDPOINTS, BACKEND_BASE_URL } from '../../config/api';
import { useEscapeKey, useFocusTrap } from '../../hooks/useKeyboardNavigation';
import './CustomerProfile.css';

/* ── Constants ────────────────────────────── */
const TABS = [
  { key: 'personal', label: 'Personal Info', Icon: FaUser },
  { key: 'coffee', label: 'Coffee Preferences', Icon: FaCoffee },
  { key: 'notifications', label: 'Notifications', Icon: FaBell },
  { key: 'security', label: 'Security', Icon: FaShieldAlt },
];

const BREWING_METHODS = ['drip', 'espresso', 'french_press', 'pour_over', 'cold_brew', 'moka_pot'];

const NOTIFICATION_OPTIONS = [
  { key: 'email_notifications', label: 'Email Notifications', desc: 'Order updates and announcements via email' },
  { key: 'sms_notifications', label: 'SMS Notifications', desc: 'Order updates via text messages' },
  { key: 'order_updates', label: 'Order Updates', desc: 'Get notified when your order status changes' },
  { key: 'promotional_offers', label: 'Promotional Offers', desc: 'Receive special offers and promotions' },
];

const DEFAULT_AVATAR =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjYwIiBjeT0iNjAiIHI9IjYwIiBmaWxsPSIjZTllOWVhIi8+CjxjaXJjbGUgY3g9IjYwIiBjeT0iNDUiIHI9IjIwIiBmaWxsPSIjOWNhM2FmIi8+CjxwYXRoIGQ9Ik0yMCA5NWMwLTIyIDI1LTMwIDQwLTMwczQwIDggNDAgMzAiIGZpbGw9IiM5Y2EzYWYiLz4KPHN2Zz4=';

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.25 },
};

const fmtMethod = (s) => s.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

/* ── Component ────────────────────────────── */
const CustomerProfile = () => {
  const { logout } = useAuth();

  /* state */
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');

  const [notifications, setNotifications] = useState({
    email_notifications: true,
    sms_notifications: false,
    order_updates: true,
    promotional_offers: false,
  });

  const [tastePreferences, setTastePreferences] = useState({
    coffee_intensity: '',
    favorite_roast: '',
    brewing_methods: [],
    taste_notes: '',
  });

  const [privacySettings, setPrivacySettings] = useState({
    public_profile: false,
    data_sharing: false,
  });

  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateForm, setDeactivateForm] = useState({ password: '', reason: '' });

  const fileInputRef = useRef(null);
  const deactivateModalRef = useRef(null);

  /* keyboard a11y */
  useEscapeKey(() => setShowDeactivateModal(false), showDeactivateModal);
  useFocusTrap(deactivateModalRef, showDeactivateModal);

  /* ── Single fetch on mount ─────────────── */
  const fetchProfile = useCallback(async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.CUSTOMER.PROFILE);
      if (response.success) {
        const data = response.data;
        setProfile(data);

        // Hydrate taste preferences, notification prefs, and privacy settings
        if (data.taste_preferences) {
          const prefs =
            typeof data.taste_preferences === 'string'
              ? JSON.parse(data.taste_preferences)
              : data.taste_preferences;

          setTastePreferences({
            coffee_intensity: prefs.coffee_intensity || '',
            favorite_roast: prefs.favorite_roast || '',
            brewing_methods: prefs.brewing_methods || [],
            taste_notes: prefs.taste_notes || '',
          });

          if (prefs.notification_preferences) {
            setNotifications((prev) => ({ ...prev, ...prefs.notification_preferences }));
          }
          if (prefs.privacy_settings) {
            setPrivacySettings(prefs.privacy_settings);
          }
        }
      }
    } catch {
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /* auto-clear alerts */
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  /* ── Handlers ──────────────────────────── */
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      name: fd.get('name'),
      phone: fd.get('phone'),
      birthday: fd.get('birthday'),
      address: fd.get('address'),
    };

    setSaving(true);
    setError(null);
    try {
      const response = await apiService.put(API_ENDPOINTS.CUSTOMER.PROFILE, payload);
      if (response.success) {
        setProfile((prev) => ({ ...prev, ...payload }));
        setSuccess('Profile updated successfully');
      }
    } catch {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCoffeePrefsUpdate = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const prefs = {
      coffee_intensity: fd.get('coffee_intensity'),
      favorite_roast: fd.get('favorite_roast'),
      brewing_methods: fd.getAll('brewing_methods'),
      taste_notes: fd.get('taste_notes'),
    };

    setSaving(true);
    setError(null);
    try {
      const response = await apiService.put(API_ENDPOINTS.CUSTOMER.PROFILE, {
        taste_preferences: prefs,
      });
      if (response.success) {
        setTastePreferences(prefs);
        setSuccess('Coffee preferences updated');
      }
    } catch {
      setError('Failed to update coffee preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await apiService.put(API_ENDPOINTS.CUSTOMER.NOTIFICATIONS, notifications);
      if (response.success) {
        setSuccess('Notification preferences updated');
      }
    } catch {
      setError('Failed to update notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const current = fd.get('current_password');
    const newPwd = fd.get('new_password');
    const confirm = fd.get('confirm_password');

    if (newPwd !== confirm) {
      setError('New password and confirmation do not match');
      return;
    }
    if (newPwd.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await apiService.put(API_ENDPOINTS.CUSTOMER.CHANGE_PASSWORD, {
        current_password: current,
        password: newPwd,
        password_confirmation: confirm,
      });
      if (response.success) {
        setSuccess('Password changed successfully');
        e.target.reset();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handlePrivacySave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiService.put(API_ENDPOINTS.CUSTOMER.PROFILE, {
        taste_preferences: { privacy_settings: privacySettings },
      });
      setSuccess('Privacy settings saved');
    } catch {
      setError('Failed to save privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('profile_picture', file);

    setSaving(true);
    setError(null);
    try {
      const response = await apiService.upload(API_ENDPOINTS.CUSTOMER.PROFILE_PICTURE, fd);
      if (response.success) {
        setProfile((prev) => ({ ...prev, profile_picture: response.data.profile_picture }));
        setSuccess('Profile picture updated');
      }
    } catch {
      setError('Failed to upload profile picture');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateForm.password) {
      setError('Password is required');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await apiService.delete(API_ENDPOINTS.CUSTOMER.DEACTIVATE_ACCOUNT, {
        password: deactivateForm.password,
        reason: deactivateForm.reason,
      });
      if (response.success) {
        logout();
        window.location.href = '/';
      }
    } catch {
      setError('Failed to deactivate account');
    } finally {
      setSaving(false);
    }
  };

  /* ── Derived ───────────────────────────── */
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  /* ── Loading ───────────────────────────── */
  if (loading) {
    return (
      <main role="main" className="cpf-page">
        <div className="cpf-loading">
          <Spinner animation="border" />
          <p>Loading your profile…</p>
        </div>
      </main>
    );
  }

  /* ── Render ────────────────────────────── */
  return (
    <main role="main" className="cpf-page">
      <PullToRefresh onRefresh={fetchProfile}>
      <Helmet>
        <title>My Profile | Arbiter Coffee</title>
        <meta name="description" content="Manage your Arbiter Coffee profile, preferences, and account settings." />
      </Helmet>

        {/* ── Alerts ─────────────────────── */}
      <AnimatePresence>
        {success && (
          <motion.div className="cpf-alert cpf-alert-success" {...fadeIn} key="success">
            <FaCheck /> {success}
          </motion.div>
        )}
        {error && (
          <motion.div className="cpf-alert cpf-alert-error" {...fadeIn} key="error">
            <FaExclamationCircle /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Profile Header ─────────────── */}
      <section className="cpf-header">
        <div className="cpf-avatar-wrap">
          <img
            src={profile?.profile_picture ? `${BACKEND_BASE_URL}${profile.profile_picture}` : DEFAULT_AVATAR}
            alt={profile?.name || 'Profile'}
            className="cpf-avatar"
          />
          <button
            type="button"
            className="cpf-avatar-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={saving}
            aria-label="Upload profile picture"
          >
            <FaCamera />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePictureUpload}
            style={{ display: 'none' }}
          />
        </div>
        <h1 className="cpf-header-name">{profile?.name || 'Your Name'}</h1>
        <p className="cpf-header-email">{profile?.email}</p>
        {memberSince && (
          <span className="cpf-member-badge">
            <FaCalendarAlt /> Member since {memberSince}
          </span>
        )}
      </section>

      {/* ── Tab Navigation ─────────────── */}
      <nav className="cpf-nav" role="tablist" aria-label="Profile sections">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            className={`cpf-nav-pill${activeTab === key ? ' active' : ''}`}
            onClick={() => setActiveTab(key)}
            role="tab"
            aria-selected={activeTab === key}
            aria-controls={`panel-${key}`}
          >
            <Icon /> {label}
          </button>
        ))}
      </nav>

        {/* ── Tab Content ────────────────── */}
      <AnimatePresence mode="wait">
        {/* ─── Personal Info ──────────── */}
        {activeTab === 'personal' && (
          <motion.div key="personal" {...fadeIn} id="panel-personal" role="tabpanel">
            <div className="cpf-card">
              <div className="cpf-card-header">
                <h2 className="cpf-card-title">Personal Information</h2>
                <p className="cpf-card-subtitle">Update your details and contact information</p>
              </div>

              <form onSubmit={handleProfileUpdate}>
                <div className="cpf-form-grid">
                  <div className="cpf-form-group">
                    <label className="cpf-form-label" htmlFor="cpf-name">Full Name</label>
                    <input id="cpf-name" type="text" name="name" className="cpf-form-input" defaultValue={profile?.name} required />
                  </div>
                  <div className="cpf-form-group">
                    <label className="cpf-form-label" htmlFor="cpf-email">Email Address</label>
                    <input id="cpf-email" type="email" className="cpf-form-input readonly" value={profile?.email || ''} readOnly />
                    <span className="cpf-form-help">Email cannot be changed</span>
                  </div>
                  <div className="cpf-form-group">
                    <label className="cpf-form-label" htmlFor="cpf-phone">Phone Number</label>
                    <input id="cpf-phone" type="tel" name="phone" className="cpf-form-input" defaultValue={profile?.phone} />
                  </div>
                  <div className="cpf-form-group">
                    <label className="cpf-form-label" htmlFor="cpf-birthday">Birthday</label>
                    <input id="cpf-birthday" type="date" name="birthday" className="cpf-form-input" defaultValue={profile?.birthday} />
                  </div>
                  <div className="cpf-form-group full-width">
                    <label className="cpf-form-label" htmlFor="cpf-address">Address</label>
                    <textarea id="cpf-address" name="address" className="cpf-form-input" rows={3} defaultValue={profile?.address} />
                  </div>
                </div>
                <button type="submit" className="cpf-btn cpf-btn-primary" disabled={saving}>
                  {saving ? <Spinner animation="border" size="sm" /> : 'Save Changes'}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* ─── Coffee Preferences ─────── */}
        {activeTab === 'coffee' && (
          <motion.div key="coffee" {...fadeIn} id="panel-coffee" role="tabpanel">
            <div className="cpf-card">
              <div className="cpf-card-header">
                <h2 className="cpf-card-title">Coffee Preferences</h2>
                <p className="cpf-card-subtitle">Help us brew the perfect cup for you</p>
              </div>

              <form onSubmit={handleCoffeePrefsUpdate}>
                <div className="cpf-form-grid">
                  <div className="cpf-form-group">
                    <label className="cpf-form-label" htmlFor="cpf-intensity">Coffee Intensity</label>
                    <select id="cpf-intensity" name="coffee_intensity" className="cpf-form-input" defaultValue={tastePreferences.coffee_intensity}>
                      <option value="">Select intensity</option>
                      <option value="light">Light</option>
                      <option value="medium">Medium</option>
                      <option value="strong">Strong</option>
                      <option value="extra_strong">Extra Strong</option>
                    </select>
                  </div>
                  <div className="cpf-form-group">
                    <label className="cpf-form-label" htmlFor="cpf-roast">Favorite Roast</label>
                    <select id="cpf-roast" name="favorite_roast" className="cpf-form-input" defaultValue={tastePreferences.favorite_roast}>
                      <option value="">Select roast</option>
                      <option value="light">Light Roast</option>
                      <option value="medium">Medium Roast</option>
                      <option value="dark">Dark Roast</option>
                      <option value="french">French Roast</option>
                      <option value="italian">Italian Roast</option>
                    </select>
                  </div>
                </div>

                <div className="cpf-form-group">
                  <label className="cpf-form-label">Brewing Methods</label>
                  <div className="cpf-chips">
                    {BREWING_METHODS.map((method) => (
                      <label key={method} className="cpf-chip">
                        <input
                          type="checkbox"
                          name="brewing_methods"
                          value={method}
                          defaultChecked={tastePreferences.brewing_methods?.includes(method)}
                        />
                        {fmtMethod(method)}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="cpf-form-group">
                  <label className="cpf-form-label" htmlFor="cpf-taste-notes">Taste Notes</label>
                  <textarea
                    id="cpf-taste-notes"
                    name="taste_notes"
                    className="cpf-form-input"
                    rows={3}
                    defaultValue={tastePreferences.taste_notes}
                    placeholder="Describe the flavors you enjoy — fruity, chocolatey, nutty, floral…"
                  />
                  <span className="cpf-form-help">Tell us about the flavors and characteristics you love in coffee</span>
                </div>

                <button type="submit" className="cpf-btn cpf-btn-primary" disabled={saving}>
                  {saving ? <Spinner animation="border" size="sm" /> : 'Save Preferences'}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* ─── Notifications ──────────── */}
        {activeTab === 'notifications' && (
          <motion.div key="notifications" {...fadeIn} id="panel-notifications" role="tabpanel">
            <div className="cpf-card">
              <div className="cpf-card-header">
                <h2 className="cpf-card-title">Notification Preferences</h2>
                <p className="cpf-card-subtitle">Choose how you'd like to hear from us</p>
              </div>

              <form onSubmit={handleNotificationUpdate}>
                <div className="cpf-switch-list">
                  {NOTIFICATION_OPTIONS.map((item) => (
                    <div className="cpf-switch-item" key={item.key}>
                      <div className="cpf-switch-info">
                        <div className="cpf-switch-label">{item.label}</div>
                        <p className="cpf-switch-desc">{item.desc}</p>
                      </div>
                      <Form.Check
                        type="switch"
                        id={`cpf-${item.key}`}
                        checked={notifications[item.key]}
                        onChange={(e) => setNotifications((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                      />
                    </div>
                  ))}
                </div>
                <div className="cpf-section-gap">
                  <button type="submit" className="cpf-btn cpf-btn-primary" disabled={saving}>
                    {saving ? <Spinner animation="border" size="sm" /> : 'Save Preferences'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* ─── Security & Privacy ─────── */}
        {activeTab === 'security' && (
          <motion.div key="security" {...fadeIn} id="panel-security" role="tabpanel">
            {/* Change Password */}
            <div className="cpf-card">
              <div className="cpf-card-header">
                <h2 className="cpf-card-title">Change Password</h2>
                <p className="cpf-card-subtitle">Keep your account secure with a strong password</p>
              </div>
              <form onSubmit={handlePasswordChange}>
                <div className="cpf-password-grid">
                  <div className="cpf-form-group">
                    <label className="cpf-form-label" htmlFor="cpf-cur-pw">Current Password</label>
                    <input id="cpf-cur-pw" type="password" name="current_password" className="cpf-form-input" required />
                  </div>
                  <div className="cpf-form-group">
                    <label className="cpf-form-label" htmlFor="cpf-new-pw">New Password</label>
                    <input id="cpf-new-pw" type="password" name="new_password" className="cpf-form-input" required minLength={8} />
                  </div>
                  <div className="cpf-form-group">
                    <label className="cpf-form-label" htmlFor="cpf-con-pw">Confirm Password</label>
                    <input id="cpf-con-pw" type="password" name="confirm_password" className="cpf-form-input" required minLength={8} />
                  </div>
                </div>
                <button type="submit" className="cpf-btn cpf-btn-outline" disabled={saving}>
                  {saving ? <Spinner animation="border" size="sm" /> : 'Change Password'}
                </button>
              </form>
            </div>

            {/* Privacy Settings */}
            <div className="cpf-card">
              <div className="cpf-card-header">
                <h2 className="cpf-card-title">Privacy Settings</h2>
                <p className="cpf-card-subtitle">Control your data and visibility</p>
              </div>
              <form onSubmit={handlePrivacySave}>
                <div className="cpf-switch-list">
                  <div className="cpf-switch-item">
                    <div className="cpf-switch-info">
                      <div className="cpf-switch-label">Public Profile</div>
                      <p className="cpf-switch-desc">Allow others to see your profile</p>
                    </div>
                    <Form.Check
                      type="switch"
                      id="cpf-public-profile"
                      checked={privacySettings.public_profile}
                      onChange={(e) => setPrivacySettings((prev) => ({ ...prev, public_profile: e.target.checked }))}
                    />
                  </div>
                  <div className="cpf-switch-item">
                    <div className="cpf-switch-info">
                      <div className="cpf-switch-label">Data Sharing</div>
                      <p className="cpf-switch-desc">Share anonymized data to improve our services</p>
                    </div>
                    <Form.Check
                      type="switch"
                      id="cpf-data-sharing"
                      checked={privacySettings.data_sharing}
                      onChange={(e) => setPrivacySettings((prev) => ({ ...prev, data_sharing: e.target.checked }))}
                    />
                  </div>
                </div>
                <div className="cpf-section-gap">
                  <button type="submit" className="cpf-btn cpf-btn-outline" disabled={saving}>
                    {saving ? <Spinner animation="border" size="sm" /> : 'Save Privacy Settings'}
                  </button>
                </div>
              </form>
            </div>

            {/* Danger Zone */}
            <div className="cpf-danger-zone">
              <h3 className="cpf-danger-title">Danger Zone</h3>
              <p className="cpf-danger-desc">
                Once you deactivate your account, there is no going back. Please be certain.
              </p>
              <button type="button" className="cpf-btn cpf-btn-danger" onClick={() => setShowDeactivateModal(true)}>
                <FaTrash /> Deactivate Account
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Deactivation Modal ─────────── */}
      <Modal show={showDeactivateModal} onHide={() => setShowDeactivateModal(false)} centered className="cpf-modal">
        <div ref={deactivateModalRef}>
          <Modal.Header closeButton>
            <Modal.Title>Deactivate Account</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="cpf-alert cpf-alert-error" style={{ marginBottom: '1rem' }}>
              <FaExclamationCircle /> This action cannot be undone. Your account will be permanently deactivated.
            </div>
            <div className="cpf-form-group">
              <label className="cpf-form-label" htmlFor="cpf-deactivate-pw">Password (Required)</label>
              <input
                id="cpf-deactivate-pw"
                type="password"
                className="cpf-form-input"
                value={deactivateForm.password}
                onChange={(e) => setDeactivateForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Enter your password"
                required
              />
            </div>
            <div className="cpf-form-group">
              <label className="cpf-form-label" htmlFor="cpf-deactivate-reason">Reason (Optional)</label>
              <textarea
                id="cpf-deactivate-reason"
                className="cpf-form-input"
                rows={3}
                value={deactivateForm.reason}
                onChange={(e) => setDeactivateForm((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Tell us why you're leaving…"
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="cpf-btn cpf-btn-outline" onClick={() => setShowDeactivateModal(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="cpf-btn cpf-btn-danger"
              onClick={handleDeactivate}
              disabled={saving || !deactivateForm.password}
            >
              {saving ? <Spinner animation="border" size="sm" /> : 'Deactivate Account'}
            </button>
          </Modal.Footer>
        </div>
      </Modal>
      </PullToRefresh>
      <BottomNavigation />
    </main>
  );
};

export default CustomerProfile;
