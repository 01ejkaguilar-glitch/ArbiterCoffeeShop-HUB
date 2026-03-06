import React, { useState, useRef } from 'react';
import { Button, Modal, Form, Row, Col } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import { useEscapeKey, useFocusTrap } from '../../hooks/useKeyboardNavigation';

function AddressSelector({ addresses, selectedAddressId, setSelectedAddressId, onAddAddress, triggerOnly = false }) {
  const [showModal, setShowModal] = useState(false);
  const [addressForm, setAddressForm] = useState({
    type: 'home',
    street: '',
    city: '',
    province: '',
    postal_code: '',
    is_default: false,
  });
  const modalRef = useRef(null);

  useEscapeKey(() => setShowModal(false), showModal);
  useFocusTrap(modalRef, showModal);

  const handleChange = (e) => {
    setAddressForm({
      ...addressForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await onAddAddress(addressForm);
    if (success) {
      setShowModal(false);
      setAddressForm({
        type: 'home',
        street: '',
        city: '',
        province: '',
        postal_code: '',
        is_default: false,
      });
    }
  };

  /* Modal (shared by both modes) */
  const addressModal = (
    <Modal show={showModal} onHide={() => setShowModal(false)} centered>
      <div ref={modalRef}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Address</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit} aria-labelledby="address-form-title" noValidate>
            <h3 id="address-form-title" className="visually-hidden">Address Information</h3>

            <Form.Group className="mb-3">
              <Form.Label htmlFor="address-type">Address Type <span aria-label="required">*</span></Form.Label>
              <Form.Select
                id="address-type"
                name="type"
                value={addressForm.type}
                onChange={handleChange}
                required
                aria-required="true"
              >
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </Form.Select>
            </Form.Group>

            <fieldset className="border-0 p-0">
              <legend className="fw-bold mb-3">Delivery Address</legend>

              <Form.Group className="mb-3">
                <Form.Label htmlFor="address-street">Street Address <span aria-label="required">*</span></Form.Label>
                <Form.Control
                  id="address-street"
                  type="text"
                  name="street"
                  value={addressForm.street}
                  onChange={handleChange}
                  placeholder="123 Main Street"
                  required
                  aria-required="true"
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label htmlFor="address-city">City <span aria-label="required">*</span></Form.Label>
                    <Form.Control
                      id="address-city"
                      type="text"
                      name="city"
                      value={addressForm.city}
                      onChange={handleChange}
                      required
                      aria-required="true"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label htmlFor="address-province">Province <span aria-label="required">*</span></Form.Label>
                    <Form.Control
                      id="address-province"
                      type="text"
                      name="province"
                      value={addressForm.province}
                      onChange={handleChange}
                      required
                      aria-required="true"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label htmlFor="address-postal">Postal Code <span aria-label="required">*</span></Form.Label>
                <Form.Control
                  id="address-postal"
                  type="text"
                  name="postal_code"
                  value={addressForm.postal_code}
                  onChange={handleChange}
                  required
                  aria-required="true"
                />
              </Form.Group>
            </fieldset>

            <Form.Check
              id="address-default"
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
              <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" className="flex-grow-1">
                Add Address
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </div>
    </Modal>
  );

  /* triggerOnly mode — just a button + the modal */
  if (triggerOnly) {
    return (
      <>
        <button type="button" className="co-add-address-btn" onClick={() => setShowModal(true)}>
          <FaPlus className="me-2" /> Add New Address
        </button>
        {addressModal}
      </>
    );
  }

  /* Full mode (fallback for empty-address empty state) */
  return (
    <>
      <button type="button" className="co-add-address-btn" onClick={() => setShowModal(true)}>
        <FaPlus className="me-2" /> Add Delivery Address
      </button>
      {addressModal}
    </>
  );
}

export default AddressSelector;
