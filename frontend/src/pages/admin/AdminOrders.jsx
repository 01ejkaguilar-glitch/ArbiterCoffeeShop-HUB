import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Modal, Form } from 'react-bootstrap';
import { FaEye } from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import Loading from '../../components/common/Loading';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.ADMIN.ORDERS);
      if (response.success) {
        // Handle paginated response
        const ordersData = response.data.data || response.data;
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'warning',
      confirmed: 'info',
      preparing: 'primary',
      ready: 'success',
      completed: 'success',
      cancelled: 'danger'
    };
    return <Badge bg={statusColors[status] || 'secondary'}>{status}</Badge>;
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setShowModal(true);
  };

  const handleUpdateStatus = async () => {
    try {
      const response = await apiService.patch(
        API_ENDPOINTS.ADMIN.ORDER_STATUS(selectedOrder.id),
        { status: newStatus }
      );

      if (response.success) {
        alert('Order status updated successfully!');
        setShowModal(false);
        fetchOrders();
      }
    } catch (error) {
      alert('Failed to update order status');
      console.error('Error updating order:', error);
    }
  };

  if (loading) {
    return <Loading message="Loading orders..." />;
  }

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h1 className="display-5 fw-bold">Orders Management</h1>
          <p className="lead text-muted">View and manage customer orders</p>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <tr key={order.id}>
                        <td>#{order.order_number || order.id}</td>
                        <td>{order.customer?.name || order.customer_name || 'N/A'}</td>
                        <td>{new Date(order.created_at).toLocaleDateString()}</td>
                        <td>{order.items?.length || order.order_items?.length || 0} items</td>
                        <td>₱{order.total_amount?.toFixed(2) || '0.00'}</td>
                        <td>{getStatusBadge(order.status)}</td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleViewOrder(order)}
                          >
                            <FaEye /> View
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center text-muted py-4">
                        No orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Order Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>Order Details - #{selectedOrder?.order_number || selectedOrder?.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Customer:</strong> {selectedOrder.customer?.name || selectedOrder.customer_name}
                </Col>
                <Col md={6}>
                  <strong>Date:</strong> {new Date(selectedOrder.created_at).toLocaleString()}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Payment Method:</strong> {selectedOrder.payment_method || 'N/A'}
                </Col>
                <Col md={6}>
                  <strong>Current Status:</strong> {getStatusBadge(selectedOrder.status)}
                </Col>
              </Row>

              <h5 className="mt-4">Order Items</h5>
              <Table bordered size="sm">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedOrder.items || selectedOrder.order_items || []).map((item, index) => (
                    <tr key={index}>
                      <td>{item.product?.name || item.product_name}</td>
                      <td>{item.quantity}</td>
                      <td>₱{item.unit_price?.toFixed(2) || item.price?.toFixed(2)}</td>
                      <td>₱{((item.unit_price || item.price) * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <div className="text-end">
                <h5>Total: ₱{selectedOrder.total_amount?.toFixed(2)}</h5>
              </div>

              <Form.Group className="mt-4">
                <Form.Label><strong>Update Status</strong></Form.Label>
                <Form.Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleUpdateStatus}>
            Update Status
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminOrders;
