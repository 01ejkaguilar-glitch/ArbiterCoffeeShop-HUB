import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaShoppingBag, FaUser, FaHeart, FaClipboardList } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const CustomerDashboard = () => {
  const { user } = useAuth();

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h1 className="display-5 fw-bold">Welcome back, {user?.name}!</h1>
          <p className="lead text-muted">Manage your orders and account</p>
        </Col>
      </Row>

      <Row className="g-4">
        <Col md={6} lg={3}>
          <Card as={Link} to="/orders" className="text-decoration-none h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <FaShoppingBag size={48} className="text-primary mb-3" />
              <Card.Title>My Orders</Card.Title>
              <Card.Text className="text-muted">
                View and track your orders
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card as={Link} to="/profile" className="text-decoration-none h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <FaUser size={48} className="text-success mb-3" />
              <Card.Title>Profile</Card.Title>
              <Card.Text className="text-muted">
                Manage your account details
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card as={Link} to="/cart" className="text-decoration-none h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <FaClipboardList size={48} className="text-info mb-3" />
              <Card.Title>Shopping Cart</Card.Title>
              <Card.Text className="text-muted">
                Review items in your cart
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card as={Link} to="/products" className="text-decoration-none h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <FaHeart size={48} className="text-danger mb-3" />
              <Card.Title>Browse Products</Card.Title>
              <Card.Text className="text-muted">
                Discover new coffee
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-5">
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Recent Orders</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted text-center py-4">
                No recent orders. Start shopping now!
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="shadow-sm">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Link to="/products" className="btn btn-outline-primary">
                  Browse Products
                </Link>
                <Link to="/orders" className="btn btn-outline-secondary">
                  Track Order
                </Link>
                <Link to="/profile" className="btn btn-outline-info">
                  Edit Profile
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CustomerDashboard;
