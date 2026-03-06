import React from 'react';
import { Card, Table, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaShoppingBag, FaArrowRight } from 'react-icons/fa';
import StatusBadge from '../../../components/common/StatusBadge';
import EmptyState from '../../../components/common/EmptyState';

const AdminRecentOrders = ({ orders }) => {
  return (
        <Card className="admin-card h-100">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <div className="dashboard-section-icon bg-primary-soft">
                <FaShoppingBag className="text-primary" />
              </div>
              <div>
                <h5 className="mb-0 fw-semibold">Recent Orders</h5>
                <small className="text-muted">Latest customer transactions</small>
              </div>
            </div>
            <Button
              as={Link}
              to="/admin/orders"
              variant="outline-primary"
              size="sm"
              className="d-flex align-items-center gap-1"
            >
              View All <FaArrowRight size={12} />
            </Button>
          </Card.Header>
          <Card.Body className="p-0">
            {orders.length > 0 ? (
              <Table responsive hover className="admin-table mb-0">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td><strong>#{order.order_number || order.id}</strong></td>
                      <td>{order.customer?.name || order.customer_name || order.user?.name || 'N/A'}</td>
                      <td className="text-muted">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td><strong>&#8369;{parseFloat(order.total_amount || 0).toFixed(2)}</strong></td>
                      <td><StatusBadge type="order" status={order.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <EmptyState
                icon={FaShoppingBag}
                title="No Recent Orders"
                message="No orders have been placed yet. They will appear here once customers start ordering."
              />
            )}
          </Card.Body>
        </Card>
  );
};

export default AdminRecentOrders;
