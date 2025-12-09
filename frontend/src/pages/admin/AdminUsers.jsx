import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Modal, Form } from 'react-bootstrap';
import { FaEye, FaEdit, FaBan, FaCheckCircle } from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import Loading from '../../components/common/Loading';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.ADMIN.USERS);
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (roles) => {
    if (!roles || roles.length === 0) return <Badge bg="secondary">customer</Badge>;
    
    const roleColors = {
      admin: 'danger',
      manager: 'warning',
      barista: 'info',
      customer: 'secondary'
    };
    
    return roles.map((role, index) => (
      <Badge key={index} bg={roleColors[role] || 'secondary'} className="me-1">
        {role}
      </Badge>
    ));
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const action = currentStatus === 'active' ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} this user?`)) {
      try {
        const response = await apiService.patch(
          API_ENDPOINTS.ADMIN.USER_DETAIL(userId),
          { status: currentStatus === 'active' ? 'inactive' : 'active' }
        );

        if (response.success) {
          alert(`User ${action}d successfully!`);
          fetchUsers();
        }
      } catch (error) {
        alert(`Failed to ${action} user`);
        console.error('Error updating user:', error);
      }
    }
  };

  if (loading) {
    return <Loading message="Loading users..." />;
  }

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h1 className="display-5 fw-bold">Users Management</h1>
          <p className="lead text-muted">Manage user accounts and permissions</p>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{getRoleBadge(user.roles)}</td>
                        <td>
                          <Badge bg={user.status === 'active' ? 'success' : 'danger'}>
                            {user.status || 'active'}
                          </Badge>
                        </td>
                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleViewUser(user)}
                          >
                            <FaEye />
                          </Button>
                          <Button
                            variant={user.status === 'active' ? 'outline-danger' : 'outline-success'}
                            size="sm"
                            onClick={() => handleToggleStatus(user.id, user.status || 'active')}
                          >
                            {user.status === 'active' ? <FaBan /> : <FaCheckCircle />}
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center text-muted py-4">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* User Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>User Details - {selectedUser?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>User ID:</strong> {selectedUser.id}
                </Col>
                <Col md={6}>
                  <strong>Status:</strong>{' '}
                  <Badge bg={selectedUser.status === 'active' ? 'success' : 'danger'}>
                    {selectedUser.status || 'active'}
                  </Badge>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Name:</strong> {selectedUser.name}
                </Col>
                <Col md={6}>
                  <strong>Email:</strong> {selectedUser.email}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Phone:</strong> {selectedUser.phone || 'N/A'}
                </Col>
                <Col md={6}>
                  <strong>Roles:</strong> {getRoleBadge(selectedUser.roles)}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Joined:</strong> {new Date(selectedUser.created_at).toLocaleString()}
                </Col>
                <Col md={6}>
                  <strong>Last Updated:</strong> {new Date(selectedUser.updated_at).toLocaleString()}
                </Col>
              </Row>

              {selectedUser.customer_profile && (
                <>
                  <h5 className="mt-4">Customer Profile</h5>
                  <Row className="mb-2">
                    <Col md={6}>
                      <strong>Total Orders:</strong> {selectedUser.customer_profile.total_orders || 0}
                    </Col>
                    <Col md={6}>
                      <strong>Total Spent:</strong> ₱{selectedUser.customer_profile.total_spent?.toFixed(2) || '0.00'}
                    </Col>
                  </Row>
                </>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminUsers;
