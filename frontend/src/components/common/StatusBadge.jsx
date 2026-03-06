import React from 'react';
import Badge from 'react-bootstrap/Badge';
import { getStatusConfig } from '../../constants/statusConfig';

/**
 * Unified status badge component.
 * Replaces all inline getStatusBadge functions across the app.
 *
 * @param {Object} props
 * @param {'order'|'leave'|'attendance'|'shift'|'shiftType'|'task'|'priority'|'employee'} props.type
 * @param {string} props.status - The status value to display
 * @param {React.ComponentType} [props.icon] - Optional icon component to render before label
 * @param {string} [props.className] - Additional CSS classes
 */
function StatusBadge({ type, status, icon: Icon, className = '' }) {
  const { variant, label } = getStatusConfig(type, status);

  return (
    <Badge bg={variant} className={className}>
      {Icon && <Icon className="me-1" aria-hidden="true" />}
      {label}
    </Badge>
  );
}

export default StatusBadge;
