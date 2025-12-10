/**
 * Real-time Notification System
 * Displays toast notifications for real-time events
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { FaBell, FaShoppingCart, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { useNotifications } from '../../hooks/useBroadcast';
import { useAuth } from '../../context/AuthContext';

const NotificationContext = createContext();

// Error Boundary for Notification System
class NotificationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('Notification system error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI - don't render notifications if there's an error
      return this.props.children;
    }

    return this.props.children;
  }
}

export const useNotificationSystem = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationSystem must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();

  // Listen for real-time notifications with error handling
  const { isConnected } = useNotifications(user?.id, (notification) => {
    try {
      addNotification(notification);
    } catch (error) {
      console.warn('Error handling notification:', error);
    }
  });

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: notification.type || 'info',
      title: notification.title || 'Notification',
      message: notification.message || '',
      timestamp: new Date(),
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Helper functions for different notification types
  const showOrderNotification = (order, action) => {
    const messages = {
      created: `Your order #${order.order_number} has been placed successfully!`,
      confirmed: `Your order #${order.order_number} has been confirmed.`,
      preparing: `Your order #${order.order_number} is being prepared.`,
      ready: `Your order #${order.order_number} is ready for pickup!`,
      completed: `Your order #${order.order_number} has been completed.`,
      cancelled: `Your order #${order.order_number} has been cancelled.`
    };

    addNotification({
      type: action === 'cancelled' ? 'warning' : 'success',
      title: 'Order Update',
      message: messages[action] || `Order #${order.order_number} status updated.`,
      icon: FaShoppingCart
    });
  };

  const showLowStockAlert = (item) => {
    addNotification({
      type: 'warning',
      title: 'Low Stock Alert',
      message: `${item.name} is running low on stock (${item.current_stock} remaining).`,
      icon: FaExclamationTriangle
    });
  };

  const showSuccessNotification = (title, message) => {
    addNotification({
      type: 'success',
      title,
      message,
      icon: FaCheckCircle
    });
  };

  const showErrorNotification = (title, message) => {
    addNotification({
      type: 'error',
      title,
      message,
      icon: FaExclamationTriangle
    });
  };

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showOrderNotification,
    showLowStockAlert,
    showSuccessNotification,
    showErrorNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
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
      className="p-3"
      style={{ zIndex: 9999 }}
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