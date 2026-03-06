import React, { useState, useEffect, useCallback } from 'react';
import {
  FaCheckCircle, FaSearch,
  FaEye, FaSync, FaTimes,
  FaSpinner, FaChevronLeft, FaChevronRight,
} from 'react-icons/fa';
import { API_ENDPOINTS } from '../../config/api';
import apiService from '../../services/api.service';
import { useNotificationSystem } from '../../components/common/NotificationSystem';
import './CompletedFoodOrders.css';

const todayStr = () => new Date().toISOString().split('T')[0];

const fmtCurrency = (n) => `₱${parseFloat(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

const calcAvgPrepTime = (orders) => {
  const valid = orders.filter(o => o.created_at && o.completed_at);
  if (!valid.length) return 'N/A';
  const avg = valid.reduce((sum, o) =>
    sum + (new Date(o.completed_at) - new Date(o.created_at)), 0) / valid.length;
  const mins = Math.round(avg / 60000);
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} min`;
};

const TYPE_MAP = {
  dine_in:  { cls: 'dine_in',  label: 'Dine In' },
  take_out: { cls: 'take_out', label: 'Take Out' },
  delivery: { cls: 'delivery', label: 'Delivery' },
};

const DetailModal = ({ order, onClose }) => {
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  if (!order) return null;

  return (
    <div className="cfo-modal-overlay" onClick={onClose}>
      <div className="cfo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cfo-modal-header">
          <h3>Order #{order.order_number || order.id}</h3>
          <button className="cfo-modal-close" onClick={onClose}><FaTimes /></button>
        </div>
        <div className="cfo-modal-body">
          <div className="cfo-modal-meta">
            <span>Customer: {order.user?.name || order.customer_name || 'Guest'}</span>
            <span>Type: {TYPE_MAP[order.order_type]?.label || order.order_type || '—'}</span>
            <span>Total: {fmtCurrency(order.total_amount)}</span>
          </div>
          <h4 style={{ margin: '1rem 0 .5rem', fontSize: '.85rem', fontWeight: 600 }}>Items</h4>
          <div className="cfo-modal-items">
            {(order.order_items || order.orderItems || []).map((item, idx) => (
              <div key={idx} className="cfo-modal-item-row">
                <span>{item.quantity}× {item.product?.name || item.product_name || 'Item'}</span>
                <span>{fmtCurrency(item.subtotal || (item.quantity * item.price))}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const CompletedFoodOrders = () => {
  const { showErrorNotification } = useNotificationSystem();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.append('date', selectedDate);
      params.append('page', page);
      const response = await apiService.get(`${API_ENDPOINTS.KITCHEN.COMPLETED_ORDERS}?${params}`);
      const raw = response.data?.data ?? response.data;
      setOrders(raw?.data || raw || []);
      setLastPage(raw?.last_page || 1);
    } catch {
      showErrorNotification('Failed to load completed orders');
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate, page, showErrorNotification]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = orders.filter(o => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (o.order_number || String(o.id)).toLowerCase().includes(q)
      || (o.user?.name || o.customer_name || '').toLowerCase().includes(q);
  });

  const avgPrep = calcAvgPrepTime(filtered);
  const totalRevenue = filtered.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);

  return (
    <div className="cfo-page">
      <div className="cfo-topbar">
        <div>
          <h1 className="cfo-title">
            Completed Food Orders
          </h1>
          <p className="cfo-subtitle">Review completed kitchen orders</p>
        </div>
        <div className="cfo-topbar-actions">
          <button
            className={`cfo-refresh-btn${refreshing ? ' spinning' : ''}`}
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
          >
            <FaSync /> {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="cfo-summary">
        <div className="cfo-summary-card">
          <div className="cfo-summary-value">{filtered.length}</div>
          <div className="cfo-summary-label">Orders Completed</div>
        </div>
        <div className="cfo-summary-card">
          <div className="cfo-summary-value">{avgPrep}</div>
          <div className="cfo-summary-label">Avg Prep Time</div>
        </div>
        <div className="cfo-summary-card">
          <div className="cfo-summary-value">{fmtCurrency(totalRevenue)}</div>
          <div className="cfo-summary-label">Total Revenue</div>
        </div>
      </div>

      {/* Filters */}
      <div className="cfo-filters">
        <input
          type="date"
          value={selectedDate}
          onChange={e => { setSelectedDate(e.target.value); setPage(1); }}
          className="cfo-date-input"
        />
        <div className="cfo-search-wrap">
          <FaSearch className="cfo-search-icon" />
          <input
            type="text"
            placeholder="Search by order # or customer…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="cfo-search-input"
          />
          {searchTerm && (
            <button className="cfo-clear-btn" onClick={() => setSearchTerm('')}>
              <FaTimes size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Orders list */}
      <div className="cfo-card">
        <div className="cfo-card-head">
          <h2 className="cfo-card-title">
            <FaCheckCircle size={14} style={{ color: '#16a34a' }} />
            Orders
          </h2>
        </div>
        <div className="cfo-table-header">
          <span>Order #</span>
          <span>Customer</span>
          <span>Total</span>
          <span>Prep Time</span>
          <span>Type</span>
          <span></span>
        </div>
        {loading ? (
          <div className="cfo-loading"><FaSpinner className="spinning" /> Loading orders…</div>
        ) : filtered.length === 0 ? (
          <div className="cfo-empty">
            <FaCheckCircle size={32} style={{ color: '#d1d5db', display: 'block', margin: '0 auto 8px' }} />
            <p>No completed orders found for this date.</p>
          </div>
        ) : (
          <div className="cfo-order-list">
            {filtered.map(order => {
              const prep = (order.created_at && order.completed_at)
                ? (() => {
                    const ms = new Date(order.completed_at) - new Date(order.created_at);
                    const m = Math.round(ms / 60000);
                    return m >= 60 ? `${Math.floor(m/60)}h ${m%60}m` : `${m}m`;
                  })()
                : '—';
              return (
                <div key={order.id} className="cfo-order-row">
                  <span className="cfo-order-num">#{order.order_number || order.id}</span>
                  <span className="cfo-order-customer">{order.user?.name || order.customer_name || 'Guest'}</span>
                  <span className="cfo-order-total">{fmtCurrency(order.total_amount)}</span>
                  <span className="cfo-order-time">{prep}</span>
                  <span className={`cfo-order-type-badge ${TYPE_MAP[order.order_type]?.cls || ''}`}>
                    {TYPE_MAP[order.order_type]?.label || order.order_type || '—'}
                  </span>
                  <button className="cfo-view-btn" onClick={() => setSelectedOrder(order)}>
                    <FaEye size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="cfo-pagination">
            <span>Page {page} of {lastPage}</span>
            <div className="cfo-page-btns">
              <button className="cfo-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <FaChevronLeft size={11} /> Prev
              </button>
              <button className="cfo-page-btn" disabled={page >= lastPage} onClick={() => setPage(p => p + 1)}>
                Next <FaChevronRight size={11} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedOrder && <DetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
};

export default CompletedFoodOrders;
