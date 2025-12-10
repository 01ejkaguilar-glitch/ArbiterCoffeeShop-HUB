import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Form, Alert, Spinner, Table } from 'react-bootstrap';
import { FaStar, FaPlus, FaEdit, FaTrash, FaCoffee, FaCalendarAlt, FaEye } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config/api';
import apiService from '../../services/api.service';
import { useNotificationSystem } from '../../components/common/NotificationSystem';

const TodaysOriginManagement = () => {
  const { user } = useAuth();
  const { showSuccessNotification, showErrorNotification } = useNotificationSystem();
  const [featuredOrigins, setFeaturedOrigins] = useState([]);
  const [availableBeans, setAvailableBeans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOrigin, setEditingOrigin] = useState(null);
  const [formData, setFormData] = useState({
    coffee_bean_id: '',
    feature_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '21:00',
    special_notes: '',
    promotion_text: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [originsResponse, beansResponse] = await Promise.all([
        apiService.get(API_ENDPOINTS.BARISTA.FEATURED_ORIGINS.LIST),
        apiService.get(API_ENDPOINTS.BARISTA.FEATURED_ORIGINS.AVAILABLE_BEANS)
      ]);

      setFeaturedOrigins(originsResponse.data);
      setAvailableBeans(beansResponse.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      showErrorNotification('Failed to load featured origins data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = {
        ...formData,
        coffee_bean_id: parseInt(formData.coffee_bean_id)
      };

      if (editingOrigin) {
        await apiService.put(API_ENDPOINTS.BARISTA.FEATURED_ORIGINS.UPDATE(editingOrigin.id), data);
        showSuccessNotification('Featured origin updated successfully');
      } else {
        await apiService.post(API_ENDPOINTS.BARISTA.FEATURED_ORIGINS.CREATE, data);
        showSuccessNotification('Featured origin created successfully');
      }

      fetchData();
      resetForm();
      setShowCreateModal(false);
      setEditingOrigin(null);
    } catch (err) {
      console.error('Error saving featured origin:', err);
      showErrorNotification('Failed to save featured origin');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this featured origin?')) return;

    try {
      await apiService.delete(API_ENDPOINTS.BARISTA.FEATURED_ORIGINS.DELETE(id));
      showSuccessNotification('Featured origin deleted successfully');
      fetchData();
    } catch (err) {
      console.error('Error deleting featured origin:', err);
      showErrorNotification('Failed to delete featured origin');
    }
  };

  const resetForm = () => {
    setFormData({
      coffee_bean_id: '',
      feature_date: new Date().toISOString().split('T')[0],
      start_time: '09:00',
      end_time: '21:00',
      special_notes: '',
      promotion_text: ''
    });
  };

  const openEditModal = (origin) => {
    setEditingOrigin(origin);
    setFormData({
      coffee_bean_id: origin.coffee_bean_id.toString(),
      feature_date: origin.feature_date,
      start_time: origin.start_time || '09:00',
      end_time: origin.end_time || '21:00',
      special_notes: origin.special_notes || '',
      promotion_text: origin.promotion_text || ''
    });
    setShowCreateModal(true);
  };

  const getTodaysFeatured = () => {
    const today = new Date().toISOString().split('T')[0];
    return featuredOrigins.filter(origin =>
      origin.feature_date === today && origin.is_active
    );
  };

  const getUpcomingFeatured = () => {
    const today = new Date();
    return featuredOrigins.filter(origin => {
      const featureDate = new Date(origin.feature_date);
      return featureDate >= today && origin.is_active;
    }).sort((a, b) => new Date(a.feature_date) - new Date(b.feature_date));
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading featured origins...</p>
      </Container>
    );
  }

  const todaysFeatured = getTodaysFeatured();
  const upcomingFeatured = getUpcomingFeatured();

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">Today's Origin Management</h1>
          <p className="text-muted mb-0">Schedule and manage featured coffee bean origins</p>
        </div>
        <div>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <FaPlus className="me-1" />
            Schedule New Feature
          </Button>
        </div>
      </div>

      {/* Today's Featured */}
      <Card className="mb-4">
        <Card.Header className="bg-warning text-dark">
          <h5 className="mb-0">
            <FaStar className="me-2" />
            Today's Featured Origins ({todaysFeatured.length}/2)
          </h5>
        </Card.Header>
        <Card.Body>
          {todaysFeatured.length === 0 ? (
            <Alert variant="info">
              <FaCoffee className="me-2" />
              No coffee beans are featured today. Schedule some to highlight special origins!
            </Alert>
          ) : (
            <Row>
              {todaysFeatured.map(origin => (
                <Col md={6} key={origin.id} className="mb-3">
                  <Card className="border-warning">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="mb-1">
                            <FaCoffee className="me-2 text-warning" />
                            {origin.coffee_bean?.name}
                          </h6>
                          <small className="text-muted">
                            {origin.coffee_bean?.origin_country} • {origin.coffee_bean?.region}
                          </small>
                        </div>
                        <Badge bg="warning">
                          <FaStar className="me-1" />
                          Featured Today
                        </Badge>
                      </div>

                      <div className="mb-2">
                        <small>
                          <strong>Time:</strong> {origin.start_time} - {origin.end_time}
                        </small>
                      </div>

                      {origin.special_notes && (
                        <div className="mb-2">
                          <small>
                            <strong>Notes:</strong> {origin.special_notes}
                          </small>
                        </div>
                      )}

                      {origin.promotion_text && (
                        <Alert variant="warning" className="py-2 mb-2">
                          <small>
                            <strong>Promotion:</strong> {origin.promotion_text}
                          </small>
                        </Alert>
                      )}

                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => openEditModal(origin)}
                        >
                          <FaEdit className="me-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(origin.id)}
                        >
                          <FaTrash className="me-1" />
                          Remove
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* Upcoming Features */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <FaCalendarAlt className="me-2" />
            Upcoming Featured Origins
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          {upcomingFeatured.length === 0 ? (
            <div className="text-center py-4">
              <FaCalendarAlt size={48} className="text-muted mb-3" />
              <p className="text-muted">No upcoming featured origins scheduled</p>
            </div>
          ) : (
            <Table striped hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Coffee Bean</th>
                  <th>Origin</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {upcomingFeatured.map(origin => (
                  <tr key={origin.id}>
                    <td>
                      <strong>{new Date(origin.feature_date).toLocaleDateString()}</strong>
                    </td>
                    <td>{origin.coffee_bean?.name}</td>
                    <td>
                      <small>{origin.coffee_bean?.origin_country}, {origin.coffee_bean?.region}</small>
                    </td>
                    <td>
                      <small>{origin.start_time} - {origin.end_time}</small>
                    </td>
                    <td>
                      <Badge bg={origin.is_active ? 'success' : 'secondary'}>
                        {origin.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => openEditModal(origin)}
                        className="me-1"
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(origin.id)}
                      >
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Create/Edit Modal */}
      <Modal show={showCreateModal} onHide={() => { setShowCreateModal(false); setEditingOrigin(null); resetForm(); }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingOrigin ? 'Edit Featured Origin' : 'Schedule New Featured Origin'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Coffee Bean *</Form.Label>
                  <Form.Select
                    value={formData.coffee_bean_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, coffee_bean_id: e.target.value }))}
                    required
                  >
                    <option value="">Select a coffee bean...</option>
                    {availableBeans.map(bean => (
                      <option key={bean.id} value={bean.id}>
                        {bean.name} - {bean.origin_country}, {bean.region}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Feature Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.feature_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, feature_date: e.target.value }))}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Special Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.special_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, special_notes: e.target.value }))}
                placeholder="Any special notes about this coffee bean..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Promotion Text</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.promotion_text}
                onChange={(e) => setFormData(prev => ({ ...prev, promotion_text: e.target.value }))}
                placeholder="Special promotion or highlight text..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowCreateModal(false); setEditingOrigin(null); resetForm(); }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingOrigin ? 'Update Feature' : 'Schedule Feature'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default TodaysOriginManagement;