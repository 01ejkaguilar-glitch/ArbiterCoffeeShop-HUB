import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Badge, Alert } from 'react-bootstrap';
import { FaShoppingBag, FaUsers, FaChartLine, FaBoxes, FaWifi, FaExclamationTriangle, FaBell } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import { useAutoRefresh, AutoRefreshControls } from '../../hooks/useAutoRefresh';
import { useBaristaOrders, useInventoryAlerts } from '../../hooks/useBroadcast';
import { useNotificationSystem } from '../../components/common/NotificationSystem';
import Loading from '../../components/common/Loading';

const AdminDashboard = () => {
  const { showSuccessNotification, showLowStockAlert } = useNotificationSystem();

  // Real-time order notifications
  const { isConnected: ordersConnected, pendingOrders } = useBaristaOrders((newOrder) => {
    showSuccessNotification(
      'New Order Alert',
      `Order #${newOrder.order_number} requires attention.`
    );
  });

  // Real-time inventory alerts
  useInventoryAlerts((item) => {
    showLowStockAlert(item);
  });

  // Auto-refresh dashboard data
  const {
    data: dashboardData,
    loading,
    error,
    lastRefresh,
    isAutoRefreshEnabled,
    refresh,
    toggleAutoRefresh
  } = useAutoRefresh(async () => {
    const response = await apiService.get(API_ENDPOINTS.ADMIN.DASHBOARD_STATS);
    if (response.success) {
      return response.data;
    }
    throw new Error('Failed to fetch dashboard data');
  }, 60000); // Refresh every minute

  const stats = dashboardData?.stats || {
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalRevenue: 0
  };

  const recentOrders = dashboardData?.recentOrders || [];

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

  if (loading) {
    return <Loading message="Loading dashboard..." />;
  }

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="display-5 fw-bold">Admin Dashboard</h1>
              <p className="lead text-muted">Manage your coffee shop</p>
            </div>
            <div className="d-flex align-items-center gap-3">
              {/* Real-time connection status */}
              <div className="d-flex align-items-center">
                {ordersConnected ? (
                  <FaWifi className="text-success me-2" />
                ) : (
                  <FaExclamationTriangle className="text-warning me-2" />
                )}
                <small className={ordersConnected ? 'text-success' : 'text-warning'}>
                  {ordersConnected ? 'Live' : 'Offline'}
                </small>
              </div>

              {/* Pending orders indicator */}
              {pendingOrders.length > 0 && (
                <div className="d-flex align-items-center">
                  <FaBell className="text-warning me-2" />
                  <Badge bg="warning">{pendingOrders.length} new orders</Badge>
                </div>
              )}

              {/* Auto-refresh controls */}
              <AutoRefreshControls
                loading={loading}
                lastRefresh={lastRefresh}
                isAutoRefreshEnabled={isAutoRefreshEnabled}
                onRefresh={refresh}
                onToggleAutoRefresh={toggleAutoRefresh}
              />
            </div>
          </div>
        </Col>
      </Row>

      {/* Error message */}
      {error && (
        <Row className="mb-3">
          <Col>
            <Alert variant="danger">
              {error}
            </Alert>
          </Col>
        </Row>
      )}

      <Row className="g-4 mb-5">
        <Col md={6} lg={3}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Total Orders</p>
                  <h3 className="mb-0">{stats.totalOrders}</h3>
                </div>
                <FaShoppingBag size={40} className="text-primary" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Total Users</p>
                  <h3 className="mb-0">{stats.totalUsers}</h3>
                </div>
                <FaUsers size={40} className="text-success" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Total Products</p>
                  <h3 className="mb-0">{stats.totalProducts}</h3>
                </div>
                <FaBoxes size={40} className="text-info" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Revenue</p>
                  <h3 className="mb-0">₱{stats.totalRevenue.toLocaleString()}</h3>
                </div>
                <FaChartLine size={40} className="text-warning" />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col md={6} lg={3}>
          <Card as={Link} to="/admin/products" className="text-decoration-none h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <FaBoxes size={48} className="text-primary mb-3" />
              <Card.Title>Products</Card.Title>
              <Card.Text className="text-muted">
                Manage product catalog
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card as={Link} to="/admin/orders" className="text-decoration-none h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <FaShoppingBag size={48} className="text-success mb-3" />
              <Card.Title>Orders</Card.Title>
              <Card.Text className="text-muted">
                View and manage orders
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card as={Link} to="/admin/users" className="text-decoration-none h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <FaUsers size={48} className="text-info mb-3" />
              <Card.Title>Users</Card.Title>
              <Card.Text className="text-muted">
                Manage user accounts
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card as={Link} to="/admin/analytics" className="text-decoration-none h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <FaChartLine size={48} className="text-warning mb-3" />
              <Card.Title>Analytics</Card.Title>
              <Card.Text className="text-muted">
                View business analytics
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Recent Orders</h5>
            </Card.Header>
            <Card.Body>
              {recentOrders.length > 0 ? (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td>#{order.order_number || order.id}</td>
                        <td>{order.customer?.name || order.customer_name || 'N/A'}</td>
                        <td>{new Date(order.created_at).toLocaleDateString()}</td>
                        <td>₱{order.total_amount?.toFixed(2) || '0.00'}</td>
                        <td>{getStatusBadge(order.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-center text-muted py-4">No recent orders</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard;
