import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCashRegister, FaCoffee, FaShoppingCart, FaTrash, FaPlus, FaMinus,
  FaPause, FaPlay, FaReceipt, FaTimes, FaSearch, FaArrowLeft,
  FaMoneyBillWave, FaMobileAlt, FaCreditCard, FaBan, FaChartBar,
  FaPrint, FaDownload, FaPercent, FaHistory, FaExclamationTriangle,
  FaUser, FaStickyNote, FaCheckCircle,
} from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS, BACKEND_BASE_URL } from '../../config/api';
import './PosPage.css';

/* ─── helpers ─── */
const peso = (v) => `₱${Number(v || 0).toFixed(2)}`;
const FALLBACK_IMG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNmMGY0ZjEiLz48dGV4dCB4PSI2MCIgeT0iNjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuMzVlbSIgZmlsbD0iI2EwYjhhNiIgZm9udC1zaXplPSI0MCI+4pibPC90ZXh0Pjwvc3ZnPg==';

const PAYMENT_METHODS = [
  { key: 'cash',  Icon: FaMoneyBillWave, label: 'Cash' },
  { key: 'gcash', Icon: FaMobileAlt,     label: 'GCash' },
  { key: 'card',  Icon: FaCreditCard,    label: 'Card' },
];

const DISCOUNTS = [
  { key: 'senior',   label: 'Senior',   pct: 20 },
  { key: 'pwd',      label: 'PWD',      pct: 20 },
  { key: 'employee', label: 'Staff',    pct: 10 },
  { key: 'promo',    label: 'Promo',    pct:  5 },
];

const QUICK_TENDERS = [20, 50, 100, 200, 500, 1000];

export default function PosPage() {
  const navigate = useNavigate();

  /* ─── state ─── */
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('dine-in');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [flashId, setFlashId] = useState(null);

  // Payment modal
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');

  // Discount
  const [discountType, setDiscountType] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  // Receipt modal
  const [receipt, setReceipt] = useState(null);

  // Held orders panel
  const [showHeld, setShowHeld] = useState(false);
  const [heldOrders, setHeldOrders] = useState([]);

  // Summary panel
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState(null);

  // Transactions panel
  const [showTransactions, setShowTransactions] = useState(false);
  const [transactions, setTransactions] = useState([]);

  // Void modal
  const [showVoid, setShowVoid] = useState(false);
  const [voidTarget, setVoidTarget] = useState(null);
  const [voidReason, setVoidReason] = useState('');

  // Notes
  const [orderNotes, setOrderNotes] = useState('');

  const searchRef = useRef(null);

  /* ─── load products ─── */
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get(API_ENDPOINTS.BARISTA.POS.PRODUCTS);
      if (res.success) {
        setCategories(res.data);
        if (res.data.length > 0) setActiveCat(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load POS products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  /* ─── keyboard shortcut: focus search with / ─── */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  /* ─── derived ─── */
  const allProducts = categories.flatMap((c) => c.products.map((p) => ({ ...p, category_id: c.id, category_name: c.name })));
  const filteredProducts = search.trim()
    ? allProducts.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : allProducts.filter((p) => p.category_id === activeCat);

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmount = discountPercent > 0 ? Math.round(subtotal * (discountPercent / 100) * 100) / 100 : 0;
  const total = subtotal - discountAmount;
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  /* ─── cart actions ─── */
  const addToCart = (product) => {
    setFlashId(product.id);
    setTimeout(() => setFlashId(null), 350);
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product_id === product.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
        return copy;
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: 1,
        special_instructions: '',
      }];
    });
  };

  const updateQty = (productId, delta) => {
    setCart((prev) => prev.map((i) => {
      if (i.product_id !== productId) return i;
      const qty = i.quantity + delta;
      return qty > 0 ? { ...i, quantity: qty } : i;
    }).filter((i) => i.quantity > 0));
  };

  const removeFromCart = (productId) => setCart((prev) => prev.filter((i) => i.product_id !== productId));
  const clearCart = () => { setCart([]); setCustomerName(''); setOrderNotes(''); setDiscountType(''); setDiscountPercent(0); };

  /* ─── discount presets ─── */
  const applyDiscount = (type, pct) => {
    if (discountType === type) { setDiscountType(''); setDiscountPercent(0); return; }
    setDiscountType(type);
    setDiscountPercent(pct);
  };

  /* ─── submit order ─── */
  const submitOrder = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'cash' && Number(amountTendered) < total) return;

    try {
      setSubmitting(true);
      const res = await apiService.post(API_ENDPOINTS.BARISTA.POS.CREATE_ORDER, {
        items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity, special_instructions: i.special_instructions })),
        order_type: orderType,
        payment_method: paymentMethod,
        amount_tendered: paymentMethod === 'cash' ? Number(amountTendered) : total,
        reference_number: referenceNumber || undefined,
        customer_name: customerName || undefined,
        discount_type: discountType || undefined,
        discount_percent: discountPercent || undefined,
        notes: orderNotes || undefined,
      });

      if (res.success) {
        setReceipt(res.data);
        setShowPayment(false);
        clearCart();
        setAmountTendered('');
        setReferenceNumber('');
        setPaymentMethod('cash');
        // Reload products to refresh stock
        loadProducts();
      }
    } catch (err) {
      console.error('Order submission failed:', err);
      alert(err?.response?.data?.message || 'Failed to submit order');
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── hold order ─── */
  const holdCurrentOrder = async () => {
    if (cart.length === 0) return;
    try {
      setSubmitting(true);
      const res = await apiService.post(API_ENDPOINTS.BARISTA.POS.HOLD_ORDER, {
        items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity, special_instructions: i.special_instructions })),
        order_type: orderType,
        customer_name: customerName || undefined,
        notes: orderNotes || undefined,
      });
      if (res.success) {
        clearCart();
      }
    } catch (err) {
      console.error('Hold failed:', err);
      alert(err?.response?.data?.message || 'Failed to hold order');
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── held orders ─── */
  const loadHeldOrders = async () => {
    try {
      const res = await apiService.get(API_ENDPOINTS.BARISTA.POS.HELD_ORDERS);
      if (res.success) setHeldOrders(res.data);
    } catch (err) { console.error(err); }
  };

  const resumeHeld = async (id) => {
    try {
      const res = await apiService.post(API_ENDPOINTS.BARISTA.POS.RESUME_HELD(id));
      if (res.success) {
        const d = res.data;
        setCart(d.items.map((i) => ({
          product_id: i.product_id,
          name: i.product_name,
          price: i.price,
          image_url: i.image_url,
          quantity: i.quantity,
          special_instructions: i.special_instructions || '',
        })));
        setOrderType(d.order_type);
        setCustomerName(d.customer_name || '');
        setShowHeld(false);
        loadHeldOrders();
      }
    } catch (err) { console.error(err); }
  };

  /* ─── daily summary ─── */
  const loadSummary = async () => {
    try {
      const res = await apiService.get(API_ENDPOINTS.BARISTA.POS.DAILY_SUMMARY);
      if (res.success) setSummary(res.data);
    } catch (err) { console.error(err); }
  };

  /* ─── transactions ─── */
  const loadTransactions = async () => {
    try {
      const res = await apiService.get(API_ENDPOINTS.BARISTA.POS.RECENT_TRANSACTIONS);
      if (res.success) setTransactions(res.data);
    } catch (err) { console.error(err); }
  };

  /* ─── void ─── */
  const performVoid = async () => {
    if (!voidTarget || !voidReason) return;
    try {
      await apiService.post(API_ENDPOINTS.BARISTA.POS.VOID_ORDER(voidTarget.id), { reason: voidReason });
      setShowVoid(false);
      setVoidTarget(null);
      setVoidReason('');
      loadTransactions();
      loadSummary();
    } catch (err) {
      alert(err?.response?.data?.message || 'Void failed');
    }
  };

  /* ─── shared receipt HTML builder ─── */
  const buildReceiptHtml = () => {
    const el = document.getElementById('pos-receipt-print');
    if (!el) return null;
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt</title>
      <style>
        body{font-family:monospace;font-size:12px;width:280px;margin:0 auto;padding:10px;}
        .center{text-align:center;} .bold{font-weight:bold;}
        .line{border-top:1px dashed #000;margin:6px 0;}
        table{width:100%;border-collapse:collapse;} td{padding:2px 0;}
        .right{text-align:right;}
      </style></head><body>${el.innerHTML}</body></html>`;
  };

  /* ─── print receipt ─── */
  const printReceipt = () => {
    const html = buildReceiptHtml();
    if (!html) return;
    const w = window.open('', '_blank', 'width=320,height=600');
    w.document.write(html);
    w.document.close();
    w.print();
    w.close();
  };

  /* ─── download receipt ─── */
  const downloadReceipt = () => {
    const html = buildReceiptHtml();
    if (!html) return;
    const orderNum = receipt?.order?.order_number ?? 'receipt';
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${orderNum}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="pos-loading">
        <div className="pos-loading-inner">
          <FaCashRegister className="pos-loading-icon" />
          <span className="pos-loading-label">Loading POS Terminal…</span>
          <div className="pos-loading-bar"><div className="pos-loading-fill" /></div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════ RENDER ═══════════════════════════════════════════ */
  return (
    <div className="pos-root">

      {/* ══════════ HEADER ══════════ */}
      <header className="pos-header">
        <div className="pos-header-left">
          <button className="pos-back-btn" onClick={() => navigate('/barista/dashboard')} title="Back">
            <FaArrowLeft />
          </button>
          <div className="pos-brand">
            <FaCashRegister className="pos-brand-icon" />
            <div>
              <div className="pos-brand-name">POS Terminal</div>
              <div className="pos-brand-sub">Arbiter Coffee Shop</div>
            </div>
          </div>
        </div>

        <div className="pos-header-center">
          <div className="pos-search-wrap">
            <FaSearch className="pos-search-ico" />
            <input
              ref={searchRef}
              type="text"
              className="pos-search-input"
              placeholder="Search products… ( / )"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="pos-search-clear" onClick={() => setSearch('')}><FaTimes /></button>
            )}
          </div>
        </div>

        <div className="pos-header-right">
          <button className="pos-hdr-chip" onClick={() => { setShowHeld(true); loadHeldOrders(); }}>
            <FaPause /><span>Held</span>
            {heldOrders.length > 0 && <em className="pos-chip-badge">{heldOrders.length}</em>}
          </button>
          <button className="pos-hdr-chip" onClick={() => { setShowTransactions(true); loadTransactions(); }}>
            <FaHistory /><span>History</span>
          </button>
          <button className="pos-hdr-chip" onClick={() => { setShowSummary(true); loadSummary(); }}>
            <FaChartBar /><span>Summary</span>
          </button>
        </div>
      </header>

      {/* ══════════ BODY ══════════ */}
      <div className="pos-body">

        {/* ─── LEFT: Product catalogue ─── */}
        <div className="pos-catalogue">

          {/* Category pill tabs */}
          {!search && (
            <div className="pos-cat-bar">
              {categories.map((c) => (
                <button
                  key={c.id}
                  className={`pos-cat-pill ${activeCat === c.id ? 'active' : ''}`}
                  onClick={() => setActiveCat(c.id)}
                >
                  {c.name}
                  <span className="pos-cat-pill-count">{c.products.length}</span>
                </button>
              ))}
            </div>
          )}

          {search && (
            <div className="pos-search-result-bar">
              <FaSearch size={11} />
              {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''} for <strong>"{search}"</strong>
            </div>
          )}

          {/* Product grid */}
          <div className="pos-grid">
            {filteredProducts.length === 0 ? (
              <div className="pos-grid-empty">
                <FaCoffee size={36} />
                <p>No products found</p>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const inCart = cart.find((i) => i.product_id === p.id);
                return (
                  <button
                    key={p.id}
                    className={`pos-product-card ${flashId === p.id ? 'flash' : ''} ${inCart ? 'in-cart' : ''}`}
                    onClick={() => addToCart(p)}
                  >
                    <div className="pos-product-img-wrap">
                      <img
                        src={p.image_url ? `${BACKEND_BASE_URL}${p.image_url}` : FALLBACK_IMG}
                        alt={p.name}
                        className="pos-product-img"
                      />
                      {inCart && <span className="pos-in-cart-badge">{inCart.quantity}</span>}
                      {p.stock_quantity <= 5 && (
                        <span className="pos-low-stock-badge">{p.stock_quantity} left</span>
                      )}
                    </div>
                    <div className="pos-product-body">
                      <span className="pos-product-name">{p.name}</span>
                      <span className="pos-product-price">{peso(p.price)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ─── RIGHT: Order panel ─── */}
        <aside className="pos-order-panel">

          {/* Order type segmented control */}
          <div className="pos-panel-section pos-order-type-wrap">
            <div className="pos-segment">
              <button
                className={`pos-seg-btn ${orderType === 'dine-in' ? 'active' : ''}`}
                onClick={() => setOrderType('dine-in')}
              >Dine In</button>
              <button
                className={`pos-seg-btn ${orderType === 'take-out' ? 'active' : ''}`}
                onClick={() => setOrderType('take-out')}
              >Take Out</button>
            </div>
          </div>

          {/* Customer & notes */}
          <div className="pos-panel-section pos-fields-wrap">
            <div className="pos-field-row">
              <FaUser className="pos-field-ico" />
              <input
                type="text"
                className="pos-field-input"
                placeholder="Customer name (optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="pos-field-row">
              <FaStickyNote className="pos-field-ico" />
              <input
                type="text"
                className="pos-field-input"
                placeholder="Order notes (optional)"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Cart items */}
          <div className="pos-cart-scroll">
            {cart.length === 0 ? (
              <div className="pos-cart-placeholder">
                <FaShoppingCart className="pos-cart-placeholder-ico" />
                <p>Your cart is empty</p>
                <small>Tap any product to add it here</small>
              </div>
            ) : (
              <div className="pos-cart-list">
                {cart.map((item) => (
                  <div key={item.product_id} className="pos-cart-row">
                    <div className="pos-cart-row-thumb">
                      <img
                        src={item.image_url ? `${BACKEND_BASE_URL}${item.image_url}` : FALLBACK_IMG}
                        alt={item.name}
                        loading="lazy"
                      />
                    </div>
                    <div className="pos-cart-row-info">
                      <span className="pos-cart-row-name">{item.name}</span>
                      <span className="pos-cart-row-unit">{peso(item.price)} each</span>
                    </div>
                    <div className="pos-cart-row-ctrl">
                      <button className="pos-qty-btn" onClick={() => updateQty(item.product_id, -1)}><FaMinus /></button>
                      <span className="pos-qty-val">{item.quantity}</span>
                      <button className="pos-qty-btn" onClick={() => updateQty(item.product_id, 1)}><FaPlus /></button>
                    </div>
                    <div className="pos-cart-row-right">
                      <span className="pos-cart-row-total">{peso(item.price * item.quantity)}</span>
                      <button className="pos-remove-btn" onClick={() => removeFromCart(item.product_id)}><FaTrash /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Discount chips */}
          {cart.length > 0 && (
            <div className="pos-panel-section pos-discount-wrap">
              <div className="pos-discount-label"><FaPercent size={10} /> Discount</div>
              <div className="pos-discount-chips">
                {DISCOUNTS.map((d) => (
                  <button
                    key={d.key}
                    className={`pos-disc-chip ${discountType === d.key ? 'active' : ''}`}
                    onClick={() => applyDiscount(d.key, d.pct)}
                  >
                    {d.label} <strong>{d.pct}%</strong>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="pos-totals-section">
            <div className="pos-totals-row">
              <span>Subtotal ({cartCount} items)</span>
              <span>{peso(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="pos-totals-row discount">
                <span>{DISCOUNTS.find((d) => d.key === discountType)?.label} {discountPercent}% off</span>
                <span>−{peso(discountAmount)}</span>
              </div>
            )}
            <div className="pos-totals-divider" />
            <div className="pos-totals-row grand">
              <span>Total</span>
              <span>{peso(total)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="pos-actions-bar">
            <button
              className="pos-act-btn secondary"
              onClick={holdCurrentOrder}
              disabled={cart.length === 0 || submitting}
              title="Hold order"
            >
              <FaPause /> Hold
            </button>
            <button
              className="pos-act-btn ghost"
              onClick={clearCart}
              disabled={cart.length === 0}
              title="Clear cart"
            >
              <FaTrash />
            </button>
            <button
              className="pos-act-btn primary"
              onClick={() => { setShowPayment(true); setAmountTendered(''); setReferenceNumber(''); }}
              disabled={cart.length === 0}
            >
              <FaMoneyBillWave />
              {cart.length === 0 ? 'Charge' : `Charge ${peso(total)}`}
            </button>
          </div>
        </aside>
      </div>

      {/* ══════════════════════════════════
           MODALS
      ══════════════════════════════════ */}

      {/* ─ PAYMENT MODAL ─ */}
      {showPayment && (
        <div className="pos-overlay" onClick={() => setShowPayment(false)}>
          <div className="pos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pos-modal-head">
              <div className="pos-modal-title"><FaCashRegister /> Collect Payment</div>
              <button className="pos-modal-x" onClick={() => setShowPayment(false)}><FaTimes /></button>
            </div>
            <div className="pos-modal-body">
              {/* Amount due card */}
              <div className="pos-pay-due-card">
                <span className="pos-pay-due-label">Amount Due</span>
                <span className="pos-pay-due-amount">{peso(total)}</span>
                {discountAmount > 0 && (
                  <span className="pos-pay-due-note">
                    Includes {DISCOUNTS.find((d) => d.key === discountType)?.label} discount of {peso(discountAmount)}
                  </span>
                )}
              </div>

              {/* Method buttons */}
              <div className="pos-pay-method-row">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.key}
                    className={`pos-pay-method-btn ${paymentMethod === m.key ? 'active' : ''}`}
                    onClick={() => setPaymentMethod(m.key)}
                  >
                    <m.Icon className="pos-pay-method-ico" />
                    <span>{m.label}</span>
                    {paymentMethod === m.key && <FaCheckCircle className="pos-pay-method-check" />}
                  </button>
                ))}
              </div>

              {/* Cash */}
              {paymentMethod === 'cash' && (
                <div className="pos-pay-cash-section">
                  <label className="pos-pay-field-label">Cash Tendered</label>
                  <input
                    type="number"
                    className="pos-pay-field"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    placeholder="Enter amount"
                    autoFocus
                    min={0}
                    step={0.01}
                  />
                  <div className="pos-tender-grid">
                    {QUICK_TENDERS.map((v) => (
                      <button
                        key={v}
                        className={`pos-tender-btn ${Number(amountTendered) === v ? 'active' : ''}`}
                        onClick={() => setAmountTendered(String(v))}
                      >₱{v}</button>
                    ))}
                    <button
                      className={`pos-tender-btn exact ${Number(amountTendered) === total ? 'active' : ''}`}
                      onClick={() => setAmountTendered(String(total))}
                    >Exact</button>
                  </div>
                  {amountTendered !== '' && Number(amountTendered) >= total && (
                    <div className="pos-change-display">
                      <span className="pos-change-label">Change</span>
                      <span className="pos-change-amount">{peso(Number(amountTendered) - total)}</span>
                    </div>
                  )}
                  {amountTendered !== '' && Number(amountTendered) < total && (
                    <div className="pos-validation-msg">
                      <FaExclamationTriangle /> Amount is ₱{(total - Number(amountTendered)).toFixed(2)} short
                    </div>
                  )}
                </div>
              )}

              {/* Digital */}
              {paymentMethod !== 'cash' && (
                <div className="pos-pay-digital-section">
                  <label className="pos-pay-field-label">Reference / Transaction Number</label>
                  <input
                    type="text"
                    className="pos-pay-field"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g. 1234567890"
                    autoFocus
                  />
                </div>
              )}
            </div>
            <div className="pos-modal-foot">
              <button className="pos-foot-btn ghost" onClick={() => setShowPayment(false)}>Cancel</button>
              <button
                className="pos-foot-btn primary"
                onClick={submitOrder}
                disabled={submitting || (paymentMethod === 'cash' && Number(amountTendered) < total)}
              >
                {submitting
                  ? <><span className="pos-spinner" /> Processing…</>
                  : <><FaCheckCircle /> Complete {peso(total)}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─ RECEIPT MODAL ─ */}
      {receipt && (
        <div className="pos-overlay" onClick={() => setReceipt(null)}>
          <div className="pos-modal receipt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pos-modal-head">
              <div className="pos-modal-title"><FaReceipt /> Receipt</div>
              <button className="pos-modal-x" onClick={() => setReceipt(null)}><FaTimes /></button>
            </div>
            <div className="pos-modal-body">
              <div id="pos-receipt-print" className="pos-receipt-paper">
                <div className="prec-header center">
                  <div className="prec-shop-name bold">ARBITER COFFEE SHOP</div>
                  <div className="prec-meta">Order: {receipt.order.order_number}</div>
                  <div className="prec-meta">{receipt.order.created_at}</div>
                  <div className="prec-meta">Barista: {receipt.order.barista_name}</div>
                  {receipt.order.customer_name && <div className="prec-meta">Customer: {receipt.order.customer_name}</div>}
                  <div className="prec-meta">Type: {receipt.order.order_type}</div>
                </div>
                <div className="line" />
                <table>
                  <thead>
                    <tr>
                      <td className="bold">Item</td>
                      <td className="right bold">Qty</td>
                      <td className="right bold">Amount</td>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.order.items.map((it, idx) => (
                      <tr key={idx}>
                        <td>{it.product_name}</td>
                        <td className="right">{it.quantity}</td>
                        <td className="right">{peso(it.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="line" />
                <div className="pos-receipt-totals">
                  <div><span>Subtotal:</span><span>{peso(receipt.order.subtotal)}</span></div>
                  {receipt.order.discount_amount > 0 && (
                    <div><span>Discount:</span><span>−{peso(receipt.order.discount_amount)}</span></div>
                  )}
                  <div className="bold"><span>TOTAL:</span><span>{peso(receipt.order.total_amount)}</span></div>
                  <div className="line" />
                  <div><span>Payment:</span><span>{receipt.payment.method.toUpperCase()}</span></div>
                  {receipt.payment.method === 'cash' && (
                    <>
                      <div><span>Tendered:</span><span>{peso(receipt.payment.amount_tendered)}</span></div>
                      <div className="bold"><span>Change:</span><span>{peso(receipt.payment.change)}</span></div>
                    </>
                  )}
                  {receipt.payment.method !== 'cash' && receipt.payment.reference && (
                    <div><span>Ref#:</span><span>{receipt.payment.reference}</span></div>
                  )}
                </div>
                <div className="line" />
                <div className="center">Thank you! Please visit us again.</div>
                <div className="center" style={{ marginTop: 4, fontSize: 11 }}>— www.arbitercoffee.com —</div>
              </div>
            </div>
            <div className="pos-modal-foot">
              <button className="pos-foot-btn ghost" onClick={() => setReceipt(null)}>Close</button>
              <button className="pos-foot-btn secondary" onClick={downloadReceipt}><FaDownload /> Download</button>
              <button className="pos-foot-btn primary" onClick={printReceipt}><FaPrint /> Print</button>
            </div>
          </div>
        </div>
      )}

      {/* ─ HELD ORDERS ─ */}
      {showHeld && (
        <div className="pos-overlay" onClick={() => setShowHeld(false)}>
          <div className="pos-modal side-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pos-modal-head">
              <div className="pos-modal-title"><FaPause /> Held Orders</div>
              <button className="pos-modal-x" onClick={() => setShowHeld(false)}><FaTimes /></button>
            </div>
            <div className="pos-modal-body">
              {heldOrders.length === 0 ? (
                <div className="pos-empty-state"><FaPause size={28} /><p>No held orders today</p></div>
              ) : (
                <div className="pos-held-list">
                  {heldOrders.map((ho) => (
                    <div key={ho.id} className="pos-held-card">
                      <div className="pos-held-card-info">
                        <div className="pos-held-order-num">{ho.order_number}</div>
                        {ho.customer_name && <div className="pos-held-customer">{ho.customer_name}</div>}
                        <div className="pos-held-meta">
                          {ho.items.length} item{ho.items.length !== 1 ? 's' : ''} · {peso(ho.total_amount)}
                        </div>
                        <div className="pos-held-time">{ho.created_at}</div>
                      </div>
                      <button className="pos-foot-btn primary small" onClick={() => resumeHeld(ho.id)}>
                        <FaPlay /> Resume
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─ DAILY SUMMARY ─ */}
      {showSummary && (
        <div className="pos-overlay" onClick={() => setShowSummary(false)}>
          <div className="pos-modal wide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pos-modal-head">
              <div className="pos-modal-title"><FaChartBar /> Today's Summary</div>
              <button className="pos-modal-x" onClick={() => setShowSummary(false)}><FaTimes /></button>
            </div>
            <div className="pos-modal-body">
              {summary ? (
                <>
                  <div className="pos-stat-grid">
                    {[
                      { label: 'Total Orders', val: summary.total_orders,       accent: false },
                      { label: 'Total Sales',  val: peso(summary.total_sales),  accent: true  },
                      { label: 'My Orders',    val: summary.my_orders,          accent: false },
                      { label: 'My Sales',     val: peso(summary.my_sales),     accent: true  },
                      { label: 'Avg Order',    val: peso(summary.average_order), accent: false },
                      { label: 'Held',         val: summary.held_orders,        accent: false },
                      { label: 'Voided',       val: summary.voided_orders,      accent: false },
                    ].map((s) => (
                      <div key={s.label} className={`pos-stat-card ${s.accent ? 'accent' : ''}`}>
                        <div className="pos-stat-val">{s.val}</div>
                        <div className="pos-stat-lbl">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {summary.payment_breakdown?.length > 0 && (
                    <div className="pos-breakdown-block">
                      <div className="pos-breakdown-title">Payment Breakdown</div>
                      {summary.payment_breakdown.map((pb) => (
                        <div key={pb.method} className="pos-breakdown-row">
                          <span className="pos-breakdown-method">{pb.method.toUpperCase()}</span>
                          <span>{pb.count} order{pb.count !== 1 ? 's' : ''}</span>
                          <span className="pos-breakdown-total">{peso(pb.total)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="pos-empty-state"><span className="pos-spinner large" /></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─ TRANSACTIONS ─ */}
      {showTransactions && (
        <div className="pos-overlay" onClick={() => setShowTransactions(false)}>
          <div className="pos-modal wide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pos-modal-head">
              <div className="pos-modal-title"><FaHistory /> Today's Transactions</div>
              <button className="pos-modal-x" onClick={() => setShowTransactions(false)}><FaTimes /></button>
            </div>
            <div className="pos-modal-body">
              {transactions.length === 0 ? (
                <div className="pos-empty-state"><FaHistory size={28} /><p>No transactions yet today</p></div>
              ) : (
                <div className="pos-txn-list">
                  {transactions.map((tx) => (
                    <div key={tx.id} className={`pos-txn-row ${tx.status === 'cancelled' ? 'voided' : ''}`}>
                      <div className="pos-txn-left">
                        <div className="pos-txn-num">{tx.order_number}</div>
                        <div className="pos-txn-meta">
                          {tx.item_count} item{tx.item_count !== 1 ? 's' : ''} · {tx.payment_method.toUpperCase()}
                        </div>
                        <div className="pos-txn-time">{tx.created_at}</div>
                      </div>
                      <div className="pos-txn-right">
                        <span className="pos-txn-amount">{peso(tx.total_amount)}</span>
                        {tx.status === 'cancelled' ? (
                          <span className="pos-voided-badge">VOIDED</span>
                        ) : (
                          <button
                            className="pos-void-btn"
                            onClick={() => { setVoidTarget(tx); setShowVoid(true); setVoidReason(''); }}
                          >
                            <FaBan /> Void
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─ VOID CONFIRM ─ */}
      {showVoid && voidTarget && (
        <div className="pos-overlay" onClick={() => setShowVoid(false)}>
          <div className="pos-modal narrow-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pos-modal-head danger">
              <div className="pos-modal-title"><FaBan /> Void Order</div>
              <button className="pos-modal-x" onClick={() => setShowVoid(false)}><FaTimes /></button>
            </div>
            <div className="pos-modal-body">
              <div className="pos-void-info">
                Void <strong>{voidTarget.order_number}</strong> for <strong>{peso(voidTarget.total_amount)}</strong>?
                This will restore stock and mark the payment as refunded.
              </div>
              <label className="pos-pay-field-label">Reason for voiding</label>
              <textarea
                className="pos-pay-field"
                rows={3}
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Enter reason…"
                autoFocus
              />
            </div>
            <div className="pos-modal-foot">
              <button className="pos-foot-btn ghost" onClick={() => setShowVoid(false)}>Cancel</button>
              <button
                className="pos-foot-btn danger"
                onClick={performVoid}
                disabled={!voidReason.trim()}
              >
                <FaBan /> Confirm Void
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
