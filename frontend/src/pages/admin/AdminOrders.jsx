import React, { useEffect, useState, useMemo } from 'react';
import { Modal, Alert } from 'react-bootstrap';
import {
  FaEye, FaRedo, FaWifi, FaBell,
  FaShoppingCart, FaCheckCircle, FaClock, FaBoxOpen,
  FaTimesCircle, FaArrowRight, FaTimes, FaSave,
} from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import { useBaristaOrders } from '../../hooks/useBroadcast';
import { useNotificationSystem } from '../../components/common/NotificationSystem';
import PageShell from '../../components/layout/PageShell';
import './AdminOrders.css';

const ORDER_STATUSES = [
  { value: 'pending',               label: 'Pending' },
  { value: 'confirmed',             label: 'Confirmed' },
  { value: 'preparing',             label: 'Preparing' },
  { value: 'ready',                 label: 'Ready' },
  { value: 'completed',             label: 'Completed' },
  { value: 'cancelled',             label: 'Cancelled' },
  { value: 'cancellation_requested',label: 'Cancel Requested' },
];

const STATUS_LABEL = {
  pending: 'Pending', confirmed: 'Confirmed', preparing: 'Preparing',
  ready: 'Ready', completed: 'Completed', cancelled: 'Cancelled',
  cancellation_requested: 'Cancel Requested',
};

/** Inline status chip using ao-status CSS classes */
const StatusChip = ({ status }) => {
  const cls = `ao-status ${status || 'pending'}`;
  return (
    <span className={cls}>
      <span className="ao-dot" />
      {STATUS_LABEL[status] ?? status}
    </span>
  );
};

const PER_PAGE_OPTIONS = [10, 15, 25, 50];

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [meta, setMeta] = useState({ total: 0, last_page: 1, current_page: 1 });

  const { showSuccessNotification } = useNotificationSystem();

  // Real-time barista order notifications
  const { isConnected, pendingOrders } = useBaristaOrders((newOrder) => {
    setOrders(prevOrders => [newOrder, ...prevOrders]);
    showSuccessNotification(
      'New Order Received',
      `Order #${newOrder.order_number} has been placed and needs attention.`
    );
  });

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Refetch whenever page, perPage, debounced search, or filters change
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, debouncedSearch, filterStatus, filterType]);

  const fetchOrders = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('page', page);
      params.set('per_page', perPage);
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (filterStatus)    params.set('status', filterStatus);
      if (filterType)      params.set('order_type', filterType);

      const url = `${API_ENDPOINTS.ADMIN.ORDERS}?${params.toString()}`;
      const response = await apiService.get(url);

      if (response.success) {
        const raw = response.data;
        // Laravel paginator wraps rows in .data
        const rows = Array.isArray(raw.data) ? raw.data : (Array.isArray(raw) ? raw : []);
        setOrders(rows);
        if (raw.total !== undefined) {
          setMeta({
            total:        raw.total,
            last_page:    raw.last_page   ?? 1,
            current_page: raw.current_page ?? 1,
            from:         raw.from         ?? null,
            to:           raw.to           ?? null,
          });
        }
      } else {
        setError('Failed to load orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setShowModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      const response = await apiService.patch(
        API_ENDPOINTS.ADMIN.ORDER_STATUS(selectedOrder.id),
        { status: newStatus }
      );

      if (response.success) {
        // Update order in the list
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === selectedOrder.id
              ? { ...order, status: newStatus }
              : order
          )
        );

        setShowModal(false);
        showSuccessNotification(
          'Order Updated',
          `Order #${selectedOrder.order_number} status changed to ${newStatus}.`
        );
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Failed to update order status');
    }
  };

  const handleRefresh = () => {
    fetchOrders(true);
  };

  const handleFilterStatus = (val) => { setFilterStatus(val); setPage(1); };
  const handleFilterType   = (val) => { setFilterType(val);   setPage(1); };
  const handlePerPage      = (val) => { setPerPage(Number(val)); setPage(1); };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Stats from the full current page (server already pre-filtered)
  const stats = useMemo(() => ({
    total:     meta.total,
    pending:   orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing' || o.status === 'confirmed').length,
    ready:     orders.filter(o => o.status === 'ready').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }), [orders, meta.total]);

  // Unique order types from current page for the filter dropdown
  const orderTypes = useMemo(() =>
    [...new Set(orders.map(o => o.order_type).filter(Boolean))],
    [orders]);

  // ── Page number range (show at most 5 page buttons) ──────────
  const pageButtons = useMemo(() => {
    const total = meta.last_page;
    if (total <= 1) return [];
    const delta = 2;
    const left  = Math.max(1, page - delta);
    const right = Math.min(total, page + delta);
    const pages = [];
    for (let i = left; i <= right; i++) pages.push(i);
    if (left > 1)     pages.unshift('...-left',  1);
    if (right < total) pages.push('...-right', total);
    return pages;
  }, [page, meta.last_page]);

  return (
    <PageShell
      title="Order Management"
      subtitle="Manage and track all customer orders"
      loading={loading}
      headerRight={
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          {/* Live indicator */}
          <span className={`ao-live-chip ${isConnected ? 'on' : 'off'}`}>
            <span className="ao-live-dot" />
            {isConnected ? 'Live' : 'Offline'}
          </span>

          {/* Pending alert */}
          {pendingOrders.length > 0 && (
            <span className="ao-pending-chip">
              <FaBell size={11} />
              {pendingOrders.length} new
            </span>
          )}

          {/* Refresh */}
          <button
            className="ao-refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Refresh orders"
          >
            <FaRedo size={12} className={refreshing ? 'ao-spinning' : ''} />
            Refresh
          </button>
        </div>
      }
    >
      {/* Error */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4">
          {error}
        </Alert>
      )}

      {/* Stats Bar */}
      {!loading && (
        <div className="ao-stats-bar">
          <div className="ao-stat-card">
            <div className="ao-stat-icon blue"><FaShoppingCart /></div>
            <div>
              <div className="ao-stat-value">{stats.total}</div>
              <div className="ao-stat-label">Total Orders</div>
            </div>
          </div>
          <div className="ao-stat-card">
            <div className="ao-stat-icon amber"><FaClock /></div>
            <div>
              <div className="ao-stat-value">{stats.pending}</div>
              <div className="ao-stat-label">Pending</div>
            </div>
          </div>
          <div className="ao-stat-card">
            <div className="ao-stat-icon purple"><FaBoxOpen /></div>
            <div>
              <div className="ao-stat-value">{stats.preparing}</div>
              <div className="ao-stat-label">In Progress</div>
            </div>
          </div>
          <div className="ao-stat-card">
            <div className="ao-stat-icon teal"><FaWifi /></div>
            <div>
              <div className="ao-stat-value">{stats.ready}</div>
              <div className="ao-stat-label">Ready</div>
            </div>
          </div>
          <div className="ao-stat-card">
            <div className="ao-stat-icon green"><FaCheckCircle /></div>
            <div>
              <div className="ao-stat-value">{stats.completed}</div>
              <div className="ao-stat-label">Completed</div>
            </div>
          </div>
          <div className="ao-stat-card">
            <div className="ao-stat-icon red"><FaTimesCircle /></div>
            <div>
              <div className="ao-stat-value">{stats.cancelled}</div>
              <div className="ao-stat-label">Cancelled</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      {!loading && (
        <div className="ao-filter-bar">
          {/* Search */}
          <div className="ao-search-wrap">
            <svg className="ao-search-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="search"
              className="ao-search-input"
              placeholder="Search order #, customer…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <select className="ao-filter-select" value={filterStatus} onChange={e => handleFilterStatus(e.target.value)} aria-label="Filter by status">
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Type filter */}
          <select className="ao-filter-select" value={filterType} onChange={e => handleFilterType(e.target.value)} aria-label="Filter by type">
            <option value="">All Types</option>
            {orderTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Per-page */}
          <select className="ao-filter-select" value={perPage} onChange={e => handlePerPage(e.target.value)} aria-label="Rows per page" style={{ minWidth: 90 }}>
            {PER_PAGE_OPTIONS.map(n => (
              <option key={n} value={n}>{n} / page</option>
            ))}
          </select>

          <span className="ao-filter-count">
            {meta.from ?? 0}–{meta.to ?? 0} of {meta.total}
          </span>
        </div>
      )}

      {/* Table */}
      <div className="ao-table-card shadow-sm">
        <div style={{ overflowX: 'auto' }}>
          <table className="ao-table" aria-label="Orders list">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Date &amp; Time</th>
                <th>Status</th>
                <th>Total</th>
                <th>Type</th>
                <th style={{ width: 70 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && orders.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="ao-empty">
                      <FaShoppingCart className="ao-empty-icon" />
                      <p>No orders found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id}>
                    <td>
                      <div className="ao-order-num">{order.order_number}</div>
                    </td>
                    <td>
                      <div className="ao-customer-name">{order.user?.name || '—'}</div>
                      {order.user?.email && (
                        <div className="ao-customer-email">{order.user.email}</div>
                      )}
                    </td>
                    <td>
                      <div className="ao-order-time">{formatDate(order.created_at)}</div>
                    </td>
                    <td>
                      <StatusChip status={order.status} />
                    </td>
                    <td>
                      <span className="ao-price">₱{parseFloat(order.total_amount).toFixed(2)}</span>
                    </td>
                    <td>
                      <span className="ao-type-pill">{order.order_type || '—'}</span>
                    </td>
                    <td>
                      <button
                        className="ao-view-btn"
                        onClick={() => handleViewOrder(order)}
                        aria-label={`View order ${order.order_number}`}
                      >
                        <FaEye size={11} /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination Bar ── */}
      {meta.last_page > 1 && (
        <div className="ao-pagination">
          <span className="ao-page-info">
            Page {meta.current_page} of {meta.last_page}
          </span>
          <div className="ao-page-btns">
            <button
              className="ao-page-btn"
              onClick={() => setPage(1)}
              disabled={page === 1}
              aria-label="First page"
            >««</button>
            <button
              className="ao-page-btn"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Previous page"
            >‹</button>

            {pageButtons.map((p, i) =>
              typeof p === 'number' ? (
                <button
                  key={p}
                  className={`ao-page-btn ${p === page ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                  aria-current={p === page ? 'page' : undefined}
                >{p}</button>
              ) : (
                <span key={p + i} className="ao-page-ellipsis">…</span>
              )
            )}

            <button
              className="ao-page-btn"
              onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
              disabled={page === meta.last_page}
              aria-label="Next page"
            >›</button>
            <button
              className="ao-page-btn"
              onClick={() => setPage(meta.last_page)}
              disabled={page === meta.last_page}
              aria-label="Last page"
            >»»</button>
          </div>
        </div>
      )}

      {/* ── Order Detail Modal ── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" className="ao-modal" centered>
        <div className="ao-modal-header">
          <h5 className="ao-modal-title">
            <span className="ao-modal-icon"><FaEye size={13} /></span>
            Order {selectedOrder?.order_number}
          </h5>
          <button className="ao-modal-close" onClick={() => setShowModal(false)} aria-label="Close">
            <FaTimes size={13} />
          </button>
        </div>

        {selectedOrder && (
          <>
            <div className="ao-modal-body">
              {/* Meta chips */}
              <div className="ao-meta-grid">
                <div className="ao-meta-chip">
                  <div className="ao-meta-chip-label">Customer</div>
                  <div className="ao-meta-chip-value">{selectedOrder.user?.name || '—'}</div>
                </div>
                <div className="ao-meta-chip">
                  <div className="ao-meta-chip-label">Order Type</div>
                  <div className="ao-meta-chip-value" style={{ textTransform: 'capitalize' }}>{selectedOrder.order_type}</div>
                </div>
                <div className="ao-meta-chip">
                  <div className="ao-meta-chip-label">Status</div>
                  <div style={{ marginTop: '.15rem' }}><StatusChip status={selectedOrder.status} /></div>
                </div>
                <div className="ao-meta-chip">
                  <div className="ao-meta-chip-label">Total Amount</div>
                  <div className="ao-meta-chip-value ao-price">₱{parseFloat(selectedOrder.total_amount).toFixed(2)}</div>
                </div>
                <div className="ao-meta-chip">
                  <div className="ao-meta-chip-label">Date Placed</div>
                  <div className="ao-meta-chip-value">{formatDate(selectedOrder.created_at)}</div>
                </div>
                {selectedOrder.payment_status && (
                  <div className="ao-meta-chip">
                    <div className="ao-meta-chip-label">Payment</div>
                    <div className="ao-meta-chip-value" style={{ textTransform: 'capitalize' }}>{selectedOrder.payment_status}</div>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="ao-section-title">Order Items</div>
              <div className="ao-items-wrap">
                <table className="ao-items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.orderItems || []).map(item => (
                      <tr key={item.id}>
                        <td className="ao-item-name">{item.product?.name || '—'}</td>
                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>₱{parseFloat(item.unit_price).toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          ₱{(parseFloat(item.unit_price) * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr style={{ background: '#f8f9fa', borderTop: '2px solid #e9ecef' }}>
                      <td colSpan="3" style={{ textAlign: 'right', fontWeight: 700, fontSize: '.8rem', color: '#6b7280', letterSpacing: '.04em' }}>TOTAL</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#111827' }}>
                        ₱{parseFloat(selectedOrder.total_amount).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Status Timeline */}
              {Array.isArray(selectedOrder.status_history) && selectedOrder.status_history.length > 0 && (
                <>
                  <div className="ao-section-title">Status Timeline</div>
                  <div className="ao-timeline">
                    {selectedOrder.status_history.map((entry, i) => (
                      <div key={i} className="ao-tl-item">
                        <div className="ao-tl-arrow">
                          <StatusChip status={entry.from} />
                          <FaArrowRight size={10} style={{ color: '#9ca3af' }} />
                          <StatusChip status={entry.to} />
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="ao-tl-time">{new Date(entry.timestamp).toLocaleString()}</div>
                          <div className="ao-tl-by">by {entry.updated_by}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Update Status */}
              <div className="ao-status-update-wrap">
                <div className="ao-status-update-label">Update Order Status</div>
                <select
                  className="ao-status-select"
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                >
                  {ORDER_STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="ao-modal-footer">
              <button className="ao-cancel-btn" onClick={() => setShowModal(false)}>Close</button>
              <button
                className="ao-save-btn"
                onClick={handleStatusUpdate}
                disabled={newStatus === selectedOrder.status}
              >
                <FaSave size={12} />
                Update Status
              </button>
            </div>
          </>
        )}
      </Modal>
    </PageShell>
  );
};

export default AdminOrders;
