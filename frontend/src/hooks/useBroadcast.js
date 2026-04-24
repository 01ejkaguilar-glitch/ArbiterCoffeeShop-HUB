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
    if (!broadcastService.isEnabled()) {
      setIsConnected(false);
      return;
    }

    // Initialize broadcast service (Reverb WebSocket)
    broadcastService.init();

    // Subscribe to channel only if channelName is provided
    if (channelName) {
      const subscribeMethod = isPrivate ? 'subscribePrivate' : 'subscribe';
      channelRef.current = broadcastService[subscribeMethod](channelName, eventHandlers);
    }

    // Detect the underlying pusher-protocol socket (works for both Reverb and Pusher)
    const getPusherSocket = () => {
      const echo = broadcastService.getEcho();
      return echo?.connector?.pusher ?? null;
    };

    const pusherSocket = getPusherSocket();
    if (pusherSocket) {
      // WebSocket mode — track actual connection state
      setIsConnected(pusherSocket.connection.state === 'connected');

      const handleConnected    = () => setIsConnected(true);
      const handleDisconnected = () => setIsConnected(false);
      pusherSocket.connection.bind('connected',    handleConnected);
      pusherSocket.connection.bind('disconnected', handleDisconnected);

      return () => {
        try {
          if (channelName && broadcastService.getEcho()) broadcastService.unsubscribe(channelName);
          pusherSocket.connection.unbind('connected',    handleConnected);
          pusherSocket.connection.unbind('disconnected', handleDisconnected);
        } catch (err) {
          console.warn('Error during broadcast cleanup:', err);
        }
      };
    } else {
      // Polling fallback mode — treat as always "connected" (polling is active)
      setIsConnected(true);
      return () => {
        try {
          if (channelName && broadcastService.getEcho()) broadcastService.unsubscribe(channelName);
        } catch (err) {
          console.warn('Error during broadcast cleanup:', err);
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setPendingOrders(prev => [...prev, event.order].slice(-50));
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
 * Hook for real-time kitchen order notifications
 */
export const useKitchenOrders = (onNewOrder) => {
  const [pendingOrders, setPendingOrders] = useState([]);

  const eventHandlers = {
    'order.created': (event) => {
      console.log('New food order for kitchen:', event);
      setPendingOrders(prev => [...prev, event.order].slice(-50));
      if (onNewOrder) {
        onNewOrder(event.order);
      }
    }
  };

  const { isConnected } = useBroadcast('kitchen-orders', eventHandlers);

  return {
    isConnected,
    pendingOrders
  };
};

/**
 * Hook for real-time task assignment notifications
 */
export const useTaskAssignments = (onTaskAssigned) => {
  const eventHandlers = {
    'task.assigned': (event) => {
      console.log('Task assigned:', event);
      if (onTaskAssigned) {
        onTaskAssigned(event);
      }
    }
  };

  const { isConnected } = useBroadcast('tasks', eventHandlers);

  return { isConnected };
};

/**
 * Hook for real-time shift notifications
 */
export const useShiftNotifications = (onShiftStarted) => {
  const eventHandlers = {
    'shift.started': (event) => {
      console.log('Shift started:', event);
      if (onShiftStarted) {
        onShiftStarted(event);
      }
    }
  };

  const { isConnected } = useBroadcast('shifts', eventHandlers);

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