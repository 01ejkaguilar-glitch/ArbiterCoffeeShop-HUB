/**
 * Service Worker Registration Utility
 * 
 * Handles PWA service worker registration, updates,
 * and push notification subscriptions.
 * 
 * @module utils/serviceWorker
 */

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

/**
 * Register the service worker
 * @param {Object} config - Configuration object
 * @param {Function} config.onSuccess - Callback when SW is registered
 * @param {Function} config.onUpdate - Callback when SW is updated
 * @param {Function} config.onOffline - Callback when app goes offline
 * @param {Function} config.onOnline - Callback when app comes back online
 */
export function register(config = {}) {
  if ('serviceWorker' in navigator) {
    const swUrl = `${process.env.PUBLIC_URL || ''}/service-worker.js`;

    if (isLocalhost) {
      // Running on localhost - check if a service worker still exists
      checkValidServiceWorker(swUrl, config);
      
      navigator.serviceWorker.ready.then(() => {
        console.log(
          'This web app is being served cache-first by a service worker. ' +
          'To learn more, visit https://cra.link/PWA'
        );
      });
    } else {
      // Not localhost - register service worker
      registerValidSW(swUrl, config);
    }

    // Set up online/offline listeners
    setupNetworkListeners(config);
  }
}

/**
 * Register a valid service worker
 */
function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('[SW] Service worker registered');

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Check every hour

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        
        if (installingWorker == null) {
          return;
        }

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content is available
              console.log('[SW] New content is available; please refresh.');
              
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // Content is cached for offline use
              console.log('[SW] Content is cached for offline use.');
              
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('[SW] Error during service worker registration:', error);
    });
}

/**
 * Check if service worker is valid
 */
function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found - reload the page
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found - register it
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('[SW] No internet connection found. App is running in offline mode.');
    });
}

/**
 * Set up network status listeners
 */
function setupNetworkListeners(config) {
  window.addEventListener('online', () => {
    console.log('[SW] App is online');
    if (config && config.onOnline) {
      config.onOnline();
    }
  });

  window.addEventListener('offline', () => {
    console.log('[SW] App is offline');
    if (config && config.onOffline) {
      config.onOffline();
    }
  });
}

/**
 * Unregister all service workers
 */
export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('[SW] Error unregistering:', error.message);
      });
  }
}

/**
 * Request push notification permission
 * @returns {Promise<string>} The permission state
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('[SW] This browser does not support notifications');
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * Subscribe to push notifications
 * @param {string} vapidPublicKey - The VAPID public key
 * @returns {Promise<PushSubscription|null>}
 */
export async function subscribeToPushNotifications(vapidPublicKey) {
  try {
    const registration = await navigator.serviceWorker.ready;
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    console.log('[SW] Push subscription:', subscription);
    return subscription;
  } catch (error) {
    console.error('[SW] Failed to subscribe to push:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 * @returns {Promise<boolean>}
 */
export async function unsubscribeFromPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[SW] Failed to unsubscribe from push:', error);
    return false;
  }
}

/**
 * Get current push subscription
 * @returns {Promise<PushSubscription|null>}
 */
export async function getPushSubscription() {
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('[SW] Failed to get push subscription:', error);
    return null;
  }
}

/**
 * Send a message to the service worker
 * @param {Object} message - The message to send
 */
export function sendMessageToSW(message) {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  }
}

/**
 * Skip waiting and activate new service worker
 */
export function skipWaiting() {
  sendMessageToSW({ type: 'SKIP_WAITING' });
}

/**
 * Clear all caches
 */
export function clearAllCaches() {
  sendMessageToSW({ type: 'CLEAR_CACHE' });
}

/**
 * Pre-cache specific URLs
 * @param {Array<string>} urls - URLs to cache
 */
export function cacheUrls(urls) {
  sendMessageToSW({ type: 'CACHE_URLS', urls });
}

/**
 * Convert VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Check if app is installed as PWA
 * @returns {boolean}
 */
export function isInstalledPWA() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

/**
 * Check if PWA install is available
 * @returns {boolean}
 */
export function canInstallPWA() {
  return 'BeforeInstallPromptEvent' in window;
}

// Export default configuration
const serviceWorkerUtils = {
  register,
  unregister,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getPushSubscription,
  skipWaiting,
  clearAllCaches,
  cacheUrls,
  isInstalledPWA,
  canInstallPWA
};

export default serviceWorkerUtils;
