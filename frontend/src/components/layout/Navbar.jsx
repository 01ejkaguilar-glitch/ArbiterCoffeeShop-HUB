import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BSNavbar, Nav, Container, Badge, Dropdown } from 'react-bootstrap';
import { FaShoppingCart, FaUser, FaCoffee, FaSignOutAlt, FaTachometerAlt, FaUtensils, FaChartLine } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const closeNav = () => setExpanded(false);

  return (
    <BSNavbar bg="dark" variant="dark" expand="lg" expanded={expanded} onToggle={setExpanded} sticky="top" className="shadow-sm">
      <Container>
        <BSNavbar.Brand as={Link} to="/" onClick={closeNav} className="d-flex align-items-center">
          <img 
            src="/assets/arbiter-logo.png" 
            height="40" 
            className="me-2"
            style={{ objectFit: 'contain' }}
          />
          <span className="fw-bold">Arbiter Coffee Hub</span>
        </BSNavbar.Brand>
        
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-lg-center">
            <Nav.Link as={Link} to="/" onClick={closeNav}>
              Home
            </Nav.Link>
            <Nav.Link as={Link} to="/products" onClick={closeNav}>
              Products
            </Nav.Link>
            <Nav.Link as={Link} to="/about" onClick={closeNav}>
              About
            </Nav.Link>
            <Nav.Link as={Link} to="/announcements" onClick={closeNav}>
              Announcements
            </Nav.Link>
            <Nav.Link as={Link} to="/inquiries" onClick={closeNav}>
              Services
            </Nav.Link>
            <Nav.Link as={Link} to="/contact" onClick={closeNav}>
              Contact
            </Nav.Link>

            {/* Cart Icon */}
            <Nav.Link as={Link} to="/cart" onClick={closeNav} className="position-relative mx-2">
              <FaShoppingCart size={20} />
              {cartCount > 0 && (
                <Badge bg="danger" pill className="position-absolute top-0 start-100 translate-middle">
                  {cartCount}
                </Badge>
              )}
            </Nav.Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <Dropdown align="end" className="ms-2">
                <Dropdown.Toggle variant="success" id="dropdown-user">
                  <FaUser className="me-2" />
                  {user?.name || 'User'}
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/dashboard" onClick={closeNav}>
                    <FaTachometerAlt className="me-2" />
                    Dashboard
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/profile" onClick={closeNav}>
                    <FaUser className="me-2" />
                    Profile
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/orders" onClick={closeNav}>
                    <FaShoppingCart className="me-2" />
                    Orders
                  </Dropdown.Item>
                  
                  {user?.roles?.includes('admin') && (
                    <>
                      <Dropdown.Divider />
                      <Dropdown.Item as={Link} to="/admin" onClick={closeNav}>
                        Admin Panel
                      </Dropdown.Item>
                    </>
                  )}

                  {user?.roles?.includes('barista') && (
                    <>
                      <Dropdown.Divider />
                      <Dropdown.Header>Barista Portal</Dropdown.Header>
                      <Dropdown.Item as={Link} to="/barista/dashboard" onClick={closeNav}>
                        <FaCoffee className="me-2" />
                        Barista Dashboard
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to="/barista/orders" onClick={closeNav}>
                        <FaUtensils className="me-2" />
                        Order Queue
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to="/barista/beans" onClick={closeNav}>
                        <FaCoffee className="me-2" />
                        Coffee Beans
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to="/barista/training" onClick={closeNav}>
                        <FaChartLine className="me-2" />
                        Training Insights
                      </Dropdown.Item>
                    </>
                  )}
                  
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={() => { handleLogout(); closeNav(); }}>
                    <FaSignOutAlt className="me-2" />
                    Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" onClick={closeNav} className="ms-2">
                  <span className="btn btn-outline-light btn-sm">Login</span>
                </Nav.Link>
                <Nav.Link as={Link} to="/register" onClick={closeNav} className="ms-2">
                  <span className="btn btn-primary btn-sm">Register</span>
                </Nav.Link>
              </>
            )}
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;
