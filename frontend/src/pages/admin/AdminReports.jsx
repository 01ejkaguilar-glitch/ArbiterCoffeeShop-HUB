import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, Alert, Tab, Tabs, Spinner } from 'react-bootstrap';
import { FaFileDownload, FaCalendar, FaFilter, FaChartBar, FaCoffee, FaTasks, FaUserClock, FaBriefcase } from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import Loading from '../../components/common/Loading';

const AdminReports = () => {
  const [activeTab, setActiveTab] = useState('attendance');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    employee_id: '',
    status: '',
    type: 'both'
  });
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchReport();
  }, [activeTab]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      let endpoint;
      const params = {
        start_date: filters.start_date,
        end_date: filters.end_date
      };

      switch (activeTab) {
        case 'attendance':
          endpoint = API_ENDPOINTS.ADMIN.REPORTS.ATTENDANCE;
          if (filters.employee_id) params.employee_id = filters.employee_id;
          break;
        case 'leave_ot':
          endpoint = API_ENDPOINTS.ADMIN.REPORTS.LEAVE_OT;
          if (filters.employee_id) params.employee_id = filters.employee_id;
          if (filters.type) params.type = filters.type;
          break;
        case 'tasks':
          endpoint = API_ENDPOINTS.ADMIN.REPORTS.TASK_COMPLETION;
          if (filters.employee_id) params.assigned_to = filters.employee_id;
          if (filters.status) params.status = filters.status;
          break;
        case 'beans':
          endpoint = API_ENDPOINTS.ADMIN.REPORTS.BEAN_USAGE;
          break;
        default:
          return;
      }

      const queryString = new URLSearchParams(params).toString();
      const response = await apiService.get(`${endpoint}?${queryString}`);
      
      if (response.success) {
        setReportData(response.data);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      showAlert('Failed to load report', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format = 'csv') => {
    try {
      const params = {
        report_type: activeTab === 'leave_ot' ? 'leave_ot' : activeTab === 'tasks' ? 'task_completion' : activeTab === 'beans' ? 'bean_usage' : 'attendance',
        format: format,
        start_date: filters.start_date,
        end_date: filters.end_date
      };

      const queryString = new URLSearchParams(params).toString();
      const url = `${API_ENDPOINTS.ADMIN.REPORTS.EXPORT}?${queryString}`;
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${params.report_type}_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showAlert('Report exported successfully!', 'success');
    } catch (error) {
      showAlert('Failed to export report', 'danger');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
  };

  const renderAttendanceReport = () => {
    if (!reportData) return null;

    return (
      <>
        <Row className="mb-4">
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h6 className="text-muted mb-2">Total Records</h6>
                <h3 className="mb-0">{reportData.stats?.total_records || 0}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h6 className="text-muted mb-2">Present</h6>
                <h3 className="mb-0 text-success">{reportData.stats?.present_count || 0}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h6 className="text-muted mb-2">Absent</h6>
                <h3 className="mb-0 text-danger">{reportData.stats?.absent_count || 0}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h6 className="text-muted mb-2">Attendance Rate</h6>
                <h3 className="mb-0 text-info">{reportData.stats?.attendance_rate || 0}%</h3>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Table responsive hover>
          <thead className="table-light">
            <tr>
              <th>Date</th>
              <th>Employee</th>
              <th>Status</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Hours Worked</th>
              <th>OT Hours</th>
            </tr>
          </thead>
          <tbody>
            {reportData.attendances && reportData.attendances.length > 0 ? (
              reportData.attendances.map((record) => (
                <tr key={record.id}>
                  <td>{new Date(record.date).toLocaleDateString()}</td>
                  <td>{record.employee?.user?.name || 'N/A'}</td>
                  <td>
                    <Badge bg={
                      record.status === 'present' ? 'success' :
                      record.status === 'late' ? 'warning' :
                      'danger'
                    }>
                      {record.status}
                    </Badge>
                  </td>
                  <td>{record.check_in_time || 'N/A'}</td>
                  <td>{record.check_out_time || 'N/A'}</td>
                  <td>{record.hours_worked || 0}h</td>
                  <td className="text-warning">{record.overtime_hours || 0}h</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center text-muted py-4">
                  No attendance records found
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </>
    );
  };

  const renderLeaveOTReport = () => {
    if (!reportData) return null;

    return (
      <>
        <Row className="mb-4">
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h6 className="text-muted mb-2">Total Leaves</h6>
                <h3 className="mb-0">{reportData.stats?.total_leave_requests || 0}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h6 className="text-muted mb-2">Approved</h6>
                <h3 className="mb-0 text-success">{reportData.stats?.approved_leaves || 0}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h6 className="text-muted mb-2">Pending</h6>
                <h3 className="mb-0 text-warning">{reportData.stats?.pending_leaves || 0}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h6 className="text-muted mb-2">Total OT Hours</h6>
                <h3 className="mb-0 text-info">{reportData.stats?.total_overtime_hours || 0}h</h3>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Leave Requests Table */}
        {reportData.leave_requests && reportData.leave_requests.length > 0 && (
          <>
            <h5 className="mb-3">Leave Requests</h5>
            <Table responsive hover className="mb-4">
              <thead className="table-light">
                <tr>
                  <th>Employee</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.leave_requests.map((leave) => (
                  <tr key={leave.id}>
                    <td>{leave.employee?.user?.name || 'N/A'}</td>
                    <td>{new Date(leave.start_date).toLocaleDateString()}</td>
                    <td>{new Date(leave.end_date).toLocaleDateString()}</td>
                    <td>{leave.days_count || 0}</td>
                    <td>{leave.reason || 'N/A'}</td>
                    <td>
                      <Badge bg={
                        leave.status === 'approved' ? 'success' :
                        leave.status === 'pending' ? 'warning' :
                        'danger'
                      }>
                        {leave.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}

        {/* Overtime Records Table */}
        {reportData.overtime_records && reportData.overtime_records.length > 0 && (
          <>
            <h5 className="mb-3">Overtime Records</h5>
            <Table responsive hover>
              <thead className="table-light">
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>OT Hours</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                </tr>
              </thead>
              <tbody>
                {reportData.overtime_records.map((ot) => (
                  <tr key={ot.id}>
                    <td>{ot.employee?.user?.name || 'N/A'}</td>
                    <td>{new Date(ot.date).toLocaleDateString()}</td>
                    <td className="text-warning"><strong>{ot.overtime_hours}h</strong></td>
                    <td>{ot.check_in_time}</td>
                    <td>{ot.check_out_time}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
      </>
    );
  };

  const renderTaskCompletionReport = () => {
    if (!reportData) return null;

    return (
      <>
        <Row className="mb-4">
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h6 className="text-muted mb-2">Total Tasks</h6>
                <h3 className="mb-0">{reportData.stats?.total_tasks || 0}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h6 className="text-muted mb-2">Completed</h6>
                <h3 className="mb-0 text-success">{reportData.stats?.completed_tasks || 0}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h6 className="text-muted mb-2">Overdue</h6>
                <h3 className="mb-0 text-danger">{reportData.stats?.overdue_tasks || 0}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h6 className="text-muted mb-2">Completion Rate</h6>
                <h3 className="mb-0 text-info">{reportData.stats?.completion_rate || 0}%</h3>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Table responsive hover>
          <thead className="table-light">
            <tr>
              <th>Task</th>
              <th>Assigned To</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Due Date</th>
              <th>Completed At</th>
            </tr>
          </thead>
          <tbody>
            {reportData.tasks && reportData.tasks.length > 0 ? (
              reportData.tasks.map((task) => (
                <tr key={task.id}>
                  <td><strong>{task.title}</strong></td>
                  <td>{task.assignedTo?.user?.name || 'N/A'}</td>
                  <td>
                    <Badge bg={
                      task.status === 'completed' ? 'success' :
                      task.status === 'in_progress' ? 'primary' :
                      task.status === 'cancelled' ? 'danger' :
                      'warning'
                    }>
                      {task.status}
                    </Badge>
                  </td>
                  <td>
                    <Badge bg={
                      task.priority === 'high' ? 'danger' :
                      task.priority === 'medium' ? 'warning' :
                      'info'
                    }>
                      {task.priority || 'normal'}
                    </Badge>
                  </td>
                  <td>{new Date(task.due_date).toLocaleDateString()}</td>
                  <td>{task.completed_at ? new Date(task.completed_at).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-muted py-4">
                  No tasks found
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </>
    );
  };

  const renderBeanUsageReport = () => {
    if (!reportData) return null;

    return (
      <>
        <Row className="mb-4">
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h6 className="text-muted mb-2">Total Beans</h6>
                <h3 className="mb-0">{reportData.stats?.total_beans || 0}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h6 className="text-muted mb-2">Low Stock</h6>
                <h3 className="mb-0 text-warning">{reportData.stats?.low_stock_beans || 0}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h6 className="text-muted mb-2">Out of Stock</h6>
                <h3 className="mb-0 text-danger">{reportData.stats?.out_of_stock_beans || 0}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h6 className="text-muted mb-2">Featured Times</h6>
                <h3 className="mb-0 text-info">{reportData.stats?.total_featured_times || 0}</h3>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Table responsive hover>
          <thead className="table-light">
            <tr>
              <th>Bean Name</th>
              <th>Origin</th>
              <th>Region</th>
              <th>Current Stock</th>
              <th>Times Featured</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {reportData.bean_usage && reportData.bean_usage.length > 0 ? (
              reportData.bean_usage.map((bean) => (
                <tr key={bean.id}>
                  <td><strong>{bean.name}</strong></td>
                  <td>{bean.origin_country}</td>
                  <td>{bean.region}</td>
                  <td className={bean.current_stock < 10 ? 'text-warning' : ''}>
                    <strong>{bean.current_stock} kg</strong>
                  </td>
                  <td>{bean.times_featured}</td>
                  <td>
                    <Badge bg={bean.is_featured ? 'success' : 'secondary'}>
                      {bean.is_featured ? 'Featured' : 'Regular'}
                    </Badge>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-muted py-4">
                  No bean usage data found
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </>
    );
  };

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="display-5 fw-bold">Reports & Analytics</h1>
              <p className="lead text-muted">View comprehensive reports and export data</p>
            </div>
            <Button 
              variant="success" 
              size="lg"
              onClick={() => handleExport('csv')}
              disabled={loading || !reportData}
            >
              <FaFileDownload className="me-2" />
              Export CSV
            </Button>
          </div>
        </Col>
      </Row>

      {alert.show && (
        <Alert variant={alert.type} dismissible onClose={() => setAlert({ show: false, message: '', type: '' })}>
          {alert.message}
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  name="start_date"
                  value={filters.start_date}
                  onChange={handleFilterChange}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  name="end_date"
                  value={filters.end_date}
                  onChange={handleFilterChange}
                />
              </Form.Group>
            </Col>
            {activeTab === 'leave_ot' && (
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    name="type"
                    value={filters.type}
                    onChange={handleFilterChange}
                  >
                    <option value="both">Both</option>
                    <option value="leave">Leave Only</option>
                    <option value="overtime">Overtime Only</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            )}
            {activeTab === 'tasks' && (
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                  >
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            )}
            <Col md={3} className="d-flex align-items-end">
              <Button variant="primary" onClick={fetchReport} disabled={loading} className="w-100">
                <FaFilter className="me-2" />
                {loading ? 'Loading...' : 'Apply Filters'}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Report Tabs */}
      <Card className="shadow-sm">
        <Card.Header>
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="border-0">
            <Tab eventKey="attendance" title={
              <span><FaUserClock className="me-2" />Attendance</span>
            } />
            <Tab eventKey="leave_ot" title={
              <span><FaBriefcase className="me-2" />Leave & OT</span>
            } />
            <Tab eventKey="tasks" title={
              <span><FaTasks className="me-2" />Task Completion</span>
            } />
            <Tab eventKey="beans" title={
              <span><FaCoffee className="me-2" />Bean Usage</span>
            } />
          </Tabs>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-3">Loading report...</p>
            </div>
          ) : (
            <>
              {activeTab === 'attendance' && renderAttendanceReport()}
              {activeTab === 'leave_ot' && renderLeaveOTReport()}
              {activeTab === 'tasks' && renderTaskCompletionReport()}
              {activeTab === 'beans' && renderBeanUsageReport()}
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminReports;
