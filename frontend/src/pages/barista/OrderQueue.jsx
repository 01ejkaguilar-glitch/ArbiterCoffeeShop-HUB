import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Alert, Spinner, Form } from 'react-bootstrap';
import { FaClock, FaUtensils, FaCheckCircle, FaInfoCircle, FaPlay, FaPause, FaStop, FaBell } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config/api';
import apiService from '../../services/api.service';
import { useBaristaOrders } from '../../hooks/useBroadcast';
import { useNotificationSystem } from '../../components/common/NotificationSystem';

const OrderQueue = () => {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState({ pending_orders: [], preparing_orders: [] });
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderTimers, setOrderTimers] = useState({});
  const { showSuccessNotification, showErrorNotification, showOrderNotification } = useNotificationSystem();

  // Real-time order updates
  const { isConnected: realtimeConnected } = useBaristaOrders((newOrder) => {
    showOrderNotification(newOrder, 'New Order Received!');
    // Add new order to pending orders
    setOrders(prev => {
      if (!prev || !prev.pending_orders) {
        return { pending_orders: [newOrder], preparing_orders: [] };
      }
      return {
        ...prev,
        pending_orders: [newOrder, ...prev.pending_orders]
      };
    });
  });

  useEffect(() => {
    fetchOrderQueue();

    // Set up timer updates
    const timerInterval = setInterval(() => {
      setOrderTimers(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(orderId => {
          if (updated[orderId].status === 'preparing') {
            updated[orderId].elapsed = Date.now() - updated[orderId].startTime;
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  const fetchOrderQueue = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(API_ENDPOINTS.BARISTA.ORDER_QUEUE);
      console.log('API Response:', response.data); // Debug log
      const orderData = response.data.data || { pending_orders: [], preparing_orders: [], total_queue: 0 };
      setOrders(orderData);

      // Initialize timers for preparing orders
      const timers = {};
      if (orderData.preparing_orders && Array.isArray(orderData.preparing_orders)) {
        orderData.preparing_orders.forEach(order => {
          timers[order.id] = {
            status: 'preparing',
            startTime: new Date(order.updated_at).getTime(),
            elapsed: Date.now() - new Date(order.updated_at).getTime()
          };
        });
      }
      setOrderTimers(timers);
    } catch (err) {
      console.error('Error fetching order queue:', err);
      showErrorNotification('Failed to load order queue');
      // Set default empty state on error
      setOrders({ pending_orders: [], preparing_orders: [], total_queue: 0 });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus, notes = '') => {
    try {
      setUpdatingOrder(orderId);
      await apiService.put(API_ENDPOINTS.BARISTA.UPDATE_ORDER(orderId), {
        status: newStatus,
        notes: notes
      });

      // Update local state
      setOrders(prev => {
        if (!prev) {
          return { pending_orders: [], preparing_orders: [] };
        }
        const updated = { ...prev };

        // Remove from current status
        updated.pending_orders = updated.pending_orders.filter(o => o.id !== orderId);
        updated.preparing_orders = updated.preparing_orders.filter(o => o.id !== orderId);

        // Add to new status if not completed
        const order = [...updated.pending_orders, ...updated.preparing_orders].find(o => o.id === orderId);
        if (order && newStatus !== 'completed') {
          const updatedOrder = { ...order, status: newStatus, updated_at: new Date().toISOString() };
          if (newStatus === 'preparing') {
            updated.preparing_orders.push(updatedOrder);
            // Start timer
            setOrderTimers(prev => ({
              ...prev,
              [orderId]: {
                status: 'preparing',
                startTime: Date.now(),
                elapsed: 0
              }
            }));
          }
        }

        return updated;
      });

      showSuccessNotification(`Order #${orderId} status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating order status:', err);
      showErrorNotification('Failed to update order status');
    } finally {
      setUpdatingOrder(null);
    }
  };

  const formatElapsedTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const OrderCard = ({ order }) => {
    const timer = orderTimers[order.id];
    const elapsedTime = timer ? formatElapsedTime(timer.elapsed) : '0:00';

    return (
      <Card className="mb-3 shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <strong>Order #{order.order_number}</strong>
            <Badge bg={order.status === 'pending' ? 'warning' : 'info'} className="ms-2">
              {order.status}
            </Badge>
          </div>
          <small className="text-muted">
            {new Date(order.created_at).toLocaleTimeString()}
          </small>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={8}>
              <div className="mb-2">
                <strong>Customer:</strong> {order.user?.name || 'N/A'}
              </div>
              <div className="mb-2">
                <strong>Items:</strong>
                {order.orderItems?.map(item => (
                  <div key={item.id} className="ms-3">
                    {item.quantity}x {item.product?.name || 'Unknown Item'}
                  </div>
                )) || 'No items'}
              </div>
              <div className="mb-2">
                <strong>Total:</strong> ${order.total_amount}
              </div>
              {order.notes && (
                <div className="mb-2">
                  <strong>Notes:</strong> {order.notes}
                </div>
              )}
            </Col>
            <Col md={4} className="text-end">
              {order.status === 'preparing' && (
                <div className="mb-3">
                  <Badge bg="success" className="d-block mb-2">
                    <FaClock className="me-1" />
                    {elapsedTime}
                  </Badge>
                </div>
              )}
              <div className="d-grid gap-2">
                {order.status === 'pending' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                    disabled={updatingOrder === order.id}
                  >
                    {updatingOrder === order.id ? <Spinner size="sm" /> : <FaPlay className="me-1" />}
                    Start Preparing
                  </Button>
                )}
                {order.status === 'preparing' && (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      disabled={updatingOrder === order.id}
                    >
                      {updatingOrder === order.id ? <Spinner size="sm" /> : <FaCheckCircle className="me-1" />}
                      Complete
                    </Button>
                  </>
                )}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    );
  };

  // Check authentication before proceeding
  if (!isAuthenticated || !user) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Alert variant="warning">
            <h4>Authentication Required</h4>
            <p>Please log in to access the barista portal.</p>
          </Alert>
        </div>
      </Container>
    );
  }

  // Check if user has barista role
  if (!user.roles || !Array.isArray(user.roles) || !user.roles.some(role => ['barista', 'admin', 'super-admin'].includes(role))) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Alert variant="danger">
            <h4>Access Denied</h4>
            <p>You don't have permission to access the barista portal.</p>
            <small className="text-muted">
              Current user: {user.email} | Roles: {user.roles ? user.roles.join(', ') : 'None'}
              <br />
              Try logging out and logging back in with a barista account (barista@arbiter.com / password123)
            </small>
          </Alert>
        </div>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading order queue...</p>
      </Container>
    );
  }

  // Ensure orders state is properly initialized
  if (!orders || !orders.pending_orders || !orders.preparing_orders) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" />
          <p className="mt-3">Loading order queue...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">Order Queue</h1>
          <p className="text-muted mb-0">Manage incoming orders and track preparation</p>
        </div>
        <div className="d-flex align-items-center">
          <Badge bg={realtimeConnected ? 'success' : 'warning'} className="me-2">
            {realtimeConnected ? '🟢 Live' : '🟡 Offline'}
          </Badge>
          <Button variant="outline-primary" onClick={fetchOrderQueue}>
            <FaBell className="me-1" />
            Refresh
          </Button>
        </div>
      </div>

      <Row>
        <Col md={6}>
          <Card>
            <Card.Header className="bg-warning text-dark">
              <h5 className="mb-0">
                <FaClock className="me-2" />
                Pending Orders ({orders.pending_orders.length})
              </h5>
            </Card.Header>
            <Card.Body className="p-3">
              {orders.pending_orders.length === 0 ? (
                <p className="text-muted text-center py-4">No pending orders</p>
              ) : (
                orders.pending_orders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">
                <FaUtensils className="me-2" />
                Preparing Orders ({orders.preparing_orders.length})
              </h5>
            </Card.Header>
            <Card.Body className="p-3">
              {orders.preparing_orders.length === 0 ? (
                <p className="text-muted text-center py-4">No orders being prepared</p>
              ) : (
                orders.preparing_orders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Order Details Modal */}
      <Modal show={showOrderModal} onHide={() => setShowOrderModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Order Details #{selectedOrder?.order_number}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Customer:</strong> {selectedOrder.user?.name || 'N/A'}
                </Col>
                <Col md={6}>
                  <strong>Status:</strong>{' '}
                  <Badge bg={selectedOrder.status === 'pending' ? 'warning' : selectedOrder.status === 'preparing' ? 'info' : 'success'}>
                    {selectedOrder.status}
                  </Badge>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Order Time:</strong> {new Date(selectedOrder.created_at).toLocaleString()}
                </Col>
                <Col md={6}>
                  <strong>Total:</strong> ${selectedOrder.total_amount}
                </Col>
              </Row>

              <h6>Order Items:</h6>
              <ul className="list-group mb-3">
                {selectedOrder.orderItems?.map(item => (
                  <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{item.quantity}x {item.product?.name || 'Unknown Item'}</strong>
                      {item.special_instructions && (
                        <div className="text-warning small mt-1">
                          <strong>Special Instructions:</strong> {item.special_instructions}
                        </div>
                      )}
                    </div>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>

              {selectedOrder.notes && (
                <div className="mb-3">
                  <strong>Order Notes:</strong>
                  <p className="mb-0">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowOrderModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default OrderQueue;