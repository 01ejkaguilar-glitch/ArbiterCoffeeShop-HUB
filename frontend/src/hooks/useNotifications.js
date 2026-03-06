/**
 * useNotifications Hook
 * 
 * Simplified hook for common notification operations.
 * Wraps NotificationCenterContext with convenient helper methods.
 * 
 * @module hooks/useNotifications
 */

import { useCallback, useMemo } from 'react';
import { useNotificationCenter, NOTIFICATION_TYPES } from '../context/NotificationContext';

/**
 * Hook for managing notifications
 */
const useNotifications = () => {
  const context = useNotificationCenter();

  // Quick notification methods
  const notify = useMemo(() => ({
    // Success notification
    success: (title, message, options = {}) => {
      return context.addNotification({
        title,
        message,
        type: NOTIFICATION_TYPES.SUCCESS,
        ...options
      });
    },

    // Error notification
    error: (title, message, options = {}) => {
      return context.addNotification({
        title,
        message,
        type: NOTIFICATION_TYPES.ERROR,
        ...options
      });
    },

    // Warning notification
    warning: (title, message, options = {}) => {
      return context.addNotification({
        title,
        message,
        type: NOTIFICATION_TYPES.WARNING,
        ...options
      });
    },

    // Info notification
    info: (title, message, options = {}) => {
      return context.addNotification({
        title,
        message,
        type: NOTIFICATION_TYPES.INFO,
        ...options
      });
    },

    // Order status update
    orderStatus: (orderId, status, options = {}) => {
      const statusMessages = {
        pending: 'Your order has been received',
        confirmed: 'Your order has been confirmed',
        preparing: 'Your order is being prepared',
        ready: 'Your order is ready for pickup!',
        completed: 'Your order has been completed',
        cancelled: 'Your order has been cancelled'
      };

      return context.addNotification({
        title: 'Order Update',
        message: statusMessages[status] || `Order #${orderId} status: ${status}`,
        type: status === 'ready' ? NOTIFICATION_TYPES.ORDER_READY : NOTIFICATION_TYPES.ORDER_STATUS,
        data: { orderId, status },
        action: { label: 'View Order', url: `/orders/${orderId}` },
        ...options
      });
    },

    // New order notification (for baristas/admins)
    newOrder: (orderId, customerName, options = {}) => {
      return context.addNotification({
        title: 'New Order',
        message: `New order from ${customerName}`,
        type: NOTIFICATION_TYPES.NEW_ORDER,
        data: { orderId, customerName },
        action: { label: 'View Order', url: `/barista/orders` },
        ...options
      });
    },

    // Announcement
    announcement: (title, message, options = {}) => {
      return context.addNotification({
        title,
        message,
        type: NOTIFICATION_TYPES.ANNOUNCEMENT,
        action: { label: 'Read More', url: '/announcements' },
        ...options
      });
    },

    // Low stock alert
    lowStock: (productName, quantity, options = {}) => {
      return context.addNotification({
        title: 'Low Stock Alert',
        message: `${productName} is running low (${quantity} remaining)`,
        type: NOTIFICATION_TYPES.LOW_STOCK,
        data: { productName, quantity },
        action: { label: 'View Inventory', url: '/admin/inventory' },
        ...options
      });
    },

    // Task assignment
    taskAssigned: (taskTitle, assignedBy, options = {}) => {
      return context.addNotification({
        title: 'New Task Assigned',
        message: `${assignedBy} assigned you: ${taskTitle}`,
        type: NOTIFICATION_TYPES.TASK_ASSIGNED,
        data: { taskTitle, assignedBy },
        action: { label: 'View Tasks', url: '/barista/tasks' },
        ...options
      });
    },

    // Leave request update
    leaveUpdate: (status, dates, options = {}) => {
      const messages = {
        approved: 'Your leave request has been approved',
        rejected: 'Your leave request has been rejected',
        pending: 'Your leave request is pending review'
      };

      return context.addNotification({
        title: 'Leave Request Update',
        message: messages[status] || `Leave request: ${status}`,
        type: status === 'approved' ? NOTIFICATION_TYPES.LEAVE_APPROVED : NOTIFICATION_TYPES.LEAVE_REJECTED,
        data: { status, dates },
        action: { label: 'View Details', url: '/barista/leave' },
        ...options
      });
    }
  }), [context]);

  // Filter notifications
  const filterNotifications = useCallback((filter) => {
    let filtered = [...context.notifications];

    if (filter.type) {
      filtered = filtered.filter(n => n.type === filter.type);
    }

    if (filter.read !== undefined) {
      filtered = filtered.filter(n => n.read === filter.read);
    }

    if (filter.startDate) {
      filtered = filtered.filter(n => new Date(n.createdAt) >= new Date(filter.startDate));
    }

    if (filter.endDate) {
      filtered = filtered.filter(n => new Date(n.createdAt) <= new Date(filter.endDate));
    }

    return filtered;
  }, [context.notifications]);

  // Get recent notifications (last n items)
  const getRecent = useCallback((count = 5) => {
    return context.notifications.slice(0, count);
  }, [context.notifications]);

  // Get unread notifications
  const getUnread = useCallback(() => {
    return context.notifications.filter(n => !n.read);
  }, [context.notifications]);

  // Check if notification type is enabled in preferences
  const isTypeEnabled = useCallback((type) => {
    if (!context.preferences.enabled) return false;
    return !context.preferences.disabledTypes?.[type];
  }, [context.preferences]);

  return {
    // State
    notifications: context.notifications,
    unreadCount: context.unreadCount,
    preferences: context.preferences,
    isLoading: context.isLoading,
    error: context.error,
    pushPermission: context.pushPermission,
    isPushSupported: context.isPushSupported,

    // Quick notification methods
    notify,

    // Core actions
    addNotification: context.addNotification,
    markAsRead: context.markAsRead,
    markAllAsRead: context.markAllAsRead,
    deleteNotification: context.deleteNotification,
    clearAll: context.clearAll,
    updatePreferences: context.updatePreferences,
    requestPushPermission: context.requestPushPermission,
    fetchNotifications: context.fetchNotifications,

    // Utility methods
    filterNotifications,
    getRecent,
    getUnread,
    isTypeEnabled,
    getGroupedNotifications: context.getGroupedNotifications,
    getNotificationsByType: context.getNotificationsByType
  };
};

export default useNotifications;
