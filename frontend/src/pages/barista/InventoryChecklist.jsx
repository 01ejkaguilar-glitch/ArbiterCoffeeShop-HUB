import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, Alert, Spinner, Tabs, Tab, InputGroup } from 'react-bootstrap';
import { FaBox, FaExclamationTriangle, FaPlus, FaMinus, FaSearch, FaSave, FaSync } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config/api';
import apiService from '../../services/api.service';
import { useNotificationSystem } from '../../components/common/NotificationSystem';

const InventoryChecklist = () => {
  // const { user } = useAuth(); // Not used in this component
  const { showSuccessNotification, showErrorNotification } = useNotificationSystem();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [changes, setChanges] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(API_ENDPOINTS.WORKFORCE.INVENTORY);
      setInventory(response.data);
      setChanges({}); // Reset changes
    } catch (err) {
      console.error('Error fetching inventory:', err);
      showErrorNotification('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (itemId, newQuantity) => {
    const quantity = Math.max(0, parseFloat(newQuantity) || 0);
    setChanges(prev => ({
      ...prev,
      [itemId]: quantity
    }));
  };

  const adjustQuantity = (itemId, adjustment) => {
    const currentQuantity = changes[itemId] !== undefined ? changes[itemId] :
      inventory.find(item => item.id === itemId)?.quantity || 0;
    const newQuantity = Math.max(0, currentQuantity + adjustment);
    updateQuantity(itemId, newQuantity);
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      const updatePromises = Object.entries(changes).map(([itemId, newQuantity]) =>
        apiService.put(`${API_ENDPOINTS.WORKFORCE.INVENTORY}/${itemId}`, {
          quantity: newQuantity
        })
      );

      await Promise.all(updatePromises);

      showSuccessNotification('Inventory updated successfully');
      setChanges({});
      fetchInventory(); // Refresh data
    } catch (err) {
      console.error('Error saving inventory changes:', err);
      showErrorNotification('Failed to save inventory changes');
    } finally {
      setSaving(false);
    }
  };

  const getStockStatus = (item, currentQuantity = null) => {
    const quantity = currentQuantity !== null ? currentQuantity : item.quantity;
    if (quantity <= 0) return { variant: 'danger', text: 'Out of Stock', icon: '❌' };
    if (quantity <= item.reorder_level) return { variant: 'warning', text: 'Low Stock', icon: '⚠️' };
    return { variant: 'success', text: 'In Stock', icon: '✅' };
  };

  const categorizeInventory = () => {
    const categories = {
      bar_supplies: [],
      coffee_beans: [],
      dairy: [],
      syrups: [],
      cups: [],
      kitchen: [],
      condiments: []
    };

    inventory.forEach(item => {
      const category = item.type || 'bar_supplies';
      if (categories[category]) {
        categories[category].push(item);
      } else {
        categories.bar_supplies.push(item);
      }
    });

    return categories;
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = categorizeInventory();
  const hasChanges = Object.keys(changes).length > 0;

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading inventory...</p>
      </Container>
    );
  }

  const InventoryCard = ({ item }) => {
    const currentQuantity = changes[item.id] !== undefined ? changes[item.id] : item.quantity;
    const stockStatus = getStockStatus(item, currentQuantity);
    const hasChange = changes[item.id] !== undefined;

    return (
      <Card className={`mb-3 ${hasChange ? 'border-primary' : ''}`}>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div className="flex-grow-1">
              <h6 className="mb-1">{item.name}</h6>
              <small className="text-muted">
                {item.unit} • Reorder at: {item.reorder_level} {item.unit}
              </small>
            </div>
            <Badge bg={stockStatus.variant}>
              {stockStatus.icon} {stockStatus.text}
            </Badge>
          </div>

          <div className="d-flex align-items-center mb-2">
            <strong className="me-2">Current:</strong>
            <span className={hasChange ? 'text-primary fw-bold' : ''}>
              {currentQuantity} {item.unit}
            </span>
            {hasChange && (
              <small className="text-muted ms-2">
                (was: {item.quantity} {item.unit})
              </small>
            )}
          </div>

          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => adjustQuantity(item.id, -1)}
            >
              <FaMinus />
            </Button>

            <Form.Control
              type="number"
              size="sm"
              style={{ width: '80px' }}
              value={currentQuantity}
              onChange={(e) => updateQuantity(item.id, e.target.value)}
              min="0"
              step="0.1"
            />

            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => adjustQuantity(item.id, 1)}
            >
              <FaPlus />
            </Button>
          </div>

          {item.cost_per_unit && (
            <small className="text-muted d-block mt-1">
              Cost: ₱{item.cost_per_unit.toFixed(2)} per {item.unit}
            </small>
          )}
        </Card.Body>
      </Card>
    );
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">Inventory Checklist</h1>
          <p className="text-muted mb-0">Manage bar supplies and track stock levels</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={fetchInventory}>
            <FaSync className="me-1" />
            Refresh
          </Button>
          {hasChanges && (
            <Button
              variant="success"
              onClick={saveChanges}
              disabled={saving}
            >
              {saving ? <Spinner size="sm" /> : <FaSave className="me-1" />}
              Save Changes ({Object.keys(changes).length})
            </Button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search inventory items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
      </Row>

      {/* Changes Alert */}
      {hasChanges && (
        <Alert variant="info" className="mb-4">
          <FaExclamationTriangle className="me-2" />
          You have unsaved changes to {Object.keys(changes).length} item(s).
          Click "Save Changes" to update the inventory.
        </Alert>
      )}

      {/* Inventory by Category */}
      <Tabs defaultActiveKey="all" className="mb-4">
        <Tab eventKey="all" title={`All Items (${filteredInventory.length})`}>
          <Row>
            {filteredInventory.map(item => (
              <Col lg={4} md={6} key={item.id}>
                <InventoryCard item={item} />
              </Col>
            ))}
          </Row>
        </Tab>

        {Object.entries(categories).map(([category, items]) => {
          if (items.length === 0) return null;

          const categoryNames = {
            bar_supplies: 'Bar Supplies',
            coffee_beans: 'Coffee Beans',
            dairy: 'Dairy Products',
            syrups: 'Syrups & Flavorings',
            cups: 'Cups & Lids',
            kitchen: 'Kitchen Supplies',
            condiments: 'Condiments'
          };

          return (
            <Tab
              key={category}
              eventKey={category}
              title={`${categoryNames[category] || category} (${items.length})`}
            >
              <Row>
                {items
                  .filter(item => !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(item => (
                    <Col lg={4} md={6} key={item.id}>
                      <InventoryCard item={item} />
                    </Col>
                  ))}
              </Row>
            </Tab>
          );
        })}
      </Tabs>

      {/* Low Stock Alert */}
      {inventory.some(item => item.quantity <= item.reorder_level) && (
        <Alert variant="warning">
          <FaExclamationTriangle className="me-2" />
          <strong>Low Stock Alert:</strong> Some items are running low and may need reordering.
          Check the items marked with ⚠️ for details.
        </Alert>
      )}

      {/* Empty State */}
      {filteredInventory.length === 0 && (
        <div className="text-center py-5">
          <FaBox size={48} className="text-muted mb-3" />
          <h4>No inventory items found</h4>
          <p className="text-muted">
            {searchTerm ? 'Try adjusting your search terms.' : 'No inventory items are currently available.'}
          </p>
        </div>
      )}
    </Container>
  );
};

export default InventoryChecklist;