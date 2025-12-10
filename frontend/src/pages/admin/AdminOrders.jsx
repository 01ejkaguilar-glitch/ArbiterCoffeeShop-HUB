import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { FaEye, FaRedo, FaWifi, FaExclamationTriangle, FaBell } from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import { useBaristaOrders } from '../../hooks/useBroadcast';
import { useNotificationSystem } from '../../components/common/NotificationSystem';
import Loading from '../../components/common/Loading';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [error, setError] = useState(null);
  const { showSuccessNotification } = useNotificationSystem();

  // Real-time barista order notifications
  const { isConnected, pendingOrders } = useBaristaOrders((newOrder) => {
    // Add new order to the list
    setOrders(prevOrders => [newOrder, ...prevOrders]);
    showSuccessNotification(
      'New Order Received',
      `Order #${newOrder.order_number} has been placed and needs attention.`
    );
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await apiService.get(API_ENDPOINTS.ADMIN.ORDERS);
      if (response.success) {
        // Handle paginated response
        const ordersData = response.data.data || response.data;
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } else {
        setError('Failed to load orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      const response = await apiService.patch(
        `${API_ENDPOINTS.ADMIN.ORDERS}/${selectedOrder.id}/status`,
        { status: newStatus }
      );

      if (response.success) {
        // Update order in the list
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === selectedOrder.id
              ? { ...order, status: newStatus }
              : order
          )
        );

        setShowModal(false);
        showSuccessNotification(
          'Order Updated',
          `Order #${selectedOrder.order_number} status changed to ${newStatus}.`
        );
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Failed to update order status');
    }
  };

  const handleRefresh = () => {
    fetchOrders(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="display-5 fw-bold">Order Management</h1>
              <p className="lead text-muted">Manage and track all customer orders</p>
            </div>
            <div className="d-flex align-items-center gap-3">
              {/* Real-time connection status */}
              <div className="d-flex align-items-center">
                {isConnected ? (
                  <FaWifi className="text-success me-2" />
                ) : (
                  <FaExclamationTriangle className="text-warning me-2" />
                )}
                <small className={isConnected ? 'text-success' : 'text-warning'}>
                  {isConnected ? 'Live' : 'Offline'}
                </small>
              </div>

              {/* Pending orders indicator */}
              {pendingOrders.length > 0 && (
                <div className="d-flex align-items-center">
                  <FaBell className="text-warning me-2" />
                  <Badge bg="warning">{pendingOrders.length} new</Badge>
                </div>
              )}

              {/* Refresh button */}
              <Button
                variant="outline-primary"
                onClick={handleRefresh}
                disabled={refreshing}
                className="d-flex align-items-center"
              >
                <FaRedo className={refreshing ? 'fa-spin me-2' : 'me-2'} />
                Refresh
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Error message */}
      {error && (
        <Row className="mb-3">
          <Col>
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          </Col>
        </Row>
      )}

      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Orders ({orders.length})</h5>
                <small className="text-muted">
                  Auto-refresh: {isConnected ? 'Enabled' : 'Disabled'}
                </small>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {orders.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">No orders found</p>
                </div>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Total</th>
                      <th>Type</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <strong>{order.order_number}</strong>
                        </td>
                        <td>{order.user?.name || 'N/A'}</td>
                        <td>{formatDate(order.created_at)}</td>
                        <td>{getStatusBadge(order.status)}</td>
                        <td>₱{parseFloat(order.total_amount).toFixed(2)}</td>
                        <td>
                          <Badge bg="light" text="dark">
                            {order.order_type}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleViewOrder(order)}
                            className="d-flex align-items-center"
                          >
                            <FaEye className="me-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Order Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Order Details - {selectedOrder?.order_number}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Customer:</strong> {selectedOrder.user?.name}
                </Col>
                <Col md={6}>
                  <strong>Order Type:</strong> {selectedOrder.order_type}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Status:</strong> {getStatusBadge(selectedOrder.status)}
                </Col>
                <Col md={6}>
                  <strong>Total:</strong> ₱{parseFloat(selectedOrder.total_amount).toFixed(2)}
                </Col>
              </Row>

              <h6>Order Items:</h6>
              <Table striped bordered hover size="sm" className="mb-4">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.orderItems?.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product?.name}</td>
                      <td>{item.quantity}</td>
                      <td>₱{parseFloat(item.unit_price).toFixed(2)}</td>
                      <td>₱{(parseFloat(item.unit_price) * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Order Timeline */}
              {selectedOrder.status_history && Array.isArray(selectedOrder.status_history) && selectedOrder.status_history.length > 0 && (
                <>
                  <h6 className="mt-4 mb-3">Order Timeline:</h6>
                  <div className="timeline mb-4">
                    {selectedOrder.status_history.map((entry, index) => (
                      <div key={index} className="timeline-item mb-2 pb-2 border-bottom">
                        <div className="d-flex justify-content-between">
                          <div>
                            <Badge bg="secondary" className="me-2">{entry.from}</Badge>
                            <FaEye className="mx-2" />
                            <Badge bg="primary">{entry.to}</Badge>
                          </div>
                          <small className="text-muted">
                            {new Date(entry.timestamp).toLocaleString()}
                          </small>
                        </div>
                        <small className="text-muted">Updated by: {entry.updated_by}</small>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <Form.Group className="mt-3">
                <Form.Label>Update Status:</Form.Label>
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
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={handleStatusUpdate}
            disabled={newStatus === selectedOrder?.status}
          >
            Update Status
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminOrders;
