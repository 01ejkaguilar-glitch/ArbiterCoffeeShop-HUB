import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Table, Spinner, Alert } from 'react-bootstrap';
import { FaArrowLeft, FaRedo } from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await apiService.get(API_ENDPOINTS.ORDERS.DETAIL(id));
      if (response.success) {
        setOrder(response.data);
      } else {
        setError('Failed to load order details');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('Failed to load order details. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchOrder(true);
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
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col xs="auto">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </Col>
        </Row>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6}>
            <Alert variant="danger" className="text-center">
              <h5>Order Not Found</h5>
              <p>{error}</p>
              <Button variant="primary" onClick={() => navigate('/orders')}>
                Back to Orders
              </Button>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <Button
                variant="outline-secondary"
                onClick={() => navigate('/orders')}
                className="me-3 d-flex align-items-center"
              >
                <FaArrowLeft className="me-2" />
                Back to Orders
              </Button>
              <div>
                <h1 className="display-5 fw-bold mb-0">Order #{order?.order_number}</h1>
                <p className="text-muted mb-0">Order Details</p>
              </div>
            </div>
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
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={8}>
          <Card className="shadow-sm mb-4">
            <Card.Header>
              <h5 className="mb-0">Order Items</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(order?.orderItems || order?.order_items || [])?.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <div>
                          <strong>{item.product?.name || item.product_name || 'Unknown Product'}</strong>
                          {item.special_instructions && (
                            <div className="text-muted small">
                              Note: {item.special_instructions}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{item.quantity}</td>
                      <td>₱{parseFloat(item.unit_price).toFixed(2)}</td>
                      <td>₱{parseFloat(item.total_price || (item.quantity * item.unit_price)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="shadow-sm mb-4">
            <Card.Header>
              <h5 className="mb-0">Order Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <strong>Status:</strong> {getStatusBadge(order?.status)}
              </div>
              <div className="mb-3">
                <strong>Order Type:</strong>{' '}
                <Badge bg="light" text="dark">
                  {order?.order_type}
                </Badge>
              </div>
              <div className="mb-3">
                <strong>Order Date:</strong><br />
                {formatDate(order?.created_at)}
              </div>
              {order?.scheduled_time && (
                <div className="mb-3">
                  <strong>Scheduled Time:</strong><br />
                  {formatDate(order?.scheduled_time)}
                </div>
              )}
              {order?.special_instructions && (
                <div className="mb-3">
                  <strong>Special Instructions:</strong><br />
                  <small className="text-muted">{order.special_instructions}</small>
                </div>
              )}
              <hr />
              <div className="mb-2">
                <div className="d-flex justify-content-between">
                  <span>Subtotal:</span>
                  <span>₱{parseFloat(order?.subtotal || 0).toFixed(2)}</span>
                </div>
                {order?.order_type === 'delivery' && order?.delivery_fee && (
                  <div className="d-flex justify-content-between">
                    <span>Delivery Fee:</span>
                    <span>₱{parseFloat(order.delivery_fee).toFixed(2)}</span>
                  </div>
                )}
              </div>
              <hr />
              <div className="d-flex justify-content-between">
                <strong>Total Amount:</strong>
                <strong>₱{parseFloat(order?.total_amount).toFixed(2)}</strong>
              </div>
            </Card.Body>
          </Card>

          {order?.order_type === 'delivery' && (
            <Card className="shadow-sm">
              <Card.Header>
                <h5 className="mb-0">Delivery Address</h5>
              </Card.Header>
              <Card.Body>
                {order?.deliveryAddress ? (
                  <>
                    <div className="mb-2">
                      <strong>Address Type:</strong> {order.deliveryAddress.type || 'Home'}
                      {order.deliveryAddress.is_default && (
                        <Badge bg="success" className="ms-2">Default</Badge>
                      )}
                    </div>
                    <address className="mb-0">
                      {order.deliveryAddress.street && <>{order.deliveryAddress.street}<br /></>}
                      {order.deliveryAddress.city && <>{order.deliveryAddress.city}, </>}
                      {order.deliveryAddress.province && <>{order.deliveryAddress.province}<br /></>}
                      {order.deliveryAddress.postal_code && <>{order.deliveryAddress.postal_code}</>}
                    </address>
                  </>
                ) : order?.delivery_address ? (
                  <address className="mb-0">
                    {typeof order.delivery_address === 'string' ? (
                      <span>{order.delivery_address}</span>
                    ) : (
                      <>
                        {order.delivery_address.street && <>{order.delivery_address.street}<br /></>}
                        {order.delivery_address.city && <>{order.delivery_address.city}, </>}
                        {order.delivery_address.province && <>{order.delivery_address.province}<br /></>}
                        {order.delivery_address.postal_code && <>{order.delivery_address.postal_code}</>}
                      </>
                    )}
                  </address>
                ) : (
                  <div className="text-muted">
                    <em>Delivery address information not available</em>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          {order?.order_type === 'pickup' && (
            <Card className="shadow-sm">
              <Card.Header>
                <h5 className="mb-0">Pickup Information</h5>
              </Card.Header>
              <Card.Body>
                <p className="mb-0">This order is for pickup at the store location.</p>
                <small className="text-muted">
                  Please arrive at your scheduled pickup time to collect your order.
                </small>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default OrderDetailPage;