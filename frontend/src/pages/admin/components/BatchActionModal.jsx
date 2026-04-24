import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const BatchActionModal = ({ show, onHide, batchAction, setBatchAction, batchValue, setBatchValue, onSubmit }) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Batch Update Products</Modal.Title>
      </Modal.Header>
      <Modal.Body className="d-grid gap-3">
        <Form.Group>
          <Form.Label>Action</Form.Label>
          <Form.Select value={batchAction} onChange={(event) => setBatchAction(event.target.value)}>
            <option value="">Select action</option>
            <option value="price">Update Price</option>
            <option value="stock">Update Stock</option>
            <option value="availability">Update Availability</option>
            <option value="category">Update Category</option>
          </Form.Select>
        </Form.Group>
        <Form.Group>
          <Form.Label>Value</Form.Label>
          <Form.Control value={batchValue} onChange={(event) => setBatchValue(event.target.value)} />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button variant="primary" onClick={onSubmit}>Apply</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default BatchActionModal;