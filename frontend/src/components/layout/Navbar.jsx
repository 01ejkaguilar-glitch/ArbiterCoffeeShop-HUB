import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Badge, Dropdown } from 'react-bootstrap';
import { FaShoppingCart, FaUser, FaCoffee, FaSignOutAlt, FaTachometerAlt, FaUtensils, FaBars, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { SearchDropdown } from '../search';
import { NotificationBell } from '../notifications';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import './Navbar.css';

const NAV_LINKS = [
  { to: '/',              label: 'Home',          exact: true },
  { to: '/products',      label: 'Products' },
  { to: '/about',         label: 'About' },
  { to: '/announcements', label: 'Announcements' },
  { to: '/inquiries',     label: 'Services' },
  { to: '/contact',       label: 'Contact' },
];

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [products, setProducts] = useState([]);

  // Close on route change
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  // ESC closes drawer
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.classList.toggle('nav-drawer-open', drawerOpen);
    return () => document.body.classList.remove('nav-drawer-open');
  }, [drawerOpen]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // Fetch products for search
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await apiService.get(API_ENDPOINTS.PRODUCTS.LIST);
        if (response.success && response.data) setProducts(response.data);
      } catch (error) {
        if (error?.code === 'ERR_NETWORK' || !error?.response) {
          console.warn('Search products are temporarily unavailable due to network or SSL issues.');
        } else {
          console.error('Failed to fetch products for search:', error);
        }
      }
    };
    fetchProducts();
  }, []);

  const handleLogout = async () => {
    await logout();
    closeDrawer();
    navigate('/login');
  };

  const isLinkActive = (link) =>
    link.exact ? location.pathname === link.to : location.pathname.startsWith(link.to);

  const CartIcon = () => (
    <Link to="/cart" className="app-nav-icon-btn" onClick={closeDrawer} aria-label="Shopping Cart">
      <FaShoppingCart size={20} />
      {cartCount > 0 && (
        <Badge bg="danger" pill className="app-nav-cart-badge">
          {cartCount > 9 ? '9+' : cartCount}
        </Badge>
      )}
    </Link>
  );

  return (
    <>
      {/* ── Sticky top bar ────────────────────────────────────────── */}
      <nav className="app-navbar" aria-label="Main navigation">
        <div className="app-navbar-inner">

          {/* Brand */}
          <Link to="/" className="app-navbar-brand" onClick={closeDrawer}>
            <img
              src="/assets/arbiterlogo.png"
              alt="Arbiter Coffee Hub Logo"
              width="40"
              height="40"
              loading="lazy"
            />
            <span>Arbiter Coffee Hub</span>
          </Link>

          {/* Desktop links (≥1200px) */}
          <div className="app-navbar-desktop-links">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`app-nav-link ${isLinkActive(link) ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="app-navbar-desktop-actions">
            <div style={{ width: '220px' }}>
              <SearchDropdown
                products={products}
                placeholder="Search products..."
                onResultClick={(product) => navigate(`/products/${product.id}`)}
              />
            </div>

            <CartIcon />

            {isAuthenticated && (
              <div className="app-nav-icon-btn-wrap">
                <NotificationBell />
              </div>
            )}

            {isAuthenticated ? (
              <Dropdown align="end">
                <Dropdown.Toggle variant="success" id="dropdown-user">
                  <FaUser className="me-2" />
                  {user?.name || 'User'}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {user?.roles?.includes('admin') && (
                    <Dropdown.Item as={Link} to="/admin"><FaTachometerAlt className="me-2" />Admin Panel</Dropdown.Item>
                  )}
                  {user?.roles?.includes('barista') && (
                    <Dropdown.Item as={Link} to="/barista"><FaCoffee className="me-2" />Barista Staff</Dropdown.Item>
                  )}
                  {user?.roles?.includes('kitchen-staff') && (
                    <Dropdown.Item as={Link} to="/kitchen"><FaUtensils className="me-2" />Kitchen Staff</Dropdown.Item>
                  )}
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout}>
                    <FaSignOutAlt className="me-2" />Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <div className="d-flex gap-2">
                <Link to="/login" className="btn btn-outline-light btn-sm">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
              </div>
            )}
          </div>

          {/* Mobile actions: cart + bell + hamburger */}
          <div className="app-navbar-mobile-actions">
            <CartIcon />
            {isAuthenticated && (
              <div className="app-nav-icon-btn-wrap">
                <NotificationBell />
              </div>
            )}
            <button
              className="app-navbar-hamburger"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              aria-expanded={drawerOpen}
            >
              <FaBars />
            </button>
          </div>

        </div>
      </nav>

      {/* ── Overlay ──────────────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="app-nav-overlay"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* ── Slide-over drawer (from right) ────────────────────────── */}
      <aside
        className={`app-nav-drawer ${drawerOpen ? 'open' : ''}`}
        aria-label="Navigation menu"
        aria-hidden={!drawerOpen}
      >
        {/* Drawer header */}
        <div className="app-nav-drawer-header">
          <Link to="/" className="app-navbar-brand" onClick={closeDrawer}>
            <img src="/assets/arbiter-logo.png" alt="" width="32" height="32" loading="lazy" />
            <span>Arbiter Coffee Hub</span>
          </Link>
          <button className="app-nav-drawer-close" onClick={closeDrawer} aria-label="Close menu">
            <FaTimes />
          </button>
        </div>

        {/* Search */}
        <div className="app-nav-drawer-search">
          <SearchDropdown
            products={products}
            placeholder="Search products..."
            onResultClick={(product) => { navigate(`/products/${product.id}`); closeDrawer(); }}
          />
        </div>

        {/* Nav links */}
        <nav className="app-nav-drawer-links">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`app-nav-drawer-link ${isLinkActive(link) ? 'active' : ''}`}
              onClick={closeDrawer}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="app-nav-drawer-user">
          {isAuthenticated ? (
            <>
              {user?.roles?.includes('admin') && (
                <Link to="/admin" className="app-nav-drawer-link" onClick={closeDrawer}><FaTachometerAlt className="me-2" />Admin Panel</Link>
              )}
              {user?.roles?.includes('barista') && (
                <Link to="/barista" className="app-nav-drawer-link" onClick={closeDrawer}><FaCoffee className="me-2" />Barista Staff</Link>
              )}
              {user?.roles?.includes('kitchen-staff') && (
                <Link to="/kitchen" className="app-nav-drawer-link" onClick={closeDrawer}><FaUtensils className="me-2" />Kitchen Staff</Link>
              )}
              <button className="app-nav-drawer-logout" onClick={handleLogout}>
                <FaSignOutAlt className="me-2" />Logout
              </button>
            </>
          ) : (
            <div className="app-nav-drawer-auth">
              <Link to="/login"    className="btn btn-outline-secondary w-100 mb-2" onClick={closeDrawer}>Login</Link>
              <Link to="/register" className="btn btn-success w-100"               onClick={closeDrawer}>Register</Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default React.memo(Navbar);

