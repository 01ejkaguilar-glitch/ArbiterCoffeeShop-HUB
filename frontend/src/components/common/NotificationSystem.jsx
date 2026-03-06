/**
 * Real-time Notification System
 *
 * Bridges WebSocket events into the persistent NotificationCenterProvider
 * and displays ephemeral toast notifications for real-time feedback.
 */

import React, { useState, createContext, useContext, useCallback, useRef, useEffect } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { FaBell, FaShoppingCart, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { useNotifications as useBroadcastNotifications } from '../../hooks/useBroadcast';
import { useAuth } from '../../context/AuthContext';
import { useNotificationCenter } from '../../context/NotificationContext';

const ToastNotificationContext = createContext();

// Error Boundary for Notification System
class NotificationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('Notification system error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.children;
    }
    return this.props.children;
  }
}

export const useNotificationSystem = () => {
  const context = useContext(ToastNotificationContext);
  if (!context) {
    throw new Error('useNotificationSystem must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const { user } = useAuth();
  const notificationCenter = useNotificationCenter();
  const toastsRef = useRef(toasts);

  useEffect(() => { toastsRef.current = toasts; }, [toasts]);

  // ─── Toast lifecycle ─────────────────────────────────────
  const addToast = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      type: notification.type || 'info',
      title: notification.title || 'Notification',
      message: notification.message || '',
      timestamp: new Date(),
      icon: notification.icon,
    };
    setToasts(prev => [toast, ...prev]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeNotification = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setToasts([]);
  }, []);

  // ─── Bridge: push to persistent NotificationCenter + show toast ──
  const addNotification = useCallback((notification) => {
    addToast(notification);
    // Also persist in notification center if it has title/message
    if (notification.title && notification.message) {
      notificationCenter.addNotification({
        title: notification.title,
        message: notification.message,
        type: notification.type || 'info',
        data: notification.data,
        action: notification.action,
      });
    }
  }, [addToast, notificationCenter]);

  // Listen for real-time WebSocket notifications
  useBroadcastNotifications(user?.id, (notification) => {
    try {
      addNotification(notification);
    } catch (error) {
      console.warn('Error handling notification:', error);
    }
  });

  // ─── Helper functions for different notification types ────
  const showOrderNotification = useCallback((order, action) => {
    const messages = {
      created: `Your order #${order.order_number} has been placed successfully!`,
      confirmed: `Your order #${order.order_number} has been confirmed.`,
      preparing: `Your order #${order.order_number} is being prepared.`,
      ready: `Your order #${order.order_number} is ready for pickup!`,
      completed: `Your order #${order.order_number} has been completed.`,
      cancelled: `Your order #${order.order_number} has been cancelled.`,
    };
    addNotification({
      type: action === 'cancelled' ? 'warning' : 'success',
      title: 'Order Update',
      message: messages[action] || `Order #${order.order_number} status updated.`,
      icon: FaShoppingCart,
      data: { orderId: order.id, status: action },
      action: { label: 'View Order', url: `/orders/${order.id}` },
    });
  }, [addNotification]);

  const showLowStockAlert = useCallback((item) => {
    addNotification({
      type: 'warning',
      title: 'Low Stock Alert',
      message: `${item.name} is running low on stock (${item.current_stock} remaining).`,
      icon: FaExclamationTriangle,
      data: { itemName: item.name, stock: item.current_stock },
      action: { label: 'View Inventory', url: '/admin/inventory' },
    });
  }, [addNotification]);

  const showSuccessNotification = useCallback((title, message) => {
    addToast({ type: 'success', title, message, icon: FaCheckCircle });
  }, [addToast]);

  const showErrorNotification = useCallback((title, message) => {
    addToast({ type: 'error', title, message, icon: FaExclamationTriangle });
  }, [addToast]);

  const value = {
    notifications: toasts,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showOrderNotification,
    showLowStockAlert,
    showSuccessNotification,
    showErrorNotification,
  };

  return (
    <ToastNotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </ToastNotificationContext.Provider>
  );
};

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotificationSystem();

  const getIcon = (type, customIcon) => {
    if (customIcon) return React.createElement(customIcon, { className: `text-${type === 'error' ? 'danger' : type === 'warning' ? 'warning' : 'success'}` });

    switch (type) {
      case 'success':
        return <FaCheckCircle className="text-success" />;
      case 'warning':
      case 'error':
        return <FaExclamationTriangle className="text-warning" />;
      default:
        return <FaBell className="text-info" />;
    }
  };

  const getToastClass = (type) => {
    switch (type) {
      case 'success':
        return 'border-success';
      case 'warning':
        return 'border-warning';
      case 'error':
        return 'border-danger';
      default:
        return 'border-info';
    }
  };

  return (
    <ToastContainer
      position="top-end"
      className="p-3 z-top"
    >
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          onClose={() => removeNotification(notification.id)}
          delay={5000}
          autohide
          className={`border ${getToastClass(notification.type)}`}
        >
          <Toast.Header>
            {getIcon(notification.type, notification.icon)}
            <strong className="me-auto ms-2">{notification.title}</strong>
            <small className="text-muted">
              {notification.timestamp.toLocaleTimeString()}
            </small>
          </Toast.Header>
          <Toast.Body>{notification.message}</Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
};

const NotificationProviderWithErrorBoundary = ({ children }) => (
  <NotificationErrorBoundary>
    <NotificationProvider>
      {children}
    </NotificationProvider>
  </NotificationErrorBoundary>
);

export default NotificationProviderWithErrorBoundary;