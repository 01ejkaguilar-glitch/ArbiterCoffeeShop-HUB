/**
 * Notification Context
 *
 * Provides centralized notification state management across the app.
 * Supports both API-backed (database) notifications and local-only
 * (localStorage) notifications as a fallback. Handles push subscriptions
 * and preference management.
 *
 * @module context/NotificationContext
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef, useMemo } from 'react';
import apiService from '../services/api.service';
import { API_ENDPOINTS } from '../config/api';

// ─── Storage Keys ──────────────────────────────────────────────
const NOTIFICATIONS_KEY = 'arbiter_notifications';
const PREFERENCES_KEY   = 'arbiter_notification_preferences';
const LAST_READ_KEY     = 'arbiter_last_notification_read';

// ─── Default Preferences ───────────────────────────────────────
const DEFAULT_PREFERENCES = {
  enabled: true,
  sound: true,
  soundEnabled: true,
  orderUpdates: true,
  announcements: true,
  promotions: true,
  lowStockAlerts: true,
  taskAssignments: true,
  leaveUpdates: true,
  systemAlerts: true,
  disabledTypes: {},
};

// ─── Notification Types ────────────────────────────────────────
export const NOTIFICATION_TYPES = {
  ORDER_STATUS:   'order_status',
  ORDER_READY:    'order_ready',
  NEW_ORDER:      'new_order',
  ANNOUNCEMENT:   'announcement',
  PROMOTION:      'promotion',
  LOW_STOCK:      'low_stock',
  TASK_ASSIGNED:  'task_assigned',
  TASK_COMPLETED: 'task_completed',
  LEAVE_REQUEST:  'leave_request',
  LEAVE_APPROVED: 'leave_approved',
  LEAVE_REJECTED: 'leave_rejected',
  SYSTEM:         'system',
  SUCCESS:        'success',
  WARNING:        'warning',
  ERROR:          'error',
  INFO:           'info',
};

// ─── Initial State ─────────────────────────────────────────────
const initialState = {
  notifications: [],
  unreadCount: 0,
  preferences: DEFAULT_PREFERENCES,
  isLoading: false,
  error: null,
  pushPermission: 'default',
  isPushSupported: false,
  lastReadAt: null,
};

// ─── Action Types ──────────────────────────────────────────────
const ACTIONS = {
  SET_NOTIFICATIONS:   'SET_NOTIFICATIONS',
  ADD_NOTIFICATION:    'ADD_NOTIFICATION',
  MARK_AS_READ:        'MARK_AS_READ',
  MARK_ALL_READ:       'MARK_ALL_READ',
  DELETE_NOTIFICATION:  'DELETE_NOTIFICATION',
  CLEAR_ALL:           'CLEAR_ALL',
  SET_PREFERENCES:     'SET_PREFERENCES',
  SET_LOADING:         'SET_LOADING',
  SET_ERROR:           'SET_ERROR',
  SET_PUSH_PERMISSION: 'SET_PUSH_PERMISSION',
  SET_PUSH_SUPPORTED:  'SET_PUSH_SUPPORTED',
  UPDATE_UNREAD_COUNT: 'UPDATE_UNREAD_COUNT',
};

// ─── Reducer ───────────────────────────────────────────────────
function notificationReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter(n => !n.read).length,
        isLoading: false,
      };

    case ACTIONS.ADD_NOTIFICATION: {
      const exists = state.notifications.some(n => n.id === action.payload.id);
      if (exists) return state;
      const next = [action.payload, ...state.notifications].slice(0, 100);
      return {
        ...state,
        notifications: next,
        unreadCount: state.unreadCount + (action.payload.read ? 0 : 1),
      };
    }

    case ACTIONS.MARK_AS_READ: {
      const wasUnread = state.notifications.some(n => n.id === action.payload && !n.read);
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    }

    case ACTIONS.MARK_ALL_READ:
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
        lastReadAt: new Date().toISOString(),
      };

    case ACTIONS.DELETE_NOTIFICATION: {
      const target = state.notifications.find(n => n.id === action.payload);
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
        unreadCount: target && !target.read ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    }

    case ACTIONS.CLEAR_ALL:
      return { ...state, notifications: [], unreadCount: 0 };

    case ACTIONS.SET_PREFERENCES:
      return { ...state, preferences: { ...state.preferences, ...action.payload } };

    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };

    case ACTIONS.SET_PUSH_PERMISSION:
      return { ...state, pushPermission: action.payload };

    case ACTIONS.SET_PUSH_SUPPORTED:
      return { ...state, isPushSupported: action.payload };

    case ACTIONS.UPDATE_UNREAD_COUNT:
      return { ...state, unreadCount: action.payload };

    default:
      return state;
  }
}

// ─── Context ───────────────────────────────────────────────────
const NotificationCenterContext = createContext(null);

/**
 * NotificationCenterProvider
 */
export function NotificationCenterProvider({ children }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const pollingRef = useRef(null);

  // Push support check
  useEffect(() => {
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    dispatch({ type: ACTIONS.SET_PUSH_SUPPORTED, payload: isSupported });
    if (isSupported) {
      dispatch({ type: ACTIONS.SET_PUSH_PERMISSION, payload: Notification.permission });
    }
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_KEY);
      if (stored) dispatch({ type: ACTIONS.SET_NOTIFICATIONS, payload: JSON.parse(stored) });
      const prefs = localStorage.getItem(PREFERENCES_KEY);
      if (prefs) dispatch({ type: ACTIONS.SET_PREFERENCES, payload: JSON.parse(prefs) });
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, []);

  // Persist notifications
  useEffect(() => {
    try { localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(state.notifications)); }
    catch (_) { /* quota exceeded */ }
  }, [state.notifications]);

  // Persist preferences
  useEffect(() => {
    try { localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state.preferences)); }
    catch (_) { /* silent */ }
  }, [state.preferences]);

  // Fetch from API (graceful fallback if 401/404)
  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const response = await apiService.get(API_ENDPOINTS.NOTIFICATIONS.LIST);
      if (response.success && Array.isArray(response.data)) {
        dispatch({ type: ACTIONS.SET_NOTIFICATIONS, payload: response.data });
      }
    } catch (err) {
      if (err?.response?.status !== 401 && err?.response?.status !== 404) {
        console.error('Failed to fetch notifications:', err);
      }
      dispatch({ type: ACTIONS.SET_ERROR, payload: err.message });
    }
  }, []);

  // Poll every 60s while authenticated
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    fetchNotifications();
    pollingRef.current = setInterval(fetchNotifications, 120000);
    return () => clearInterval(pollingRef.current);
  }, [fetchNotifications]);

  // Add notification (local)
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: notification.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: notification.title,
      message: notification.message,
      type: notification.type || NOTIFICATION_TYPES.INFO,
      read: false,
      createdAt: notification.createdAt || new Date().toISOString(),
      data: notification.data || {},
      icon: notification.icon,
      action: notification.action,
    };
    dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: newNotification });
    if (state.preferences.sound && state.preferences.enabled) playNotificationSound();
    if (state.pushPermission === 'granted' && state.preferences.enabled) showBrowserNotification(newNotification);
    return newNotification;
  }, [state.preferences, state.pushPermission]);

  // Mark as read (API + local)
  const markAsRead = useCallback(async (id) => {
    dispatch({ type: ACTIONS.MARK_AS_READ, payload: id });
    try { await apiService.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id)); } catch (_) { /* offline fallback */ }
  }, []);

  // Mark all read
  const markAllAsRead = useCallback(async () => {
    dispatch({ type: ACTIONS.MARK_ALL_READ });
    localStorage.setItem(LAST_READ_KEY, new Date().toISOString());
    try { await apiService.post(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ); } catch (_) { /* offline fallback */ }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (id) => {
    dispatch({ type: ACTIONS.DELETE_NOTIFICATION, payload: id });
    try { await apiService.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(id)); } catch (_) { /* offline fallback */ }
  }, []);

  // Clear all
  const clearAll = useCallback(async () => {
    dispatch({ type: ACTIONS.CLEAR_ALL });
    try { await apiService.delete(API_ENDPOINTS.NOTIFICATIONS.CLEAR_ALL); } catch (_) { /* offline fallback */ }
  }, []);

  // Update preferences (keeps sound/soundEnabled in sync)
  const updatePreferences = useCallback((prefs) => {
    if ('soundEnabled' in prefs) prefs.sound = prefs.soundEnabled;
    if ('sound' in prefs) prefs.soundEnabled = prefs.sound;
    dispatch({ type: ACTIONS.SET_PREFERENCES, payload: prefs });
  }, []);

  // Request push permission and subscribe via PushManager
  const requestPushPermission = useCallback(async () => {
    if (!state.isPushSupported) return 'unsupported';
    try {
      const permission = await Notification.requestPermission();
      dispatch({ type: ACTIONS.SET_PUSH_PERMISSION, payload: permission });

      if (permission === 'granted') {
        // Attempt PushManager subscription with VAPID key
        try {
          const registration = await navigator.serviceWorker.ready;
          const existing = await registration.pushManager.getSubscription();
          if (!existing) {
            const response = await apiService.get(API_ENDPOINTS.NOTIFICATIONS.VAPID_KEY);
            if (response?.publicKey) {
              const urlBase64 = response.publicKey
                .replace(/-/g, '+')
                .replace(/_/g, '/');
              const raw = atob(urlBase64);
              const key = new Uint8Array(raw.length);
              for (let i = 0; i < raw.length; i++) key[i] = raw.charCodeAt(i);

              await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: key,
              });
            }
          }
        } catch (pushErr) {
          console.warn('Push subscription setup failed (non-blocking):', pushErr);
        }
      }

      return permission;
    } catch (_) { return 'denied'; }
  }, [state.isPushSupported]);

  // Helpers
  const getNotificationsByType = useCallback(
    (type) => state.notifications.filter(n => n.type === type),
    [state.notifications]
  );

  const getGroupedNotifications = useCallback(() => {
    const groups = {};
    state.notifications.forEach(n => {
      const key = new Date(n.createdAt).toDateString();
      (groups[key] = groups[key] || []).push(n);
    });
    return groups;
  }, [state.notifications]);

  const value = useMemo(() => ({
    ...state,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    updatePreferences,
    requestPushPermission,
    fetchNotifications,
    getNotificationsByType,
    getGroupedNotifications,
  }), [state, addNotification, markAsRead, markAllAsRead, deleteNotification, clearAll, updatePreferences, requestPushPermission, fetchNotifications, getNotificationsByType, getGroupedNotifications]);

  return (
    <NotificationCenterContext.Provider value={value}>
      {children}
    </NotificationCenterContext.Provider>
  );
}

/**
 * useNotificationCenter hook
 */
export function useNotificationCenter() {
  const context = useContext(NotificationCenterContext);
  if (!context) {
    throw new Error('useNotificationCenter must be used within a NotificationCenterProvider');
  }
  return context;
}

// ─── Helpers ───────────────────────────────────────────────────
function playNotificationSound() {
  try {
    const audio = new Audio('/assets/sounds/notification.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  } catch (_) { /* silent */ }
}

function showBrowserNotification(notification) {
  try {
    const bn = new Notification(notification.title, {
      body: notification.message,
      icon: notification.icon || '/assets/arbiter-logo.png',
      tag: notification.id,
      data: notification.data,
      requireInteraction: false,
    });
    bn.onclick = () => {
      window.focus();
      if (notification.action?.url) window.location.href = notification.action.url;
      bn.close();
    };
    setTimeout(() => bn.close(), 5000);
  } catch (err) { console.error('Browser notification failed:', err); }
}

export default NotificationCenterContext;
