import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Alert, Spinner, ProgressBar, Form } from 'react-bootstrap';
import { FaChartLine, FaClock, FaStar, FaCheckCircle, FaExclamationTriangle, FaTrophy, FaCalendarAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config/api';
import apiService from '../../services/api.service';
import { useNotificationSystem } from '../../components/common/NotificationSystem';

const TrainingInsights = () => {
  const { user } = useAuth();
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('today');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPerformanceData();
  }, [period]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`${API_ENDPOINTS.BARISTA.PERFORMANCE}?period=${period}`);
      setPerformanceData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching performance data:', err);
      setError('Failed to load performance data. Barista tracking may not be fully implemented yet.');
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceGrade = (score) => {
    if (score >= 9.0) return { grade: 'A+', color: 'success', label: 'Outstanding' };
    if (score >= 8.5) return { grade: 'A', color: 'success', label: 'Excellent' };
    if (score >= 8.0) return { grade: 'B+', color: 'info', label: 'Very Good' };
    if (score >= 7.5) return { grade: 'B', color: 'info', label: 'Good' };
    if (score >= 7.0) return { grade: 'C+', color: 'warning', label: 'Satisfactory' };
    if (score >= 6.0) return { grade: 'C', color: 'warning', label: 'Needs Improvement' };
    return { grade: 'D', color: 'danger', label: 'Below Standard' };
  };

  const getSpeedRating = (avgTime) => {
    if (!avgTime) return { rating: 'N/A', color: 'secondary' };
    const minutes = parseFloat(avgTime.replace(' minutes', ''));
    if (minutes <= 8) return { rating: 'Fast', color: 'success' };
    if (minutes <= 12) return { rating: 'Good', color: 'info' };
    if (minutes <= 15) return { rating: 'Average', color: 'warning' };
    return { rating: 'Slow', color: 'danger' };
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading performance data...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <Alert.Heading>Performance Data Unavailable</Alert.Heading>
          <p>{error}</p>
          <p className="mb-0">
            <small>
              Note: Performance tracking requires barista_id to be properly assigned to orders.
              This feature may not be fully functional until order tracking is implemented.
            </small>
          </p>
        </Alert>
      </Container>
    );
  }

  const performanceGrade = performanceData ? getPerformanceGrade(4.8) : null; // Mock grade since we don't have real data
  const speedRating = performanceData ? getSpeedRating(performanceData.avg_preparation_time) : null;

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">Training Insights</h1>
          <p className="text-muted mb-0">Track your performance and skill development</p>
        </div>
        <Form.Select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          style={{ width: 'auto' }}
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </Form.Select>
      </div>

      {/* Performance Overview */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <FaTrophy size={30} className={`text-${performanceGrade?.color || 'secondary'} mb-2`} />
              <h3 className="mb-1">{performanceGrade?.grade || 'N/A'}</h3>
              <p className="text-muted mb-1">Performance Grade</p>
              <Badge bg={performanceGrade?.color || 'secondary'}>
                {performanceGrade?.label || 'No Data'}
              </Badge>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <FaCheckCircle size={30} className="text-success mb-2" />
              <h3 className="mb-1">{performanceData?.orders_completed || 0}</h3>
              <p className="text-muted mb-1">Orders Completed</p>
              <small className="text-muted">
                of {performanceData?.total_orders || 0} total
              </small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <FaClock size={30} className={`text-${speedRating?.color || 'secondary'} mb-2`} />
              <h3 className="mb-1">{performanceData?.avg_preparation_time || 'N/A'}</h3>
              <p className="text-muted mb-1">Avg Prep Time</p>
              <Badge bg={speedRating?.color || 'secondary'}>
                {speedRating?.rating || 'No Data'}
              </Badge>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <FaStar size={30} className="text-warning mb-2" />
              <h3 className="mb-1">{performanceData?.customer_ratings || 'N/A'}</h3>
              <p className="text-muted mb-1">Customer Rating</p>
              <div className="mt-1">
                {performanceData?.customer_ratings ? (
                  [...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={i < Math.floor(performanceData.customer_ratings) ? 'text-warning' : 'text-muted'}
                      size={12}
                    />
                  ))
                ) : (
                  <small className="text-muted">No ratings yet</small>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Detailed Metrics */}
      <Row className="mb-4">
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <FaChartLine className="me-2" />
                Performance Breakdown
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Order Completion Rate</span>
                  <span className="fw-bold">
                    {performanceData?.total_orders ?
                      Math.round((performanceData.orders_completed / performanceData.total_orders) * 100) : 0
                    }%
                  </span>
                </div>
                <ProgressBar
                  variant="success"
                  now={performanceData?.total_orders ?
                    (performanceData.orders_completed / performanceData.total_orders) * 100 : 0
                  }
                  style={{ height: '8px' }}
                />
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Speed Efficiency</span>
                  <span className="fw-bold">
                    {performanceData?.avg_preparation_time ? 'Good' : 'N/A'}
                  </span>
                </div>
                <ProgressBar
                  variant="info"
                  now={performanceData?.avg_preparation_time ? 75 : 0}
                  style={{ height: '8px' }}
                />
              </div>

              <div className="mb-0">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Quality Consistency</span>
                  <span className="fw-bold">High</span>
                </div>
                <ProgressBar
                  variant="warning"
                  now={85}
                  style={{ height: '8px' }}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <FaExclamationTriangle className="me-2" />
                Areas for Improvement
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <h6 className="text-warning">⚠️ Speed Consistency</h6>
                <small className="text-muted">
                  Your preparation times vary significantly. Focus on maintaining consistent timing.
                </small>
              </div>

              <div className="mb-3">
                <h6 className="text-info">💡 Latte Art Skills</h6>
                <small className="text-muted">
                  Consider practicing latte art techniques to improve presentation quality.
                </small>
              </div>

              <div className="mb-0">
                <h6 className="text-success">✅ Customer Service</h6>
                <small className="text-muted">
                  Your customer ratings are excellent! Keep up the great work.
                </small>
              </div>
            </Card.Body>
          </Card>

          <Card className="mt-3">
            <Card.Header>
              <h5 className="mb-0">
                <FaCalendarAlt className="me-2" />
                Today's Tasks
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center py-3">
                <FaCalendarAlt size={24} className="text-muted mb-2" />
                <p className="text-muted mb-0">Task tracking not yet implemented</p>
                <small className="text-muted">
                  Daily task assignments will appear here
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Achievement Badges */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">
            <FaTrophy className="me-2" />
            Recent Achievements
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4} className="mb-3">
              <div className="text-center p-3 border rounded">
                <FaCheckCircle size={24} className="text-success mb-2" />
                <h6>Order Master</h6>
                <small className="text-muted">Completed 10+ orders today</small>
              </div>
            </Col>

            <Col md={4} className="mb-3">
              <div className="text-center p-3 border rounded">
                <FaClock size={24} className="text-info mb-2" />
                <h6>Speed Demon</h6>
                <small className="text-muted">Average prep time under 12 min</small>
              </div>
            </Col>

            <Col md={4} className="mb-3">
              <div className="text-center p-3 border rounded">
                <FaStar size={24} className="text-warning mb-2" />
                <h6>Quality Champion</h6>
                <small className="text-muted">Customer rating above 4.5</small>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TrainingInsights;