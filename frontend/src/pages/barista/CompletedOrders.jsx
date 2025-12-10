import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, Table, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { FaCheckCircle, FaCalendarAlt, FaSearch, FaDownload, FaEye } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config/api';
import apiService from '../../services/api.service';
import { useNotificationSystem } from '../../components/common/NotificationSystem';

const CompletedOrders = () => {
  const { user } = useAuth();
  const { showErrorNotification } = useNotificationSystem();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total_orders: 0,
    total_revenue: 0,
    avg_prep_time: 'N/A'
  });

  useEffect(() => {
    fetchCompletedOrders();
  }, [selectedDate, currentPage]);

  const fetchCompletedOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(
        `${API_ENDPOINTS.BARISTA.COMPLETED_ORDERS}?date=${selectedDate}&page=${currentPage}`
      );

      setOrders(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
      setStats({
        total_orders: response.data.total || 0,
        total_revenue: calculateTotalRevenue(response.data.data || []),
        avg_prep_time: calculateAvgPrepTime(response.data.data || [])
      });
    } catch (err) {
      console.error('Error fetching completed orders:', err);
      showErrorNotification('Failed to load completed orders');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalRevenue = (ordersData) => {
    return ordersData.reduce((total, order) => total + (order.total_amount || 0), 0);
  };

  const calculateAvgPrepTime = (ordersData) => {
    if (ordersData.length === 0) return 'N/A';

    const ordersWithTime = ordersData.filter(order =>
      order.created_at && order.updated_at
    );

    if (ordersWithTime.length === 0) return 'N/A';

    const totalTime = ordersWithTime.reduce((total, order) => {
      const created = new Date(order.created_at);
      const completed = new Date(order.updated_at);
      return total + (completed - created);
    }, 0);

    const avgMs = totalTime / ordersWithTime.length;
    const avgMinutes = Math.round(avgMs / (1000 * 60));

    return `${avgMinutes} min`;
  };

  const getOrderTypeBadge = (orderType) => {
    const variants = {
      dine_in: 'primary',
      take_out: 'secondary',
      delivery: 'info'
    };
    return <Badge bg={variants[orderType] || 'secondary'}>{orderType.replace('_', ' ').toUpperCase()}</Badge>;
  };

  const filteredOrders = orders.filter(order =>
    order.order_number.toString().includes(searchTerm) ||
    order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderItems?.some(item =>
      item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const exportToCSV = () => {
    const headers = ['Order #', 'Customer', 'Type', 'Items', 'Total', 'Completed At'];
    const csvData = filteredOrders.map(order => [
      order.order_number,
      order.user?.name || 'Guest',
      order.order_type,
      order.orderItems?.map(item => `${item.quantity}x ${item.product?.name}`).join('; ') || '',
      order.total_amount,
      new Date(order.updated_at).toLocaleString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `completed-orders-${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading completed orders...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">Completed Orders</h1>
          <p className="text-muted mb-0">View and analyze completed orders</p>
        </div>
        <Button variant="outline-success" onClick={exportToCSV}>
          <FaDownload className="me-1" />
          Export CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <FaCheckCircle size={30} className="text-success mb-2" />
              <h3 className="mb-1">{stats.total_orders}</h3>
              <p className="text-muted mb-0">Orders Completed</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <FaCalendarAlt size={30} className="text-info mb-2" />
              <h3 className="mb-1">₱{stats.total_revenue.toLocaleString()}</h3>
              <p className="text-muted mb-0">Total Revenue</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <FaCheckCircle size={30} className="text-warning mb-2" />
              <h3 className="mb-1">{stats.avg_prep_time}</h3>
              <p className="text-muted mb-0">Avg Prep Time</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Search</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search by order number, customer, or item..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Form.Group>
            </Col>

            <Col md={2} className="d-flex align-items-end">
              <Button variant="primary" onClick={fetchCompletedOrders} className="w-100">
                Refresh
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Orders Table */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Completed Orders - {selectedDate}</h5>
        </Card.Header>
        <Card.Body className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-5">
              <FaCheckCircle size={48} className="text-muted mb-3" />
              <h4>No completed orders found</h4>
              <p className="text-muted">
                {searchTerm ? 'Try adjusting your search terms.' : 'No orders were completed on this date.'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped hover className="mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Completed At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <tr key={order.id}>
                      <td>
                        <strong>#{order.order_number}</strong>
                      </td>
                      <td>{order.user?.name || 'Guest'}</td>
                      <td>{getOrderTypeBadge(order.order_type)}</td>
                      <td>
                        <small>
                          {order.orderItems?.slice(0, 2).map((item, index) => (
                            <span key={index}>
                              {item.quantity}x {item.product?.name}
                              {index < order.orderItems.slice(0, 2).length - 1 && ', '}
                            </span>
                          ))}
                          {order.orderItems?.length > 2 && ` +${order.orderItems.length - 2} more`}
                        </small>
                      </td>
                      <td>₱{order.total_amount?.toFixed(2)}</td>
                      <td>
                        <small className="text-muted">
                          {new Date(order.updated_at).toLocaleTimeString()}
                        </small>
                      </td>
                      <td>
                        <Button
                          variant="outline-info"
                          size="sm"
                          title="View Details"
                        >
                          <FaEye />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>

        {/* Pagination */}
        {totalPages > 1 && (
          <Card.Footer>
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                Page {currentPage} of {totalPages}
              </small>
              <div>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="me-2"
                >
                  Previous
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </Card.Footer>
        )}
      </Card>
    </Container>
  );
};

export default CompletedOrders;