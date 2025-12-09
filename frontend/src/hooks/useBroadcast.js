/**
 * Real-time Broadcasting Hook
 * React hook for subscribing to real-time events
 */

import { useEffect, useRef, useState } from 'react';
import broadcastService from '../services/broadcast.service';

export const useBroadcast = (channelName, eventHandlers = {}, isPrivate = false) => {
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef(null);

  useEffect(() => {
    // Initialize broadcast service
    broadcastService.init();

    // Subscribe to channel only if channelName is provided
    if (channelName) {
      const subscribeMethod = isPrivate ? 'subscribePrivate' : 'subscribe';
      channelRef.current = broadcastService[subscribeMethod](channelName, eventHandlers);
    }

    // Check connection status - consider polling as connected
    const isEchoAvailable = broadcastService.getEcho() && broadcastService.getEcho().connector && broadcastService.getEcho().connector.pusher;
    setIsConnected(isEchoAvailable ? broadcastService.isConnected : true); // Polling mode is always "connected"

    // Listen for connection changes - only if Echo is available
    let handleConnected, handleDisconnected;
    if (broadcastService.getEcho() && broadcastService.getEcho().connector && broadcastService.getEcho().connector.pusher) {
      handleConnected = () => setIsConnected(true);
      handleDisconnected = () => setIsConnected(false);

      broadcastService.getEcho().connector.pusher.connection.bind('connected', handleConnected);
      broadcastService.getEcho().connector.pusher.connection.bind('disconnected', handleDisconnected);
    }

    // Cleanup function
    return () => {
      try {
        if (channelName && channelRef.current && broadcastService.getEcho()) {
          broadcastService.unsubscribe(channelName);
        }
        if (handleConnected && handleDisconnected && broadcastService.getEcho() && broadcastService.getEcho().connector && broadcastService.getEcho().connector.pusher) {
          broadcastService.getEcho().connector.pusher.connection.unbind('connected', handleConnected);
          broadcastService.getEcho().connector.pusher.connection.unbind('disconnected', handleDisconnected);
        }
      } catch (error) {
        console.warn('Error during broadcast cleanup:', error);
      }
    };
  }, [channelName, isPrivate]);

  return {
    isConnected,
    channel: channelRef.current
  };
};

/**
 * Hook for real-time order updates
 */
export const useOrderUpdates = (userId, onOrderUpdate) => {
  const [lastUpdate, setLastUpdate] = useState(null);

  const eventHandlers = {
    'order.created': (event) => {
      console.log('New order created:', event);
      setLastUpdate(new Date());
      if (onOrderUpdate) {
        onOrderUpdate('created', event.order);
      }
    },
    'order.status.updated': (event) => {
      console.log('Order status updated:', event);
      setLastUpdate(new Date());
      if (onOrderUpdate) {
        onOrderUpdate('status_updated', event.order);
      }
    }
  };

  const { isConnected } = useBroadcast(`user-orders-${userId}`, eventHandlers, true);

  return {
    isConnected,
    lastUpdate
  };
};

/**
 * Hook for real-time barista order notifications
 */
export const useBaristaOrders = (onNewOrder) => {
  const [pendingOrders, setPendingOrders] = useState([]);

  const eventHandlers = {
    'order.created': (event) => {
      console.log('New order for barista:', event);
      setPendingOrders(prev => [...prev, event.order]);
      if (onNewOrder) {
        onNewOrder(event.order);
      }
    }
  };

  const { isConnected } = useBroadcast('barista-orders', eventHandlers);

  return {
    isConnected,
    pendingOrders
  };
};

/**
 * Hook for real-time inventory alerts
 */
export const useInventoryAlerts = (onLowStock) => {
  const eventHandlers = {
    'inventory.low-stock': (event) => {
      console.log('Low stock alert:', event);
      if (onLowStock) {
        onLowStock(event.item);
      }
    }
  };

  const { isConnected } = useBroadcast('inventory-alerts', eventHandlers);

  return { isConnected };
};

/**
 * Hook for real-time notifications
 */
export const useNotifications = (userId, onNotification) => {
  const eventHandlers = {
    'notification.received': (event) => {
      console.log('New notification:', event);
      if (onNotification) {
        onNotification(event.notification);
      }
    }
  };

  // Always call useBroadcast but with conditional channel name
  const channelName = userId ? `user-notifications-${userId}` : null;
  const broadcastResult = useBroadcast(channelName, eventHandlers, !!userId);

  // Return disconnected state if no userId
  return userId ? broadcastResult : { isConnected: false };
};