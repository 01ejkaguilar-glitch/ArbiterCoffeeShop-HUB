import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Modal, Form, Alert, Tab, Tabs, Spinner } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaExclamationTriangle, FaBoxes, FaCoffee, FaUtensils, FaBox, FaSprayCan, FaPencilAlt } from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import Loading from '../../components/common/Loading';

const AdminInventory = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [activeTab, setActiveTab] = useState('all');
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'bar',
    quantity: '',
    unit: '',
    reorder_level: '',
    cost_per_unit: ''
  });

  const inventoryTypes = [
    { key: 'bar', label: 'Bar Inventory', icon: FaCoffee },
    { key: 'kitchen', label: 'Kitchen Supplies', icon: FaUtensils },
    { key: 'packaging', label: 'Packaging Materials', icon: FaBox },
    { key: 'cleaning', label: 'Cleaning Supplies', icon: FaSprayCan },
    { key: 'stationery', label: 'Stationery', icon: FaPencilAlt }
  ];

  useEffect(() => {
    fetchInventoryItems();
  }, []);

  const fetchInventoryItems = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(API_ENDPOINTS.ADMIN.INVENTORY.LIST);
      if (response.success) {
        const items = response.data.data || response.data;
        setInventoryItems(Array.isArray(items) ? items : []);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      showAlert('Failed to load inventory items', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        type: item.type,
        quantity: item.quantity,
        unit: item.unit,
        reorder_level: item.reorder_level || '',
        cost_per_unit: item.cost_per_unit || ''
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        type: activeTab === 'all' ? 'bar' : activeTab,
        quantity: '',
        unit: '',
        reorder_level: '',
        cost_per_unit: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        quantity: parseFloat(formData.quantity) || 0,
        reorder_level: parseFloat(formData.reorder_level) || 0,
        cost_per_unit: parseFloat(formData.cost_per_unit) || null
      };

      let response;
      if (editingItem) {
        response = await apiService.put(
          API_ENDPOINTS.ADMIN.INVENTORY.UPDATE(editingItem.id),
          dataToSend
        );
      } else {
        response = await apiService.post(API_ENDPOINTS.ADMIN.INVENTORY.CREATE, dataToSend);
      }

      if (response.success) {
        showAlert(
          editingItem ? 'Item updated successfully!' : 'Item added successfully!',
          'success'
        );
        handleCloseModal();
        fetchInventoryItems();
      }
    } catch (error) {
      showAlert(error.response?.data?.message || 'Failed to save item', 'danger');
    }
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const response = await apiService.delete(API_ENDPOINTS.ADMIN.INVENTORY.DELETE(itemId));
        if (response.success) {
          showAlert('Item deleted successfully!', 'success');
          fetchInventoryItems();
        }
      } catch (error) {
        showAlert('Failed to delete item', 'danger');
      }
    }
  };

  const handleAdjustStock = async (item, adjustment) => {
    const newQuantity = parseFloat(prompt(`Adjust stock for ${item.name}\nCurrent: ${item.quantity} ${item.unit}\nEnter new quantity:`, item.quantity));
    
    if (isNaN(newQuantity) || newQuantity < 0) {
      return;
    }

    try {
      const response = await apiService.post(
        API_ENDPOINTS.ADMIN.INVENTORY.ADJUST(item.id),
        {
          quantity: newQuantity,
          reason: 'Manual adjustment by admin'
        }
      );

      if (response.success) {
        showAlert('Stock adjusted successfully!', 'success');
        fetchInventoryItems();
      }
    } catch (error) {
      showAlert('Failed to adjust stock', 'danger');
    }
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
  };

  const getStockBadge = (item) => {
    if (item.quantity === 0) {
      return <Badge bg="danger">Out of Stock</Badge>;
    } else if (item.quantity <= item.reorder_level) {
      return <Badge bg="warning">Low Stock</Badge>;
    }
    return <Badge bg="success">In Stock</Badge>;
  };

  const getFilteredItems = () => {
    if (activeTab === 'all') {
      return inventoryItems;
    }
    return inventoryItems.filter(item => item.type === activeTab);
  };

  const getLowStockCount = (type) => {
    const items = type === 'all' 
      ? inventoryItems 
      : inventoryItems.filter(item => item.type === type);
    return items.filter(item => item.quantity <= item.reorder_level && item.quantity > 0).length;
  };

  const getOutOfStockCount = (type) => {
    const items = type === 'all' 
      ? inventoryItems 
      : inventoryItems.filter(item => item.type === type);
    return items.filter(item => item.quantity === 0).length;
  };

  const renderStatsCards = () => {
    const filteredItems = getFilteredItems();
    const lowStock = filteredItems.filter(i => i.quantity <= i.reorder_level && i.quantity > 0).length;
    const outOfStock = filteredItems.filter(i => i.quantity === 0).length;
    const inStock = filteredItems.filter(i => i.quantity > i.reorder_level).length;

    return (
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h6 className="text-muted mb-2">Total Items</h6>
              <h3 className="mb-0">{filteredItems.length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h6 className="text-muted mb-2">In Stock</h6>
              <h3 className="mb-0 text-success">{inStock}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h6 className="text-muted mb-2">Low Stock</h6>
              <h3 className="mb-0 text-warning">{lowStock}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h6 className="text-muted mb-2">Out of Stock</h6>
              <h3 className="mb-0 text-danger">{outOfStock}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    );
  };

  if (loading) {
    return <Loading message="Loading inventory..." />;
  }

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="display-5 fw-bold">Inventory Management</h1>
              <p className="lead text-muted">Manage stock across all categories</p>
            </div>
            <Button variant="primary" size="lg" onClick={() => handleShowModal()}>
              <FaPlus className="me-2" />
              Add Item
            </Button>
          </div>
        </Col>
      </Row>

      {alert.show && (
        <Alert variant={alert.type} dismissible onClose={() => setAlert({ show: false, message: '', type: '' })}>
          {alert.message}
        </Alert>
      )}

      {renderStatsCards()}

      <Card className="shadow-sm">
        <Card.Header>
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="border-0">
            <Tab eventKey="all" title={
              <span>
                <FaBoxes className="me-2" />
                All Items {getLowStockCount('all') > 0 && <Badge bg="warning" className="ms-2">{getLowStockCount('all')}</Badge>}
              </span>
            } />
            {inventoryTypes.map(type => {
              const Icon = type.icon;
              const lowCount = getLowStockCount(type.key);
              return (
                <Tab key={type.key} eventKey={type.key} title={
                  <span>
                    <Icon className="me-2" />
                    {type.label}
                    {lowCount > 0 && <Badge bg="warning" className="ms-2">{lowCount}</Badge>}
                  </span>
                } />
              );
            })}
          </Tabs>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Reorder Level</th>
                <th>Cost/Unit</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredItems().length > 0 ? (
                getFilteredItems().map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td><strong>{item.name}</strong></td>
                    <td>
                      <Badge bg="info">
                        {inventoryTypes.find(t => t.key === item.type)?.label || item.type}
                      </Badge>
                    </td>
                    <td>
                      <strong className={item.quantity <= item.reorder_level ? 'text-warning' : ''}>
                        {item.quantity}
                      </strong>
                    </td>
                    <td>{item.unit}</td>
                    <td>{item.reorder_level}</td>
                    <td>{item.cost_per_unit ? `₱${parseFloat(item.cost_per_unit).toFixed(2)}` : 'N/A'}</td>
                    <td>{getStockBadge(item)}</td>
                    <td>
                      <Button
                        variant="outline-info"
                        size="sm"
                        className="me-1"
                        onClick={() => handleAdjustStock(item)}
                        title="Adjust Stock"
                      >
                        <FaBoxes />
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                        onClick={() => handleShowModal(item)}
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center text-muted py-4">
                    No inventory items found for this category
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
          <Modal.Title>{editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Item Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Coffee Cups, Milk, etc."
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Form.Select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                  >
                    {inventoryTypes.map(type => (
                      <option key={type.key} value={type.key}>{type.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Quantity *</Form.Label>
                  <Form.Control
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    step="0.01"
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Unit *</Form.Label>
                  <Form.Control
                    type="text"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    required
                    placeholder="e.g., pcs, kg, L"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Reorder Level *</Form.Label>
                  <Form.Control
                    type="number"
                    name="reorder_level"
                    value={formData.reorder_level}
                    onChange={handleChange}
                    required
                    step="0.01"
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Cost Per Unit (Optional)</Form.Label>
                  <Form.Control
                    type="number"
                    name="cost_per_unit"
                    value={formData.cost_per_unit}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="₱0.00"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingItem ? 'Update Item' : 'Add Item'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AdminInventory;
