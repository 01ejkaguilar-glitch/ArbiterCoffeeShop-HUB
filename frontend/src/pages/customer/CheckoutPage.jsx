import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, ListGroup, Modal, Spinner } from 'react-bootstrap';
import { FaMapMarkerAlt, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [orderType, setOrderType] = useState('delivery');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState({
    type: 'home',
    street: '',
    city: '',
    province: '',
    postal_code: '',
    is_default: false,
  });

  const deliveryFee = orderType === 'delivery' ? 50 : 0;
  const subtotal = cart?.items?.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0) || 0;
  const total = subtotal + deliveryFee;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    
    if (!cart || !cart.items || cart.items.length === 0) {
      navigate('/cart');
      return;
    }

    fetchAddresses();
  }, [isAuthenticated, cart, navigate]);

  const fetchAddresses = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.ADDRESSES);
      if (response.success) {
        setAddresses(response.data);
        const defaultAddress = response.data.find(addr => addr.is_default);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        }
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  };

  const handleAddressChange = (e) => {
    setAddressForm({
      ...addressForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const response = await apiService.post(API_ENDPOINTS.ADDRESSES, addressForm);
      if (response.success) {
        setAddresses([...addresses, response.data]);
        setSelectedAddressId(response.data.id);
        setShowAddressModal(false);
        setAddressForm({
          type: 'home',
          street: '',
          city: '',
          province: '',
          postal_code: '',
          is_default: false,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add address');
    }
  };

  const handlePlaceOrder = async () => {
    setError('');
    setLoading(true);

    try {
      // Validate order
      if (orderType === 'delivery' && !selectedAddressId) {
        setError('Please select a delivery address');
        setLoading(false);
        return;
      }

      if (!cart || !cart.items || cart.items.length === 0) {
        setError('Your cart is empty');
        setLoading(false);
        return;
      }

      // Prepare order data
      const orderData = {
        order_type: orderType,
        payment_method: paymentMethod,
        items: cart.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          special_instructions: item.special_instructions || null,
        })),
        notes: notes || null,
      };

      // Add delivery address if delivery order
      if (orderType === 'delivery') {
        orderData.delivery_address_id = selectedAddressId;
      }

      // Create order
      const response = await apiService.post(API_ENDPOINTS.ORDERS.CREATE, orderData);

      if (response.success) {
        // Clear cart after successful order
        await clearCart();
        
        // Redirect to order confirmation
        navigate(`/orders/${response.data.id}`, { 
          state: { orderCreated: true } 
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h1 className="display-5 fw-bold">Checkout</h1>
          <p className="lead text-muted">Complete your order</p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Row>
        <Col lg={8}>
          {/* Order Type */}
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Order Type</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Check
                  type="radio"
                  name="orderType"
                  label="Dine In"
                  value="dine-in"
                  checked={orderType === 'dine-in'}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="mb-2"
                />
                <Form.Check
                  type="radio"
                  name="orderType"
                  label="Take Out"
                  value="take-out"
                  checked={orderType === 'take-out'}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="mb-2"
                />
                <Form.Check
                  type="radio"
                  name="orderType"
                  label="Delivery"
                  value="delivery"
                  checked={orderType === 'delivery'}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="mb-2"
                />
              </Form>
            </Card.Body>
          </Card>

          {/* Delivery Address */}
          {orderType === 'delivery' && (
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Delivery Address</h5>
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => setShowAddressModal(true)}
                >
                  <FaPlus className="me-1" />
                  Add New
                </Button>
              </Card.Header>
              <Card.Body>
                {addresses.length === 0 ? (
                  <Alert variant="info">
                    No addresses found. Please add a delivery address.
                  </Alert>
                ) : (
                  <ListGroup>
                    {addresses.map((address) => (
                      <ListGroup.Item
                        key={address.id}
                        action
                        active={selectedAddressId === address.id}
                        onClick={() => setSelectedAddressId(address.id)}
                        className="d-flex justify-content-between align-items-start"
                      >
                        <div>
                          <div className="fw-bold">
                            <FaMapMarkerAlt className="me-2" />
                            {address.type.charAt(0).toUpperCase() + address.type.slice(1)}
                            {address.is_default && (
                              <span className="badge bg-success ms-2">Default</span>
                            )}
                          </div>
                          <div className="text-muted">
                            {address.street}, {address.city}, {address.province} {address.postal_code}
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Payment Method */}
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Payment Method</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Check
                  type="radio"
                  name="payment"
                  label="Cash on Delivery / Cash"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mb-2"
                />
                <Form.Check
                  type="radio"
                  name="payment"
                  label="GCash"
                  value="gcash"
                  checked={paymentMethod === 'gcash'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mb-2"
                />
                <Form.Check
                  type="radio"
                  name="payment"
                  label="Maya"
                  value="maya"
                  checked={paymentMethod === 'maya'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mb-2"
                />
                <Form.Check
                  type="radio"
                  name="payment"
                  label="Card"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mb-2"
                />
              </Form>
            </Card.Body>
          </Card>

          {/* Order Notes */}
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Order Notes (Optional)</h5>
            </Card.Header>
            <Card.Body>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Add any special instructions for your order..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* Order Summary */}
          <Card className="shadow-sm sticky-top" style={{ top: '20px' }}>
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">Order Summary</h5>
            </Card.Header>
            <Card.Body>
              {/* Cart Items */}
              <div className="mb-3">
                {cart?.items?.map((item, index) => (
                  <div key={index} className="d-flex justify-content-between mb-2">
                    <div className="flex-grow-1">
                      <div className="fw-bold">{item.product?.name || 'Product'}</div>
                      <div className="text-muted small">Qty: {item.quantity} × ₱{parseFloat(item.unit_price).toFixed(2)}</div>
                    </div>
                    <div className="fw-bold">
                      ₱{(item.unit_price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              
              <hr />
              
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Delivery Fee:</span>
                <span>₱{deliveryFee.toFixed(2)}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-4">
                <span className="fw-bold">Total:</span>
                <span className="fw-bold fs-5">₱{total.toFixed(2)}</span>
              </div>
              <Button
                variant="success"
                size="lg"
                className="w-100"
                onClick={handlePlaceOrder}
                disabled={loading || (orderType === 'delivery' && !selectedAddressId)}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Processing...
                  </>
                ) : (
                  'Place Order'
                )}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add Address Modal */}
      <Modal show={showAddressModal} onHide={() => setShowAddressModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Address</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddAddress}>
            <Form.Group className="mb-3">
              <Form.Label>Address Type</Form.Label>
              <Form.Select
                name="type"
                value={addressForm.type}
                onChange={handleAddressChange}
                required
              >
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Street Address</Form.Label>
              <Form.Control
                type="text"
                name="street"
                value={addressForm.street}
                onChange={handleAddressChange}
                placeholder="123 Main Street"
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    name="city"
                    value={addressForm.city}
                    onChange={handleAddressChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Province</Form.Label>
                  <Form.Control
                    type="text"
                    name="province"
                    value={addressForm.province}
                    onChange={handleAddressChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Postal Code</Form.Label>
              <Form.Control
                type="text"
                name="postal_code"
                value={addressForm.postal_code}
                onChange={handleAddressChange}
                required
              />
            </Form.Group>

            <Form.Check
              type="checkbox"
              name="is_default"
              label="Set as default address"
              checked={addressForm.is_default}
              onChange={(e) =>
                setAddressForm({ ...addressForm, is_default: e.target.checked })
              }
              className="mb-3"
            />

            <div className="d-flex gap-2">
              <Button variant="secondary" onClick={() => setShowAddressModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" className="flex-grow-1">
                Add Address
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default CheckoutPage;
