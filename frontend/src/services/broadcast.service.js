/**
 * Real-time Broadcasting Service
 * Handles real-time updates using HTTP polling fallback
 */

import API_BASE_URL from '../config/api';

class BroadcastService {
  constructor() {
    this.echo = null;
    this.channels = new Map();
    this.isConnected = false;
  }

  /**
   * Initialize the broadcasting service with fallback to polling
   */
  init() {
    if (this.echo) {
      return this.echo;
    }

    // For development, skip Echo initialization and use polling only
    console.log('Broadcast service initialized with polling fallback only');
    this.startPollingFallback();
    return null;
  }

  /**
   * Start polling fallback when WebSocket is not available
   */
  startPollingFallback() {
    if (this.pollingInterval) return; // Already polling

    console.log('Starting polling fallback for real-time updates');
    this.isConnected = true; // Mark as connected since polling is active

    // Poll for updates every 30 seconds
    this.pollingInterval = setInterval(async () => {
      try {
        // Poll for user's orders if logged in
        const token = localStorage.getItem('authToken');
        if (token) {
          const response = await fetch(`${API_BASE_URL}/orders`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              // Trigger polling events for components that need updates
              this.triggerPollingEvent('orders.updated', data.data);
            }
          }
        }
      } catch (error) {
        console.log('Polling failed:', error);
      }
    }, 30000); // Poll every 30 seconds
  }

  /**
   * Trigger polling events for fallback
   */
  triggerPollingEvent(event, data) {
    // This is a simple event system for polling fallback
    if (this.pollingListeners && this.pollingListeners[event]) {
      this.pollingListeners[event].forEach(callback => callback(data));
    }
  }

  /**
   * Listen for polling events (fallback)
   */
  onPolling(event, callback) {
    if (!this.pollingListeners) {
      this.pollingListeners = {};
    }
    if (!this.pollingListeners[event]) {
      this.pollingListeners[event] = [];
    }
    this.pollingListeners[event].push(callback);
  }

  /**
   * Subscribe to a channel
   */
  subscribe(channelName, eventHandlers = {}) {
    // Echo is disabled in development, return null to use polling fallback
    console.log('Broadcast subscription skipped (polling mode):', channelName);
    return null;
  }

  /**
   * Subscribe to a private channel
   */
  subscribePrivate(channelName, eventHandlers = {}) {
    // Echo is disabled in development, return null to use polling fallback
    console.log('Broadcast private subscription skipped (polling mode):', channelName);
    return null;
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channelName) {
    try {
      if (this.channels.has(channelName)) {
        const channel = this.channels.get(channelName);
        if (channel && typeof channel.stopListening === 'function') {
          // Additional check to ensure channel is valid
          if (channel.pusher && channel.name) {
            channel.stopListening();
          }
        }
        this.channels.delete(channelName);
      }
    } catch (error) {
      console.warn('Error unsubscribing from channel:', channelName, error);
      // Force remove from channels map even if stopListening failed
      this.channels.delete(channelName);
    }
  }

  /**
   * Check if connected to real-time service
   */
  isConnected() {
    return this.isConnected;
  }

  /**
   * Get the Echo instance (returns null in polling-only mode)
   */
  getEcho() {
    return this.echo;
  }

  /**
   * Clean up all subscriptions
   */
  disconnect() {
    this.channels.forEach((channel, name) => {
      channel.stopListening();
    });
    this.channels.clear();

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    if (this.echo) {
      this.echo.disconnect();
      this.echo = null;
    }

    this.isConnected = false;
  }
}

// Create and export a singleton instance
const broadcastService = new BroadcastService();
export default broadcastService;