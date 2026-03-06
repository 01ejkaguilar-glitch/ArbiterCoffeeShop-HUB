import React from 'react';
import {
  FaClock, FaThumbsUp, FaPlay, FaCheckCircle,
  FaBan, FaEye, FaSpinner,
} from 'react-icons/fa';

const URGENT_MS = 15 * 60 * 1000; // 15 minutes

const OrderCard = ({
  order,
  timer,
  updatingOrder,
  onUpdateStatus,
  onViewDetail,
  formatElapsedTime,
}) => {
  const isUpdating = updatingOrder === order.id;
  const elapsed    = timer?.elapsed ?? 0;
  const elapsedStr = formatElapsedTime ? formatElapsedTime(elapsed) : '0:00';
  const isUrgent   = order.status === 'preparing' && elapsed >= URGENT_MS;

  const btn = (label, icon, statusClass, newStatus) => (
    <button
      className={`oq-btn ${statusClass}`}
      onClick={() => onUpdateStatus(order.id, newStatus)}
      disabled={isUpdating}
    >
      {isUpdating ? <FaSpinner className="oq-spin" /> : icon}
      {label}
    </button>
  );

  return (
    <div className={`oq-card ${order.status}`}>
      {/* Header */}
      <div className="oq-card-head">
        <div className="oq-card-id">
          <span className="oq-order-num">#{order.order_number}</span>
          <span className="oq-order-time">
            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        {order.status === 'preparing' && (
          <span className={`oq-timer-badge${isUrgent ? ' urgent' : ''}`}>
            <FaClock />
            {elapsedStr}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="oq-card-body">
        <p className="oq-customer">
          <span className="oq-label">Customer</span>
          {order.user?.name || 'Walk-in'}
        </p>

        <div className="oq-items">
          {(order.orderItems || []).map(item => (
            <div key={item.id} className="oq-item-row">
              <span className="oq-item-qty">{item.quantity}×</span>
              <span className="oq-item-name">{item.product?.name || 'Unknown Item'}</span>
              <span className="oq-item-price">₱{parseFloat(item.subtotal || 0).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {order.notes && (
          <p className="oq-notes">{order.notes}</p>
        )}
      </div>

      {/* Footer */}
      <div className="oq-card-footer">
        <span className="oq-total">₱{parseFloat(order.total_amount || 0).toFixed(2)}</span>

        <div className="oq-actions">
          {onViewDetail && (
            <button
              className="oq-btn oq-btn-icon"
              onClick={() => onViewDetail(order)}
              title="View details"
            >
              <FaEye />
            </button>
          )}

          {order.status === 'pending' && (
            <>
              {btn('Confirm',  <FaThumbsUp />, 'confirm',  'confirmed')}
              {btn('Prepare',  <FaPlay />,     'prepare',  'preparing')}
              {btn('Cancel',   <FaBan />,      'cancel',   'cancelled')}
            </>
          )}

          {order.status === 'confirmed' && (
            <>
              {btn('Start Preparing', <FaPlay />, 'prepare', 'preparing')}
              {btn('Cancel',          <FaBan />,  'cancel',  'cancelled')}
            </>
          )}

          {order.status === 'preparing' && (
            <>
              {btn('Mark Ready', <FaCheckCircle />, 'ready',  'ready')}
              {btn('Cancel',     <FaBan />,         'cancel', 'cancelled')}
            </>
          )}

          {order.status === 'ready' && (
            <>
              {btn('Complete', <FaCheckCircle />, 'complete', 'completed')}
              {btn('Cancel',   <FaBan />,         'cancel',   'cancelled')}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
