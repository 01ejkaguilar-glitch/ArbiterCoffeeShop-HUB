import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

/**
 * Modernized action card grid for dashboard quick-action sections.
 * Renders a responsive grid of linked cards with gradient icon + title + description.
 */
function ActionCardGrid({
  items,
  columns = 4,
  className = '',
}) {
  if (!items || items.length === 0) return null;

  const lgCol = 12 / columns;

  return (
    <Row className={`g-4 mb-5 ${className}`.trim()}>
      {items.map((item) => {
        const IconComponent = item.icon;
        // Extract color keyword from class like 'text-primary' → 'primary'
        const colorKey = (item.iconColor || 'text-primary').replace('text-', '');
        return (
          <Col md={6} lg={lgCol} key={item.path}>
            <Card
              as={Link}
              to={item.path}
              className="action-card text-decoration-none h-100"
            >
              <Card.Body className="p-4">
                <div className={`action-card-icon mb-3 bg-${colorKey}-soft`}>
                  <IconComponent size={22} className={`text-${colorKey}`} />
                </div>
                <Card.Title className="action-card-title">{item.label}</Card.Title>
                {item.description && (
                  <Card.Text className="action-card-desc text-muted mb-0">{item.description}</Card.Text>
                )}
              </Card.Body>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}

export default ActionCardGrid;
