import React, { useState, useEffect, useCallback } from 'react';
import {
  FaCheckCircle, FaCalendarAlt, FaSearch, FaDownload,
  FaEye, FaClock, FaMoneyBillWave, FaSync, FaTimes,
  FaSpinner, FaChevronLeft, FaChevronRight,
} from 'react-icons/fa';
import { API_ENDPOINTS } from '../../config/api';
import apiService from '../../services/api.service';
import { useNotificationSystem } from '../../components/common/NotificationSystem';
import './CompletedOrders.css';

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const todayStr = () => new Date().toISOString().split('T')[0];

const fmtCurrency = (n) => `â‚±${parseFloat(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

const calcAvgPrepTime = (orders) => {
  const valid = orders.filter(o => o.created_at && o.completed_at);
  if (!valid.length) return 'N/A';
  const avg = valid.reduce((sum, o) =>
    sum + (new Date(o.completed_at) - new Date(o.created_at)), 0) / valid.length;
  const mins = Math.round(avg / 60000);
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} min`;
};

const calcRevenue = (orders) =>
  orders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);

const TYPE_MAP = {
  dine_in:  { cls: 'dine_in',  label: 'Dine In' },
  take_out: { cls: 'take_out', label: 'Take Out' },
  delivery: { cls: 'delivery', label: 'Delivery' },
};

// â”€â”€ Detail Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DetailModal = ({ order, onClose }) => {
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  if (!order) return null;
  const typeInfo = TYPE_MAP[order.order_type] || { cls: 'take_out', label: order.order_type };

  return (
    <div className="co-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="co-dialog" role="dialog" aria-modal="true">
        <div className="co-dialog-head">
          <h2 className="co-dialog-title">
              <FaCheckCircle style={{ color: 'var(--color-dark-green)' }} />
            Order #{order.order_number}
          </h2>
          <button className="co-dialog-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="co-dialog-body">
          <div className="co-detail-grid">
            <div className="co-detail-field">
              <label>Customer</label>
              <span>{order.user?.name || 'Guest / Walk-in'}</span>
            </div>
            <div className="co-detail-field">
              <label>Order Type</label>
              <span className={`co-type-chip ${typeInfo.cls}`}>{typeInfo.label}</span>
            </div>
            <div className="co-detail-field">
              <label>Completed At</label>
              <span>{order.completed_at ? new Date(order.completed_at).toLocaleString() : '–'}</span>
            </div>
            <div className="co-detail-field">
              <label>Order Placed</label>
              <span>{new Date(order.created_at).toLocaleString()}</span>
            </div>
            {order.payment_status && (
              <div className="co-detail-field">
                <label>Payment</label>
                <span style={{ textTransform: 'capitalize' }}>{order.payment_status}</span>
              </div>
            )}
          </div>

          <p className="co-items-section-title">Items</p>
          {(order.orderItems || []).map(item => (
            <div className="co-detail-item-row" key={item.id}>
              <span className="co-detail-item-qty">{item.quantity}×</span>
              <div style={{ flex: 1 }}>
                <span className="co-detail-item-name">{item.product?.name || 'Unknown Item'}</span>
                {item.special_instructions && (
                  <div className="co-detail-item-subs">{item.special_instructions}</div>
                )}
              </div>
              <span className="co-detail-item-price">
                {fmtCurrency(item.subtotal || (parseFloat(item.price) * item.quantity))}
              </span>
            </div>
          ))}

          <p className="co-detail-total">Total: {fmtCurrency(order.total_amount)}</p>

          {order.notes && (
            <div className="co-notes-box">{order.notes}</div>
          )}
        </div>

        <div className="co-dialog-footer">
          <button className="co-btn secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const CompletedOrders = () => {
  const { showErrorNotification } = useNotificationSystem();

  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [searchTerm, setSearchTerm]   = useState('');
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalCount, setTotalCount]   = useState(0);
  const [stats, setStats] = useState({ total_orders: 0, total_revenue: 0, avg_prep_time: 'N/A' });
  const [detailOrder, setDetailOrder] = useState(null);

  // â”€â”€ Fetch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fetchCompletedOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await apiService.get(
        `${API_ENDPOINTS.BARISTA.COMPLETED_ORDERS}?date=${selectedDate}&page=${currentPage}`
      );
      // sendResponse wraps paginator: response.data = {success, data: paginator, message}
      const paginator = res.data?.data ?? res.data;
      const list = Array.isArray(paginator?.data) ? paginator.data : [];

      setOrders(list);
      setTotalPages(paginator?.last_page ?? 1);
      setTotalCount(paginator?.total ?? list.length);
      setStats({
        total_orders:  paginator?.total ?? list.length,
        total_revenue: calcRevenue(list),
        avg_prep_time: calcAvgPrepTime(list),
      });
    } catch {
      showErrorNotification('Failed to load completed orders');
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate, currentPage, showErrorNotification]);

  useEffect(() => {
    fetchCompletedOrders();
  }, [fetchCompletedOrders]);

  // Reset to page 1 when date changes
  const handleDateChange = useCallback((e) => {
    setSelectedDate(e.target.value);
    setCurrentPage(1);
  }, []);

  // â”€â”€ CSV Export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const exportToCSV = useCallback(() => {
    const headers = ['Order #', 'Customer', 'Type', 'Items', 'Total', 'Completed At'];
    const rows = orders.map(o => [
      o.order_number,
      o.user?.name || 'Guest',
      o.order_type,
      (o.orderItems || []).map(i => `${i.quantity}x ${i.product?.name}`).join('; '),
      parseFloat(o.total_amount || 0).toFixed(2),
      o.completed_at ? new Date(o.completed_at).toLocaleString() : '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(f => `"${f}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: `completed-orders-${selectedDate}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  }, [orders, selectedDate]);

  // â”€â”€ Filtered list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const filtered = orders.filter(o =>
    String(o.order_number).includes(searchTerm) ||
    o.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.orderItems || []).some(i => i.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="co-page">

      {/* Top bar */}
      <div className="co-topbar">
        <div>
          <h1 className="co-title"><FaCheckCircle size={22} /> Completed Orders</h1>
          <p className="co-subtitle">View and analyze all completed orders for any date</p>
        </div>
        <div className="co-topbar-actions">
          <button className="co-btn secondary sm" onClick={() => fetchCompletedOrders(true)} disabled={refreshing}>
            <FaSync size={11} className={refreshing ? 'co-spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button className="co-btn success sm" onClick={exportToCSV} disabled={orders.length === 0}>
            <FaDownload size={11} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="co-stats">
        <div className="co-stat-card">
          <div className="co-stat-icon green"><FaCheckCircle /></div>
          <div>
            <div className="co-stat-value">{stats.total_orders.toLocaleString()}</div>
            <div className="co-stat-label">Orders Completed</div>
          </div>
        </div>
        <div className="co-stat-card">
          <div className="co-stat-icon blue"><FaMoneyBillWave /></div>
          <div>
            <div className="co-stat-value">{fmtCurrency(stats.total_revenue)}</div>
            <div className="co-stat-label">Total Revenue (page)</div>
          </div>
        </div>
        <div className="co-stat-card">
          <div className="co-stat-icon amber"><FaClock /></div>
          <div>
            <div className="co-stat-value">{stats.avg_prep_time}</div>
            <div className="co-stat-label">Avg Prep Time</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="co-filters">
        <div className="co-filter-group" style={{ maxWidth: 200 }}>
          <span className="co-filter-label">
            <FaCalendarAlt size={10} style={{ marginRight: '.3rem' }} /> Date
          </span>
          <input
            className="co-date-input"
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
          />
        </div>

        <div className="co-filter-group">
          <span className="co-filter-label">
            <FaSearch size={10} style={{ marginRight: '.3rem' }} /> Search
          </span>
          <div className="co-search-wrap">
            <FaSearch className="co-search-icon" size={12} />
            <input
              className="co-search-input"
              type="text"
              placeholder="Order #, customer name, or item…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="co-search-clear" onClick={() => setSearchTerm('')} aria-label="Clear">
                <FaTimes size={9} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="co-table-card">
        <div className="co-table-head-bar">
          <h2>
            Completed Orders
            <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: '.4rem', fontSize: '.8rem' }}>
              – {selectedDate}
            </span>
          </h2>
          <span className="co-table-count">
            {filtered.length} {filtered.length !== totalCount ? `of ${totalCount} total` : 'orders'}
          </span>
        </div>

        {loading ? (
          <div className="co-empty">
            <FaSpinner className="co-spin" size={28} />
            <p style={{ marginTop: '.75rem' }}>Loading orders…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="co-empty">
            <FaCheckCircle />
            <h3>No completed orders found</h3>
            <p>{searchTerm ? 'Try different search terms.' : 'No orders were completed on this date.'}</p>
          </div>
        ) : (
          <div className="co-table-wrap">
            <table className="co-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Completed At</th>
                  <th>Prep Time</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => {
                  const typeInfo = TYPE_MAP[order.order_type] || { cls: 'take_out', label: order.order_type };
                  const prepMs = (order.created_at && order.completed_at)
                    ? new Date(order.completed_at) - new Date(order.created_at) : null;
                  const prepMin = prepMs !== null ? Math.round(prepMs / 60000) : null;
                  return (
                    <tr key={order.id}>
                      <td><span className="co-order-num">#{order.order_number}</span></td>
                      <td>{order.user?.name || 'Guest'}</td>
                      <td><span className={`co-type-chip ${typeInfo.cls}`}>{typeInfo.label}</span></td>
                      <td>
                        <div className="co-items-preview">
                          {(order.orderItems || []).slice(0, 2).map((item, i) => (
                            <span key={i}>
                              {item.quantity}× {item.product?.name}
                              {i < Math.min((order.orderItems || []).length, 2) - 1 && ', '}
                            </span>
                          ))}
                          {(order.orderItems || []).length > 2 && (
                            <span className="co-items-more"> +{(order.orderItems || []).length - 2} more</span>
                          )}
                        </div>
                      </td>
                      <td><span className="co-total">{fmtCurrency(order.total_amount)}</span></td>
                      <td>
                        <span className="co-time">
                          {order.completed_at
                            ? new Date(order.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '–'}
                        </span>
                      </td>
                      <td>
                        <span className="co-time">
                          {prepMin !== null
                            ? (prepMin >= 60 ? `${Math.floor(prepMin / 60)}h ${prepMin % 60}m` : `${prepMin}m`)
                            : '–'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="co-btn icon-only sm"
                          title="View details"
                          aria-label="View order details"
                          onClick={() => setDetailOrder(order)}
                        >
                          <FaEye size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="co-pagination">
            <span className="co-pagination-info">Page {currentPage} of {totalPages} ({totalCount} total)</span>
            <div className="co-pagination-btns">
              <button
                className="co-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                aria-label="Previous page"
              >
                <FaChevronLeft size={11} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                return p <= totalPages ? (
                  <button
                    key={p}
                    className={`co-page-btn${currentPage === p ? ' active' : ''}`}
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </button>
                ) : null;
              })}
              <button
                className="co-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                aria-label="Next page"
              >
                <FaChevronRight size={11} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detailOrder && (
        <DetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />
      )}
    </div>
  );
};

export default CompletedOrders;
