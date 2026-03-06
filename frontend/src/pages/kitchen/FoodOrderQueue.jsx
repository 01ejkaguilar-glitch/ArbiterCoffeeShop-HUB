import React, { useState, useEffect, useCallback } from 'react';
import {
  FaClock, FaUtensils, FaBell, FaCheckCircle, FaThumbsUp,
  FaSync, FaClipboardList,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config/api';
import apiService from '../../services/api.service';
import { useKitchenOrders } from '../../hooks/useBroadcast';
import { useNotificationSystem } from '../../components/common/NotificationSystem';
import './FoodOrderQueue.css';

const POLL_INTERVAL = 30000; // 30 s fallback polling

// ─ Helpers ──────────────────────────────────────────────────────────────────────────────
const EMPTY_QUEUE = { pending_orders: [], confirmed_orders: [], preparing_orders: [], ready_orders: [], total_queue: 0 };

const normalise = (data) => ({
  pending_orders:   Array.isArray(data?.pending_orders)   ? data.pending_orders   : [],
  confirmed_orders: Array.isArray(data?.confirmed_orders) ? data.confirmed_orders : [],
  preparing_orders: Array.isArray(data?.preparing_orders) ? data.preparing_orders : [],
  ready_orders:     Array.isArray(data?.ready_orders)     ? data.ready_orders     : [],
  total_queue:      data?.total_queue ?? 0,
});

const formatElapsedTime = (ms) => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
};

// ─ Skeleton ───────────────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="foq-skeleton-card">
    <div className="foq-skeleton foq-skeleton-line foq-skeleton-sm" />
    <div className="foq-skeleton foq-skeleton-line foq-skeleton-md" />
    <div className="foq-skeleton foq-skeleton-line foq-skeleton-full" />
    <div className="foq-skeleton foq-skeleton-btn" style={{ marginTop: 10 }} />
  </div>
);

/* ── Connection chip ────────────────────────────────────────── */
const ConnChip = ({ connected }) => (
  <span className={`foq-conn-chip ${connected ? 'live' : 'offline'}`}>
    <span className="foq-conn-dot" />
    {connected ? 'Live' : 'Offline'}
  </span>
);

// ─ Column config ──────────────────────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'pending',   label: 'Pending',   ordersKey: 'pending_orders',   icon: <FaClock /> },
  { key: 'confirmed', label: 'Confirmed', ordersKey: 'confirmed_orders', icon: <FaThumbsUp /> },
  { key: 'preparing', label: 'Preparing', ordersKey: 'preparing_orders', icon: <FaUtensils /> },
  { key: 'ready',     label: 'Ready',     ordersKey: 'ready_orders',     icon: <FaCheckCircle /> },
];

// ─ Order Card ──────────────────────────────────────────────────────────────────────
const FoodOrderCard = ({ order, timer, updatingOrder, onUpdateStatus, formatElapsedTime }) => {
  const statusActions = {
    pending:   [{ label: 'Confirm', status: 'confirmed', cls: 'confirm' }, { label: 'Start Prep', status: 'preparing', cls: 'prepare' }],
    confirmed: [{ label: 'Start Prep', status: 'preparing', cls: 'prepare' }],
    preparing: [{ label: 'Mark Ready', status: 'ready', cls: 'ready' }],
    ready:     [{ label: 'Complete', status: 'completed', cls: 'complete' }],
  };
  const actions = statusActions[order.status] || [];

  return (
    <div className={`foq-order-card ${order.status}`}>
      <div className="foq-order-header">
        <span className="foq-order-num">#{order.order_number || order.id}</span>
        <span className={`foq-order-type ${order.order_type || 'dine_in'}`}>
          {(order.order_type || 'dine_in').replace('_', ' ')}
        </span>
      </div>
      <div className="foq-order-customer">
        {order.user?.name || order.customer_name || 'Guest'}
      </div>
      <div className="foq-order-items-list">
        {(order.order_items || order.orderItems || []).map((item, idx) => (
          <div key={idx} className="foq-order-item-row">
            <span className="foq-item-qty">{item.quantity}×</span>
            <span className="foq-item-name">{item.product?.name || item.product_name || 'Item'}</span>
          </div>
        ))}
      </div>
      {timer && order.status === 'preparing' && (
        <div className="foq-timer">
          <FaClock size={11} /> {formatElapsedTime(timer.elapsed)}
        </div>
      )}
      <div className="foq-order-actions">
        {actions.map((act) => (
          <button
            key={act.status}
            className={`foq-action-btn ${act.cls}`}
            onClick={() => onUpdateStatus(order.id, act.status)}
            disabled={updatingOrder === order.id}
          >
            {updatingOrder === order.id ? '…' : act.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const FoodOrderQueue = () => {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders]         = useState(EMPTY_QUEUE);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [orderTimers, setOrderTimers] = useState({});
  const { showSuccessNotification, showErrorNotification, showOrderNotification } = useNotificationSystem();

  // ─ Broadcast (WebSocket → polling fallback) ───────────────────────────────────────
  const { isConnected: realtimeConnected } = useKitchenOrders((newOrder) => {
    showOrderNotification(newOrder, 'New Food Order!');
    setOrders(prev => ({
      ...prev,
      pending_orders: [newOrder, ...(prev.pending_orders || [])],
    }));
  });

  // ─ Fetch ───────────────────────────────────────────────────────────────────────────────
  const fetchOrderQueue = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const response = await apiService.get(API_ENDPOINTS.KITCHEN.ORDER_QUEUE);
      const raw = response.data?.data ?? response.data;
      const data = normalise(raw);
      setOrders(data);

      const timers = {};
      data.preparing_orders.forEach(order => {
        timers[order.id] = {
          status: 'preparing',
          startTime: new Date(order.prepared_at || order.updated_at).getTime(),
          elapsed: Date.now() - new Date(order.prepared_at || order.updated_at).getTime(),
        };
      });
      setOrderTimers(timers);
    } catch {
      showErrorNotification('Failed to load food order queue');
      setOrders(EMPTY_QUEUE);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showErrorNotification]);

  useEffect(() => {
    fetchOrderQueue();

    // 1-second timer tick for elapsed display
    const tick = setInterval(() => {
      setOrderTimers(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          if (next[id].status === 'preparing') next[id].elapsed = Date.now() - next[id].startTime;
        });
        return next;
      });
    }, 1000);

    // 30-second background poll (fallback when WebSocket unavailable)
    const poll = setInterval(() => fetchOrderQueue(true), POLL_INTERVAL);

    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [fetchOrderQueue]);

  // ─ Update status ──────────────────────────────────────────────────────────────────
  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    setUpdatingOrder(orderId);
    try {
      await apiService.put(API_ENDPOINTS.KITCHEN.UPDATE_ORDER(orderId), { status: newStatus });

      setOrders(prev => {
        const all = [
          ...(prev.pending_orders || []),
          ...(prev.confirmed_orders || []),
          ...(prev.preparing_orders || []),
          ...(prev.ready_orders || []),
        ];
        const order = all.find(o => o.id === orderId);
        const next = {
          pending_orders:   (prev.pending_orders   || []).filter(o => o.id !== orderId),
          confirmed_orders: (prev.confirmed_orders || []).filter(o => o.id !== orderId),
          preparing_orders: (prev.preparing_orders || []).filter(o => o.id !== orderId),
          ready_orders:     (prev.ready_orders     || []).filter(o => o.id !== orderId),
        };

        if (order && !['completed', 'cancelled'].includes(newStatus)) {
          const updated = { ...order, status: newStatus, updated_at: new Date().toISOString() };
          if (newStatus === 'confirmed')  next.confirmed_orders.unshift(updated);
          if (newStatus === 'preparing') {
            next.preparing_orders.unshift(updated);
            setOrderTimers(t => ({
              ...t,
              [orderId]: { status: 'preparing', startTime: Date.now(), elapsed: 0 },
            }));
          }
          if (newStatus === 'ready') next.ready_orders.unshift(updated);
        }
        return next;
      });

      showSuccessNotification(`Order #${orderId} → ${newStatus}`);
    } catch {
      showErrorNotification('Failed to update order status');
    } finally {
      setUpdatingOrder(null);
    }
  }, [showSuccessNotification, showErrorNotification]);

  if (!isAuthenticated || !user) {
    return (
      <div className="foq-page">
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          <FaBell size={36} style={{ opacity: .3, marginBottom: '.75rem', display: 'block', margin: '0 auto .75rem' }} />
          <p style={{ fontWeight: 600 }}>Authentication required. Please log in.</p>
        </div>
      </div>
    );
  }

  const hasRole = user.roles && Array.isArray(user.roles)
    && user.roles.some(r => ['kitchen-staff', 'admin', 'super-admin'].includes(r));
  if (!hasRole) {
    return (
      <div className="foq-page">
        <div style={{ textAlign: 'center', padding: '3rem', color: '#C41E3A' }}>
          <p style={{ fontWeight: 700 }}>Access Denied — Kitchen Staff role required.</p>
        </div>
      </div>
    );
  }

  const totalActive = orders.pending_orders.length + orders.confirmed_orders.length +
    orders.preparing_orders.length + orders.ready_orders.length;

  return (
    <div className="foq-page">
      {/* Top bar */}
      <div className="foq-topbar">
        <div>
          <h1 className="foq-title">
            Food Order Queue
          </h1>
          <p className="foq-subtitle">Monitor and advance food orders in real time</p>
        </div>
        <div className="foq-topbar-actions">
          <ConnChip connected={realtimeConnected} />
          <button
            className={`foq-refresh-btn${refreshing ? ' spinning' : ''}`}
            onClick={() => fetchOrderQueue(true)}
            disabled={refreshing}
          >
            <FaSync />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Summary pills */}
      <div className="foq-summary">
        {COLUMNS.map(col => (
          <span key={col.key} className={`foq-summary-pill ${col.key}`}>
            {col.icon}
            {col.label}
            <span className="foq-count">{(orders[col.ordersKey] || []).length}</span>
          </span>
        ))}
        <span className="foq-summary-pill" style={{ background: '#f3f4f6', color: '#374151', borderColor: '#d1d5db' }}>
          Total active: <span className="foq-count">{totalActive}</span>
        </span>
      </div>

      {/* Kanban board */}
      <div className="foq-board">
        {COLUMNS.map(col => {
          const colOrders = orders[col.ordersKey] || [];
          return (
            <div key={col.key} className={`foq-col ${col.key}`}>
              <div className="foq-col-head">
                <div className="foq-col-icon">{col.icon}</div>
                <span className="foq-col-label">{col.label}</span>
                <span className="foq-col-badge">{colOrders.length}</span>
              </div>
              <div className="foq-col-body">
                {loading ? (
                  <><SkeletonCard /><SkeletonCard /></>
                ) : colOrders.length === 0 ? (
                  <div className="foq-col-empty">
                    <FaClipboardList />
                    No {col.label.toLowerCase()} orders
                  </div>
                ) : colOrders.map(order => (
                  <FoodOrderCard
                    key={order.id}
                    order={order}
                    timer={orderTimers[order.id]}
                    updatingOrder={updatingOrder}
                    onUpdateStatus={updateOrderStatus}
                    formatElapsedTime={formatElapsedTime}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FoodOrderQueue;
