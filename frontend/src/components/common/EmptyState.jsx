/**
 * Empty State Component
 * Displayed when lists/tables have no data to show
 */

import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FaInbox } from 'react-icons/fa';

const EmptyState = ({ 
  icon: CustomIcon = FaInbox,
  title = 'No Data Available',
  message = 'There are no items to display at this time.',
  actionText,
  onActionClick,
  variant = 'info'
}) => {
  const iconColors = {
    info: 'var(--color-info)',
    warning: 'var(--color-warning)',
    secondary: 'var(--color-gray-600)',
    success: 'var(--color-success)'
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6} className="text-center">
          <div className="mb-4">
            <CustomIcon size={80} style={{ color: iconColors[variant] || iconColors.info }} />
          </div>
          <h3 className="mb-3">{title}</h3>
          <p className="text-muted mb-4">{message}</p>
          {actionText && onActionClick && (
            <button 
              className={`btn btn-${variant} btn-lg`}
              onClick={onActionClick}
              aria-label={actionText}
            >
              {actionText}
            </button>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default EmptyState;
