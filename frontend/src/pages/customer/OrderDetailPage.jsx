import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Button, Spinner } from 'react-bootstrap';
import {
  FaArrowLeft, FaSync, FaUtensils, FaShoppingBag, FaTruck,
  FaMapMarkerAlt, FaClock, FaCalendarAlt, FaReceipt,
  FaCreditCard, FaStickyNote, FaCheckCircle, FaTimesCircle,
  FaHourglassHalf, FaFire, FaBan, FaCoffee, FaRedo
} from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS, BACKEND_BASE_URL } from '../../config/api';
import SEO from '../../components/SEO';
import { useToast } from '../../components/animations/Toast';

/* ── helpers ── */
const fmt = (v) => { const n = parseFloat(v); return isNaN(n) ? '0.00' : n.toFixed(2); };

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const ORDER_TYPE_META = {
  'dine-in':  { icon: FaUtensils,    label: 'Dine In' },
  'take-out': { icon: FaShoppingBag, label: 'Take Out' },
  'delivery': { icon: FaTruck,       label: 'Delivery' },
};

const STATUS_META = {
  pending:                { icon: FaHourglassHalf, label: 'Pending',       cls: 'od-status--pending' },
  confirmed:              { icon: FaCheckCircle,   label: 'Confirmed',     cls: 'od-status--confirmed' },
  preparing:              { icon: FaFire,          label: 'Preparing',     cls: 'od-status--preparing' },
  ready:                  { icon: FaCoffee,        label: 'Ready',         cls: 'od-status--ready' },
  completed:              { icon: FaCheckCircle,   label: 'Completed',     cls: 'od-status--completed' },
  cancelled:              { icon: FaTimesCircle,   label: 'Cancelled',     cls: 'od-status--cancelled' },
  cancellation_requested: { icon: FaBan,           label: 'Cancel Req.',   cls: 'od-status--cancel-req' },
};

const PAYMENT_LABELS = { cash: 'Cash', gcash: 'GCash', maya: 'Maya', card: 'Card' };

/* ================================================================ */

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Auto-refresh for active orders (pending, confirmed, preparing, ready)
  useEffect(() => {
    const activeStatuses = ['pending', 'confirmed', 'preparing', 'ready'];
    if (!order || !activeStatuses.includes(order.status)) return;

    const interval = setInterval(() => {
      fetchOrder(true);
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.status, id]);

  const fetchOrder = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      const res = await apiService.get(API_ENDPOINTS.ORDERS.DETAIL(id));
      if (res.success) setOrder(res.data);
      else setError('Failed to load order details');
    } catch (e) {
      console.error('Error fetching order:', e);
      setError('Failed to load order details. Please try again.');
    } finally { setLoading(false); setRefreshing(false); }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setActionLoading(true);
    try {
      const res = await apiService.post(API_ENDPOINTS.ORDERS.CANCEL_REQUEST(id));
      if (res.success) {
        toast.success('Cancellation request submitted');
        fetchOrder(true);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to cancel order');
    } finally { setActionLoading(false); }
  };

  const handleReorder = async () => {
    setActionLoading(true);
    try {
      const res = await apiService.post(API_ENDPOINTS.ORDERS.REORDER(id));
      if (res.success) {
        toast.success('New order created!');
        navigate(`/orders/${res.data.id}`);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to reorder');
    } finally { setActionLoading(false); }
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <main role="main">
        <Container className="py-5 text-center">
          <Spinner animation="border" role="status" style={{ color: 'var(--color-dark-green)' }}>
            <span className="visually-hidden">Loading…</span>
          </Spinner>
        </Container>
      </main>
    );
  }

  /* ── Error state ── */
  if (error) {
    return (
      <main role="main">
        <Container className="py-5">
          <div className="od-error">
            <FaTimesCircle className="od-error-icon" />
            <h2>Order Not Found</h2>
            <p>{error}</p>
            <Button variant="primary" onClick={() => navigate('/orders')}>Back to Orders</Button>
          </div>
        </Container>
      </main>
    );
  }

  /* ── Derived data ── */
  const items = order?.orderItems || order?.order_items || [];
  const status = STATUS_META[order?.status] || STATUS_META.pending;
  const StatusIcon = status.icon;
  const typeMeta = ORDER_TYPE_META[order?.order_type] || ORDER_TYPE_META['dine-in'];
  const TypeIcon = typeMeta.icon;
  const addr = order?.deliveryAddress || order?.delivery_address;

  return (
    <main role="main">
      <SEO title={`Order #${order?.order_number}`} url={`/orders/${id}`} />
      <Container className="py-5">

        {/* ── Header ── */}
        <div className="od-header">
          <div className="od-header-left">
            <Button as={Link} to="/orders" variant="outline-primary" size="sm" className="od-back-btn">
              <FaArrowLeft className="me-2" /> Orders
            </Button>
            <div>
              <h1 className="od-title">Order #{order?.order_number}</h1>
              <p className="od-date"><FaCalendarAlt className="me-1" /> {formatDate(order?.created_at)}</p>
            </div>
          </div>
          <div className="od-header-right">
            <span className={`od-status-pill ${status.cls}`}>
              <StatusIcon className="me-1" /> {status.label}
            </span>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => fetchOrder(true)}
              disabled={refreshing}
              className="od-refresh-btn"
            >
              <FaSync className={refreshing ? 'fa-spin' : ''} />
            </Button>
          </div>
        </div>

        {/* ── Quick info strip ── */}
        <div className="od-info-strip">
          <div className="od-info-chip">
            <TypeIcon /> {typeMeta.label}
          </div>
          <div className="od-info-chip">
            <FaCreditCard /> {PAYMENT_LABELS[order?.payment_method] || order?.payment_method}
          </div>
          <div className="od-info-chip">
            <FaReceipt /> {items.length} {items.length === 1 ? 'item' : 'items'}
          </div>
          {order?.scheduled_time && (
            <div className="od-info-chip">
              <FaClock /> {formatDate(order.scheduled_time)}
            </div>
          )}
        </div>

        <Row className="g-4">
          {/* ─── Left: Items ─── */}
          <Col lg={8}>
            <section className="od-section">
              <h2 className="od-section-title">Order Items</h2>
              <div className="od-items">
                {items.map((item, i) => {
                  const price = parseFloat(item.unit_price) || 0;
                  const lineTotal = parseFloat(item.total_price || price * item.quantity) || 0;
                  return (
                    <div key={i} className="od-item">
                      <img
                        className="od-item-img"
                        src={
                          item.product?.image_url
                            ? `${BACKEND_BASE_URL}${item.product.image_url}`
                            : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmMGYwZjAiLz48dGV4dCB4PSIzMCIgeT0iMzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuMzVlbSIgZmlsbD0iI2FhYSIgZm9udC1zaXplPSIxMCI+Q29mZmVlPC90ZXh0Pjwvc3ZnPg=='
                        }
                        alt={item.product?.name || ''}
                        loading="lazy"
                      />
                      <div className="od-item-info">
                        <span className="od-item-name">
                          {item.product?.name || item.product_name || 'Unknown Product'}
                        </span>
                        {item.special_instructions && (
                          <span className="od-item-note">
                            <FaStickyNote className="me-1" /> {item.special_instructions}
                          </span>
                        )}
                      </div>
                      <span className="od-item-qty">&times;{item.quantity}</span>
                      <span className="od-item-price">₱{fmt(price)}</span>
                      <span className="od-item-total">₱{fmt(lineTotal)}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── Notes ── */}
            {(order?.notes || order?.special_instructions) && (
              <section className="od-section">
                <h2 className="od-section-title">
                  <FaStickyNote className="me-2" /> Notes
                </h2>
                <p className="od-notes-text">{order.notes || order.special_instructions}</p>
              </section>
            )}
          </Col>

          {/* ─── Right: Summary sidebar ─── */}
          <Col lg={4}>
            <div className="od-summary-card">
              <h2 className="od-summary-title">Payment Summary</h2>

              <div className="od-summary-rows">
                <div className="od-summary-row">
                  <span>Subtotal</span>
                  <span>₱{fmt(order?.subtotal)}</span>
                </div>
                {order?.order_type === 'delivery' && (
                  <div className="od-summary-row">
                    <span>Delivery Fee</span>
                    <span>₱{fmt(order?.delivery_fee)}</span>
                  </div>
                )}
              </div>

              <div className="od-summary-total">
                <span>Total</span>
                <span>₱{fmt(order?.total_amount)}</span>
              </div>

              <div className="od-pay-status">
                <span className="od-pay-label">Payment Status</span>
                <span className={`od-pay-badge ${order?.payment_status === 'paid' ? 'od-pay--paid' : 'od-pay--pending'}`}>
                  {order?.payment_status === 'paid' ? 'Paid' : 'Pending'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="d-grid gap-2 mt-3">
                {['pending', 'confirmed'].includes(order?.status) && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={handleCancelOrder}
                    disabled={actionLoading}
                  >
                    <FaTimesCircle className="me-1" /> Cancel Order
                  </Button>
                )}
                {['completed', 'cancelled'].includes(order?.status) && (
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={handleReorder}
                    disabled={actionLoading}
                  >
                    <FaRedo className="me-1" /> Reorder
                  </Button>
                )}
              </div>
            </div>

            {/* ── Delivery address card ── */}
            {order?.order_type === 'delivery' && addr && (
              <div className="od-address-card">
                <h3 className="od-address-title">
                  <FaMapMarkerAlt className="me-2" /> Delivery Address
                </h3>
                {typeof addr === 'string' ? (
                  <p className="od-address-text">{addr}</p>
                ) : (
                  <p className="od-address-text">
                    {addr.type && (
                      <span className="od-address-type">
                        {addr.type.charAt(0).toUpperCase() + addr.type.slice(1)}
                        {addr.is_default && <span className="od-badge-default">Default</span>}
                      </span>
                    )}
                    {addr.street}{addr.street && <br />}
                    {addr.city}{addr.city && addr.province && ', '}{addr.province}{(addr.city || addr.province) && <br />}
                    {addr.postal_code}
                  </p>
                )}
              </div>
            )}

            {/* ── Pickup info ── */}
            {order?.order_type === 'take-out' && (
              <div className="od-address-card">
                <h3 className="od-address-title">
                  <FaShoppingBag className="me-2" /> Pickup Information
                </h3>
                <p className="od-address-text">
                  Pick up at the store location.
                  {order.scheduled_time && <><br />Pickup time: {formatDate(order.scheduled_time)}</>}
                </p>
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </main>
  );
};

export default OrderDetailPage;