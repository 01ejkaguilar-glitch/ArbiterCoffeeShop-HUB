import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FaFacebook, FaInstagram, FaTwitter, FaCoffee, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <Container>
        <Row>
          {/* Brand Section */}
          <Col md={4} className="mb-4">
            <div className="d-flex align-items-center mb-3">
              <img 
                src="/assets/arbiter-logo-white.png" 
                height="40"
                className="me-2"
                style={{ objectFit: 'contain' }}
              />
              <h4 className="mb-0 text-white">Arbiter Coffee Hub</h4>
            </div>
            <p className="text-light">
              Specialty coffee experience delivered with passion. Serving the finest coffee beans
              and artisan beverages since our establishment.
            </p>
            <div className="d-flex gap-3 mt-3">
              <a href="https://www.facebook.com/profile.php?id=100085413528378" target="_blank" rel="noopener noreferrer" className="text-success">
                <FaFacebook size={24} />
              </a>
              <a href="https://instagram.com/arbitercoffee.ph" target="_blank" rel="noopener noreferrer" className="text-success">
                <FaInstagram size={24} />
              </a>
              <a href="https://tiktok.com/@arbitercoffee.ph" target="_blank" rel="noopener noreferrer" className="text-success">
                <FaTwitter size={24} />
              </a>
            </div>
          </Col>

          {/* Quick Links */}
          <Col md={2} className="mb-4">
            <h5 className="text-white mb-3">Quick Links</h5>
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
          <Col md={3} className="mb-4">
            <h5 className="text-white mb-3">Services</h5>
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
          <Col md={3} className="mb-4">
            <h5 className="text-white mb-3">Contact Us</h5>
            <ul className="list-unstyled">
              <li className="mb-3 d-flex align-items-start">
                <FaMapMarkerAlt className="text-success mt-1 me-2 flex-shrink-0" />
                <span className="text-light">Behind House, 146 Bagong Bayan 2, Bongabong, 5211 Oriental Mindoro</span>
              </li>
              <li className="mb-3 d-flex align-items-center">
                <FaPhone className="text-success me-2 flex-shrink-0" />
                <a href="tel:09772788903" className="text-decoration-none text-light">
                  0977 278 8903
                </a>
              </li>
              <li className="mb-3 d-flex align-items-center">
                <FaEnvelope className="text-success me-2 flex-shrink-0" />
                <a href="mailto:arbitercoffee.ph@gmail.com" className="text-decoration-none text-light">
                  arbitercoffee.ph@gmail.com
                </a>
              </li>
            </ul>
          </Col>
        </Row>

        <hr className="border-secondary my-4" />

        {/* Bottom Footer */}
        <Row>
          <Col md={6} className="text-center text-md-start mb-3 mb-md-0">
            <p className="text-light mb-0">
              &copy; {currentYear} Arbiter Coffee Hub. All rights reserved.
            </p>
          </Col>
          <Col md={6} className="text-center text-md-end">
            <Link to="/privacy" className="text-decoration-none text-success me-3">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-decoration-none text-success">
              Terms of Service
            </Link>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
