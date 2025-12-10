import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Form, Alert, Spinner, InputGroup, Tab, Tabs } from 'react-bootstrap';
import { FaCoffee, FaEdit, FaSearch, FaStar, FaStarHalfAlt, FaRegStar, FaExclamationTriangle, FaCalendarAlt, FaClock, FaPlus } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config/api';
import apiService from '../../services/api.service';
import { useNotificationSystem } from '../../components/common/NotificationSystem';

const CoffeeBeanControl = () => {
  // const { user } = useAuth(); // Not used in this component
  const [beans, setBeans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedBean, setSelectedBean] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [updatingStock, setUpdatingStock] = useState(false);

  // Add Coffee Bean state
  const [showAddBeanModal, setShowAddBeanModal] = useState(false);
  const [addingBean, setAddingBean] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [newBeanForm, setNewBeanForm] = useState({
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

  // Archive state
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [beanToArchive, setBeanToArchive] = useState(null);
  const [archiving, setArchiving] = useState(false);

  // Featured Origins state
  const [featuredOrigins, setFeaturedOrigins] = useState([]);
  const [todaysFeatured, setTodaysFeatured] = useState(null);
  const [availableBeans, setAvailableBeans] = useState([]);
  const [showFeaturedModal, setShowFeaturedModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [featuredForm, setFeaturedForm] = useState({
    coffee_bean_id: '',
    feature_date: new Date().toISOString().split('T')[0],
    start_time: '08:00',
    end_time: '18:00',
    special_notes: '',
    promotion_text: '',
    is_active: true
  });
  const [creatingFeatured, setCreatingFeatured] = useState(false);

  const { showSuccessNotification, showErrorNotification } = useNotificationSystem();

  useEffect(() => {
    fetchCoffeeBeans();
    fetchFeaturedOrigins();
    fetchTodaysFeatured();
    fetchAvailableBeans();
  }, []);

  const fetchCoffeeBeans = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(API_ENDPOINTS.BARISTA.COFFEE_BEANS.LIST);
      setBeans(response.data);
    } catch (err) {
      console.error('Error fetching coffee beans:', err);
      showErrorNotification('Failed to load coffee beans');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedOrigins = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.BARISTA.FEATURED_ORIGINS.LIST);
      // Handle paginated response - the actual data is in response.data.data
      const featuredData = response.data.data || response.data;
      setFeaturedOrigins(Array.isArray(featuredData) ? featuredData : []);
    } catch (err) {
      console.error('Error fetching featured origins:', err);
      // Don't show error for featured origins as it's not critical
      setFeaturedOrigins([]);
    }
  };

  const fetchTodaysFeatured = async () => {
    try {
      // First try to get currently active featured origin (time-filtered)
      const activeResponse = await apiService.get(API_ENDPOINTS.BARISTA.FEATURED_ORIGINS.TODAY);
      const activeData = activeResponse.data.data || activeResponse.data;
      
      if (Array.isArray(activeData) && activeData.length > 0) {
        setTodaysFeatured(activeData[0]);
        return;
      }

      // If no active origin right now, try to get today's scheduled origins (ignores time)
      try {
        const scheduledResponse = await apiService.get(`${API_ENDPOINTS.BARISTA.FEATURED_ORIGINS.TODAY}-scheduled`);
        const scheduledData = scheduledResponse.data.data || scheduledResponse.data;
        if (Array.isArray(scheduledData) && scheduledData.length > 0) {
          // Mark it as scheduled but not yet active
          const scheduled = scheduledData[0];
          scheduled._isScheduled = true; // Flag to show different UI
          setTodaysFeatured(scheduled);
        } else {
          setTodaysFeatured(null);
        }
      } catch (schedErr) {
        setTodaysFeatured(null);
      }
    } catch (err) {
      console.error('Error fetching today\'s featured:', err);
      setTodaysFeatured(null);
    }
  };

  const fetchAvailableBeans = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.BARISTA.FEATURED_ORIGINS.AVAILABLE_BEANS);
      setAvailableBeans(response.data);
    } catch (err) {
      console.error('Error fetching available beans:', err);
      // If endpoint not available, use all beans as fallback
      setAvailableBeans(beans.filter(bean => bean.is_featured));
    }
  };

  const updateBeanStock = async () => {
    if (!selectedBean || !newStock) return;

    try {
      setUpdatingStock(true);
      await apiService.put(API_ENDPOINTS.BARISTA.COFFEE_BEANS.UPDATE_STOCK(selectedBean.id), {
        stock_quantity: parseFloat(newStock)
      });

      // Update local state
      setBeans(prev => prev.map(bean =>
        bean.id === selectedBean.id
          ? { ...bean, stock_quantity: parseFloat(newStock) }
          : bean
      ));

      showSuccessNotification(`Stock updated for ${selectedBean.name}`);
      setShowStockModal(false);
      setSelectedBean(null);
      setNewStock('');
    } catch (err) {
      console.error('Error updating stock:', err);
      showErrorNotification('Failed to update stock');
    } finally {
      setUpdatingStock(false);
    }
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

  const addCoffeeBean = async () => {
    try {
      setAddingBean(true);
      
      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append('name', newBeanForm.name);
      formData.append('origin_country', newBeanForm.origin_country);
      formData.append('region', newBeanForm.region || '');
      formData.append('elevation', newBeanForm.elevation || '');
      formData.append('processing_method', newBeanForm.processing_method || '');
      formData.append('variety', newBeanForm.variety || '');
      formData.append('tasting_notes', newBeanForm.tasting_notes || '');
      formData.append('producer', newBeanForm.producer || '');
      formData.append('stock_quantity', newBeanForm.stock_quantity);
      formData.append('is_featured', newBeanForm.is_featured ? '1' : '0');
      
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await apiService.post(API_ENDPOINTS.BARISTA.COFFEE_BEANS.CREATE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Add to local state
      setBeans(prev => [...prev, response.data]);

      showSuccessNotification(`Coffee bean "${newBeanForm.name}" added successfully`);
      setShowAddBeanModal(false);
      resetNewBeanForm();
      fetchCoffeeBeans(); // Refresh the list
    } catch (err) {
      console.error('Error adding coffee bean:', err);
      showErrorNotification(err.response?.data?.message || 'Failed to add coffee bean');
    } finally {
      setAddingBean(false);
    }
  };

  const resetNewBeanForm = () => {
    setNewBeanForm({
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
    setSelectedImage(null);
    setImagePreview(null);
  };

  const archiveCoffeeBean = async () => {
    if (!beanToArchive) return;

    try {
      setArchiving(true);
      await apiService.delete(API_ENDPOINTS.BARISTA.COFFEE_BEANS.ARCHIVE(beanToArchive.id));

      // Remove from local state
      setBeans(prev => prev.filter(bean => bean.id !== beanToArchive.id));

      showSuccessNotification(`Coffee bean "${beanToArchive.name}" archived successfully`);
      setShowArchiveModal(false);
      setBeanToArchive(null);
    } catch (err) {
      console.error('Error archiving coffee bean:', err);
      showErrorNotification('Failed to archive coffee bean');
    } finally {
      setArchiving(false);
    }
  };

  const createFeaturedOrigin = async () => {
    try {
      setCreatingFeatured(true);
      await apiService.post(API_ENDPOINTS.BARISTA.FEATURED_ORIGINS.CREATE, featuredForm);

      showSuccessNotification('Featured origin created successfully');
      setShowFeaturedModal(false);
      resetFeaturedForm();
      fetchFeaturedOrigins();
      fetchTodaysFeatured();
    } catch (err) {
      console.error('Error creating featured origin:', err);
      showErrorNotification(err.response?.data?.message || 'Failed to create featured origin');
    } finally {
      setCreatingFeatured(false);
    }
  };

  const resetFeaturedForm = () => {
    setFeaturedForm({
      coffee_bean_id: '',
      feature_date: new Date().toISOString().split('T')[0],
      start_time: '08:00',
      end_time: '18:00',
      special_notes: '',
      promotion_text: '',
      is_active: true
    });
  };

  const getStockStatus = (quantity) => {
    if (quantity <= 0) return { variant: 'danger', text: 'Out of Stock', icon: '❌' };
    if (quantity < 5) return { variant: 'warning', text: 'Low Stock', icon: '⚠️' };
    if (quantity < 20) return { variant: 'info', text: 'Medium', icon: '🟡' };
    return { variant: 'success', text: 'Good Stock', icon: '✅' };
  };

  const filteredBeans = beans.filter(bean =>
    bean.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bean.origin_country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bean.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading coffee beans...</p>
      </Container>
    );
  }

  const renderInventoryTab = () => (
    <>
      {/* Search Bar and Add Button */}
      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search beans by name, origin, or region..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={6} className="text-end">
          <Button 
            variant="success" 
            onClick={() => setShowAddBeanModal(true)}
          >
            <FaPlus className="me-2" />
            Add Coffee Bean
          </Button>
        </Col>
      </Row>

      {/* Coffee Beans Grid */}
      <Row>
        {filteredBeans.map(bean => {
          const stockStatus = getStockStatus(bean.stock_quantity);

          return (
            <Col lg={4} md={6} className="mb-4" key={bean.id}>
              <Card className="h-100">
                <div className="position-relative">
                  <Card.Img
                    variant="top"
                    src={bean.image_url || '/assets/default.png'}
                    alt={bean.name}
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                  {bean.is_featured && (
                    <Badge bg="warning" className="position-absolute top-0 end-0 m-2">
                      <FaStar className="me-1" />
                      Featured
                    </Badge>
                  )}
                </div>

                <Card.Body className="d-flex flex-column">
                  <Card.Title className="d-flex align-items-center">
                    <FaCoffee className="me-2 text-brown" />
                    {bean.name}
                  </Card.Title>

                  <div className="mb-2">
                    <small className="text-muted">
                      {bean.origin_country} • {bean.region}
                    </small>
                  </div>

                  <div className="mb-2">
                    <strong>Origin:</strong> {bean.origin_country}<br />
                    <strong>Region:</strong> {bean.region}<br />
                    <strong>Elevation:</strong> {bean.elevation}m<br />
                    <strong>Process:</strong> {bean.processing_method}
                  </div>

                  <div className="mb-2">
                    <strong>Tasting Notes:</strong><br />
                    <small className="text-muted">{bean.tasting_notes}</small>
                  </div>

                  <div className="mb-3">
                    <strong>Stock Status:</strong>
                    <div className="d-flex align-items-center mt-1">
                      <Badge bg={stockStatus.variant} className="me-2">
                        {stockStatus.icon} {stockStatus.text}
                      </Badge>
                      <span className="fw-bold">{bean.stock_quantity}kg</span>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-100 mb-2"
                      onClick={() => {
                        setSelectedBean(bean);
                        setNewStock(bean.stock_quantity.toString());
                        setShowStockModal(true);
                      }}
                    >
                      <FaEdit className="me-1" />
                      Update Stock
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="w-100"
                      onClick={() => {
                        setBeanToArchive(bean);
                        setShowArchiveModal(true);
                      }}
                    >
                      Archive
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {filteredBeans.length === 0 && (
        <div className="text-center py-5">
          <FaCoffee size={48} className="text-muted mb-3" />
          <h4>No coffee beans found</h4>
          <p className="text-muted">
            {searchTerm ? 'Try adjusting your search terms.' : 'No coffee beans are currently available.'}
          </p>
        </div>
      )}

      {/* Stock Update Modal */}
      <Modal show={showStockModal} onHide={() => setShowStockModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Stock - {selectedBean?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Current Stock</Form.Label>
            <Form.Control
              type="text"
              value={`${selectedBean?.stock_quantity || 0} kg`}
              readOnly
              className="bg-light"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>New Stock Quantity (kg)</Form.Label>
            <Form.Control
              type="number"
              step="0.1"
              min="0"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              placeholder="Enter new stock quantity"
            />
            <Form.Text className="text-muted">
              Enter the new stock quantity in kilograms
            </Form.Text>
          </Form.Group>

          {selectedBean && (
            <Alert variant={getStockStatus(parseFloat(newStock) || 0).variant}>
              <FaExclamationTriangle className="me-2" />
              This will set the stock to {newStock}kg ({getStockStatus(parseFloat(newStock) || 0).text})
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStockModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={updateBeanStock}
            disabled={updatingStock || !newStock}
          >
            {updatingStock ? <Spinner size="sm" /> : null}
            Update Stock
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Coffee Bean Modal */}
      <Modal 
        show={showAddBeanModal} 
        onHide={() => {
          setShowAddBeanModal(false);
          resetNewBeanForm();
        }}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaPlus className="me-2" />
            Add New Coffee Bean
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Bean Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={newBeanForm.name}
                    onChange={(e) => setNewBeanForm({...newBeanForm, name: e.target.value})}
                    placeholder="e.g., Ethiopian Yirgacheffe"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Origin Country *</Form.Label>
                  <Form.Control
                    type="text"
                    value={newBeanForm.origin_country}
                    onChange={(e) => setNewBeanForm({...newBeanForm, origin_country: e.target.value})}
                    placeholder="e.g., Ethiopia"
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
                    value={newBeanForm.region}
                    onChange={(e) => setNewBeanForm({...newBeanForm, region: e.target.value})}
                    placeholder="e.g., Sidamo"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Elevation</Form.Label>
                  <Form.Control
                    type="text"
                    value={newBeanForm.elevation}
                    onChange={(e) => setNewBeanForm({...newBeanForm, elevation: e.target.value})}
                    placeholder="e.g., 1800-2200m"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Processing Method</Form.Label>
                  <Form.Control
                    type="text"
                    value={newBeanForm.processing_method}
                    onChange={(e) => setNewBeanForm({...newBeanForm, processing_method: e.target.value})}
                    placeholder="e.g., Washed, Natural, Honey"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Variety</Form.Label>
                  <Form.Control
                    type="text"
                    value={newBeanForm.variety}
                    onChange={(e) => setNewBeanForm({...newBeanForm, variety: e.target.value})}
                    placeholder="e.g., Heirloom"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Producer</Form.Label>
              <Form.Control
                type="text"
                value={newBeanForm.producer}
                onChange={(e) => setNewBeanForm({...newBeanForm, producer: e.target.value})}
                placeholder="e.g., Local Cooperative"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tasting Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newBeanForm.tasting_notes}
                onChange={(e) => setNewBeanForm({...newBeanForm, tasting_notes: e.target.value})}
                placeholder="e.g., Floral, Citrus, Bergamot"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Initial Stock Quantity (kg) *</Form.Label>
              <Form.Control
                type="number"
                step="0.1"
                min="0"
                value={newBeanForm.stock_quantity}
                onChange={(e) => setNewBeanForm({...newBeanForm, stock_quantity: parseFloat(e.target.value) || 0})}
                placeholder="0"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Coffee Bean Image</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              <Form.Text className="text-muted">
                Upload an image for the coffee bean (JPG, PNG, GIF - max 2MB)
              </Form.Text>
              {imagePreview && (
                <div className="mt-3">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }}
                    className="rounded"
                  />
                </div>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Mark as Featured Bean"
                checked={newBeanForm.is_featured}
                onChange={(e) => setNewBeanForm({...newBeanForm, is_featured: e.target.checked})}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowAddBeanModal(false);
              resetNewBeanForm();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={addCoffeeBean}
            disabled={addingBean || !newBeanForm.name || !newBeanForm.origin_country}
          >
            {addingBean ? (
              <>
                <Spinner size="sm" className="me-2" />
                Adding...
              </>
            ) : (
              <>
                <FaPlus className="me-2" />
                Add Coffee Bean
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );

  const renderFeaturedTab = () => (
    <>
      {/* Today's Featured Display */}
      <Card className="mb-4 border-warning">
        <Card.Header className="bg-warning text-dark">
          <h5 className="mb-0">
            <FaStar className="me-2" />
            Today's Featured Origin
          </h5>
        </Card.Header>
        <Card.Body>
          {todaysFeatured ? (
            <Row>
              <Col md={8}>
                <h4 className="text-warning">{todaysFeatured.coffeeBean?.name}</h4>
                <p className="mb-2">
                  <strong>Origin:</strong> {todaysFeatured.coffeeBean?.origin_country} • {todaysFeatured.coffeeBean?.region}
                </p>
                <p className="mb-2">
                  <strong>Tasting Notes:</strong> {todaysFeatured.coffeeBean?.tasting_notes}
                </p>
                {todaysFeatured.promotion_text && (
                  <Alert variant="info">
                    <strong>Promotion:</strong> {todaysFeatured.promotion_text}
                  </Alert>
                )}
                {todaysFeatured.special_notes && (
                  <p className="mb-0">
                    <strong>Notes:</strong> {todaysFeatured.special_notes}
                  </p>
                )}
                {todaysFeatured._isScheduled && (
                  <Alert variant="warning" className="mt-2">
                    <FaClock className="me-2" />
                    This featured origin is scheduled for today but not yet active. It will activate at {todaysFeatured.start_time}.
                  </Alert>
                )}
              </Col>
              <Col md={4} className="text-end">
                <div className="mb-2">
                  <Badge bg={todaysFeatured._isScheduled ? 'warning' : 'success'} className="me-2">
                    <FaClock className="me-1" />
                    {todaysFeatured.start_time} - {todaysFeatured.end_time}
                  </Badge>
                </div>
                <Badge bg={todaysFeatured._isScheduled ? 'warning' : (todaysFeatured.is_active ? 'success' : 'secondary')}>
                  {todaysFeatured._isScheduled ? 'Scheduled' : (todaysFeatured.is_active ? 'Active Now' : 'Inactive')}
                </Badge>
              </Col>
            </Row>
          ) : (
            <div className="text-center py-3">
              <FaRegStar size={48} className="text-muted mb-3" />
              <h5>No featured origin set for today</h5>
              <p className="text-muted">Set a featured coffee origin to highlight it to customers.</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Featured Origins Management */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Manage Featured Origins</h5>
        <Button variant="success" onClick={() => setShowFeaturedModal(true)}>
          <FaStar className="me-1" />
          Set Featured Origin
        </Button>
      </div>

      {/* Featured Origins List */}
      <Row>
        {Array.isArray(featuredOrigins) && featuredOrigins.map(featured => (
          <Col md={6} className="mb-3" key={featured.id}>
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{featured.coffeeBean?.name}</strong>
                  <br />
                  <small className="text-muted">
                    <FaCalendarAlt className="me-1" />
                    {new Date(featured.feature_date).toLocaleDateString()}
                  </small>
                </div>
                <Badge bg={featured.is_active ? 'success' : 'secondary'}>
                  {featured.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </Card.Header>
              <Card.Body>
                <p className="mb-2">
                  <strong>Origin:</strong> {featured.coffeeBean?.origin_country} • {featured.coffeeBean?.region}
                </p>
                {featured.start_time && featured.end_time && (
                  <p className="mb-2">
                    <strong>Time:</strong> {featured.start_time} - {featured.end_time}
                  </p>
                )}
                {featured.promotion_text && (
                  <Alert variant="info" className="py-2">
                    <small>{featured.promotion_text}</small>
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {Array.isArray(featuredOrigins) && featuredOrigins.length === 0 && (
        <div className="text-center py-5">
          <FaRegStar size={48} className="text-muted mb-3" />
          <h5>No featured origins scheduled</h5>
          <p className="text-muted">Create your first featured origin to highlight special coffee beans.</p>
        </div>
      )}

      {/* Create Featured Origin Modal */}
      <Modal show={showFeaturedModal} onHide={() => setShowFeaturedModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Set Featured Origin</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Coffee Bean</Form.Label>
                  <Form.Select
                    value={featuredForm.coffee_bean_id}
                    onChange={(e) => setFeaturedForm({...featuredForm, coffee_bean_id: e.target.value})}
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
                  <Form.Label>Feature Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={featuredForm.feature_date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFeaturedForm({...featuredForm, feature_date: e.target.value})}
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
                    value={featuredForm.start_time}
                    onChange={(e) => setFeaturedForm({...featuredForm, start_time: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={featuredForm.end_time}
                    onChange={(e) => setFeaturedForm({...featuredForm, end_time: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Promotion Text (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={featuredForm.promotion_text}
                onChange={(e) => setFeaturedForm({...featuredForm, promotion_text: e.target.value})}
                placeholder="e.g., Special 20% discount today!"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Special Notes (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={featuredForm.special_notes}
                onChange={(e) => setFeaturedForm({...featuredForm, special_notes: e.target.value})}
                placeholder="Internal notes about this featured origin"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Active"
                checked={featuredForm.is_active}
                onChange={(e) => setFeaturedForm({...featuredForm, is_active: e.target.checked})}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowFeaturedModal(false); resetFeaturedForm(); }}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={createFeaturedOrigin}
            disabled={creatingFeatured || !featuredForm.coffee_bean_id}
          >
            {creatingFeatured ? <Spinner size="sm" /> : <FaStar className="me-1" />}
            Set as Featured
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">Coffee Bean Control</h1>
          <p className="text-muted mb-0">Manage coffee bean inventory and featured origins</p>
        </div>
        <Button variant="outline-primary" onClick={() => { fetchCoffeeBeans(); fetchFeaturedOrigins(); fetchTodaysFeatured(); }}>
          <FaCoffee className="me-1" />
          Refresh All
        </Button>
      </div>

      <Tabs defaultActiveKey="inventory" className="mb-4">
        <Tab eventKey="inventory" title="Bean Inventory">
          {renderInventoryTab()}
        </Tab>
        <Tab eventKey="featured" title="Featured Origins">
          {renderFeaturedTab()}
        </Tab>
      </Tabs>

      {/* Archive Confirmation Modal */}
      <Modal show={showArchiveModal} onHide={() => setShowArchiveModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Archive Coffee Bean</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <FaExclamationTriangle className="me-2" />
            Are you sure you want to archive <strong>{beanToArchive?.name}</strong>?
          </Alert>
          <p>
            This will remove the coffee bean from the active inventory. 
            The bean can be restored by an administrator if needed.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowArchiveModal(false);
              setBeanToArchive(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={archiveCoffeeBean}
            disabled={archiving}
          >
            {archiving ? (
              <>
                <Spinner size="sm" className="me-2" />
                Archiving...
              </>
            ) : (
              'Archive Bean'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );

};

export default CoffeeBeanControl;