import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Spinner, Alert, Container } from 'react-bootstrap';
import { FaLightbulb, FaShoppingCart, FaStar } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api.service';
import { API_ENDPOINTS, BACKEND_BASE_URL } from '../../config/api';

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
  }, [user]);

  const fetchPersonalizedRecommendations = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(API_ENDPOINTS.RECOMMENDATIONS.HOMEPAGE);
      if (response.success && response.data) {
        const { recommended_products, recommended_coffee_beans, is_authenticated } = response.data;
        
        // Combine products and coffee beans into recommendations
        const allRecommendations = [];
        
        // Add products
        if (recommended_products && Array.isArray(recommended_products)) {
          recommended_products.forEach(product => {
            allRecommendations.push({
              product: product,
              score: is_authenticated ? 80 : 60, // Higher score for personalized
              reason: product.reason || (is_authenticated ? 'Recommended for you' : 'Popular choice')
            });
          });
        }
        
        // Add coffee beans (limit to 2 to keep total reasonable)
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
        // Fallback to popular products if recommendations fail
        await fetchPopularProducts();
      }
    } catch (err) {
      console.error('Personalized recommendations fetch error:', err);
      // Fallback to popular products
      await fetchPopularProducts();
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
          score: 50, // Default score for popular products
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
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading recommendations...</span>
        </Spinner>
        <p className="text-muted mt-2">Finding the perfect coffee for you...</p>
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
    <section className="py-5 bg-light">
      <Container>
        <div className="text-center mb-5">
          <h2 className="display-5 fw-bold">
            {user ? (
              <>
                <FaLightbulb className="text-warning me-2" />
                Recommended for You
              </>
            ) : (
              <>
                <FaStar className="text-warning me-2" />
                Popular Picks
              </>
            )}
          </h2>
          <p className="lead text-muted">
            {user
              ? 'Based on your preferences and order history'
              : 'Discover what our customers love most'
            }
          </p>
        </div>

        <Row className="g-4">
          {recommendations.slice(0, 4).map((recommendation, index) => (
            <Col key={recommendation.product.id || index} md={3}>
              <Card className="product-card h-100 shadow-sm">
                <Card.Img
                  variant="top"
                  src={recommendation.product.image_url ? 
                    `${BACKEND_BASE_URL}${recommendation.product.image_url}` : 
                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDMwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjZGRkIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTI1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjM1ZW0iIGZpbGw9IiM5OTkiIGZvbnQtc2l6ZT0iMTYiPkNvZmZlZTwvdGV4dD4KPHN2Zz4='}
                  className="product-image"
                />
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="h6">{recommendation.product.name}</Card.Title>
                  <Card.Text className="text-muted small flex-grow-1">
                    {recommendation.product.description?.substring(0, 60)}...
                  </Card.Text>
                  {recommendation.reason && (
                    <small className="text-primary mb-2">
                      <FaLightbulb className="me-1" />
                      {recommendation.reason}
                    </small>
                  )}
                  <div className="d-flex justify-content-between align-items-center mt-auto">
                    <span className="fw-bold text-primary">
                      {recommendation.product.is_coffee_bean ? 
                        `₱${recommendation.product.price_per_kg}/kg` : 
                        `₱${recommendation.product.price}`
                      }
                    </span>
                    <Button
                      as={Link}
                      to={recommendation.product.is_coffee_bean ? 
                        "/coffee-beans" : 
                        `/products/${recommendation.product.id}`
                      }
                      variant="primary"
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

        <div className="text-center mt-4">
          <Button as={Link} to="/products" variant="outline-primary">
            View All Products
          </Button>
        </div>
      </Container>
    </section>
  );
};

export default HomepageRecommendations;