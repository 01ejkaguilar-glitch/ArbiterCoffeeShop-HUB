import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const BottomNavigation = lazy(() => import('../mobile/BottomNavigation'));
const Footer = lazy(() => import('./Footer'));

/**
 * Layout for public (unauthenticated) pages: Navbar + content + Footer + BottomNav.
 */
function PublicLayout() {
  const [showFooter, setShowFooter] = useState(false);
  const [showBottomNavigation, setShowBottomNavigation] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const reveal = () => {
      if (!cancelled) {
        setShowFooter(true);
      }
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(reveal, { timeout: 1500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timerId = window.setTimeout(reveal, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const reveal = () => {
      if (!cancelled) {
        setShowBottomNavigation(true);
      }
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(reveal, { timeout: 2000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timerId = window.setTimeout(reveal, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, []);

  return (
    <div className="App d-flex flex-column min-vh-100">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Navbar />
      <div id="main-content" className="flex-grow-1">
        <Outlet />
      </div>
      {showFooter ? (
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      ) : null}
      {showBottomNavigation ? (
        <Suspense fallback={null}>
          <BottomNavigation />
        </Suspense>
      ) : null}
    </div>
  );
}

export default PublicLayout;
