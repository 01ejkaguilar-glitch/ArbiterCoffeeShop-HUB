import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Badge } from 'react-bootstrap';
import { FaShoppingBag, FaUsers, FaChartLine, FaBoxes } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import Loading from '../../components/common/Loading';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalRevenue: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.ADMIN.DASHBOARD_STATS);

      if (response.success) {
        const { stats: dashboardStats, recentOrders: orders } = response.data;
        
        setStats({
          totalOrders: dashboardStats.totalOrders || 0,
          totalUsers: dashboardStats.totalUsers || 0,
          totalProducts: dashboardStats.totalProducts || 0,
          totalRevenue: dashboardStats.totalRevenue || 0
        });

        setRecentOrders(orders || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  if (loading) {
    return <Loading message="Loading dashboard..." />;
  }

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h1 className="display-5 fw-bold">Admin Dashboard</h1>
          <p className="lead text-muted">Manage your coffee shop</p>
        </Col>
      </Row>

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
