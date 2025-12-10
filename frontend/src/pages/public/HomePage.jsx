import React from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaCoffee, FaLeaf, FaTruck, FaAward } from 'react-icons/fa';
import HomepageRecommendations from '../../components/public/HomepageRecommendations';

const HomePage = () => {
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

      {/* Featured Products / Recommendations */}
      <section className="py-5">
        <Container>
          <HomepageRecommendations />
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
