import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const ProductFormModal = ({ show, onHide, formData = {}, handleChange, handleSubmit, editingProduct, categories = [] }) => {
  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{editingProduct ? 'Edit Product' : 'Add Product'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-grid gap-3">
          <Form.Group>
            <Form.Label>Name</Form.Label>
            <Form.Control name="name" value={formData.name || ''} onChange={handleChange} required />
          </Form.Group>
          <Form.Group>
            <Form.Label>Description</Form.Label>
            <Form.Control as="textarea" rows={3} name="description" value={formData.description || ''} onChange={handleChange} />
          </Form.Group>
          <div className="d-grid gap-3" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <Form.Group>
              <Form.Label>Price</Form.Label>
              <Form.Control type="number" step="0.01" name="price" value={formData.price || ''} onChange={handleChange} required />
            </Form.Group>
            <Form.Group>
              <Form.Label>Stock Quantity</Form.Label>
              <Form.Control type="number" name="stock_quantity" value={formData.stock_quantity || ''} onChange={handleChange} required />
            </Form.Group>
          </div>
          <Form.Group>
            <Form.Label>Category</Form.Label>
            <Form.Select name="category_id" value={formData.category_id || ''} onChange={handleChange}>
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group>
            <Form.Check type="checkbox" name="is_available" label="Available" checked={!!formData.is_available} onChange={handleChange} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Cancel</Button>
          <Button variant="primary" type="submit">Save</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ProductFormModal;