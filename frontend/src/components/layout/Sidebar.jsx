import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaCoffee, FaArrowLeft, FaTachometerAlt, FaBars, FaTimes } from 'react-icons/fa';
import './Sidebar.css';

function Sidebar({ items, title, groups }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Close drawer on Escape
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.classList.toggle('sidebar-drawer-open', drawerOpen);
    return () => document.body.classList.remove('sidebar-drawer-open');
  }, [drawerOpen]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const renderNavItem = (item, inDrawer = false) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={`sidebar-link ${isActive ? 'active' : ''}`}
        title={!inDrawer && collapsed ? item.label : undefined}
        onClick={inDrawer ? closeDrawer : undefined}
      >
        <Icon className="sidebar-icon" />
        {(inDrawer || !collapsed) && <span className="sidebar-label">{item.label}</span>}
      </NavLink>
    );
  };

  const renderNav = (inDrawer = false) => (
    <nav className="sidebar-nav">
      <NavLink
        to={`/${title.toLowerCase()}`}
        className={({ isActive }) => `sidebar-link sidebar-dashboard-link ${isActive ? 'active' : ''}`}
        title={!inDrawer && collapsed ? 'Dashboard' : undefined}
        onClick={inDrawer ? closeDrawer : undefined}
      >
        <FaTachometerAlt className="sidebar-icon" />
        {(inDrawer || !collapsed) && <span className="sidebar-label">Dashboard</span>}
      </NavLink>

      {groups ? (
        groups.map((group, idx) => (
          <div key={idx} className="sidebar-group">
            {(inDrawer || !collapsed) && <div className="sidebar-group-label">{group.label}</div>}
            {group.items.map((item) => renderNavItem(item, inDrawer))}
          </div>
        ))
      ) : (
        items && items.map((item) => renderNavItem(item, inDrawer))
      )}
    </nav>
  );

  return (
    <>
      {/* ── Desktop sidebar (hidden ≤991px) ─────────────────────── */}
      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="sidebar-header">
          <FaCoffee className="sidebar-brand-icon" />
          {!collapsed && <span className="sidebar-brand-text">{title}</span>}
          <button
            className="sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>

        {renderNav(false)}

        <div className="sidebar-footer">
          <Link to="/" className="sidebar-back-link" title="Back to Store">
            <FaArrowLeft className="sidebar-icon" />
            {!collapsed && <span className="sidebar-label">Back to Store</span>}
          </Link>
        </div>
      </aside>

      {/* ── Mobile header bar (visible ≤991px) ───────────────────── */}
      <div className="sidebar-mobile-header">
        <button
          className="sidebar-mobile-hamburger"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={drawerOpen}
        >
          <FaBars />
        </button>
        <span className="sidebar-mobile-title">
          <FaCoffee className="sidebar-mobile-brand-icon" />
          {title}
        </span>
      </div>

      {/* ── Overlay ──────────────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* ── Slide-over drawer ────────────────────────────────────── */}
      <aside className={`sidebar-drawer ${drawerOpen ? 'sidebar-drawer-open' : ''}`} aria-label="Navigation menu">
        <div className="sidebar-header">
          <FaCoffee className="sidebar-brand-icon" />
          <span className="sidebar-brand-text">{title}</span>
          <button
            className="sidebar-toggle"
            onClick={closeDrawer}
            aria-label="Close navigation menu"
          >
            <FaTimes />
          </button>
        </div>

        {renderNav(true)}

        <div className="sidebar-footer">
          <Link to="/" className="sidebar-back-link" onClick={closeDrawer}>
            <FaArrowLeft className="sidebar-icon" />
            <span className="sidebar-label">Back to Store</span>
          </Link>
        </div>
      </aside>
    </>
  );
}

export default React.memo(Sidebar);
