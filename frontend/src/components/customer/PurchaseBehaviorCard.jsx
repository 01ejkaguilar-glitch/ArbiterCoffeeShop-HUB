import React, { useState, useEffect } from 'react';
import { Card, Spinner, Alert, Badge, Row, Col } from 'react-bootstrap';
import { FaShoppingCart, FaCalendarAlt, FaMoneyBillWave, FaClock } from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';

const PurchaseBehaviorCard = () => {
  const [behaviorData, setBehaviorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPurchaseBehavior();
  }, []);

  const fetchPurchaseBehavior = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(API_ENDPOINTS.CUSTOMER_INSIGHTS.PURCHASE_BEHAVIOR);
      if (response.success) {
        setBehaviorData(response.data);
      } else {
        setError('Failed to load purchase behavior');
      }
    } catch (err) {
      setError('Failed to load purchase behavior');
      console.error('Purchase behavior fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFrequencyBadge = (frequency) => {
    const badges = {
      'High': { variant: 'success', text: 'Frequent Buyer' },
      'Medium': { variant: 'warning', text: 'Regular Customer' },
      'Low': { variant: 'secondary', text: 'Occasional Visitor' },
    };
    return badges[frequency] || { variant: 'light', text: frequency };
  };

  const getSpendingBadge = (tier) => {
    const badges = {
      'Premium': { variant: 'primary', text: 'Premium Spender' },
      'Standard': { variant: 'info', text: 'Standard Spender' },
      'Budget': { variant: 'secondary', text: 'Budget Conscious' },
    };
    return badges[tier] || { variant: 'light', text: tier };
  };

  if (loading) {
    return (
      <Card className="h-100">
        <Card.Body className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading purchase behavior...</span>
          </Spinner>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-100">
        <Card.Body>
          <Alert variant="danger" className="mb-0">
            <small>{error}</small>
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  const frequency = behaviorData?.frequency_tier || 'Low';
  const spending = behaviorData?.spending_tier || 'Budget';
  const avgOrder = behaviorData?.avg_order_value || 0;
  const totalOrders = behaviorData?.total_orders || 0;
  const lastOrder = behaviorData?.days_since_last_order || 0;

  return (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Body>
        <div className="d-flex align-items-center mb-3">
          <FaShoppingCart className="text-primary me-2" size={20} />
          <h6 className="mb-0 fw-bold">Purchase Behavior</h6>
        </div>

        <Row className="g-3">
          <Col xs={6}>
            <div className="text-center">
              <div className="d-flex align-items-center justify-content-center mb-1">
                <FaCalendarAlt className="text-info me-1" size={14} />
                <small className="text-muted">Frequency</small>
              </div>
              <Badge bg={getFrequencyBadge(frequency).variant} className="fs-6">
                {getFrequencyBadge(frequency).text}
              </Badge>
            </div>
          </Col>

          <Col xs={6}>
            <div className="text-center">
              <div className="d-flex align-items-center justify-content-center mb-1">
                <FaMoneyBillWave className="text-success me-1" size={14} />
                <small className="text-muted">Spending</small>
              </div>
              <Badge bg={getSpendingBadge(spending).variant} className="fs-6">
                {getSpendingBadge(spending).text}
              </Badge>
            </div>
          </Col>

          <Col xs={6}>
            <div className="text-center">
              <small className="text-muted d-block">Avg Order</small>
              <span className="fw-bold text-primary">₱{avgOrder.toFixed(2)}</span>
            </div>
          </Col>

          <Col xs={6}>
            <div className="text-center">
              <small className="text-muted d-block">Total Orders</small>
              <span className="fw-bold text-dark">{totalOrders}</span>
            </div>
          </Col>
        </Row>

        <hr className="my-3" />

        <div className="d-flex align-items-center justify-content-between">
          <small className="text-muted">
            <FaClock className="me-1" />
            Last order: {lastOrder} days ago
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default PurchaseBehaviorCard;