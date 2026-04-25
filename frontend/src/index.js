// PWA install prompt and update notification
import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/variables.css';
import './styles/overrides.css';
import './styles/utilities.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorker from './utils/serviceWorker';

const shouldEnableServiceWorker = process.env.NODE_ENV === 'production'
  && process.env.REACT_APP_ENABLE_SERVICE_WORKER === 'true';

// Listen for service worker update messages
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'NEW_VERSION_AVAILABLE') {
      window.dispatchEvent(new CustomEvent('pwa-update-available'));
    }
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Service worker is opt-in for production to avoid noisy failures when deployment/TLS is not ready.
if (shouldEnableServiceWorker) {
  serviceWorker.register({
    onSuccess: () => {
      console.log('App ready for offline use!');
    },
    onUpdate: () => {
      console.log('New version available! Please refresh.');
      if (window.confirm('A new version is available. Refresh to update?')) {
        serviceWorker.skipWaiting();
        window.location.reload();
      }
    },
    onOffline: () => {
      console.log('App is now offline');
    },
    onOnline: () => {
      console.log('App is back online');
    }
  });
} else {
  serviceWorker.unregister();
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
