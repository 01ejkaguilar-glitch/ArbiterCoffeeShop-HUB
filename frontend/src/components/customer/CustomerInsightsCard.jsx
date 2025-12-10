import React from 'react';
import { Row, Col } from 'react-bootstrap';
import EngagementScoreCard from './EngagementScoreCard';
import PurchaseBehaviorCard from './PurchaseBehaviorCard';
import ProductAffinityCard from './ProductAffinityCard';
import RecommendationsCard from './RecommendationsCard';

const CustomerInsightsCard = () => {
  return (
    <Row className="g-4 mb-5">
      <Col lg={6}>
        <EngagementScoreCard />
      </Col>
      <Col lg={6}>
        <PurchaseBehaviorCard />
      </Col>
      <Col lg={6}>
        <ProductAffinityCard />
      </Col>
      <Col lg={6}>
        <RecommendationsCard />
      </Col>
    </Row>
  );
};

export default CustomerInsightsCard;