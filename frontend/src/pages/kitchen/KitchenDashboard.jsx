import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FaClock, FaCheckCircle, FaUtensils, FaChartLine,
  FaTasks, FaCalendarAlt, FaSignInAlt, FaStopwatch,
  FaSync, FaExclamationTriangle, FaBolt, FaList,
  FaBoxes, FaClipboardList, FaChevronRight,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config/api';
import apiService from '../../services/api.service';
import { useKitchenOrders } from '../../hooks/useBroadcast';
import { useNotificationSystem } from '../../components/common/NotificationSystem';
import './KitchenDashboard.css';

const POLL_INTERVAL = 30000; // 30 s fallback polling

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

/* ─── Connection chip ────────────────────────────────────────── */
const ConnChip = ({ connected }) => (
  <span className={`kd-conn-chip ${connected ? 'live' : 'offline'}`}>
    <span className="kd-conn-dot" />
    {connected ? 'Live' : 'Offline'}
  </span>
);

/* ─── Skeleton loader ────────────────────────────────────────── */
const SkeletonLoader = () => (
  <>
    <div className="kd-skeleton-stat-grid">
      {[0,1,2,3].map(i => <div key={i} className="kd-skeleton kd-skeleton-stat" />)}
    </div>
    <div className="kd-skeleton" style={{ height: 260, borderRadius: 12, marginBottom: '1.25rem' }} />
    <div className="kd-skeleton" style={{ height: 200, borderRadius: 12 }} />
  </>
);

/* ══════════════════════════════════════════════════════════════
   KITCHEN DASHBOARD
   ══════════════════════════════════════════════════════════════ */
const KitchenDashboard = () => {
  const { user } = useAuth();
  const { showOrderNotification } = useNotificationSystem();

  const [dashboardData, setDashboardData]   = useState(null);
  const [workforceData, setWorkforceData]   = useState(null);
  const [queueData, setQueueData]           = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [refreshing, setRefreshing]         = useState(false);

  // ─ Real-time via WebSocket / polling fallback ──────────────────────────────────
  const { isConnected: realtimeConnected } = useKitchenOrders((newOrder) => {
    showOrderNotification(newOrder, 'New Food Order!');
    // Refresh stats so counts stay accurate
    fetchDashboardData(false);
  });

  /* data fetch ----------------------------------------------- */
  const fetchDashboardData = useCallback(async (showLoad = true) => {
    try {
      if (showLoad) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const dashRes = await apiService.get(API_ENDPOINTS.KITCHEN.DASHBOARD);
      if (dashRes.success) setDashboardData(dashRes.data);

      try {
        const qRes = await apiService.get(API_ENDPOINTS.KITCHEN.ORDER_QUEUE);
        if (qRes.success) setQueueData(qRes.data);
      } catch { /* non-fatal */ }

      try {
        const [shiftRes, tasksRes] = await Promise.all([
          apiService.get(API_ENDPOINTS.KITCHEN.SHIFT_CURRENT),
          apiService.get(API_ENDPOINTS.KITCHEN.TASKS_TODAY),
        ]);
        setWorkforceData({
          currentShift: shiftRes.success ? shiftRes.data : null,
          todaysTasks:  tasksRes.success  ? tasksRes.data  : [],
        });
      } catch { setWorkforceData(null); }

    } catch {
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    // 30-second background poll (fallback when WebSocket unavailable)
    const poll = setInterval(() => fetchDashboardData(false), POLL_INTERVAL);
    return () => clearInterval(poll);
  }, [fetchDashboardData]);

  /* derived -------------------------------------------------- */
  const pendingOrders   = dashboardData?.pending_orders   || 0;
  const preparingOrders = dashboardData?.preparing_orders || 0;
  const completedToday  = dashboardData?.completed_today  || 0;
  const totalFoodToday  = dashboardData?.total_food_orders_today || 0;
  const avgPrepTime     = dashboardData?.average_preparation_time || '—';

  const todaysTasks     = workforceData?.todaysTasks || [];
  const completedTasks  = todaysTasks.filter(t => t.status === 'completed').length;
  const currentShift    = workforceData?.currentShift;

  const liveQueue = [
    ...(queueData?.pending_orders   || []),
    ...(queueData?.preparing_orders || []),
    ...(queueData?.ready_orders     || []),
  ].slice(0, 8);

  return (
    <div className="kd-page">

      {/* Header */}
      <div className="kd-header">
        <div className="kd-header-left">
          <h1 className="kd-title">{getGreeting()}, {user?.name || 'Kitchen Staff'}!</h1>
          <p className="kd-subtitle">{todayLabel}</p>
        </div>
        <div className="kd-header-right">
          <ConnChip connected={realtimeConnected} />
          <button
            className="kd-refresh-btn"
            onClick={() => fetchDashboardData(false)}
            disabled={refreshing || loading}
          >
            <FaSync className={refreshing ? 'spinning' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {!realtimeConnected && !loading && (
        <div className="kd-warn">
          <FaExclamationTriangle />
          Real-time updates unavailable — please refresh periodically to check for new orders.
        </div>
      )}

      {error && (
        <div className="kd-error">
          <FaExclamationTriangle className="kd-error-icon" />
          <span>{error}</span>
        </div>
      )}

      {loading ? <SkeletonLoader /> : (
        <>
          {/* Stat Cards */}
          <div className="kd-stat-grid">
            <div className="kd-stat-card amber">
              <div className="kd-stat-icon amber"><FaClock size={20} /></div>
              <div className="kd-stat-info">
                <div className="kd-stat-value">{pendingOrders}</div>
                <p className="kd-stat-label">Pending Food Orders</p>
              </div>
            </div>
            <div className="kd-stat-card blue">
              <div className="kd-stat-icon blue"><FaUtensils size={20} /></div>
              <div className="kd-stat-info">
                <div className="kd-stat-value">{preparingOrders}</div>
                <p className="kd-stat-label">Preparing</p>
              </div>
            </div>
            <div className="kd-stat-card green">
              <div className="kd-stat-icon green"><FaCheckCircle size={20} /></div>
              <div className="kd-stat-info">
                <div className="kd-stat-value">{completedToday}</div>
                <p className="kd-stat-label">Completed Today</p>
              </div>
            </div>
            <div className="kd-stat-card teal">
              <div className="kd-stat-icon teal"><FaClipboardList size={20} /></div>
              <div className="kd-stat-info">
                <div className="kd-stat-value">{totalFoodToday}</div>
                <p className="kd-stat-label">Total Food Orders Today</p>
              </div>
            </div>
          </div>

          {/* KPI Metrics */}
          <div className="kd-metrics-grid">
            <div className="kd-metric-card">
              <div className="kd-metric-icon blue"><FaStopwatch size={18} /></div>
              <div className="kd-metric-info">
                <div className="kd-metric-value">{avgPrepTime}</div>
                <div className="kd-metric-label">Avg Prep Time</div>
              </div>
            </div>
            <div className="kd-metric-card">
              <div className="kd-metric-icon amber"><FaClipboardList size={18} /></div>
              <div className="kd-metric-info">
                <div className="kd-metric-value">{completedTasks} / {todaysTasks.length}</div>
                <div className="kd-metric-label">Tasks Completed</div>
              </div>
            </div>
          </div>

          {/* Body Grid */}
          <div className="kd-body-grid">

            {/* Left: Live Food Order Queue */}
            <div className="kd-card">
              <div className="kd-card-head">
                <h2 className="kd-card-title">
                  <FaBolt size={14} />
                  Food Order Queue
                  {liveQueue.length > 0 && (
                    <span className={`kd-card-badge ${pendingOrders > 0 ? 'amber' : ''}`}>
                      {liveQueue.length}
                    </span>
                  )}
                </h2>
                <Link to="/kitchen/orders" className="kd-see-all">
                  View all <FaChevronRight size={10} />
                </Link>
              </div>
              <div className="kd-card-body">
                {liveQueue.length === 0 ? (
                  <div className="kd-order-empty">
                    <FaCheckCircle size={28} style={{ color: '#16a34a', marginBottom: 8 }} />
                    <br />No active food orders — queue is clear!
                  </div>
                ) : (
                  <div className="kd-order-list">
                    {liveQueue.map((order) => (
                      <div key={order.id} className="kd-order-item">
                        <span className="kd-order-num">#{order.order_number || order.id}</span>
                        <span className="kd-order-customer">
                          {order.user?.name || order.customer_name || 'Guest'}
                        </span>
                        <span className="kd-order-items">
                          {order.order_items?.length || order.orderItems?.length || 0} item(s)
                        </span>
                        <span className={`kd-order-status ${order.status}`}>{order.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right column */}
            <div>
              {/* Shift card */}
              <div className="kd-shift-card">
                <div className="kd-shift-header">
                  <div>
                    <div className="kd-shift-label">Current Shift</div>
                    {currentShift ? (
                      <div className="kd-shift-time">
                        {currentShift.start_time} – {currentShift.end_time}
                      </div>
                    ) : (
                      <div className="kd-shift-none">No shift today</div>
                    )}
                  </div>
                  <div className="kd-shift-icon-wrap">
                    <FaCalendarAlt size={18} color="var(--color-kitchen-primary)" />
                  </div>
                </div>
                <div className="kd-shift-actions">
                  <Link to="/kitchen/attendance" className="kd-shift-btn primary">
                    <FaSignInAlt size={13} /> Clock In/Out
                  </Link>
                  <Link to="/kitchen/shifts" className="kd-shift-btn outline">
                    <FaCalendarAlt size={13} /> My Shifts
                  </Link>
                </div>
              </div>

              {/* Quick actions */}
              <div className="kd-card">
                <div className="kd-card-head">
                  <h2 className="kd-card-title"><FaBolt size={14} /> Quick Actions</h2>
                </div>
                <div className="kd-card-body">
                  <div className="kd-actions-grid">
                    <Link to="/kitchen/orders" className="kd-action-item">
                      <div className="kd-action-icon amber"><FaClock size={15} /></div>
                      <span className="kd-action-label">Food Orders</span>
                      {pendingOrders > 0 && (
                        <span className="kd-card-badge amber">{pendingOrders}</span>
                      )}
                      <FaChevronRight size={10} className="kd-action-chevron" />
                    </Link>
                    <Link to="/kitchen/tasks" className="kd-action-item">
                      <div className="kd-action-icon blue"><FaTasks size={15} /></div>
                      <span className="kd-action-label">My Tasks</span>
                      {todaysTasks.length > 0 && (
                        <span className="kd-card-badge blue">{todaysTasks.length}</span>
                      )}
                      <FaChevronRight size={10} className="kd-action-chevron" />
                    </Link>
                    <Link to="/kitchen/inventory" className="kd-action-item">
                      <div className="kd-action-icon purple"><FaBoxes size={15} /></div>
                      <span className="kd-action-label">Inventory Check</span>
                      <FaChevronRight size={10} className="kd-action-chevron" />
                    </Link>
                    <Link to="/kitchen/performance" className="kd-action-item">
                      <div className="kd-action-icon green"><FaChartLine size={15} /></div>
                      <span className="kd-action-label">My Performance</span>
                      <FaChevronRight size={10} className="kd-action-chevron" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Tasks */}
          <div className="kd-card">
            <div className="kd-card-head">
              <h2 className="kd-card-title">
                <FaList size={14} />
                Today's Tasks
                {todaysTasks.length > 0 && (
                  <span className="kd-card-badge">{todaysTasks.length}</span>
                )}
              </h2>
              <Link to="/kitchen/tasks" className="kd-see-all">
                See all <FaChevronRight size={10} />
              </Link>
            </div>
            <div className="kd-card-body">
              {todaysTasks.length === 0 ? (
                <p className="kd-task-empty">No tasks assigned for today.</p>
              ) : (
                <div className="kd-task-list">
                  {todaysTasks.slice(0, 6).map((task, i) => (
                    <div key={task.id || i} className="kd-task-item">
                      <span className={`kd-task-status-dot ${task.status === 'in_progress' ? 'in_progress' : task.status}`} />
                      <span className="kd-task-name">{task.title || task.name || 'Unnamed task'}</span>
                      {task.priority && (
                        <span className={`kd-task-priority ${task.priority}`}>{task.priority}</span>
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

export default KitchenDashboard;
