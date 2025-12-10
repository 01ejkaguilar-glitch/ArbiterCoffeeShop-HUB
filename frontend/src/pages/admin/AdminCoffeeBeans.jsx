import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Form, Alert, Spinner, InputGroup, Table } from 'react-bootstrap';
import { FaCoffee, FaEdit, FaTrash, FaSearch, FaStar, FaPlus, FaArchive } from 'react-icons/fa';
import { API_ENDPOINTS } from '../../config/api';
import { BACKEND_BASE_URL } from '../../config/api';
import apiService from '../../services/api.service';
import Loading from '../../components/common/Loading';

const AdminCoffeeBeans = () => {
  const [beans, setBeans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBean, setEditingBean] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    origin_country: '',
    region: '',
    elevation: '',
    processing_method: '',
    variety: '',
    tasting_notes: '',
    producer: '',
    stock_quantity: 0,
    is_featured: false
  });

  useEffect(() => {
    fetchCoffeeBeans();
  }, []);

  const fetchCoffeeBeans = async (bustCache = false) => {
    try {
      setLoading(true);
      const response = await apiService.get(`${API_ENDPOINTS.COFFEE_BEANS.LIST}?per_page=1000`, {}, bustCache);
      // Handle paginated response
      const beansData = response.data.data || response.data;
      setBeans(Array.isArray(beansData) ? beansData : []);
    } catch (error) {
      console.error('Error fetching coffee beans:', error);
      showAlert('Failed to load coffee beans', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (bean = null) => {
    if (bean) {
      setEditingBean(bean);
      setFormData({
        name: bean.name,
        origin_country: bean.origin_country,
        region: bean.region || '',
        elevation: bean.elevation || '',
        processing_method: bean.processing_method || '',
        variety: bean.variety || '',
        tasting_notes: bean.tasting_notes || '',
        producer: bean.producer || '',
        stock_quantity: bean.stock_quantity,
        is_featured: bean.is_featured || false
      });
      setImagePreview(bean.image_url ? `${BACKEND_BASE_URL}${bean.image_url}` : null);
    } else {
      setEditingBean(null);
      setFormData({
        name: '',
        origin_country: '',
        region: '',
        elevation: '',
        processing_method: '',
        variety: '',
        tasting_notes: '',
        producer: '',
        stock_quantity: 0,
        is_featured: false
      });
      setImagePreview(null);
    }
    setSelectedImage(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBean(null);
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'is_featured') {
          data.append(key, formData[key] ? '1' : '0');
        } else {
          data.append(key, formData[key]);
        }
      });

      if (selectedImage) {
        data.append('image', selectedImage);
      }

      let response;
      if (editingBean) {
        // For updates, Laravel requires _method field for FormData PUT requests
        data.append('_method', 'PUT');
        response = await apiService.post(API_ENDPOINTS.ADMIN.COFFEE_BEANS.UPDATE(editingBean.id), data);
      } else {
        response = await apiService.upload(API_ENDPOINTS.ADMIN.COFFEE_BEANS.CREATE, data);
      }

      if (response.success) {
        showAlert(
          editingBean ? 'Coffee bean updated successfully!' : 'Coffee bean added successfully!',
          'success'
        );
        handleCloseModal();
        fetchCoffeeBeans(true); // Bust cache to get fresh data
      }
    } catch (error) {
      console.error('Save error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          (error.response?.status === 404 ? 'Coffee bean not found. It may have been deleted.' : 'Failed to save coffee bean');
      showAlert(errorMessage, 'danger');
    }
  };

  const handleDelete = async (beanId) => {
    if (window.confirm('Are you sure you want to delete this coffee bean?')) {
      try {
        const response = await apiService.delete(API_ENDPOINTS.ADMIN.COFFEE_BEANS.DELETE(beanId));
        if (response.success) {
          showAlert('Coffee bean deleted successfully!', 'success');
          fetchCoffeeBeans(true); // Bust cache to get fresh data
        }
      } catch (error) {
        console.error('Delete error:', error);
        const errorMessage = error.response?.status === 404 
          ? 'Coffee bean not found. It may have already been deleted.' 
          : 'Failed to delete coffee bean';
        showAlert(errorMessage, error.response?.status === 404 ? 'warning' : 'danger');
        // Refresh the list even on 404 to sync with backend state
        if (error.response?.status === 404) {
          fetchCoffeeBeans(true);
        }
      }
    }
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
  };

  const filteredBeans = beans.filter(bean =>
    bean.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bean.origin_country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bean.region && bean.region.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStockBadge = (quantity) => {
    if (quantity === 0) return <Badge bg="danger">Out of Stock</Badge>;
    if (quantity < 10) return <Badge bg="warning">Low Stock</Badge>;
    return <Badge bg="success">In Stock</Badge>;
  };

  if (loading) {
    return <Loading message="Loading coffee beans..." />;
  }

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="display-5 fw-bold">Coffee Bean Management</h1>
              <p className="lead text-muted">Manage your coffee bean inventory</p>
            </div>
            <Button variant="primary" size="lg" onClick={() => handleShowModal()}>
              <FaPlus className="me-2" />
              Add Coffee Bean
            </Button>
          </div>
        </Col>
      </Row>

      {alert.show && (
        <Alert variant={alert.type} dismissible onClose={() => setAlert({ show: false, message: '', type: '' })}>
          {alert.message}
        </Alert>
      )}

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h6 className="text-muted mb-2">Total Beans</h6>
              <h3 className="mb-0">{beans.length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h6 className="text-muted mb-2">Featured</h6>
              <h3 className="mb-0 text-warning">{beans.filter(b => b.is_featured).length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h6 className="text-muted mb-2">Low Stock</h6>
              <h3 className="mb-0 text-warning">{beans.filter(b => b.stock_quantity < 10 && b.stock_quantity > 0).length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h6 className="text-muted mb-2">Out of Stock</h6>
              <h3 className="mb-0 text-danger">{beans.filter(b => b.stock_quantity === 0).length}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search Bar */}
      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by name, origin, or region..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
      </Row>

      {/* Coffee Beans Table */}
      <Card className="shadow-sm">
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Origin</th>
                <th>Region</th>
                <th>Stock (kg)</th>
                <th>Processing</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBeans.length > 0 ? (
                filteredBeans.map((bean) => (
                  <tr key={bean.id}>
                    <td>
                      <img
                        src={bean.image_url ? `${BACKEND_BASE_URL}${bean.image_url}` : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZGRkIi8+Cjx0ZXh0IHg9IjI1IiB5PSIyNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zNWVtIiBmaWxsPSIjOTk5IiBmb250LXNpemU9IjEwIj5ObyBJbWFnZTwvdGV4dD4KPHN2Zz4='}
                        alt={bean.name}
                        width="50"
                        height="50"
                        className="rounded"
                      />
                    </td>
                    <td>
                      <div>
                        <strong>{bean.name}</strong>
                        {bean.is_featured && <FaStar className="text-warning ms-2" />}
                      </div>
                    </td>
                    <td>{bean.origin_country}</td>
                    <td>{bean.region || 'N/A'}</td>
                    <td>
                      <strong className={bean.stock_quantity < 10 ? 'text-warning' : ''}>
                        {bean.stock_quantity}
                      </strong>
                    </td>
                    <td>{bean.processing_method || 'N/A'}</td>
                    <td>{getStockBadge(bean.stock_quantity)}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                        onClick={() => handleShowModal(bean)}
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(bean.id)}
                      >
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">
                    No coffee beans found
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingBean ? 'Edit Coffee Bean' : 'Add Coffee Bean'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Bean Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Origin Country *</Form.Label>
                  <Form.Control
                    type="text"
                    name="origin_country"
                    value={formData.origin_country}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Region</Form.Label>
                  <Form.Control
                    type="text"
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Elevation</Form.Label>
                  <Form.Control
                    type="text"
                    name="elevation"
                    value={formData.elevation}
                    onChange={handleChange}
                    placeholder="e.g., 1,800-2,200m"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Processing Method</Form.Label>
                  <Form.Select
                    name="processing_method"
                    value={formData.processing_method}
                    onChange={handleChange}
                  >
                    <option value="">Select method...</option>
                    <option value="Washed">Washed</option>
                    <option value="Natural">Natural</option>
                    <option value="Honey">Honey</option>
                    <option value="Semi-Washed">Semi-Washed</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Variety</Form.Label>
                  <Form.Control
                    type="text"
                    name="variety"
                    value={formData.variety}
                    onChange={handleChange}
                    placeholder="e.g., Arabica, Bourbon"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Producer</Form.Label>
                  <Form.Control
                    type="text"
                    name="producer"
                    value={formData.producer}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Stock Quantity (kg) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.1"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Tasting Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="tasting_notes"
                    value={formData.tasting_notes}
                    onChange={handleChange}
                    placeholder="e.g., Floral, citrus, bergamot, jasmine"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Bean Image</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </Form.Group>
                {imagePreview && (
                  <div>
                    <img src={imagePreview} alt="Preview" className="img-thumbnail" style={{ maxHeight: '150px' }} />
                  </div>
                )}
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="is_featured"
                    label="Mark as Featured Bean"
                    checked={formData.is_featured}
                    onChange={handleChange}
                  />
                  <Form.Text className="text-muted">
                    Featured beans can be set as "Today's Featured Origin"
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingBean ? 'Update Bean' : 'Add Bean'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AdminCoffeeBeans;
