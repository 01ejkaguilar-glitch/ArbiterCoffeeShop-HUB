import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/variables.css';
import './styles/overrides.css';
import './styles/utilities.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorker from './utils/serviceWorker';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA functionality
serviceWorker.register({
  onSuccess: (registration) => {
    console.log('App ready for offline use!');
  },
  onUpdate: (registration) => {
    // Show update notification to user
    console.log('New version available! Please refresh.');
    // You can dispatch a custom event or use a toast notification here
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

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
