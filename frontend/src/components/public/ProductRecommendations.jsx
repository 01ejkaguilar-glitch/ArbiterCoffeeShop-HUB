import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import { FaLightbulb, FaShoppingCart, FaStar } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api.service';
import { API_ENDPOINTS, BACKEND_BASE_URL } from '../../config/api';

const ProductRecommendations = ({ currentProductId, limit = 3 }) => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchPersonalizedRecommendations();
    } else {
      fetchRelatedProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentProductId]);

  const fetchPersonalizedRecommendations = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(API_ENDPOINTS.RECOMMENDATIONS.PRODUCTS);
      if (response.success) {
        // Filter out the current product and limit results
        const filteredRecommendations = (response.data || [])
          .filter(rec => rec.product.id !== currentProductId)
          .slice(0, limit);
        setRecommendations(filteredRecommendations);
      } else {
        // Fallback to related products
        await fetchRelatedProducts();
      }
    } catch (err) {
      console.error('Personalized recommendations fetch error:', err);
      // Fallback to related products
      await fetchRelatedProducts();
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    try {
      setLoading(true);
      // Get all products and filter out current product
      const response = await apiService.get(API_ENDPOINTS.PRODUCTS.LIST, { limit: 10 });
      if (response.success && response.data) {
        const productsData = response.data.data || response.data;
        const productsArray = Array.isArray(productsData) ? productsData : [];

        // Filter out current product and take a few random ones
        const relatedProducts = productsArray
          .filter(product => product.id !== currentProductId)
          .slice(0, limit)
          .map(product => ({
            product: product,
            score: 40, // Default score for related products
            reason: 'You might also like this'
          }));

        setRecommendations(relatedProducts);
      } else {
        setRecommendations([]);
      }
    } catch (err) {
      console.error('Related products fetch error:', err);
      setError('Unable to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-3">
        <Spinner animation="border" size="sm" role="status">
          <span className="visually-hidden">Loading recommendations...</span>
        </Spinner>
        <small className="text-muted ms-2">Finding similar products...</small>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="warning" className="py-2">
        <small>Unable to load product recommendations.</small>
      </Alert>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="mt-5">
      <h4 className="mb-3">
        {user ? (
          <>
            <FaLightbulb className="text-warning me-2" />
            You Might Also Like
          </>
        ) : (
          <>
            <FaStar className="text-warning me-2" />
            Similar Products
          </>
        )}
      </h4>

      <Row className="g-3">
        {recommendations.map((recommendation, index) => (
          <Col key={recommendation.product.id || index} md={4}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Img
                variant="top"
                src={recommendation.product.image_url ? 
                  `${BACKEND_BASE_URL}${recommendation.product.image_url}` : 
                  '/assets/images/product-placeholder.png'}
                alt={recommendation.product.name}
                className="product-image"
                style={{ height: '150px', objectFit: 'cover' }}
                onError={(e) => { e.target.src = '/assets/images/product-placeholder.png'; }}
              />
              <Card.Body className="d-flex flex-column p-3">
                <Card.Title className="h6 mb-1">{recommendation.product.name}</Card.Title>
                <Card.Text className="text-muted small mb-2 flex-grow-1">
                  {recommendation.product.description
                    ? recommendation.product.description.length > 60
                      ? recommendation.product.description.substring(0, 60) + '…'
                      : recommendation.product.description
                    : ''}
                </Card.Text>
                <div className="d-flex justify-content-between align-items-center mt-auto">
                  <span className="fw-bold text-primary">₱{parseFloat(recommendation.product.price).toFixed(2)}</span>
                  <Button
                    as={Link}
                    to={`/products/${recommendation.product.id}`}
                    variant="outline-primary"
                    size="sm"
                  >
                    <FaShoppingCart size={12} />
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ProductRecommendations;