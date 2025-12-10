import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Badge, Button, Table, Spinner, Alert, Form, InputGroup, Dropdown, Pagination } from 'react-bootstrap';
import { FaEye, FaRedo, FaWifi, FaExclamationTriangle, FaSearch, FaFilter, FaDownload, FaRedoAlt, FaCalendarAlt, FaSort, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOrderUpdates } from '../../hooks/useBroadcast';
import { useNotificationSystem } from '../../components/common/NotificationSystem';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [reordering, setReordering] = useState(null);
  const ordersPerPage = 10;
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showOrderNotification } = useNotificationSystem();

  // Real-time order updates
  const { isConnected, lastUpdate } = useOrderUpdates(user?.id, (action, order) => {
    if (action === 'status_updated') {
      // Update the order in the list
      setOrders(prevOrders =>
        prevOrders.map(o => o.id === order.id ? { ...o, ...order } : o)
      );
      showOrderNotification(order, order.status);
    } else if (action === 'created') {
      // Add new order to the list
      setOrders(prevOrders => [order, ...prevOrders]);
      showOrderNotification(order, 'created');
    }
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

      const response = await apiService.get(API_ENDPOINTS.ORDERS.LIST);
      if (response.success) {
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

  const handleReorder = async (orderId) => {
    setReordering(orderId);
    try {
      const response = await apiService.post(API_ENDPOINTS.ORDERS.REORDER(orderId));
      if (response.success) {
        // Redirect to cart or show success message
        alert('Order items added to cart successfully!');
        navigate('/cart');
      } else {
        setError('Failed to reorder items');
      }
    } catch (error) {
      console.error('Error reordering:', error);
      setError('Failed to reorder items. Please try again.');
    } finally {
      setReordering(null);
    }
  };

  const handleCancelRequest = async (orderId) => {
    if (!window.confirm('Are you sure you want to request cancellation for this order? This action requires admin approval.')) {
      return;
    }

    try {
      const response = await apiService.post(API_ENDPOINTS.ORDERS.CANCEL_REQUEST(orderId));
      if (response.success) {
        // Update the order status in local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, status: 'cancellation_requested' } 
              : order
          )
        );
        alert('Cancellation request submitted successfully. Please wait for admin confirmation.');
      } else {
        setError(response.message || 'Failed to request cancellation');
      }
    } catch (error) {
      console.error('Error requesting cancellation:', error);
      setError(error.response?.data?.message || 'Failed to request cancellation. Please try again.');
    }
  };

  const handleDownloadReceipt = async (orderId) => {
    try {
      // In a real implementation, this would call an API endpoint to generate/download the receipt
      // For now, we'll simulate it
      const order = orders.find(o => o.id === orderId);
      if (order) {
        // Create a simple receipt text
        const receiptText = `
ARBITER COFFEE SHOP
Order Receipt
Order #: ${order.order_number}
Date: ${formatDate(order.created_at)}
Status: ${order.status}
Total: ₱${parseFloat(order.total_amount).toFixed(2)}

Thank you for your business!
        `.trim();

        // Create and download the file
        const blob = new Blob([receiptText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt_${order.order_number}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      setError('Failed to download receipt');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRefresh = () => {
    fetchOrders(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setDateFilter('all');
    setSortBy('date');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'warning',
      confirmed: 'info',
      preparing: 'primary',
      ready: 'success',
      completed: 'success',
      cancelled: 'danger',
      cancellation_requested: 'warning',
    };
    const statusLabels = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      ready: 'Ready',
      completed: 'Completed',
      cancelled: 'Cancelled',
      cancellation_requested: 'Cancel Requested',
    };
    return <Badge bg={statusColors[status] || 'secondary'}>{statusLabels[status] || status}</Badge>;
  };

  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders.filter((order) => {
      // Search filter
      const matchesSearch = !searchTerm ||
        order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id?.toString().includes(searchTerm);

      // Status filter
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      // Type filter
      const matchesType = typeFilter === 'all' || order.order_type === typeFilter;

      // Date filter
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const orderDate = new Date(order.created_at);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        const lastMonth = new Date(today);
        lastMonth.setMonth(today.getMonth() - 1);

        switch (dateFilter) {
          case 'today':
            matchesDate = orderDate.toDateString() === today.toDateString();
            break;
          case 'yesterday':
            matchesDate = orderDate.toDateString() === yesterday.toDateString();
            break;
          case 'week':
            matchesDate = orderDate >= lastWeek;
            break;
          case 'month':
            matchesDate = orderDate >= lastMonth;
            break;
          default:
            matchesDate = true;
        }
      }

      return matchesSearch && matchesStatus && matchesType && matchesDate;
    });

    // Sort orders
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'total':
          aValue = parseFloat(a.total_amount);
          bValue = parseFloat(b.total_amount);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [orders, searchTerm, statusFilter, typeFilter, dateFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedOrders.length / ordersPerPage);
  const paginatedOrders = filteredAndSortedOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

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

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="display-5 fw-bold">Order History</h1>
              <p className="lead text-muted">View and track your orders</p>
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

      {/* Search and Filters */}
      <Row className="mb-4">
        <Col lg={6}>
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by order number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col lg={6} className="d-flex gap-2 justify-content-end">
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm">
              <FaFilter className="me-2" />
              Status: {statusFilter === 'all' ? 'All' : statusFilter}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setStatusFilter('all')}>All Status</Dropdown.Item>
              <Dropdown.Item onClick={() => setStatusFilter('pending')}>Pending</Dropdown.Item>
              <Dropdown.Item onClick={() => setStatusFilter('confirmed')}>Confirmed</Dropdown.Item>
              <Dropdown.Item onClick={() => setStatusFilter('preparing')}>Preparing</Dropdown.Item>
              <Dropdown.Item onClick={() => setStatusFilter('ready')}>Ready</Dropdown.Item>
              <Dropdown.Item onClick={() => setStatusFilter('completed')}>Completed</Dropdown.Item>
              <Dropdown.Item onClick={() => setStatusFilter('cancelled')}>Cancelled</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm">
              <FaCalendarAlt className="me-2" />
              Date: {dateFilter === 'all' ? 'All' : dateFilter}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setDateFilter('all')}>All Time</Dropdown.Item>
              <Dropdown.Item onClick={() => setDateFilter('today')}>Today</Dropdown.Item>
              <Dropdown.Item onClick={() => setDateFilter('yesterday')}>Yesterday</Dropdown.Item>
              <Dropdown.Item onClick={() => setDateFilter('week')}>Last 7 days</Dropdown.Item>
              <Dropdown.Item onClick={() => setDateFilter('month')}>Last 30 days</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm">
              Type: {typeFilter === 'all' ? 'All' : typeFilter}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setTypeFilter('all')}>All Types</Dropdown.Item>
              <Dropdown.Item onClick={() => setTypeFilter('dine-in')}>Dine In</Dropdown.Item>
              <Dropdown.Item onClick={() => setTypeFilter('take-out')}>Take Out</Dropdown.Item>
              <Dropdown.Item onClick={() => setTypeFilter('delivery')}>Delivery</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
            Clear
          </Button>
        </Col>
      </Row>

      {/* Results Summary */}
      <Row className="mb-3">
        <Col>
          <Alert variant="light" className="py-2">
            <small>
              Showing {paginatedOrders.length} of {filteredAndSortedOrders.length} orders
              {searchTerm && ` matching "${searchTerm}"`}
            </small>
          </Alert>
        </Col>
      </Row>

      {/* Last update indicator */}
      {lastUpdate && (
        <Row className="mb-3">
          <Col>
            <Alert variant="info" className="py-2">
              <small>
                Last updated: {lastUpdate.toLocaleTimeString()}
              </small>
            </Alert>
          </Col>
        </Row>
      )}

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
          {orders.length === 0 ? (
            <Card className="shadow-sm">
              <Card.Body className="text-center py-5">
                <p className="text-muted mb-3">No orders yet</p>
                <Button variant="primary" href="/products">
                  Start Shopping
                </Button>
              </Card.Body>
            </Card>
          ) : filteredAndSortedOrders.length === 0 ? (
            <Card className="shadow-sm">
              <Card.Body className="text-center py-5">
                <p className="text-muted mb-3">No orders match your filters</p>
                <Button variant="outline-primary" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <Card className="shadow-sm">
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Total</th>
                      <th>Type</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <strong>{order.order_number}</strong>
                        </td>
                        <td>{formatDate(order.created_at)}</td>
                        <td>{getStatusBadge(order.status)}</td>
                        <td>₱{parseFloat(order.total_amount).toFixed(2)}</td>
                        <td>
                          <Badge bg="light" text="dark">
                            {order.order_type}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => navigate(`/orders/${order.id}`)}
                              title="View Details"
                            >
                              <FaEye />
                            </Button>
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleReorder(order.id)}
                              disabled={reordering === order.id}
                              title="Reorder"
                            >
                              {reordering === order.id ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                <FaRedoAlt />
                              )}
                            </Button>
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => handleDownloadReceipt(order.id)}
                              title="Download Receipt"
                            >
                              <FaDownload />
                            </Button>
                            {/* Cancel button - only show for pending or confirmed orders */}
                            {(order.status === 'pending' || order.status === 'confirmed') && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleCancelRequest(order.id)}
                                title="Request Cancellation"
                              >
                                <FaTimes />
                              </Button>
                            )}
                            {/* Show info if cancellation requested */}
                            {order.status === 'cancellation_requested' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                disabled
                                title="Cancellation Pending Admin Approval"
                              >
                                Pending
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-center mt-4">
                    <Pagination>
                      <Pagination.First
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                      />
                      <Pagination.Prev
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      />

                      {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + idx;
                        return (
                          <Pagination.Item
                            key={pageNum}
                            active={pageNum === currentPage}
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Pagination.Item>
                        );
                      })}

                      <Pagination.Next
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      />
                      <Pagination.Last
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                      />
                    </Pagination>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default OrderHistory;
