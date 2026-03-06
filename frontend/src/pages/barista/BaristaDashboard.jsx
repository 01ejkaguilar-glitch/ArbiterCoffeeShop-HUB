import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FaClock, FaCheckCircle, FaUtensils, FaChartLine, FaCoffee,
  FaTasks, FaCalendarAlt, FaSignInAlt, FaDollarSign, FaStopwatch,
  FaSync, FaExclamationTriangle, FaBolt, FaList,
  FaBoxes, FaLeaf, FaClipboardList, FaChevronRight,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config/api';
import apiService from '../../services/api.service';
import { useBaristaOrders } from '../../hooks/useBroadcast';
import { useNotificationSystem } from '../../components/common/NotificationSystem';
import './BaristaDashboard.css';

/* ─── helpers ─────────────────────────────────────────────────── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const todayLabel = new Date().toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});

const fmt = (n, prefix = '') =>
  prefix
    ? `${prefix}${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : (n || 0).toString();

/* ─── Connection chip ────────────────────────────────────────── */
const ConnChip = ({ connected }) => (
  <span className={`bd-conn-chip ${connected ? 'live' : 'offline'}`}>
    <span className="bd-conn-dot" />
    {connected ? 'Live' : 'Offline'}
  </span>
);

/* ─── Skeleton loader ────────────────────────────────────────── */
const SkeletonLoader = () => (
  <>
    <div className="bd-skeleton-stat-grid">
      {[0,1,2,3].map(i => <div key={i} className="bd-skeleton bd-skeleton-stat" />)}
    </div>
    <div className="bd-skeleton" style={{ height: 260, borderRadius: 12, marginBottom: '1.25rem' }} />
    <div className="bd-skeleton" style={{ height: 200, borderRadius: 12 }} />
  </>
);

/* ══════════════════════════════════════════════════════════════
   BARISTA DASHBOARD
   ══════════════════════════════════════════════════════════════ */
const BaristaDashboard = () => {
  const { user } = useAuth();
  const { showOrderNotification } = useNotificationSystem();

  const [dashboardData, setDashboardData]   = useState(null);
  const [workforceData, setWorkforceData]   = useState(null);
  const [queueData, setQueueData]           = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [refreshing, setRefreshing]         = useState(false);

  /* real-time orders ----------------------------------------- */
  const { isConnected: realtimeConnected } = useBaristaOrders((newOrder) => {
    showOrderNotification(newOrder, 'New Order Received!');
    fetchDashboardData(false);
  });

  /* data fetch ----------------------------------------------- */
  const fetchDashboardData = useCallback(async (showLoad = true) => {
    try {
      if (showLoad) setLoading(true);
      else setRefreshing(true);
      setError(null);

      /* main stats */
      const dashRes = await apiService.get(API_ENDPOINTS.BARISTA.DASHBOARD);
      if (dashRes.success) setDashboardData(dashRes.data);

      /* queue preview */
      try {
        const qRes = await apiService.get(API_ENDPOINTS.BARISTA.ORDER_QUEUE);
        if (qRes.success) setQueueData(qRes.data);
      } catch { /* non-fatal */ }

      /* workforce */
      try {
        const [shiftRes, tasksRes] = await Promise.all([
          apiService.get(API_ENDPOINTS.BARISTA.SHIFT_CURRENT),
          apiService.get(API_ENDPOINTS.BARISTA.TASKS_TODAY),
        ]);
        setWorkforceData({
          currentShift: shiftRes.success ? shiftRes.data : null,
          todaysTasks:  tasksRes.success  ? tasksRes.data  : [],
        });
      } catch { setWorkforceData(null); }

    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  /* derived -------------------------------------------------- */
  const pendingOrders   = dashboardData?.pending_orders   || 0;
  const preparingOrders = dashboardData?.preparing_orders || 0;
  const completedToday  = dashboardData?.completed_today  || 0;
  const revenue         = dashboardData?.total_revenue_today || 0;
  const avgPrepTime     = dashboardData?.average_preparation_time || '—';
  const ordersPerHour   = completedToday
    ? (Math.round((completedToday / 8) * 10) / 10).toString() : '0';

  const todaysTasks     = workforceData?.todaysTasks || [];
  const completedTasks  = todaysTasks.filter(t => t.status === 'completed').length;
  const currentShift    = workforceData?.currentShift;

  /* queue items: flatten pending + preparing + ready */
  const liveQueue = [
    ...(queueData?.pending_orders   || []),
    ...(queueData?.preparing_orders || []),
    ...(queueData?.ready_orders     || []),
  ].slice(0, 8);

  /* ── render ───────────────────────────────────────────────── */
  return (
    <div className="bd-page">

      {/* Header ─────────────────────────────────────────────── */}
      <div className="bd-header">
        <div className="bd-header-left">
          <h1 className="bd-title">{getGreeting()}, {user?.name || 'Barista'}!</h1>
          <p className="bd-subtitle">{todayLabel}</p>
        </div>
        <div className="bd-header-right">
          <ConnChip connected={realtimeConnected} />
          <button
            className="bd-refresh-btn"
            onClick={() => fetchDashboardData(false)}
            disabled={refreshing || loading}
          >
            <FaSync className={refreshing ? 'spinning' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Offline warning ─────────────────────────────────────── */}
      {!realtimeConnected && !loading && (
        <div className="bd-warn">
          <FaExclamationTriangle />
          Real-time updates unavailable — please refresh periodically to check for new orders.
        </div>
      )}

      {/* Error ───────────────────────────────────────────────── */}
      {error && (
        <div className="bd-error">
          <FaExclamationTriangle className="bd-error-icon" />
          <span>{error}</span>
        </div>
      )}

      {/* Skeleton / Content ──────────────────────────────────── */}
      {loading ? <SkeletonLoader /> : (
        <>
          {/* ── Stat Cards ────────────────────────────────────── */}
          <div className="bd-stat-grid">

            <div className="bd-stat-card amber">
              <div className="bd-stat-icon amber"><FaClock size={20} /></div>
              <div className="bd-stat-info">
                <div className="bd-stat-value">{pendingOrders}</div>
                <p className="bd-stat-label">Pending Orders</p>
              </div>
            </div>

            <div className="bd-stat-card blue">
              <div className="bd-stat-icon blue"><FaUtensils size={20} /></div>
              <div className="bd-stat-info">
                <div className="bd-stat-value">{preparingOrders}</div>
                <p className="bd-stat-label">Preparing</p>
              </div>
            </div>

            <div className="bd-stat-card green">
              <div className="bd-stat-icon green"><FaCheckCircle size={20} /></div>
              <div className="bd-stat-info">
                <div className="bd-stat-value">{completedToday}</div>
                <p className="bd-stat-label">Completed Today</p>
              </div>
            </div>

            <div className="bd-stat-card teal">
              <div className="bd-stat-icon teal"><FaDollarSign size={20} /></div>
              <div className="bd-stat-info">
                <div className="bd-stat-value">{fmt(revenue, '₱')}</div>
                <p className="bd-stat-label">Today's Revenue</p>
              </div>
            </div>

          </div>

          {/* ── KPI Metrics ───────────────────────────────────── */}
          <div className="bd-metrics-grid">
            <div className="bd-metric-card">
              <div className="bd-metric-icon blue"><FaStopwatch size={18} /></div>
              <div className="bd-metric-info">
                <div className="bd-metric-value">{avgPrepTime}</div>
                <div className="bd-metric-label">Avg Preparation Time</div>
              </div>
            </div>
            <div className="bd-metric-card">
              <div className="bd-metric-icon green"><FaChartLine size={18} /></div>
              <div className="bd-metric-info">
                <div className="bd-metric-value">{ordersPerHour}</div>
                <div className="bd-metric-label">Orders per Hour</div>
              </div>
            </div>
            <div className="bd-metric-card">
              <div className="bd-metric-icon amber"><FaClipboardList size={18} /></div>
              <div className="bd-metric-info">
                <div className="bd-metric-value">{completedTasks} / {todaysTasks.length}</div>
                <div className="bd-metric-label">Tasks Completed</div>
              </div>
            </div>
          </div>

          {/* ── Body Grid ─────────────────────────────────────── */}
          <div className="bd-body-grid">

            {/* Left: Live Order Queue ─────────────────────────── */}
            <div className="bd-card">
              <div className="bd-card-head">
                <h2 className="bd-card-title">
                  <FaBolt size={14} />
                  Live Order Queue
                  {liveQueue.length > 0 && (
                    <span className={`bd-card-badge ${pendingOrders > 0 ? 'amber' : ''}`}>
                      {liveQueue.length}
                    </span>
                  )}
                </h2>
                <Link to="/barista/orders" className="bd-see-all">
                  View all <FaChevronRight size={10} />
                </Link>
              </div>
              <div className="bd-card-body">
                {liveQueue.length === 0 ? (
                  <div className="bd-order-empty">
                    <FaCheckCircle size={28} style={{ color: '#16a34a', marginBottom: 8 }} />
                    <br />No active orders — queue is clear!
                  </div>
                ) : (
                  <div className="bd-order-list">
                    {liveQueue.map((order) => (
                      <div key={order.id} className="bd-order-item">
                        <span className="bd-order-num">#{order.order_number || order.id}</span>
                        <span className="bd-order-customer">
                          {order.user?.name || order.customer_name || 'Guest'}
                        </span>
                        <span className="bd-order-items">
                          {order.order_items?.length || order.orderItems?.length || 0} item(s)
                        </span>
                        <span className={`bd-order-status ${order.status}`}>{order.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right column ───────────────────────────────────── */}
            <div>

              {/* Shift card */}
              <div className="bd-shift-card">
                <div className="bd-shift-header">
                  <div>
                    <div className="bd-shift-label">Current Shift</div>
                    {currentShift ? (
                      <div className="bd-shift-time">
                        {currentShift.start_time} – {currentShift.end_time}
                      </div>
                    ) : (
                      <div className="bd-shift-none">No shift today</div>
                    )}
                    {currentShift?.shift_name && (
                      <div className="bd-shift-name">{currentShift.shift_name}</div>
                    )}
                  </div>
                  <div className="bd-shift-icon-wrap">
                    <FaCalendarAlt size={18} color="var(--color-dark-green)" />
                  </div>
                </div>
                <div className="bd-shift-actions">
                  <Link to="/barista/attendance" className="bd-shift-btn primary">
                    <FaSignInAlt size={13} /> Clock In/Out
                  </Link>
                  <Link to="/barista/shifts" className="bd-shift-btn outline">
                    <FaCalendarAlt size={13} /> My Shifts
                  </Link>
                </div>
              </div>

              {/* Quick actions */}
              <div className="bd-card">
                <div className="bd-card-head">
                  <h2 className="bd-card-title"><FaBolt size={14} /> Quick Actions</h2>
                </div>
                <div className="bd-card-body">
                  <div className="bd-actions-grid">

                    <Link to="/barista/orders" className="bd-action-item">
                      <div className="bd-action-icon amber"><FaClock size={15} /></div>
                      <span className="bd-action-label">Order Queue</span>
                      {pendingOrders > 0 && (
                        <span className="bd-card-badge amber">{pendingOrders}</span>
                      )}
                      <FaChevronRight size={10} className="bd-action-chevron" />
                    </Link>

                    <Link to="/barista/tasks" className="bd-action-item">
                      <div className="bd-action-icon blue"><FaTasks size={15} /></div>
                      <span className="bd-action-label">My Tasks</span>
                      {todaysTasks.length > 0 && (
                        <span className="bd-card-badge blue">{todaysTasks.length}</span>
                      )}
                      <FaChevronRight size={10} className="bd-action-chevron" />
                    </Link>

                    <Link to="/barista/beans" className="bd-action-item">
                      <div className="bd-action-icon green"><FaCoffee size={15} /></div>
                      <span className="bd-action-label">Coffee Beans</span>
                      <FaChevronRight size={10} className="bd-action-chevron" />
                    </Link>

                    <Link to="/barista/featured-origins" className="bd-action-item">
                      <div className="bd-action-icon teal"><FaLeaf size={15} /></div>
                      <span className="bd-action-label">Today's Origin</span>
                      <FaChevronRight size={10} className="bd-action-chevron" />
                    </Link>

                    <Link to="/barista/inventory" className="bd-action-item">
                      <div className="bd-action-icon purple"><FaBoxes size={15} /></div>
                      <span className="bd-action-label">Inventory Check</span>
                      <FaChevronRight size={10} className="bd-action-chevron" />
                    </Link>

                    <Link to="/barista/performance" className="bd-action-item">
                      <div className="bd-action-icon green"><FaChartLine size={15} /></div>
                      <span className="bd-action-label">My Performance</span>
                      <FaChevronRight size={10} className="bd-action-chevron" />
                    </Link>

                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ── Today's Tasks ────────────────────────────────── */}
          <div className="bd-card">
            <div className="bd-card-head">
              <h2 className="bd-card-title">
                <FaList size={14} />
                Today's Tasks
                {todaysTasks.length > 0 && (
                  <span className="bd-card-badge">{todaysTasks.length}</span>
                )}
              </h2>
              <Link to="/barista/tasks" className="bd-see-all">
                See all <FaChevronRight size={10} />
              </Link>
            </div>
            <div className="bd-card-body">
              {todaysTasks.length === 0 ? (
                <p className="bd-task-empty">No tasks assigned for today.</p>
              ) : (
                <div className="bd-task-list">
                  {todaysTasks.slice(0, 6).map((task, i) => (
                    <div key={task.id || i} className="bd-task-item">
                      <span className={`bd-task-status-dot ${task.status === 'in_progress' ? 'in_progress' : task.status}`} />
                      <span className="bd-task-name">{task.title || task.name || 'Unnamed task'}</span>
                      {task.priority && (
                        <span className={`bd-task-priority ${task.priority}`}>{task.priority}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </>
      )}

    </div>
  );
};

export default BaristaDashboard;

