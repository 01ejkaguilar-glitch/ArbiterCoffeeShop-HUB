import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaCoffee, FaLeaf, FaTruck, FaAward } from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.PRODUCTS.LIST, { limit: 3 });
      if (response.success && response.data) {
        // Handle paginated response - extract the data array
        const productsData = response.data.data || response.data;
        const productsArray = Array.isArray(productsData) ? productsData : [];
        setFeaturedProducts(productsArray.slice(0, 3));
      } else {
        setFeaturedProducts([]);
      }
    } catch (error) {
      console.error('Error fetching featured products:', error);
      setFeaturedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <Row className="align-items-center">
            <Col lg={8} className="mx-auto text-center">
              <h1 className="hero-title fade-in">Welcome to Arbiter Coffee</h1>
              <p className="hero-subtitle fade-in">
                Experience the finest artisan coffee, crafted with passion and served with excellence
              </p>
              <div className="mt-4">
                <Button as={Link} to="/products" variant="light" size="lg" className="me-3">
                  <FaCoffee className="me-2" />
                  Browse Products
                </Button>
                <Button as={Link} to="/about" variant="outline-light" size="lg">
                  Learn More
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-5 bg-light">
        <Container>
          <Row className="g-4">
            <Col md={3}>
              <Card className="text-center border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="mb-3">
                    <FaCoffee size={48} className="text-primary" />
                  </div>
                  <Card.Title>Premium Quality</Card.Title>
                  <Card.Text>
                    Sourced from the finest coffee farms around the world
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="mb-3">
                    <FaLeaf size={48} className="text-success" />
                  </div>
                  <Card.Title>Sustainable</Card.Title>
                  <Card.Text>
                    Eco-friendly practices and ethically sourced beans
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="mb-3">
                    <FaTruck size={48} className="text-info" />
                  </div>
                  <Card.Title>Fast Delivery</Card.Title>
                  <Card.Text>
                    Quick and reliable delivery right to your doorstep
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="mb-3">
                    <FaAward size={48} className="text-warning" />
                  </div>
                  <Card.Title>Award Winning</Card.Title>
                  <Card.Text>
                    Recognized for excellence in coffee craftsmanship
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Featured Products */}
      <section className="py-5">
        <Container>
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold">Featured Products</h2>
            <p className="lead text-muted">Discover our most popular coffee selections</p>
          </div>
          <Row className="g-4">
            {!loading && featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <Col key={product.id} md={4}>
                  <Card className="product-card h-100">
                    <Card.Img 
                      variant="top" 
                      src={product.image_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDMwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjZGRkIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTI1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjM1ZW0iIGZpbGw9IiM5OTkiIGZvbnQtc2l6ZT0iMTYiPkNvZmZlZTwvdGV4dD4KPHN2Zz4='} 
                      className="product-image"
                    />
                    <Card.Body>
                      <Card.Title>{product.name}</Card.Title>
                      <Card.Text className="text-muted">
                        {product.description?.substring(0, 100)}...
                      </Card.Text>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="product-price">₱{product.price}</span>
                        <Button as={Link} to={`/products/${product.id}`} variant="primary">
                          View Details
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            ) : (
              <Col className="text-center">
                <p className="text-muted">Loading featured products...</p>
              </Col>
            )}
          </Row>
          <div className="text-center mt-5">
            <Button as={Link} to="/products" variant="outline-primary" size="lg">
              View All Products
            </Button>
          </div>
        </Container>
      </section>

      {/* Call to Action */}
      <section className="bg-dark text-white py-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={8}>
              <h3 className="mb-3">Start Your Coffee Journey Today</h3>
              <p className="lead mb-0">
                Join thousands of satisfied customers enjoying premium coffee delivered fresh to their door
              </p>
            </Col>
            <Col lg={4} className="text-lg-end">
              <Button as={Link} to="/register" variant="success" size="lg">
                Sign Up Now
              </Button>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default HomePage;
