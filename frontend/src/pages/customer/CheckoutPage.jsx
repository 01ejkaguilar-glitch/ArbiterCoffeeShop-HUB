import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Modal, Spinner } from 'react-bootstrap';
import {
  FaUtensils, FaShoppingBag, FaTruck, FaClock, FaMapMarkerAlt,
  FaMoneyBillWave, FaMobileAlt, FaCreditCard, FaQrcode, FaStickyNote,
  FaShieldAlt, FaArrowLeft, FaCheckCircle, FaInfoCircle, FaCoffee
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api.service';
import { API_ENDPOINTS, BACKEND_BASE_URL } from '../../config/api';
import { useToast } from '../../components/animations/Toast';
import AddressSelector from '../../components/checkout/AddressSelector';
import SEO from '../../components/SEO';

/* ── helpers ── */
const fmt = (val) => {
  const n = parseFloat(val);
  return isNaN(n) ? '0.00' : n.toFixed(2);
};

const ORDER_TYPES = [
  { value: 'dine-in',  label: 'Dine In',  icon: FaUtensils,    desc: 'Enjoy at the shop' },
  { value: 'take-out', label: 'Take Out',  icon: FaShoppingBag, desc: 'Grab and go' },
  { value: 'delivery', label: 'Delivery',  icon: FaTruck,       desc: 'We deliver to you' },
];

const PICKUP_OPTIONS = [
  { value: 'asap',                label: 'ASAP',              desc: 'Ready in 15–20 min' },
  { value: '30min',               label: '30 Minutes',        desc: 'Half an hour' },
  { value: '1hour',               label: '1 Hour',            desc: 'Take your time' },
  { value: '2hours',              label: '2 Hours',           desc: 'Flexible pickup' },
  { value: 'tomorrow_morning',    label: 'Tomorrow AM',       desc: '9 : 00 AM' },
  { value: 'tomorrow_afternoon',  label: 'Tomorrow PM',       desc: '2 : 00 PM' },
];

const PAYMENT_METHODS = [
  { value: 'cash',  label: 'Cash',   icon: FaMoneyBillWave, desc: 'Pay upon pickup / delivery' },
  { value: 'gcash', label: 'GCash',  icon: FaMobileAlt,     desc: 'Scan QR to pay' },
  { value: 'maya',  label: 'Maya',   icon: FaMobileAlt,     desc: 'Scan QR to pay' },
  { value: 'card',  label: 'Card',   icon: FaCreditCard,    desc: 'Debit / credit card' },
];

/* ================================================================ */

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  /* state */
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [orderType, setOrderType] = useState('dine-in');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [pickupTime, setPickupTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState(null);

  /* derived */
  const deliveryFee = orderType === 'delivery' ? 50 : 0;
  const subtotal = cart?.items?.reduce(
    (sum, i) => sum + (parseFloat(i.unit_price ?? i.product?.price) || 0) * i.quantity, 0
  ) || 0;
  const total = subtotal + deliveryFee;
  const itemCount = cart?.items?.reduce((s, i) => s + i.quantity, 0) || 0;
  const canOrder = (orderType !== 'delivery' || !!selectedAddressId) && itemCount > 0;

  /* boot */
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    if (!cart || !cart.items || cart.items.length === 0) {
      navigate('/cart');
      return;
    }
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  /* addresses */
  const fetchAddresses = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.CUSTOMER.ADDRESSES);
      if (response.success) {
        setAddresses(response.data);
        const def = response.data.find((a) => a.is_default);
        if (def) setSelectedAddressId(def.id);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  };

  const handleAddAddress = async (form) => {
    try {
      const response = await apiService.post(API_ENDPOINTS.CUSTOMER.ADDRESSES, form);
      if (response.success) {
        setAddresses((prev) => [...prev, response.data]);
        setSelectedAddressId(response.data.id);
        return true;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add address');
    }
    return false;
  };

  /* place order */
  const handlePlaceOrder = async () => {
    setError('');

    // Confirmation dialog
    if (!window.confirm('Are you sure you want to place this order?')) {
      return;
    }

    setLoading(true);
    try {
      if (orderType === 'delivery' && !selectedAddressId) {
        toast.warning('Please select a delivery address');
        setError('Please select a delivery address');
        setLoading(false);
        return;
      }
      if (!cart?.items?.length) {
        toast.error('Your cart is empty');
        setError('Your cart is empty');
        setLoading(false);
        return;
      }

      const orderData = {
        order_type: orderType,
        payment_method: paymentMethod,
        items: cart.items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          special_instructions: i.special_instructions || null,
        })),
        notes: notes || null,
      };
      if (orderType === 'delivery') orderData.delivery_address_id = selectedAddressId;
      if (orderType === 'take-out' && pickupTime) orderData.pickup_time = pickupTime;

      const response = await apiService.post(API_ENDPOINTS.ORDERS.CREATE, orderData);

      if (response.success) {
        setCreatedOrderId(response.data.id);
        if (['gcash', 'maya'].includes(paymentMethod)) {
          setShowPaymentQR(true);
          toast.info('Please complete payment using the QR code');
          return;
        }
        await clearCart();
        toast.success('Order placed successfully!');
        navigate(`/orders/${response.data.id}`, { state: { orderCreated: true } });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to place order. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── render ── */
  return (
    <main role="main">
      <SEO title="Checkout" url="/checkout" />
      <Container className="py-5">

        {/* Header */}
        <div className="co-header">
          <Button as={Link} to="/cart" variant="outline-primary" size="sm" className="co-back-btn">
            <FaArrowLeft className="me-2" /> Back to Cart
          </Button>
          <div>
            <h1 className="co-title">Checkout</h1>
            <p className="co-subtitle">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} &middot; ₱{fmt(subtotal)}
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="co-alert co-alert-danger" role="alert">
            <FaInfoCircle className="me-2" />
            {error}
            <button className="co-alert-close" onClick={() => setError('')} aria-label="Dismiss">&times;</button>
          </div>
        )}

        <Row className="g-4">
          {/* ─────── LEFT: form sections ─────── */}
          <Col lg={8}>

            {/* 1 ── Order Type ─────────────────── */}
            <section className="co-section">
              <h2 className="co-section-title">
                <span className="co-step-badge">1</span> Order Type
              </h2>
              <div className="co-type-grid">
                {ORDER_TYPES.map(({ value, label, icon: Icon, desc }) => (
                  <button
                    key={value}
                    type="button"
                    className={`co-type-card${orderType === value ? ' co-type-active' : ''}`}
                    onClick={() => setOrderType(value)}
                    aria-pressed={orderType === value}
                  >
                    <span className="co-type-icon"><Icon /></span>
                    <span className="co-type-label">{label}</span>
                    <span className="co-type-desc">{desc}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* 2 ── Pickup Time (take-out only) ── */}
            {orderType === 'take-out' && (
              <section className="co-section">
                <h2 className="co-section-title">
                  <span className="co-step-badge">2</span> Pickup Time
                </h2>
                <div className="co-pickup-grid">
                  {PICKUP_OPTIONS.map(({ value, label, desc }) => (
                    <button
                      key={value}
                      type="button"
                      className={`co-pickup-card${pickupTime === value ? ' co-pickup-active' : ''}`}
                      onClick={() => setPickupTime(value)}
                      aria-pressed={pickupTime === value}
                    >
                      <FaClock className="co-pickup-icon" />
                      <span className="co-pickup-label">{label}</span>
                      <span className="co-pickup-desc">{desc}</span>
                    </button>
                  ))}
                </div>
                <p className="co-hint"><FaInfoCircle className="me-1" /> Hours: Mon – Sun, 7 AM – 10 PM</p>
              </section>
            )}

            {/* 2/3 ── Delivery Address ────────── */}
            {orderType === 'delivery' && (
              <section className="co-section">
                <h2 className="co-section-title">
                  <span className="co-step-badge">2</span> Delivery Address
                </h2>
                {addresses.length === 0 ? (
                  <div className="co-empty-address">
                    <FaMapMarkerAlt className="co-empty-icon" />
                    <p>No saved addresses yet.</p>
                    <AddressSelector
                      addresses={addresses}
                      selectedAddressId={selectedAddressId}
                      setSelectedAddressId={setSelectedAddressId}
                      onAddAddress={handleAddAddress}
                    />
                  </div>
                ) : (
                  <>
                    <div className="co-address-list">
                      {addresses.map((addr) => (
                        <button
                          key={addr.id}
                          type="button"
                          className={`co-address-card${selectedAddressId === addr.id ? ' co-address-active' : ''}`}
                          onClick={() => setSelectedAddressId(addr.id)}
                          aria-pressed={selectedAddressId === addr.id}
                        >
                          <div className="co-address-icon-wrap">
                            <FaMapMarkerAlt />
                          </div>
                          <div className="co-address-info">
                            <span className="co-address-type">
                              {addr.type?.charAt(0).toUpperCase() + addr.type?.slice(1)}
                              {addr.is_default && <span className="co-badge-default">Default</span>}
                            </span>
                            <span className="co-address-text">
                              {addr.street}, {addr.city}, {addr.province} {addr.postal_code}
                            </span>
                          </div>
                          {selectedAddressId === addr.id && (
                            <FaCheckCircle className="co-address-check" />
                          )}
                        </button>
                      ))}
                    </div>
                    <AddressSelector
                      addresses={addresses}
                      selectedAddressId={selectedAddressId}
                      setSelectedAddressId={setSelectedAddressId}
                      onAddAddress={handleAddAddress}
                      triggerOnly
                    />
                  </>
                )}
              </section>
            )}

            {/* 3 ── Payment Method ────────────── */}
            <section className="co-section">
              <h2 className="co-section-title">
                <span className="co-step-badge">{orderType === 'dine-in' ? 2 : 3}</span> Payment Method
              </h2>
              <div className="co-pay-grid">
                {PAYMENT_METHODS.map(({ value, label, icon: Icon, desc }) => (
                  <button
                    key={value}
                    type="button"
                    className={`co-pay-card${paymentMethod === value ? ' co-pay-active' : ''}`}
                    onClick={() => setPaymentMethod(value)}
                    aria-pressed={paymentMethod === value}
                  >
                    <span className="co-pay-icon"><Icon /></span>
                    <span className="co-pay-label">{label}</span>
                    <span className="co-pay-desc">{desc}</span>
                  </button>
                ))}
              </div>
              {['gcash', 'maya'].includes(paymentMethod) && (
                <div className="co-pay-note">
                  <FaQrcode className="me-2" />
                  A QR code will be shown after placing the order for {paymentMethod === 'gcash' ? 'GCash' : 'Maya'} payment.
                </div>
              )}
            </section>

            {/* 4 ── Notes ─────────────────────── */}
            <section className="co-section">
              <h2 className="co-section-title">
                <span className="co-step-badge">{orderType === 'dine-in' ? 3 : 4}</span>
                Order Notes
                <span className="co-optional">(optional)</span>
              </h2>
              <div className="co-notes-wrap">
                <FaStickyNote className="co-notes-icon" />
                <Form.Control
                  as="textarea"
                  rows={3}
                  className="co-notes-input"
                  placeholder="Add any special instructions for your order…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={1000}
                />
              </div>
            </section>
          </Col>

          {/* ─────── RIGHT: order summary ─────── */}
          <Col lg={4}>
            <div className="co-summary-card">
              <h2 className="co-summary-title">Order Summary</h2>

              {/* Item list */}
              <div className="co-summary-items">
                {cart?.items?.map((item) => {
                  const price = parseFloat(item.unit_price ?? item.product?.price) || 0;
                  return (
                    <div key={item.id} className="co-summary-item">
                      <img
                        className="co-summary-img"
                        src={
                          item.product?.image_url
                            ? `${BACKEND_BASE_URL}${item.product.image_url}`
                            : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmMGYwZjAiLz48dGV4dCB4PSIzMCIgeT0iMzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuMzVlbSIgZmlsbD0iI2FhYSIgZm9udC1zaXplPSIxMCI+Q29mZmVlPC90ZXh0Pjwvc3ZnPg=='
                        }
                        alt={item.product?.name}
                        loading="lazy"
                      />
                      <div className="co-summary-item-info">
                        <span className="co-summary-item-name">{item.product?.name}</span>
                        <span className="co-summary-item-qty">
                          {item.quantity} &times; ₱{fmt(price)}
                        </span>
                      </div>
                      <span className="co-summary-item-total">₱{fmt(price * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="co-summary-rows">
                <div className="co-summary-row">
                  <span>Subtotal</span>
                  <span>₱{fmt(subtotal)}</span>
                </div>
                <div className="co-summary-row">
                  <span>Delivery Fee</span>
                  <span>{deliveryFee > 0 ? `₱${fmt(deliveryFee)}` : 'Free'}</span>
                </div>
              </div>

              <div className="co-summary-total">
                <span>Total</span>
                <span>₱{fmt(total)}</span>
              </div>

              {/* Place order */}
              <Button
                variant="primary"
                size="lg"
                className="w-100 co-place-btn"
                onClick={handlePlaceOrder}
                disabled={loading || !canOrder}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" /> Processing…
                  </>
                ) : (
                  <>
                    Place Order &middot; ₱{fmt(total)}
                  </>
                )}
              </Button>

              {!canOrder && orderType === 'delivery' && (
                <p className="co-summary-warn">Please select a delivery address to continue.</p>
              )}

              {/* Trust */}
              <div className="co-trust">
                <div className="co-trust-item">
                  <FaShieldAlt /> Secure Checkout
                </div>
                <div className="co-trust-item">
                  <FaCoffee /> Freshly Prepared
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* ─── Payment QR Modal ──────────────── */}
      <Modal show={showPaymentQR} onHide={() => setShowPaymentQR(false)} size="md" centered className="co-qr-modal">
        <Modal.Body className="text-center p-4 p-md-5">
          <div className="co-qr-success-icon">
            <FaCheckCircle />
          </div>
          <h3 className="co-qr-title">Order Placed!</h3>
          <p className="co-qr-subtitle">
            Complete your <strong>{paymentMethod === 'gcash' ? 'GCash' : 'Maya'}</strong> payment below.
          </p>

          <div className="co-qr-amount">₱{fmt(total)}</div>

          <div className="co-qr-box">
            <FaQrcode size={120} />
            <p>QR code will appear here in production</p>
          </div>

          <ol className="co-qr-steps">
            <li>Open your {paymentMethod === 'gcash' ? 'GCash' : 'Maya'} app</li>
            <li>Scan the QR code above</li>
            <li>Confirm the payment amount</li>
            <li>Tap <strong>"Payment Completed"</strong> below</li>
          </ol>

          <div className="d-flex gap-3 mt-4">
            <Button
              variant="outline-secondary"
              className="flex-grow-1"
              disabled={loading}
              onClick={async () => {
                // Cancel the created order so it doesn't stay orphaned
                if (createdOrderId) {
                  try {
                    setLoading(true);
                    await apiService.post(API_ENDPOINTS.ORDERS.CANCEL_REQUEST(createdOrderId));
                    toast.info('Order cancelled');
                  } catch (err) {
                    console.error('Failed to cancel order:', err);
                    toast.warning('Could not cancel order — please contact support');
                  } finally {
                    setLoading(false);
                  }
                }
                setShowPaymentQR(false);
                setCreatedOrderId(null);
              }}
            >
              Cancel Order
            </Button>
            <Button
              variant="primary"
              className="flex-grow-1"
              disabled={loading}
              onClick={async () => {
                try {
                  setLoading(true);
                  // Confirm payment on the created order
                  if (createdOrderId) {
                    await apiService.post(API_ENDPOINTS.ORDERS.CONFIRM(createdOrderId));
                  }
                  await clearCart();
                  setShowPaymentQR(false);
                  toast.success('Payment confirmed! Order placed successfully.');
                  navigate(createdOrderId ? `/orders/${createdOrderId}` : '/orders', {
                    state: { paymentCompleted: true },
                  });
                } catch (err) {
                  const msg = err.response?.data?.message || 'Payment confirmation failed';
                  toast.error(msg);
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? <Spinner animation="border" size="sm" /> : 'Payment Completed'}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </main>
  );
};

export default CheckoutPage;
