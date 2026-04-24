import React from 'react';
import { FaClock, FaEye, FaUtensils, FaThumbsUp, FaCheckCircle, FaTimes } from 'react-icons/fa';

const STATUS_ACTIONS = {
  pending: [
    { label: 'Confirm', status: 'confirmed', icon: FaThumbsUp, className: 'confirm' },
    { label: 'Prep', status: 'preparing', icon: FaUtensils, className: 'prepare' },
  ],
  confirmed: [
    { label: 'Prep', status: 'preparing', icon: FaUtensils, className: 'prepare' },
  ],
  preparing: [
    { label: 'Ready', status: 'ready', icon: FaCheckCircle, className: 'ready' },
  ],
  ready: [
    { label: 'Complete', status: 'completed', icon: FaCheckCircle, className: 'complete' },
  ],
};

const formatStatusLabel = (value) => String(value || 'pending').replaceAll('_', ' ');

const OrderCard = ({
  order,
  timer,
  updatingOrder,
  onUpdateStatus,
  onViewDetail,
  formatElapsedTime,
}) => {
  const actions = STATUS_ACTIONS[order?.status] || [];
  const items = order?.order_items || order?.items || [];
  const total = order?.total_amount ?? order?.total ?? null;

  return (
    <article className={`oq-card ${order?.status || 'pending'}`}>
      <div className="oq-card-head">
        <div className="oq-card-id">
          <span className="oq-order-num">#{order?.order_number || order?.id}</span>
          <span className="oq-label">{formatStatusLabel(order?.status)}</span>
        </div>
        <span className="oq-order-time">
          {order?.order_type ? formatStatusLabel(order.order_type) : 'dine in'}
        </span>
      </div>

      <div className="oq-card-body">
        <div className="oq-customer">
          {order?.user?.name || order?.customer_name || 'Guest'}
        </div>

        <div className="oq-items">
          {items.map((item, index) => (
            <div key={`${item?.id || index}`} className="oq-item-row">
              <span className="oq-item-qty">{item?.quantity ?? 1}×</span>
              <span className="oq-item-name">{item?.product?.name || item?.product_name || item?.name || 'Item'}</span>
              {item?.price != null && <span className="oq-item-price">${Number(item.price).toFixed(2)}</span>}
            </div>
          ))}
        </div>

        {order?.notes && <div className="oq-notes">{order.notes}</div>}

        {timer && order?.status === 'preparing' && (
          <div className={`oq-timer-badge ${timer.elapsed >= 15 * 60 * 1000 ? 'urgent' : ''}`}>
            <FaClock /> {formatElapsedTime(timer.elapsed)}
          </div>
        )}
      </div>

      <div className="oq-card-footer">
        {total != null && (
          <div className="oq-total">
            <span className="oq-total-label">Total</span>
            <span>${Number(total).toFixed(2)}</span>
          </div>
        )}

        <div className="oq-actions">
          <button type="button" className="oq-btn oq-btn-icon" onClick={() => onViewDetail?.(order)} aria-label="View order details">
            <FaEye />
          </button>

          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.status}
                type="button"
                className={`oq-btn ${action.className}`}
                disabled={updatingOrder === order?.id}
                onClick={() => onUpdateStatus?.(order?.id, action.status)}
              >
                {updatingOrder === order?.id ? <span className="oq-btn-spinner" /> : <Icon />}
                {action.label}
              </button>
            );
          })}

          <button
            type="button"
            className="oq-btn oq-btn-icon"
            onClick={() => onUpdateStatus?.(order?.id, 'cancelled')}
            aria-label="Cancel order"
            disabled={updatingOrder === order?.id}
          >
            <FaTimes />
          </button>
        </div>
      </div>
    </article>
  );
};

export default OrderCard;