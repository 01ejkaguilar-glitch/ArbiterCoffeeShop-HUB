import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Alert, Spinner } from 'react-bootstrap';
import { FaClock, FaCheckCircle, FaUtensils, FaChartLine, FaCoffee, FaTasks } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config/api';
import apiService from '../../services/api.service';
import { useBaristaOrders } from '../../hooks/useBroadcast';
import { useNotificationSystem } from '../../components/common/NotificationSystem';

const BaristaDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showOrderNotification } = useNotificationSystem();

  // Real-time order updates
  const { isConnected: realtimeConnected } = useBaristaOrders((newOrder) => {
    showOrderNotification(newOrder, 'New Order Received!');
    // Refresh dashboard data
    fetchDashboardData();
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(API_ENDPOINTS.BARISTA.DASHBOARD);
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading dashboard...</p>
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

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">Barista Dashboard</h1>
          <p className="text-muted mb-0">Welcome back, {user?.name}!</p>
        </div>
        <div className="d-flex align-items-center">
          <Badge bg={realtimeConnected ? 'success' : 'warning'} className="me-2">
            {realtimeConnected ? '🟢 Live' : '🟡 Offline'}
          </Badge>
          <small className="text-muted">
            {realtimeConnected ? 'Real-time updates active' : 'Real-time updates unavailable'}
          </small>
        </div>
      </div>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-3">
          <Card className="h-100 border-warning">
            <Card.Body className="text-center">
              <FaClock size={30} className="text-warning mb-2" />
              <h3 className="mb-1">{dashboardData?.pending_orders || 0}</h3>
              <p className="text-muted mb-0">Pending Orders</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6} className="mb-3">
          <Card className="h-100 border-primary">
            <Card.Body className="text-center">
              <FaUtensils size={30} className="text-primary mb-2" />
              <h3 className="mb-1">{dashboardData?.preparing_orders || 0}</h3>
              <p className="text-muted mb-0">Preparing</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6} className="mb-3">
          <Card className="h-100 border-success">
            <Card.Body className="text-center">
              <FaCheckCircle size={30} className="text-success mb-2" />
              <h3 className="mb-1">{dashboardData?.completed_today || 0}</h3>
              <p className="text-muted mb-0">Completed Today</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6} className="mb-3">
          <Card className="h-100 border-info">
            <Card.Body className="text-center">
              <FaChartLine size={30} className="text-info mb-2" />
              <h3 className="mb-1">₱{dashboardData?.total_revenue_today?.toLocaleString() || 0}</h3>
              <p className="text-muted mb-0">Today's Revenue</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Performance Metrics */}
      <Row className="mb-4">
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <FaChartLine className="me-2" />
                Performance Today
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <small className="text-muted">Average Preparation Time</small>
                    <h4 className="mb-0">{dashboardData?.average_preparation_time || 'N/A'}</h4>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <small className="text-muted">Orders per Hour</small>
                    <h4 className="mb-0">
                      {dashboardData?.completed_today ?
                        Math.round((dashboardData.completed_today / 8) * 10) / 10 : 0
                      }
                    </h4>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <FaTasks className="me-2" />
                Quick Actions
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <a href="/barista/orders" className="btn btn-primary">
                  <FaUtensils className="me-2" />
                  View Order Queue
                </a>
                <a href="/barista/beans" className="btn btn-outline-secondary">
                  <FaCoffee className="me-2" />
                  Manage Coffee Beans
                </a>
                <a href="/barista/training" className="btn btn-outline-info">
                  <FaChartLine className="me-2" />
                  View Performance
                </a>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Real-time Status */}
      {!realtimeConnected && (
        <Alert variant="warning">
          <strong>Real-time updates unavailable:</strong> You may not receive instant notifications for new orders.
          Please refresh the page periodically to check for updates.
        </Alert>
      )}
    </Container>
  );
};

export default BaristaDashboard;