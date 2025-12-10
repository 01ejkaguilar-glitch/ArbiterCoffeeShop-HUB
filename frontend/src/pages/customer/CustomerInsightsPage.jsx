import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Tabs, Tab, Button } from 'react-bootstrap';
import { FaChartLine, FaHeart, FaLightbulb, FaDownload } from 'react-icons/fa';
import { CustomerInsightsCard } from '../../components/customer';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';

const CustomerInsightsPage = () => {
  const [insightsData, setInsightsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFullInsights();
  }, []);

  const fetchFullInsights = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(API_ENDPOINTS.CUSTOMER_INSIGHTS.INSIGHTS);
      if (response.success) {
        setInsightsData(response.data);
      } else {
        setError('Failed to load customer insights');
      }
    } catch (err) {
      setError('Failed to load customer insights');
      console.error('Full insights fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportInsights = () => {
    // Create a simple text export of insights
    const exportData = {
      timestamp: new Date().toISOString(),
      insights: insightsData
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `customer-insights-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" size="lg">
          <span className="visually-hidden">Loading your insights...</span>
        </Spinner>
        <p className="mt-3">Analyzing your coffee journey...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Unable to Load Insights</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={fetchFullInsights}>
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h1 className="display-5 fw-bold">Your Coffee Insights</h1>
              <p className="lead text-muted">Discover your coffee preferences and shopping patterns</p>
            </div>
            <Button
              variant="outline-primary"
              onClick={handleExportInsights}
              className="d-flex align-items-center"
            >
              <FaDownload className="me-2" />
              Export Data
            </Button>
          </div>
        </Col>
      </Row>

      <Tabs defaultActiveKey="overview" className="mb-4">
        <Tab eventKey="overview" title="Overview">
          <CustomerInsightsCard />
        </Tab>

        <Tab eventKey="detailed" title="Detailed Analytics">
          <Row className="g-4">
            <Col lg={6}>
              <Card className="shadow-sm">
                <Card.Header className="bg-primary text-white">
                  <FaChartLine className="me-2" />
                  Purchase History Analysis
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <strong>Total Orders:</strong> {insightsData?.purchase_behavior?.total_orders || 0}
                  </div>
                  <div className="mb-3">
                    <strong>Average Order Value:</strong> ₱{insightsData?.purchase_behavior?.avg_order_value?.toFixed(2) || '0.00'}
                  </div>
                  <div className="mb-3">
                    <strong>Frequency Tier:</strong> {insightsData?.purchase_behavior?.frequency_tier || 'N/A'}
                  </div>
                  <div>
                    <strong>Days Since Last Order:</strong> {insightsData?.purchase_behavior?.days_since_last_order || 0}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6}>
              <Card className="shadow-sm">
                <Card.Header className="bg-success text-white">
                  <FaHeart className="me-2" />
                  Product Preferences
                </Card.Header>
                <Card.Body>
                  {insightsData?.product_affinity?.favorite_products?.length > 0 ? (
                    <div>
                      <h6>Your Top Products:</h6>
                      <ul className="list-unstyled">
                        {insightsData.product_affinity.favorite_products.slice(0, 5).map((product, index) => (
                          <li key={index} className="mb-2">
                            <strong>{product.name}</strong> - Ordered {product.order_count} times
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-muted">No product preferences available yet.</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="predictions" title="Predictions">
          <Card className="shadow-sm">
            <Card.Header className="bg-info text-white">
              <FaLightbulb className="me-2" />
              Future Insights
            </Card.Header>
            <Card.Body>
              {insightsData?.predictions ? (
                <div>
                  <div className="mb-3">
                    <strong>Predicted Next Purchase:</strong> {insightsData.predictions.next_purchase_date || 'N/A'}
                  </div>
                  <div className="mb-3">
                    <strong>Lifecycle Stage:</strong> {insightsData.predictions.lifecycle_stage || 'N/A'}
                  </div>
                  <div>
                    <strong>Retention Risk:</strong> {insightsData.predictions.retention_risk || 'Low'}
                  </div>
                </div>
              ) : (
                <p className="text-muted">Prediction data will be available after more purchase history.</p>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default CustomerInsightsPage;