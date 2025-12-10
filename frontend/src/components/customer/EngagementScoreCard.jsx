import React, { useState, useEffect } from 'react';
import { Card, Spinner, Alert, ProgressBar, Badge } from 'react-bootstrap';
import { FaStar, FaUsers } from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';

const EngagementScoreCard = () => {
  const [engagementData, setEngagementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEngagementScore();
  }, []);

  const fetchEngagementScore = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(API_ENDPOINTS.CUSTOMER_INSIGHTS.ENGAGEMENT_SCORE);
      if (response.success) {
        setEngagementData(response.data);
      } else {
        setError('Failed to load engagement score');
      }
    } catch (err) {
      setError('Failed to load engagement score');
      console.error('Engagement score fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Highly Engaged';
    if (score >= 60) return 'Moderately Engaged';
    if (score >= 40) return 'Low Engagement';
    return 'Needs Attention';
  };

  if (loading) {
    return (
      <Card className="h-100">
        <Card.Body className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading engagement score...</span>
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

  const score = engagementData?.cei_score || 0;
  const percentile = engagementData?.percentile || 50; // Default to 50th percentile if not provided
  const tier = engagementData?.engagement_level || 'Bronze';

  return (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Body>
        <div className="d-flex align-items-center mb-3">
          <FaStar className="text-warning me-2" size={20} />
          <h6 className="mb-0 fw-bold">Customer Engagement</h6>
        </div>

        <div className="text-center mb-3">
          <h2 className={`fw-bold text-${getScoreColor(score)} mb-1`}>{score}</h2>
          <small className="text-muted">CEI Score</small>
        </div>

        <ProgressBar
          variant={getScoreColor(score)}
          now={score}
          className="mb-3"
          style={{ height: '8px' }}
        />

        <div className="d-flex justify-content-between align-items-center mb-2">
          <small className="text-muted">
            <FaUsers className="me-1" />
            Top {100 - percentile}%
          </small>
          <Badge bg={tier === 'Gold' ? 'warning' : tier === 'Silver' ? 'secondary' : 'bronze'} className="fs-6">
            {tier}
          </Badge>
        </div>

        <small className="text-muted d-block">
          {getScoreLabel(score)}
        </small>
      </Card.Body>
    </Card>
  );
};

export default EngagementScoreCard;