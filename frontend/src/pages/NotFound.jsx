import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaHome, FaCoffee, FaEnvelope, FaSearch } from 'react-icons/fa';
import SEO from '../components/SEO';

/**
 * NotFound - Custom 404 Page
 * Displays a user-friendly error page with navigation options
 */
const NotFound = () => {
  return (
    <main role="main">
      <div className="not-found-page">
        <SEO 
          title="Page Not Found - 404"
          description="Sorry, the page you're looking for doesn't exist. Browse our coffee products or return to the homepage."
          url={window.location.pathname}
          type="website"
        />
        
        <Container className="py-5">
          <Row className="justify-content-center text-center">
            <Col md={8} lg={6}>
              {/* 404 Illustration */}
              <header className="mb-5">
                <h1 className="display-1 fw-bold notfound-heading">
                  404
                </h1>
                <FaCoffee size={80} className="text-muted mb-3" aria-hidden="true" />

                <h2 className="mb-3">Oops! Page Not Found</h2>
                <p className="lead text-muted">
                  The page you're looking for seems to have been moved, deleted, or doesn't exist. 
                  Don't worry, let's get you back on track!
                </p>
              </header>

            {/* Quick Actions */}
            <Row className="g-3 mb-5">
              <Col sm={6}>
                <Link to="/" className="text-decoration-none" aria-label="Go to homepage">
                  <Card className="h-100 shadow-sm hover-shadow">
                    <Card.Body className="d-flex flex-column align-items-center py-4">
                      <FaHome size={40} className="mb-3 text-coffee" aria-hidden="true" />
                      <h5>Go Home</h5>
                      <p className="text-muted small mb-0">
                        Return to homepage
                      </p>
                    </Card.Body>
                  </Card>
                </Link>
              </Col>

              <Col sm={6}>
                <Link to="/products" className="text-decoration-none" aria-label="Browse coffee products">
                  <Card className="h-100 shadow-sm hover-shadow">
                    <Card.Body className="d-flex flex-column align-items-center py-4">
                      <FaCoffee size={40} className="mb-3 text-coffee" aria-hidden="true" />
                      <h5>Browse Coffee</h5>
                      <p className="text-muted small mb-0">
                        Explore our products
                      </p>
                    </Card.Body>
                  </Card>
                </Link>
              </Col>

              <Col sm={6}>
                <Link to="/contact" className="text-decoration-none" aria-label="Contact us">
                  <Card className="h-100 shadow-sm hover-shadow">
                    <Card.Body className="d-flex flex-column align-items-center py-4">
                      <FaEnvelope size={40} className="mb-3 text-coffee" aria-hidden="true" />
                      <h5>Contact Us</h5>
                      <p className="text-muted small mb-0">
                        Get in touch
                      </p>
                    </Card.Body>
                  </Card>
                </Link>
              </Col>

              <Col sm={6}>
                <Link to="/about" className="text-decoration-none" aria-label="Learn about us">
                  <Card className="h-100 shadow-sm hover-shadow">
                    <Card.Body className="d-flex flex-column align-items-center py-4">
                      <FaSearch size={40} className="mb-3 text-coffee" aria-hidden="true" />
                      <h5>About Us</h5>
                      <p className="text-muted small mb-0">
                        Learn our story
                      </p>
                    </Card.Body>
                  </Card>
                </Link>
              </Col>
            </Row>

            {/* Additional Help */}
            <div className="text-muted">
              <p className="mb-2">
                <strong>Looking for something specific?</strong>
              </p>
              <p className="small">
                Try using the navigation menu above or{' '}
                <Link to="/contact" className="text-primary">
                  contact us
                </Link>{' '}
                if you need help finding what you're looking for.
              </p>
            </div>
          </Col>
        </Row>
      </Container>

      <style>{`
        .not-found-page {
          min-height: calc(100vh - 200px);
          display: flex;
          align-items: center;
        }

        .hover-shadow {
          transition: all 0.3s ease;
        }

        .hover-shadow:hover {
          transform: translateY(-5px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
        }

        .hover-shadow:hover .card-body {
          color: var(--color-coffee-brown);
        }
      `}</style>
      </div>
    </main>
  );
};

export default NotFound;
