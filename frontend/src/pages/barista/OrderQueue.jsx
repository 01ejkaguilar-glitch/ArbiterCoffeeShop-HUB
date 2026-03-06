import React, { useState, useEffect, useCallback } from 'react';
import {
  FaClock, FaUtensils, FaBell, FaCheckCircle, FaThumbsUp,
  FaSync, FaClipboardList,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config/api';
import apiService from '../../services/api.service';
import { useBaristaOrders } from '../../hooks/useBroadcast';
import { useNotificationSystem } from '../../components/common/NotificationSystem';
import OrderCard from './components/OrderCard';
import OrderDetailModal from './components/OrderDetailModal';
import './OrderQueue.css';

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
  <div className="oq-skeleton-card">
    <div className="oq-skeleton oq-skeleton-line oq-skeleton-sm" />
    <div className="oq-skeleton oq-skeleton-line oq-skeleton-md" />
    <div className="oq-skeleton oq-skeleton-line oq-skeleton-full" />
    <div className="oq-skeleton oq-skeleton-btn" style={{ marginTop: 10 }} />
  </div>
);

// ─ Column config ──────────────────────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'pending',   label: 'Pending',   ordersKey: 'pending_orders',   icon: <FaClock /> },
  { key: 'confirmed', label: 'Confirmed', ordersKey: 'confirmed_orders', icon: <FaThumbsUp /> },
  { key: 'preparing', label: 'Preparing', ordersKey: 'preparing_orders', icon: <FaUtensils /> },
  { key: 'ready',     label: 'Ready',     ordersKey: 'ready_orders',     icon: <FaCheckCircle /> },
];

const OrderQueue = () => {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders]         = useState(EMPTY_QUEUE);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderTimers, setOrderTimers] = useState({});
  const { showSuccessNotification, showErrorNotification, showOrderNotification } = useNotificationSystem();

  // ─ Real-time ─────────────────────────────────────────────────────────────────────────────
  const { isConnected: realtimeConnected } = useBaristaOrders((newOrder) => {
    showOrderNotification(newOrder, 'New Order Received!');
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
      const response = await apiService.get(API_ENDPOINTS.BARISTA.ORDER_QUEUE);
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
      showErrorNotification('Failed to load order queue');
      setOrders(EMPTY_QUEUE);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showErrorNotification]);

  // Initial load + timer tick
  useEffect(() => {
    fetchOrderQueue();
    const tick = setInterval(() => {
      setOrderTimers(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          if (next[id].status === 'preparing') next[id].elapsed = Date.now() - next[id].startTime;
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [fetchOrderQueue]);

  // ─ Update status ──────────────────────────────────────────────────────────────────
  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    setUpdatingOrder(orderId);
    try {
      await apiService.put(API_ENDPOINTS.BARISTA.UPDATE_ORDER(orderId), { status: newStatus });

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

  const openDetail = useCallback((order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  }, []);

  // ─ Auth guards ─────────────────────────────────────────────────────────────────────
  if (!isAuthenticated || !user) {
    return (
      <div className="oq-page">
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          <FaBell size={36} style={{ opacity: .3, marginBottom: '.75rem', display: 'block', margin: '0 auto .75rem' }} />
          <p style={{ fontWeight: 600 }}>Authentication required. Please log in.</p>
        </div>
      </div>
    );
  }

  const hasRole = user.roles && Array.isArray(user.roles)
    && user.roles.some(r => ['barista', 'admin', 'super-admin'].includes(r));
  if (!hasRole) {
    return (
      <div className="oq-page">
        <div style={{ textAlign: 'center', padding: '3rem', color: '#C41E3A' }}>
          <p style={{ fontWeight: 700 }}>Access Denied — Barista role required.</p>
        </div>
      </div>
    );
  }

  const totalActive = orders.pending_orders.length + orders.confirmed_orders.length +
    orders.preparing_orders.length + orders.ready_orders.length;

  return (
    <div className="oq-page">

      {/* Top bar */}
      <div className="oq-topbar">
        <div>
          <h1 className="oq-title">
              <FaClipboardList style={{ marginRight: '.5rem', color: 'var(--color-dark-green)' }} />
            Order Queue
          </h1>
          <p className="oq-subtitle">Monitor and advance all active orders in real time</p>
        </div>
        <div className="oq-topbar-actions">
          <span className={`oq-conn-chip ${realtimeConnected ? 'online' : 'offline'}`}>
            <span className="oq-conn-dot" />
            {realtimeConnected ? 'Live' : 'Offline'}
          </span>
          <button
            className={`oq-refresh-btn${refreshing ? ' spinning' : ''}`}
            onClick={() => fetchOrderQueue(true)}
            disabled={refreshing}
          >
            <FaSync />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Summary pills */}
      <div className="oq-summary">
        {COLUMNS.map(col => (
          <span key={col.key} className={`oq-summary-pill ${col.key}`}>
            {col.icon}
            {col.label}
            <span className="oq-count">{(orders[col.ordersKey] || []).length}</span>
          </span>
        ))}
        <span className="oq-summary-pill" style={{ background: '#f3f4f6', color: '#374151', borderColor: '#d1d5db' }}>
          Total active: <span className="oq-count">{totalActive}</span>
        </span>
      </div>

      {/* Kanban board */}
      <div className="oq-board">
        {COLUMNS.map(col => {
          const colOrders = orders[col.ordersKey] || [];
          return (
            <div key={col.key} className={`oq-col ${col.key}`}>
              <div className="oq-col-head">
                <div className="oq-col-icon">{col.icon}</div>
                <span className="oq-col-label">{col.label}</span>
                <span className="oq-col-badge">{colOrders.length}</span>
              </div>
              <div className="oq-col-body">
                {loading ? (
                  <><SkeletonCard /><SkeletonCard /></>
                ) : colOrders.length === 0 ? (
                  <div className="oq-col-empty">
                    <FaClipboardList />
                    No {col.label.toLowerCase()} orders
                  </div>
                ) : colOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    timer={orderTimers[order.id]}
                    updatingOrder={updatingOrder}
                    onUpdateStatus={updateOrderStatus}
                    onViewDetail={openDetail}
                    formatElapsedTime={formatElapsedTime}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail modal */}
      <OrderDetailModal
        show={showOrderModal}
        onHide={() => setShowOrderModal(false)}
        order={selectedOrder}
      />
    </div>
  );
};

export default OrderQueue;
