import React from 'react';
import { Card } from 'react-bootstrap';

const AdminChartSection = ({ stats, analyticsData }) => {
  return (
    <Card className="admin-card">
      <Card.Body>
        <h5 className="fw-semibold mb-3">Sales Overview</h5>
        <pre className="mb-0 small text-muted">{JSON.stringify({ stats, analyticsData }, null, 2)}</pre>
      </Card.Body>
    </Card>
  );
};

export default AdminChartSection;