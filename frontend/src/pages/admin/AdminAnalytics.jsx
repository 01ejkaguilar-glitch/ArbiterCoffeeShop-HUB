import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Badge } from 'react-bootstrap';
import { FaChartLine, FaShoppingCart, FaUsers, FaBoxes } from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import Loading from '../../components/common/Loading';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.ADMIN.ANALYTICS.SALES);
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Loading analytics..." />;
  }

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h1 className="display-5 fw-bold">Analytics & Reports</h1>
          <p className="lead text-muted">View detailed analytics and generate reports</p>
        </Col>
      </Row>

      {/* Overview Stats */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="shadow-sm h-100 border-0" style={{ borderLeft: '4px solid #009245' }}>
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0 me-3">
                  <FaChartLine size={30} style={{ color: '#009245' }} />
                </div>
                <div>
                  <h6 className="text-muted mb-1">Total Revenue</h6>
                  <h4 className="mb-0">₱{parseFloat(analytics?.totalRevenue || 0).toFixed(2)}</h4>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="shadow-sm h-100 border-0" style={{ borderLeft: '4px solid #006837' }}>
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0 me-3">
                  <FaShoppingCart size={30} style={{ color: '#006837' }} />
                </div>
                <div>
                  <h6 className="text-muted mb-1">Total Orders</h6>
                  <h4 className="mb-0">{analytics?.totalOrders || 0}</h4>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="shadow-sm h-100 border-0" style={{ borderLeft: '4px solid #28a745' }}>
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0 me-3">
                  <FaUsers size={30} style={{ color: '#28a745' }} />
                </div>
                <div>
                  <h6 className="text-muted mb-1">Total Customers</h6>
                  <h4 className="mb-0">{analytics?.totalCustomers || 0}</h4>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="shadow-sm h-100 border-0" style={{ borderLeft: '4px solid #17a2b8' }}>
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0 me-3">
                  <FaBoxes size={30} style={{ color: '#17a2b8' }} />
                </div>
                <div>
                  <h6 className="text-muted mb-1">Avg Order Value</h6>
                  <h4 className="mb-0">₱{parseFloat(analytics?.averageOrderValue || 0).toFixed(2)}</h4>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Top Products */}
      <Row className="mb-4">
        <Col lg={6} className="mb-4">
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="mb-3">Top Selling Products</Card.Title>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th className="text-end">Sales</th>
                    <th className="text-end">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.topProducts && analytics.topProducts.length > 0 ? (
                    analytics.topProducts.map((product, index) => (
                      <tr key={index}>
                        <td>{product.name}</td>
                        <td>
                          <Badge bg="secondary">{product.category}</Badge>
                        </td>
                        <td className="text-end">{product.total_sold || 0}</td>
                        <td className="text-end">₱{parseFloat(product.revenue || 0).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-3">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* Revenue by Category */}
        <Col lg={6} className="mb-4">
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="mb-3">Revenue by Category</Card.Title>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th className="text-end">Orders</th>
                    <th className="text-end">Revenue</th>
                    <th className="text-end">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.revenueByCategory && analytics.revenueByCategory.length > 0 ? (
                    analytics.revenueByCategory.map((category, index) => (
                      <tr key={index}>
                        <td>{category.name}</td>
                        <td className="text-end">{category.order_count || 0}</td>
                        <td className="text-end">₱{parseFloat(category.revenue || 0).toFixed(2)}</td>
                        <td className="text-end">{parseFloat(category.percentage || 0).toFixed(1)}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-3">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Sales by Status */}
      <Row>
        <Col lg={12} className="mb-4">
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="mb-3">Sales by Status</Card.Title>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th className="text-end">Count</th>
                    <th className="text-end">Total Amount</th>
                    <th className="text-end">% of Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.ordersByStatus && analytics.ordersByStatus.length > 0 ? (
                    analytics.ordersByStatus.map((status, index) => (
                      <tr key={index}>
                        <td>
                          <Badge
                            bg={
                              status.status === 'completed' ? 'success' :
                              status.status === 'pending' ? 'warning' :
                              status.status === 'cancelled' ? 'danger' : 'info'
                            }
                          >
                            {status.status}
                          </Badge>
                        </td>
                        <td className="text-end">{status.count || 0}</td>
                        <td className="text-end">₱{parseFloat(status.total || 0).toFixed(2)}</td>
                        <td className="text-end">{parseFloat(status.percentage || 0).toFixed(1)}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-3">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminAnalytics;
