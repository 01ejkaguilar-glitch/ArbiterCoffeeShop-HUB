import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import { FaCoffee, FaShoppingCart, FaArrowRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api.service';
import { API_ENDPOINTS, BACKEND_BASE_URL } from '../../config/api';

const isTransportError = (error) => {
  if (!error) return false;
  return error.code === 'ERR_NETWORK' || !error.response;
};

const HomepageRecommendations = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchPersonalizedRecommendations();
    } else {
      fetchPopularProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchPersonalizedRecommendations = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(API_ENDPOINTS.RECOMMENDATIONS.HOMEPAGE);
      if (response.success && response.data) {
        const { recommended_products, recommended_coffee_beans, is_authenticated } = response.data;
        const allRecommendations = [];

        if (recommended_products && Array.isArray(recommended_products)) {
          recommended_products.forEach(product => {
            allRecommendations.push({
              product: product,
              score: is_authenticated ? 80 : 60,
              reason: product.reason || (is_authenticated ? 'Recommended for you' : 'Popular choice')
            });
          });
        }

        if (recommended_coffee_beans && Array.isArray(recommended_coffee_beans)) {
          recommended_coffee_beans.slice(0, 2).forEach(bean => {
            allRecommendations.push({
              product: {
                ...bean,
                price: bean.price_per_kg,
                is_coffee_bean: true
              },
              score: is_authenticated ? 75 : 55,
              reason: bean.reason || (is_authenticated ? 'Perfect bean match' : 'Featured selection')
            });
          });
        }

        setRecommendations(allRecommendations);
      } else {
        await fetchPopularProducts();
      }
    } catch (err) {
      console.error('Personalized recommendations fetch error:', err);
      if (!isTransportError(err)) {
        await fetchPopularProducts();
      } else {
        setError('Unable to load recommendations');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularProducts = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(API_ENDPOINTS.PRODUCTS.LIST, { limit: 4 });
      if (response.success && response.data) {
        const productsData = response.data.data || response.data;
        const productsArray = Array.isArray(productsData) ? productsData : [];
        setRecommendations(productsArray.slice(0, 4).map(product => ({
          product: product,
          score: 50,
          reason: 'Popular choice among our customers'
        })));
      } else {
        setRecommendations([]);
      }
    } catch (err) {
      console.error('Popular products fetch error:', err);
      setError('Unable to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" role="status" style={{ color: 'var(--color-dark-green)' }}>
          <span className="visually-hidden">Loading recommendations...</span>
        </Spinner>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--spacing-3)' }}>
          Finding the perfect coffee for you...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="warning" className="text-center">
        <small>Unable to load personalized recommendations right now.</small>
      </Alert>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <>
      <Row className="g-4">
        {recommendations.slice(0, 4).map((recommendation, index) => (
          <Col key={recommendation.product.id || index} sm={6} lg={3}>
            <Card className="product-card h-100 recommendation-card">
              <div className="recommendation-img-wrap">
                <Card.Img
                  variant="top"
                  src={recommendation.product.image_url
                    ? `${BACKEND_BASE_URL}${recommendation.product.image_url}`
                    : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDMwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjZGRkIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTI1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjM1ZW0iIGZpbGw9IiM5OTkiIGZvbnQtc2l6ZT0iMTYiPkNvZmZlZTwvdGV4dD4KPHN2Zz4='}
                  alt={`${recommendation.product.name}${recommendation.product.description ? ` - ${recommendation.product.description.substring(0, 80)}` : ''}`}
                  className="product-image"
                  loading="lazy"
                />
              </div>
              <Card.Body className="d-flex flex-column">
                <Card.Title className="recommendation-title">{recommendation.product.name}</Card.Title>
                <Card.Text className="recommendation-desc flex-grow-1">
                  {recommendation.product.description?.substring(0, 80)}
                  {recommendation.product.description?.length > 80 ? '...' : ''}
                </Card.Text>
                {recommendation.reason && (
                  <div className="recommendation-reason">
                    <FaCoffee className="me-1" />
                    {recommendation.reason}
                  </div>
                )}
                <div className="d-flex justify-content-between align-items-center mt-auto pt-3"
                  style={{ borderTop: '1px solid var(--color-border-default)' }}>
                  <span className="recommendation-price">
                    {recommendation.product.is_coffee_bean
                      ? `₱${parseFloat(recommendation.product.price_per_kg || 0).toFixed(2)}/kg`
                      : `₱${parseFloat(recommendation.product.price || 0).toFixed(2)}`
                    }
                  </span>
                  <Button
                    as={Link}
                    to={recommendation.product.is_coffee_bean
                      ? '/coffee-beans'
                      : `/products/${recommendation.product.id}`
                    }
                    variant="primary"
                    size="sm"
                    className="recommendation-btn"
                  >
                    <FaShoppingCart size={12} className="me-1" /> View
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <div className="text-center mt-5">
        <Button as={Link} to="/products" variant="outline-primary" size="lg" className="px-4">
          View All Products <FaArrowRight className="ms-2" />
        </Button>
      </div>
    </>
  );
};

export default HomepageRecommendations;