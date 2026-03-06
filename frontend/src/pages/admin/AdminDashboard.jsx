import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaShoppingBag, FaUsers, FaBoxes, FaUserCheck, FaUserClock, FaDollarSign, FaBell, FaChartLine, FaArrowRight } from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import { useBaristaOrders, useInventoryAlerts } from '../../hooks/useBroadcast';
import { useNotificationSystem } from '../../components/common/NotificationSystem';
import PageShell from '../../components/layout/PageShell';
import DashboardStatGrid from '../../components/dashboard/DashboardStatGrid';
import ConnectionStatus from '../../components/common/ConnectionStatus';
import '../../components/dashboard/EnhancedStatCard.css';
import '../../styles/admin.css';
import AdminChartSection from './components/AdminChartSection';
import AdminRecentOrders from './components/AdminRecentOrders';

const AdminDashboard = () => {
  const { showSuccessNotification, showLowStockAlert } = useNotificationSystem();

  // Real-time order notifications
  const { isConnected: ordersConnected, pendingOrders } = useBaristaOrders((newOrder) => {
    showSuccessNotification(
      'New Order Alert',
      `Order #${newOrder.order_number} requires attention.`
    );
  });

  // Real-time inventory alerts
  useInventoryAlerts((item) => {
    showLowStockAlert(item);
  });

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState(null);
  const [workforceData, setWorkforceData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard data function
  const fetchDashboardData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      // Fetch main dashboard data
      const dashboardResponse = await apiService.get(API_ENDPOINTS.ADMIN.DASHBOARD_STATS);
      if (dashboardResponse.success) {
        setDashboardData(dashboardResponse.data);
      }

      // Fetch analytics data (real sales + category breakdown)
      try {
        const analyticsResponse = await apiService.get(API_ENDPOINTS.ADMIN.ANALYTICS.SALES);
        if (analyticsResponse.success) {
          setAnalyticsData(analyticsResponse.data);
        }
      } catch (analyticsError) {
        console.warn('Failed to fetch analytics data:', analyticsError);
      }

      // Fetch workforce data
      try {
        const [employeeStatsResponse, attendanceSummaryResponse] = await Promise.all([
          apiService.get(API_ENDPOINTS.WORKFORCE.EMPLOYEE_STATS),
          apiService.get(API_ENDPOINTS.WORKFORCE.ATTENDANCE_SUMMARY)
        ]);

        setWorkforceData({
          employeeStats: employeeStatsResponse.success ? employeeStatsResponse.data : null,
          attendanceSummary: attendanceSummaryResponse.success ? attendanceSummaryResponse.data : null
        });
      } catch (workforceError) {
        console.warn('Failed to fetch workforce data:', workforceError);
        // Don't fail the whole dashboard if workforce data fails
        setWorkforceData(null);
      }

    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const stats = dashboardData?.stats || {
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalRevenue: 0
  };

  const workforceStats = workforceData?.employeeStats || {
    total: 0,
    active: 0,
    on_leave: 0,
    new_hires: 0
  };

  // Map backend field names to frontend expectations
  const mappedWorkforceStats = workforceData?.employeeStats ? {
    total: workforceData.employeeStats.total_employees || 0,
    active: workforceData.employeeStats.active_employees || 0,
    on_leave: workforceData.employeeStats.on_leave || 0,
    new_hires: 0 // This would need a separate calculation
  } : workforceStats;

  const attendanceStats = workforceData?.attendanceSummary || {
    present_today: 0,
    absent_today: 0,
    late_today: 0,
    total_employees: 0
  };

  const recentOrders = dashboardData?.recentOrders || [];

  // Calculate trends (mock data - would come from API in production)
  const ordersTrend = 12;
  const revenueTrend = 15;

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <PageShell
      title={`${getGreeting()}, Admin`}
      subtitle={todayDate}
      loading={loading}
      headerRight={
        <>
          <ConnectionStatus isConnected={ordersConnected} pendingCount={pendingOrders.length} />
          {pendingOrders.length > 0 && (
            <span className="d-flex align-items-center gap-1 text-warning">
              <FaBell />
              <Badge bg="warning" text="dark">{pendingOrders.length} pending</Badge>
            </span>
          )}
        </>
      }
      error={error}
      onRetry={() => fetchDashboardData()}
    >

      {/* KPI Stats */}
      <div className="dashboard-section-label">Overview</div>
      <DashboardStatGrid
        stats={[
          { title: 'Total Orders', value: stats.totalOrders, icon: FaShoppingBag, iconColor: 'primary', trend: ordersTrend, trendLabel: 'vs last week' },
          { title: 'Total Revenue', value: stats.totalRevenue, prefix: '₱', icon: FaDollarSign, iconColor: 'warning', trend: revenueTrend, trendLabel: 'vs last week' },
          { title: 'Total Users', value: stats.totalUsers, icon: FaUsers, iconColor: 'success', trendLabel: 'registered users' },
          { title: 'Total Products', value: stats.totalProducts, icon: FaBoxes, iconColor: 'info', trendLabel: 'in catalog' },
        ]}
      />

      {/* Operational Row: Recent Orders + Workforce */}
      <Row className="g-4 mb-5">
        <Col lg={8}>
          <AdminRecentOrders orders={recentOrders} />
        </Col>
        <Col lg={4}>
          <Card className="admin-card h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <div className="dashboard-section-icon bg-info-soft">
                  <FaUsers className="text-info" />
                </div>
                <div>
                  <h5 className="mb-0 fw-semibold">Workforce Today</h5>
                  <small className="text-muted">Staff status at a glance</small>
                </div>
              </div>
              <Button as={Link} to="/admin/employees" variant="outline-secondary" size="sm" className="d-flex align-items-center gap-1">
                View <FaArrowRight size={12} />
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="workforce-stat-list">
                {[
                  { label: 'Total Employees', value: mappedWorkforceStats.total, icon: FaUsers, color: 'info' },
                  { label: 'Present Today', value: attendanceStats.present_today, icon: FaUserCheck, color: 'success' },
                  { label: 'On Leave', value: mappedWorkforceStats.on_leave, icon: FaUserClock, color: 'warning' },
                  { label: 'Absent Today', value: attendanceStats.absent_today, icon: FaUserClock, color: 'danger' },
                ].map((item, idx) => (
                  <div key={idx} className="workforce-stat-item">
                    <div className={`workforce-stat-icon bg-${item.color}-soft`}>
                      <item.icon size={14} className={`text-${item.color}`} />
                    </div>
                    <span className="workforce-stat-label">{item.label}</span>
                    <span className="workforce-stat-value">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Analytics */}
      <div className="dashboard-section-label"><FaChartLine className="me-2" />Analytics</div>
      <AdminChartSection stats={stats} analyticsData={analyticsData} />
    </PageShell>
  );
};

export default AdminDashboard;
