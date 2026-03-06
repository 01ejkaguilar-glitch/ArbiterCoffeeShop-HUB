import React, { useState, useEffect, useMemo } from 'react';
import { Container, Spinner, Button } from 'react-bootstrap';
import {
  FaShoppingBag, FaCheckCircle, FaClock, FaWallet,
  FaCoffee, FaClipboardList, FaUser, FaStar,
  FaChevronRight, FaArrowRight, FaFire,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import { AreaMetricChart } from '../../components/charts';
import StatusBadge from '../../components/common/StatusBadge';
import SEO from '../../components/SEO';
import './CustomerDashboard.css';

/* ── helpers ── */
const fmt = (v) => { const n = parseFloat(v); return isNaN(n) ? '0.00' : n.toFixed(2); };

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const QUICK_ACTIONS = [
  { path: '/products', label: 'Browse Menu', icon: FaCoffee, color: 'rgba(0,104,55,0.1)', iconColor: 'var(--color-dark-green)', desc: 'Discover new flavors' },
    { path: '/orders', label: 'My Orders', icon: FaClipboardList, color: 'rgba(0,104,55,0.1)', iconColor: 'var(--color-dark-green)', desc: 'Track & manage orders' },
    { path: '/cart', label: 'My Cart', icon: FaShoppingBag, color: 'rgba(155,107,0,0.1)', iconColor: 'var(--color-warning)', desc: 'Review your cart' },
    { path: '/profile', label: 'Profile', icon: FaUser, color: 'rgba(0,104,55,0.1)', iconColor: 'var(--color-dark-green)', desc: 'Account settings' },
];

/* ── motion variants ── */
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }) };

/* ================================================================ */

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);

  const stats = dashboardData?.statistics || {};
  const recentOrders = useMemo(() => dashboardData?.recent_orders || [], [dashboardData]);
  const activeOrder = dashboardData?.active_order;

  /* chart data */
  const orderHistoryData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const map = days.map((d) => ({ date: d, orders: 0 }));
    if (recentOrders.length) {
      recentOrders.forEach((o) => {
        const idx = (new Date(o.created_at).getDay() + 6) % 7; // Mon=0
        map[idx].orders += 1;
      });
    }
    return map;
  }, [recentOrders]);

  useEffect(() => { fetchDashboard(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetchAnalytics(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await apiService.get(API_ENDPOINTS.CUSTOMER.DASHBOARD);
      if (res.success) setDashboardData(res.data);
      else setError('Failed to load dashboard');
    } catch {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await apiService.get(API_ENDPOINTS.CUSTOMER.ANALYTICS);
      if (res.success) setAnalyticsData(res.data);
    } catch {
      // analytics is non-critical; silently skip on error
    }
  };

  /* ── Loading ─────────── */
  if (loading) {
    return (
      <main role="main">
        <Container className="py-5 text-center">
          <Spinner animation="border" variant="success" />
          <p className="mt-3 text-muted">Loading your dashboard…</p>
        </Container>
      </main>
    );
  }

  /* ── Error ──────────── */
  if (error) {
    return (
      <main role="main">
        <Container className="py-5 text-center">
          <p className="text-danger mb-3">{error}</p>
          <Button variant="outline-primary" size="sm" onClick={fetchDashboard}>Retry</Button>
        </Container>
      </main>
    );
  }

  const avgOrder = stats.total_orders > 0
    ? ((parseFloat(stats.total_spent) || 0) / stats.total_orders).toFixed(2)
    : '0.00';
  const completionRate = stats.total_orders > 0
    ? ((stats.completed_orders / stats.total_orders) * 100).toFixed(0)
    : 0;

  return (
    <main role="main">
      <SEO title="Dashboard" url="/customer/dashboard" />
      <Container className="py-4">

        {/* ─── Hero Greeting ────────────────── */}
        <motion.div className="cdb-hero" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="cdb-hero-greeting">{getGreeting()}</p>
          <h1 className="cdb-hero-name">{user?.name || 'Coffee Lover'}</h1>
          <p className="cdb-hero-subtitle">Here's what's happening with your coffee orders today.</p>
          <div className="cdb-hero-member">
            <FaStar size={14} />
            Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
          </div>
        </motion.div>

        {/* ─── Active Order Banner ──────────── */}
        {activeOrder && (
          <motion.div className="cdb-active-order" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}>
            <span className="cdb-active-pulse" />
            <div className="cdb-active-info">
              <div className="cdb-active-label">
                Order #{activeOrder.id} is <StatusBadge type="order" status={activeOrder.status} />
              </div>
              <div className="cdb-active-meta">
                {activeOrder.order_items?.length || '—'} items · ₱{fmt(activeOrder.total_amount)}
              </div>
            </div>
            <Button as={Link} to={`/orders/${activeOrder.id}`} variant="warning" size="sm" className="cdb-active-btn fw-semibold">
              Track Order <FaArrowRight className="ms-1" />
            </Button>
          </motion.div>
        )}

        {/* ─── Stat Cards ───────────────────── */}
        <div className="cdb-stats">
          {[
            { label: 'Total Orders', value: stats.total_orders || 0, Icon: FaShoppingBag, mod: 'orders' },
            { label: 'Completed', value: stats.completed_orders || 0, Icon: FaCheckCircle, mod: 'completed' },
            { label: 'Active', value: stats.active_orders || 0, Icon: FaClock, mod: 'active' },
            { label: 'Total Spent', value: `₱${fmt(stats.total_spent)}`, Icon: FaWallet, mod: 'spent' },
          ].map((s, i) => (
            <motion.div key={s.label} className="cdb-stat-card" custom={i} initial="hidden" animate="visible" variants={fadeUp}>
              <div className={`cdb-stat-icon cdb-stat-icon--${s.mod}`}><s.Icon /></div>
              <div className="cdb-stat-value">{s.value}</div>
              <div className="cdb-stat-label">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ─── Quick Actions ────────────────── */}
        <div className="cdb-actions">
          {QUICK_ACTIONS.map((a, i) => (
            <motion.div key={a.path} custom={i + 4} initial="hidden" animate="visible" variants={fadeUp}>
              <Link to={a.path} className="cdb-action-card">
                <div className="cdb-action-icon-wrap" style={{ background: a.color, color: a.iconColor }}>
                  <a.icon />
                </div>
                <span className="cdb-action-label">{a.label}</span>
                <span className="cdb-action-desc">{a.desc}</span>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* ─── Content Grid: Chart + Recent Orders ── */}
        <div className="cdb-content-grid">

          {/* Left — chart + quick stats */}
          <div>
            <AreaMetricChart
              data={orderHistoryData}
              title="Order Activity"
              subtitle="Recent orders by day of week"
              dataKey="orders"
              xAxisKey="date"
              height={220}
              color="#006837"
            />

            <div className="cdb-quick-stats mt-3">
              <div className="cdb-section-header">
                <h2 className="cdb-section-title">Quick Stats</h2>
              </div>
              <div className="cdb-quick-stat-row">
                <span className="cdb-quick-stat-label">Avg Order Value</span>
                <span className="cdb-quick-stat-value">₱{avgOrder}</span>
              </div>
              <div className="cdb-quick-stat-row">
                <span className="cdb-quick-stat-label">Completion Rate</span>
                <span className="cdb-quick-stat-value">{completionRate}%</span>
              </div>
              <div className="cdb-quick-stat-row">
                <span className="cdb-quick-stat-label">Member Since</span>
                <span className="cdb-quick-stat-value">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                </span>
              </div>
            </div>

            {/* Top products from analytics */}
            {analyticsData?.top_products?.length > 0 && (
              <div className="cdb-quick-stats mt-3">
                <div className="cdb-section-header">
                  <h2 className="cdb-section-title"><FaFire size={14} className="me-1" style={{ color: '#e67e22' }} />Top Products</h2>
                </div>
                {analyticsData.top_products.slice(0, 5).map((p, i) => (
                  <div className="cdb-quick-stat-row" key={p.product_id || p.id || i}>
                    <span className="cdb-quick-stat-label">{p.product_name || p.name}</span>
                    <span className="cdb-quick-stat-value">{p.order_count || p.quantity || p.count}×</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — recent orders */}
          <div className="cdb-orders-card">
            <div className="cdb-section-header">
              <h2 className="cdb-section-title">Recent Orders</h2>
              <Link to="/orders" className="cdb-section-link">
                View All <FaChevronRight size={10} />
              </Link>
            </div>

            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <Link key={order.id} to={`/orders/${order.id}`} className="cdb-order-item">
                  <div className="cdb-order-num-wrap">
                    <span className="cdb-order-num">#{order.id}</span>
                  </div>
                  <div className="cdb-order-details">
                    <div className="cdb-order-title">
                      Order #{order.id}
                    </div>
                    <div className="cdb-order-meta">
                      {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' · '}
                      <StatusBadge type="order" status={order.status} />
                    </div>
                  </div>
                  <div className="cdb-order-right">
                    <div className="cdb-order-amount">₱{fmt(order.total_amount)}</div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="cdb-empty">
                <div className="cdb-empty-icon"><FaCoffee /></div>
                <p className="cdb-empty-text">No orders yet. Ready for your first cup?</p>
                <Link to="/products" className="cdb-empty-link">Browse Menu <FaArrowRight className="ms-1" size={12} /></Link>
              </div>
            )}
          </div>
        </div>

      </Container>
    </main>
  );
};

export default CustomerDashboard;
