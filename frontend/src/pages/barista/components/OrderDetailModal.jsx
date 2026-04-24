import React from 'react';
import { FaTimes } from 'react-icons/fa';

const formatStatusLabel = (value) => String(value || 'pending').replaceAll('_', ' ');

const OrderDetailModal = ({ show, onHide, order }) => {
  if (!show || !order) {
    return null;
  }

  const items = order.order_items || order.items || [];
  const total = order.total_amount ?? order.total ?? null;

  return (
    <div className="oq-overlay" role="dialog" aria-modal="true" aria-label="Order details">
      <div className="oq-dialog">
        <div className="oq-dialog-head">
          <h2 className="oq-dialog-title">Order #{order.order_number || order.id}</h2>
          <button type="button" className="oq-dialog-close" onClick={onHide} aria-label="Close order details">
            <FaTimes />
          </button>
        </div>

        <div className="oq-dialog-body">
          <div className="oq-dialog-grid">
            <div className="oq-dialog-field">
              <label>Status</label>
              <span className={`oq-status-chip ${order.status || 'pending'}`}>{formatStatusLabel(order.status)}</span>
            </div>
            <div className="oq-dialog-field">
              <label>Customer</label>
              <span>{order.user?.name || order.customer_name || 'Guest'}</span>
            </div>
            <div className="oq-dialog-field">
              <label>Type</label>
              <span>{formatStatusLabel(order.order_type || 'dine_in')}</span>
            </div>
            <div className="oq-dialog-field">
              <label>Placed</label>
              <span>{order.created_at ? new Date(order.created_at).toLocaleString() : 'Unknown'}</span>
            </div>
          </div>

          {order.notes && (
            <div className="oq-card-notes">
              {order.notes}
            </div>
          )}

          <div className="oq-dialog-section-title">Items</div>
          <div>
            {items.map((item, index) => (
              <div key={`${item?.id || index}`} className="oq-dialog-item-row">
                <span className="oq-dialog-qty">{item?.quantity ?? 1}×</span>
                <span className="oq-dialog-item-name">{item?.product?.name || item?.product_name || item?.name || 'Item'}</span>
                {item?.price != null && <span className="oq-dialog-item-price">${Number(item.price).toFixed(2)}</span>}
              </div>
            ))}
          </div>

          {total != null && (
            <div className="oq-dialog-total">Total: ${Number(total).toFixed(2)}</div>
          )}
        </div>

        <div className="oq-dialog-footer">
          <button type="button" className="oq-btn cancel" onClick={onHide}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;