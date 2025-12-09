import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Alert } from 'react-bootstrap';
import { FaShoppingBag, FaUser, FaHeart, FaClipboardList, FaCheckCircle, FaClock, FaDollarSign, FaStar } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(API_ENDPOINTS.CUSTOMER.DASHBOARD);
      if (response.success) {
        setDashboardData(response.data);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'warning', text: 'Pending' },
      preparing: { variant: 'info', text: 'Preparing' },
      ready: { variant: 'primary', text: 'Ready' },
      completed: { variant: 'success', text: 'Completed' },
      cancelled: { variant: 'danger', text: 'Cancelled' },
    };
    const config = statusConfig[status] || { variant: 'secondary', text: status };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading your dashboard...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Dashboard</Alert.Heading>
          <p>{error}</p>
          <button className="btn btn-outline-danger" onClick={fetchDashboardData}>
            Try Again
          </button>
        </Alert>
      </Container>
    );
  }

  const stats = dashboardData?.statistics || {};
  const recentOrders = dashboardData?.recent_orders || [];
  const activeOrder = dashboardData?.active_order;

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h1 className="display-5 fw-bold">Welcome back, {user?.name}!</h1>
          <p className="lead text-muted">Manage your orders and account</p>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row className="g-4 mb-5">
        <Col md={6} lg={3}>
          <Card className="text-center border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              <FaShoppingBag size={32} className="text-primary mb-2" />
              <h3 className="fw-bold text-primary">{stats.total_orders || 0}</h3>
              <p className="text-muted mb-0">Total Orders</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card className="text-center border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              <FaCheckCircle size={32} className="text-success mb-2" />
              <h3 className="fw-bold text-success">{stats.completed_orders || 0}</h3>
              <p className="text-muted mb-0">Completed Orders</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card className="text-center border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              <FaClock size={32} className="text-warning mb-2" />
              <h3 className="fw-bold text-warning">{stats.active_orders || 0}</h3>
              <p className="text-muted mb-0">Active Orders</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card className="text-center border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              <FaDollarSign size={32} className="text-info mb-2" />
              <h3 className="fw-bold text-info">₱{stats.total_spent || '0.00'}</h3>
              <p className="text-muted mb-0">Total Spent</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row className="g-4 mb-5">
        <Col md={6} lg={3}>
          <Card as={Link} to="/orders" className="text-decoration-none h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <FaShoppingBag size={48} className="text-primary mb-3" />
              <Card.Title>My Orders</Card.Title>
              <Card.Text className="text-muted">
                View and track your orders
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card as={Link} to="/profile" className="text-decoration-none h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <FaUser size={48} className="text-success mb-3" />
              <Card.Title>Profile</Card.Title>
              <Card.Text className="text-muted">
                Manage your account details
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card as={Link} to="/cart" className="text-decoration-none h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <FaClipboardList size={48} className="text-info mb-3" />
              <Card.Title>Shopping Cart</Card.Title>
              <Card.Text className="text-muted">
                Review items in your cart
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card as={Link} to="/products" className="text-decoration-none h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <FaHeart size={48} className="text-danger mb-3" />
              <Card.Title>Browse Products</Card.Title>
              <Card.Text className="text-muted">
                Discover new coffee
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Active Order Alert */}
      {activeOrder && (
        <Row className="mb-4">
          <Col>
            <Alert variant="info" className="d-flex align-items-center">
              <FaClock className="me-3" size={24} />
              <div className="flex-grow-1">
                <strong>Active Order #{activeOrder.id}</strong>
                <p className="mb-0">Status: {getStatusBadge(activeOrder.status)}</p>
              </div>
              <Link to={`/orders/${activeOrder.id}`} className="btn btn-info">
                View Details
              </Link>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Recent Orders */}
      <Row>
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Orders</h5>
              <Link to="/orders" className="btn btn-light btn-sm">View All</Link>
            </Card.Header>
            <Card.Body>
              {recentOrders.length > 0 ? (
                <div className="list-group list-group-flush">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="list-group-item px-0 py-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">Order #{order.id}</h6>
                          <p className="text-muted mb-1">
                            {new Date(order.created_at).toLocaleDateString()} • ₱{order.total_amount}
                          </p>
                          <div>
                            {getStatusBadge(order.status)}
                          </div>
                        </div>
                        <Link to={`/orders/${order.id}`} className="btn btn-outline-primary btn-sm">
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center py-4">
                  No recent orders. <Link to="/products">Start shopping now!</Link>
                </p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="shadow-sm">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Link to="/products" className="btn btn-outline-primary">
                  Browse Products
                </Link>
                <Link to="/orders" className="btn btn-outline-secondary">
                  Track Order
                </Link>
                <Link to="/profile" className="btn btn-outline-info">
                  Edit Profile
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CustomerDashboard;
