import React from 'react';
import { Badge } from 'react-bootstrap';
import { FaWifi, FaExclamationTriangle, FaBell } from 'react-icons/fa';

/**
 * Reusable real-time connection status indicator.
 * Shows Live/Offline status with optional pending count.
 *
 * @param {Object} props
 * @param {boolean} props.isConnected - Whether the real-time connection is active
 * @param {number} [props.pendingCount] - Number of pending items to display
 * @param {string} [props.pendingLabel='new orders'] - Label for pending badge
 */
function ConnectionStatus({ isConnected, pendingCount = 0, pendingLabel = 'new orders' }) {
  return (
    <div className="d-flex align-items-center gap-3">
      <div className="d-flex align-items-center">
        {isConnected ? (
          <FaWifi className="text-success me-2" aria-hidden="true" />
        ) : (
          <FaExclamationTriangle className="text-warning me-2" aria-hidden="true" />
        )}
        <small className={isConnected ? 'text-success' : 'text-warning'}>
          {isConnected ? 'Live' : 'Offline'}
        </small>
      </div>

      {pendingCount > 0 && (
        <div className="d-flex align-items-center">
          <FaBell className="text-warning me-2" aria-hidden="true" />
          <Badge bg="warning">{pendingCount} {pendingLabel}</Badge>
        </div>
      )}
    </div>
  );
}

export default ConnectionStatus;
