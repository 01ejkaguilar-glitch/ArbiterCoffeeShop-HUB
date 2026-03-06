import React from 'react';
import { Modal } from 'react-bootstrap';
import { FaTimes, FaTag, FaBoxes, FaToggleOn } from 'react-icons/fa';
import '../AdminProducts.css';

const ACTIONS = [
  { key: 'price',     label: 'Update Price',    icon: <FaTag />,      emoji: '₱' },
  { key: 'stock',     label: 'Update Stock',    icon: <FaBoxes />,    emoji: '📦' },
  { key: 'available', label: 'Set Availability', icon: <FaToggleOn />, emoji: '🔄' },
];

const BatchActionModal = ({
  show,
  onHide,
  selectedCount,
  batchAction,
  setBatchAction,
  batchValue,
  setBatchValue,
  onApply,
}) => {
  const canApply = batchAction && batchValue !== '';

  return (
    <Modal show={show} onHide={onHide} className="ap-batch-modal" centered>
      {/* Header */}
      <div className="ap-modal-header">
        <h5 className="ap-modal-title">
          Batch Edit
          <span style={{ fontWeight: 400, color: '#6b7280', fontSize: '.9rem' }}>
            — {selectedCount} product{selectedCount !== 1 ? 's' : ''} selected
          </span>
        </h5>
        <button className="ap-modal-close" onClick={onHide} aria-label="Close">
          <FaTimes size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="ap-modal-body">
        {/* Action selector tiles */}
        <p style={{ fontSize: '.8rem', color: '#6b7280', marginBottom: '.75rem' }}>
          Choose which field to update across all selected products:
        </p>
        <div className="ap-batch-action-grid">
          {ACTIONS.map(action => (
            <div
              key={action.key}
              className={`ap-batch-action-tile ${batchAction === action.key ? 'active' : ''}`}
              onClick={() => { setBatchAction(action.key); setBatchValue(''); }}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setBatchAction(action.key)}
              aria-pressed={batchAction === action.key}
            >
              <div className="ap-batch-action-tile-icon">{action.emoji}</div>
              <div className="ap-batch-action-tile-label">{action.label}</div>
            </div>
          ))}
        </div>

        {/* Value input */}
        {batchAction === 'price' && (
          <div className="ap-form-group">
            <label className="ap-form-label" htmlFor="ba-price">
              New Price (₱) <span className="req">*</span>
            </label>
            <input
              id="ba-price"
              className="ap-form-input"
              type="number"
              step="0.01"
              min="0"
              value={batchValue}
              onChange={e => setBatchValue(e.target.value)}
              placeholder="e.g. 150.00"
              autoFocus
            />
          </div>
        )}

        {batchAction === 'stock' && (
          <div className="ap-form-group">
            <label className="ap-form-label" htmlFor="ba-stock">
              New Stock Quantity <span className="req">*</span>
            </label>
            <input
              id="ba-stock"
              className="ap-form-input"
              type="number"
              min="0"
              value={batchValue}
              onChange={e => setBatchValue(e.target.value)}
              placeholder="e.g. 50"
              autoFocus
            />
          </div>
        )}

        {batchAction === 'available' && (
          <div className="ap-form-group">
            <label className="ap-form-label" htmlFor="ba-avail">
              Availability Status <span className="req">*</span>
            </label>
            <select
              id="ba-avail"
              className="ap-form-select"
              value={batchValue}
              onChange={e => setBatchValue(e.target.value)}
            >
              <option value="">Select status…</option>
              <option value="true">✅ Available</option>
              <option value="false">🚫 Unavailable</option>
            </select>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="ap-modal-footer">
        <button type="button" className="ap-cancel-btn" onClick={onHide}>
          Cancel
        </button>
        <button
          type="button"
          className="ap-apply-btn"
          onClick={onApply}
          disabled={!canApply}
        >
          Apply to {selectedCount} Product{selectedCount !== 1 ? 's' : ''}
        </button>
      </div>
    </Modal>
  );
};

export default BatchActionModal;
