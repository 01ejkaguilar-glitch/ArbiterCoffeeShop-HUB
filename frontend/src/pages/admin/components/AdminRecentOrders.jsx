import React from 'react';
import { Card, ListGroup } from 'react-bootstrap';

const AdminRecentOrders = ({ orders = [] }) => {
  return (
    <Card className="admin-card h-100">
      <Card.Header>
        <h5 className="mb-0 fw-semibold">Recent Orders</h5>
      </Card.Header>
      <ListGroup variant="flush">
        {orders.length === 0 ? (
          <ListGroup.Item className="text-muted">No recent orders</ListGroup.Item>
        ) : orders.map((order) => (
          <ListGroup.Item key={order.id} className="d-flex justify-content-between align-items-center">
            <span>#{order.order_number || order.id}</span>
            <small className="text-muted">{order.status || 'pending'}</small>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Card>
  );
};

export default AdminRecentOrders;