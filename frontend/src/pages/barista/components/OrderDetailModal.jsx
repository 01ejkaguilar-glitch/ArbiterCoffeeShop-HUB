import React, { useEffect } from 'react';

const OrderDetailModal = ({ show, onHide, order }) => {
  // Close on Escape key
  useEffect(() => {
    if (!show) return;
    const handleKey = (e) => { if (e.key === 'Escape') onHide(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [show, onHide]);

  if (!show || !order) return null;

  const statusLabel = order.status
    ? order.status.charAt(0).toUpperCase() + order.status.slice(1)
    : 'Unknown';

  return (
    <div className="oq-overlay" onClick={(e) => { if (e.target === e.currentTarget) onHide(); }}>
      <div className="oq-dialog" role="dialog" aria-modal="true" aria-labelledby="oq-dlg-title">
        <div className="oq-dialog-head">
          <h2 className="oq-dialog-title" id="oq-dlg-title">
            Order #{order.order_number}
          </h2>
          <button className="oq-dialog-close" onClick={onHide} aria-label="Close">✕</button>
        </div>

        <div className="oq-dialog-body">
          <div className="oq-dialog-grid">
            <div className="oq-dialog-field">
              <label>Customer</label>
              <span>{order.user?.name || 'Walk-in'}</span>
            </div>
            <div className="oq-dialog-field">
              <label>Status</label>
              <span className={`oq-status-chip ${order.status}`}>{statusLabel}</span>
            </div>
            <div className="oq-dialog-field">
              <label>Order Time</label>
              <span>{new Date(order.created_at).toLocaleString()}</span>
            </div>
            <div className="oq-dialog-field">
              <label>Total</label>
              <span>₱{parseFloat(order.total_amount || 0).toFixed(2)}</span>
            </div>
          </div>

          <p className="oq-dialog-section-title">Items</p>
          <div>
            {(order.orderItems || []).map(item => (
              <div key={item.id} className="oq-dialog-item-row">
                <span className="oq-dialog-qty">{item.quantity}×</span>
                <span className="oq-dialog-item-name">{item.product?.name || 'Unknown Item'}</span>
                {item.special_instructions && (
                  <span style={{ fontSize: '.72rem', color: '#9B6B00', fontStyle: 'italic' }}>
                    ({item.special_instructions})
                  </span>
                )}
                <span className="oq-dialog-item-price">
                  ₱{parseFloat(item.subtotal || (item.price * item.quantity) || 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <p className="oq-dialog-total">Total: ₱{parseFloat(order.total_amount || 0).toFixed(2)}</p>

          {order.notes && (
            <>
              <p className="oq-dialog-section-title">Order Notes</p>
              <p className="oq-notes">{order.notes}</p>
            </>
          )}
        </div>

        <div className="oq-dialog-footer">
          <button className="oq-btn cancel" onClick={onHide}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;

