import React, { useMemo } from 'react';
import { Row, Col } from 'react-bootstrap';
import { SalesLineChart, RevenuePieChart } from '../../../components/charts';

const AdminChartSection = ({ analyticsData }) => {
  // Real daily sales from API: [{ date, total, orders }]
  const dailySales = useMemo(() => {
    const raw = analyticsData?.daily_sales || [];
    if (raw.length > 0) {
      return raw.map(d => ({
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: parseFloat(d.total) || 0,
        orders: parseInt(d.orders) || 0,
      }));
    }
    // Empty placeholder — no fake data
    return [];
  }, [analyticsData]);

  // Real revenue by category from API: [{ name, revenue }]
  const revenueByCategory = useMemo(() => {
    const raw = analyticsData?.revenueByCategory || [];
    if (raw.length > 0) {
      return raw.map(c => ({ name: c.name, value: parseFloat(c.revenue) || 0 }));
    }
    return [];
  }, [analyticsData]);

  const hasData = dailySales.length > 0 || revenueByCategory.length > 0;

  if (!hasData) {
    return (
      <div className="text-center text-muted py-5 mb-5">
        <p className="mb-0">No analytics data available for this period.</p>
      </div>
    );
  }

  return (
    <Row className="g-4 mb-5">
      {dailySales.length > 0 && (
        <Col lg={revenueByCategory.length > 0 ? 7 : 12}>
          <SalesLineChart
            data={dailySales}
            title="Daily Sales — This Month"
            subtitle="Revenue per day based on paid orders"
            dataKey="sales"
            xAxisKey="date"
            height={300}
            valuePrefix="₱"
          />
        </Col>
      )}
      {revenueByCategory.length > 0 && (
        <Col lg={dailySales.length > 0 ? 5 : 12}>
          <RevenuePieChart
            data={revenueByCategory}
            title="Revenue by Category"
            subtitle="Actual breakdown from paid orders this month"
            height={300}
            innerRadius={55}
            outerRadius={95}
            showLabel={false}
          />
        </Col>
      )}
    </Row>
  );
};

export default AdminChartSection;
