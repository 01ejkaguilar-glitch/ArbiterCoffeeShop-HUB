import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { BottomNavigation } from '../mobile';

/**
 * Layout for public (unauthenticated) pages: Navbar + content + Footer + BottomNav.
 */
function PublicLayout() {
  return (
    <div className="App d-flex flex-column min-vh-100">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Navbar />
      <div id="main-content" className="flex-grow-1">
        <Outlet />
      </div>
      <Footer />
      <BottomNavigation />
    </div>
  );
}

export default PublicLayout;
