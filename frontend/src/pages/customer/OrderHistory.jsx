import React from 'react';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';

const OrderHistory = () => {
  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h1 className="display-5 fw-bold">Order History</h1>
          <p className="lead text-muted">View and track your orders</p>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="text-center py-5">
                <p className="text-muted">No orders yet</p>
                <Button variant="primary" href="/products">
                  Start Shopping
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderHistory;
