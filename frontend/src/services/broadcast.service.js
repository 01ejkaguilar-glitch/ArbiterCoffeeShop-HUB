/**
 * Real-time Broadcasting Service
 * Handles real-time updates using Laravel Reverb (WebSocket)
 * Falls back to polling when WebSocket is unavailable.
 */

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import API_BASE_URL from '../config/api';

const REALTIME_ENABLED = process.env.REACT_APP_ENABLE_NOTIFICATIONS === 'true';

const runtimeHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const isLocalRuntimeHost = runtimeHost === 'localhost' || runtimeHost === '127.0.0.1';
const defaultReverbHost = isLocalRuntimeHost ? 'localhost' : 'api.arbitercoffee.shop';
const defaultReverbScheme = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https' : 'http';
const defaultReverbPort = defaultReverbScheme === 'https' ? 443 : 80;

// Reverb connection config (read from env, falls back to localhost defaults)
const REVERB_CONFIG = {
  key:    process.env.REACT_APP_REVERB_APP_KEY  || 'local',
  host:   process.env.REACT_APP_REVERB_HOST     || defaultReverbHost,
  port:   parseInt(process.env.REACT_APP_REVERB_PORT  || String(defaultReverbPort), 10),
  scheme: process.env.REACT_APP_REVERB_SCHEME   || defaultReverbScheme,
};

class BroadcastService {
  constructor() {
    this.echo = null;
    this.channels = new Map();
    this.connected = false;
  }

  /**
   * Initialize the broadcasting service with Laravel Echo → Reverb
   */
  init() {
    if (!REALTIME_ENABLED) {
      return null;
    }

    if (this.echo) {
      return this.echo;
    }

    try {
      // Reverb uses the Pusher protocol — set window.Pusher so Echo can use it
      window.Pusher = Pusher;

      this.echo = new Echo({
        broadcaster: 'reverb',
        key: REVERB_CONFIG.key,
        wsHost: REVERB_CONFIG.host,
        wsPort: REVERB_CONFIG.port,
        wssPort: REVERB_CONFIG.port,
        scheme: REVERB_CONFIG.scheme,
        forceTLS: REVERB_CONFIG.scheme === 'https',
        enabledTransports: ['ws', 'wss'],
        disableStats: true,
        auth: {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        },
        authEndpoint: `${new URL(API_BASE_URL).origin}/broadcasting/auth`,
      });

      console.log('Broadcast service initialised with Laravel Reverb (WebSocket)');
      this.connected = true;
      return this.echo;
    } catch (error) {
      console.error('Failed to initialise Reverb Echo, falling back to polling:', error);
      this.startPollingFallback();
      return null;
    }
  }

  /**
   * Start polling fallback when WebSocket is not available
   */
  startPollingFallback() {
    if (this.pollingInterval) return; // Already polling

    console.log('Starting polling fallback for real-time updates');
    this.connected = true; // Mark as connected since polling is active

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
    }, 60000); // Poll every 60 seconds
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
    if (!this.echo) {
      console.warn('Echo not initialized, cannot subscribe to channel:', channelName);
      return null;
    }

    try {
      const channel = this.echo.channel(channelName);
      this.channels.set(channelName, channel);

      // Bind event handlers
      Object.keys(eventHandlers).forEach(event => {
        channel.listen(event, eventHandlers[event]);
      });

      console.log('Subscribed to channel:', channelName);
      return channel;
    } catch (error) {
      console.error('Failed to subscribe to channel:', channelName, error);
      return null;
    }
  }

  /**
   * Subscribe to a private channel
   */
  subscribePrivate(channelName, eventHandlers = {}) {
    if (!this.echo) {
      console.warn('Echo not initialized, cannot subscribe to private channel:', channelName);
      return null;
    }

    try {
      const channel = this.echo.private(channelName);
      this.channels.set(channelName, channel);

      // Bind event handlers
      Object.keys(eventHandlers).forEach(event => {
        channel.listen(event, eventHandlers[event]);
      });

      console.log('Subscribed to private channel:', channelName);
      return channel;
    } catch (error) {
      console.error('Failed to subscribe to private channel:', channelName, error);
      return null;
    }
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channelName) {
    try {
      if (this.channels.has(channelName)) {
        // Leave the channel properly through Echo
        if (this.echo && channelName) {
          this.echo.leave(channelName);
        }
        
        this.channels.delete(channelName);
      }
    } catch (error) {
      console.warn('Error unsubscribing from channel:', channelName, error);
      // Force remove from channels map even if leaving failed
      this.channels.delete(channelName);
    }
  }

  /**
   * Check if connected to real-time service
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Get the Echo instance (returns null in polling-only mode)
   */
  getEcho() {
    return this.echo;
  }

  /**
   * Whether realtime websocket/polling should be enabled
   */
  isEnabled() {
    return REALTIME_ENABLED;
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

    this.connected = false;
  }
}

// Create and export a singleton instance
const broadcastService = new BroadcastService();
export default broadcastService;