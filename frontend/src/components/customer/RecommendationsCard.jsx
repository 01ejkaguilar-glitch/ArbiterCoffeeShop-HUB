import React, { useState, useEffect } from 'react';
import { Card, Spinner, Alert, Button, Row, Col } from 'react-bootstrap';
import { FaLightbulb, FaShoppingCart, FaStar } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';

const RecommendationsCard = () => {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(API_ENDPOINTS.RECOMMENDATIONS.PRODUCTS);
      if (response.success) {
        setRecommendations(response.data);
      } else {
        setError('Failed to load recommendations');
      }
    } catch (err) {
      setError('Failed to load recommendations');
      console.error('Recommendations fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="h-100">
        <Card.Body className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading recommendations...</span>
          </Spinner>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-100">
        <Card.Body>
          <Alert variant="danger" className="mb-0">
            <small>{error}</small>
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  const recommendedProducts = recommendations || [];

  return (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Body>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center">
            <FaLightbulb className="text-warning me-2" size={20} />
            <h6 className="mb-0 fw-bold">Recommended for You</h6>
          </div>
          <Link to="/products" className="btn btn-sm btn-outline-primary">
            View All
          </Link>
        </div>

        {recommendedProducts.length > 0 ? (
          <Row className="g-2">
            {recommendedProducts.slice(0, 2).map((recommendation) => (
              <Col xs={12} key={recommendation.product.id}>
                <Card className="border-0 bg-light">
                  <Card.Body className="p-3">
                    <div className="d-flex align-items-start">
                      <div className="flex-grow-1">
                        <h6 className="mb-1 fw-bold">{recommendation.product.name}</h6>
                        <p className="mb-2 text-muted small">{recommendation.product.description}</p>
                        <div className="d-flex align-items-center justify-content-between">
                          <span className="fw-bold text-primary">₱{recommendation.product.price}</span>
                          <div className="d-flex align-items-center">
                            <FaStar className="text-warning me-1" size={12} />
                            <small className="text-muted">{recommendation.product.rating || '4.5'}</small>
                          </div>
                        </div>
                        <small className="text-muted d-block mt-1">{recommendation.reason}</small>
                      </div>
                      <Button
                        as={Link}
                        to={`/products/${recommendation.product.id}`}
                        variant="primary"
                        size="sm"
                        className="ms-2"
                      >
                        <FaShoppingCart size={12} />
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div className="text-center py-4">
            <FaLightbulb className="text-muted mb-2" size={32} />
            <p className="text-muted mb-0 small">
              Complete more orders to get personalized recommendations!
            </p>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default RecommendationsCard;