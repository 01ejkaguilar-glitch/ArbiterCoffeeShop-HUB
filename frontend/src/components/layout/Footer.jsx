import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FaFacebook, FaInstagram, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import { FaTiktok } from 'react-icons/fa6';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <Container>
        <Row className="g-4">
          {/* Brand Section */}
          <Col lg={4} md={6}>
            <div className="d-flex align-items-center mb-3">
              <img 
                src="/assets/arbiter-logo-white.png" 
                className="me-2 brand-logo"
                alt="Arbiter Coffee Hub Logo"
                width="40"
                height="40"
                loading="lazy"
              />
              <h4 className="mb-0 text-white">Arbiter Coffee Hub</h4>
            </div>
            <p className="footer-brand-text">
              Specialty coffee experience delivered with passion. Serving the finest coffee beans
              and artisan beverages since our establishment.
            </p>
            <div className="d-flex gap-2 mt-3">
              <a href="https://www.facebook.com/profile.php?id=100085413528378" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Visit our Facebook page">
                <FaFacebook />
              </a>
              <a href="https://instagram.com/arbitercoffee.ph" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Visit our Instagram page">
                <FaInstagram />
              </a>
              <a href="https://tiktok.com/@arbitercoffee.ph" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Visit our TikTok page">
                <FaTiktok />
              </a>
            </div>
          </Col>

          {/* Quick Links */}
          <Col lg={2} md={3} sm={6}>
            <h5>Quick Links</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/" className="text-decoration-none">Home</Link>
              </li>
              <li className="mb-2">
                <Link to="/products" className="text-decoration-none">Products</Link>
              </li>
              <li className="mb-2">
                <Link to="/announcements" className="text-decoration-none">Announcements</Link>
              </li>
              <li className="mb-2">
                <Link to="/about" className="text-decoration-none">About Us</Link>
              </li>
              <li className="mb-2">
                <Link to="/contact" className="text-decoration-none">Contact</Link>
              </li>
            </ul>
          </Col>

          {/* Services */}
          <Col lg={3} md={3} sm={6}>
            <h5>Services</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/inquiries" className="text-decoration-none">Barista Training</Link>
              </li>
              <li className="mb-2">
                <Link to="/inquiries" className="text-decoration-none">Arbiter Express</Link>
              </li>
              <li className="mb-2">
                <Link to="/orders" className="text-decoration-none">Track Order</Link>
              </li>
              <li className="mb-2">
                <Link to="/profile" className="text-decoration-none">My Account</Link>
              </li>
              <li className="mb-2">
                <Link to="/cart" className="text-decoration-none">Shopping Cart</Link>
              </li>
            </ul>
          </Col>

          {/* Contact Info */}
          <Col lg={3} md={6}>
            <h5>Contact Us</h5>
            <ul className="list-unstyled">
              <li className="mb-3 d-flex align-items-start">
                <FaMapMarkerAlt className="mt-1 me-2 flex-shrink-0" style={{ color: 'var(--color-medium-green)', opacity: 0.8 }} />
                <span style={{ color: 'rgba(255,255,255,0.65)' }}>Behind House 146, Bagong Bayan 2, Bongabong, 5211 Oriental Mindoro</span>
              </li>
              <li className="mb-3 d-flex align-items-center">
                <FaPhone className="me-2 flex-shrink-0" style={{ color: 'var(--color-medium-green)', opacity: 0.8 }} />
                <a href="tel:09772788903" className="text-decoration-none">
                  0977 278 8903
                </a>
              </li>
              <li className="mb-3 d-flex align-items-center">
                <FaEnvelope className="me-2 flex-shrink-0" style={{ color: 'var(--color-medium-green)', opacity: 0.8 }} />
                <a href="mailto:arbitercoffee.ph@gmail.com" className="text-decoration-none">
                  arbitercoffee.ph@gmail.com
                </a>
              </li>
            </ul>
          </Col>
        </Row>

        {/* Bottom Footer */}
        <div className="footer-bottom">
          <Row className="align-items-center">
            <Col md={6} className="text-center text-md-start mb-3 mb-md-0">
              <p className="mb-0" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'var(--font-size-sm)' }}>
                &copy; {currentYear} Arbiter Coffee Hub. All rights reserved.
              </p>
            </Col>
            <Col md={6} className="text-center text-md-end">
              <Link to="/privacy" className="text-decoration-none me-3" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'var(--font-size-sm)' }}>
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-decoration-none" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'var(--font-size-sm)' }}>
                Terms of Service
              </Link>
            </Col>
          </Row>
        </div>
      </Container>
    </footer>
  );
};

export default React.memo(Footer);
