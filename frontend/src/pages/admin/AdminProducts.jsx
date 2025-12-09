import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Badge, Alert } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import { BACKEND_BASE_URL } from '../../config/api';
import Loading from '../../components/common/Loading';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    category_id: '',
    is_available: true,
    image: null
  });
  const [categories, setCategories] = useState([]);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.PRODUCTS.LIST);
      if (response.success && response.data) {
        // Handle paginated response - extract the data array
        const productsData = response.data.data || response.data;
        setProducts(Array.isArray(productsData) ? productsData : []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.CATEGORIES.LIST);
      if (response.success && response.data) {
        // Handle paginated response - extract the data array
        const categoriesData = response.data.data || response.data;
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const handleShowModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock_quantity: product.stock_quantity,
        category_id: product.category_id || '',
        is_available: product.is_available,
        image: null
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        stock_quantity: '',
        category_id: '',
        is_available: true,
        image: null
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'file') {
      setFormData({
        ...formData,
        [name]: files[0] || null
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;

      // Check if we have an image file to upload
      if (formData.image) {
        // Use FormData for file upload
        const formDataToSend = new FormData();
        Object.keys(formData).forEach(key => {
          if (key === 'image' && formData[key]) {
            formDataToSend.append(key, formData[key]);
          } else if (key === 'price') {
            formDataToSend.append(key, parseFloat(formData[key]) || 0);
          } else if (key === 'stock_quantity') {
            formDataToSend.append(key, parseInt(formData[key]) || 0);
          } else if (key === 'category_id') {
            formDataToSend.append(key, parseInt(formData[key]) || '');
          } else if (key === 'is_available') {
            formDataToSend.append(key, formData[key] ? 1 : 0);
          } else if (key !== 'image') {
            formDataToSend.append(key, formData[key]);
          }
        });

        if (editingProduct) {
          response = await apiService.upload(
            API_ENDPOINTS.PRODUCTS.UPDATE(editingProduct.id),
            formDataToSend
          );
        } else {
          response = await apiService.upload(API_ENDPOINTS.PRODUCTS.CREATE, formDataToSend);
        }
      } else {
        // Use regular JSON for non-file uploads
        const dataToSend = { 
          ...formData,
          price: parseFloat(formData.price) || 0,
          stock_quantity: parseInt(formData.stock_quantity) || 0,
          category_id: parseInt(formData.category_id) || null,
          is_available: formData.is_available ? 1 : 0
        };
        delete dataToSend.image; // Remove image field if no file

        if (editingProduct) {
          response = await apiService.put(
            API_ENDPOINTS.PRODUCTS.UPDATE(editingProduct.id),
            dataToSend
          );
        } else {
          response = await apiService.post(API_ENDPOINTS.PRODUCTS.CREATE, dataToSend);
        }
      }

      if (response.success) {
        setAlert({
          show: true,
          message: editingProduct ? 'Product updated successfully!' : 'Product created successfully!',
          type: 'success'
        });
        handleCloseModal();
        fetchProducts();
        setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to save product';
      const validationErrors = error.response?.data?.errors;
      
      if (validationErrors) {
        const errorDetails = Object.values(validationErrors).flat().join(', ');
        setAlert({
          show: true,
          message: `${errorMessage}: ${errorDetails}`,
          type: 'danger'
        });
      } else {
        setAlert({
          show: true,
          message: errorMessage,
          type: 'danger'
        });
      }
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await apiService.delete(API_ENDPOINTS.PRODUCTS.DELETE(productId));
        if (response.success) {
          setAlert({ show: true, message: 'Product deleted successfully!', type: 'success' });
          fetchProducts();
          setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
        }
      } catch (error) {
        setAlert({
          show: true,
          message: error.response?.data?.message || 'Failed to delete product',
          type: 'danger'
        });
      }
    }
  };

  if (loading) {
    return <Loading message="Loading products..." />;
  }

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="display-5 fw-bold">Products Management</h1>
              <p className="lead text-muted">Manage your product catalog</p>
            </div>
            <Button variant="primary" size="lg" onClick={() => handleShowModal()}>
              <FaPlus className="me-2" />
              Add Product
            </Button>
          </div>
        </Col>
      </Row>

      {alert.show && (
        <Row className="mb-3">
          <Col>
            <Alert variant={alert.type} onClose={() => setAlert({ show: false, message: '', type: '' })} dismissible>
              {alert.message}
            </Alert>
          </Col>
        </Row>
      )}

      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length > 0 ? (
                    products.map((product) => (
                      <tr key={product.id}>
                        <td>{product.id}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              src={product.image_url ? `${BACKEND_BASE_URL}${product.image_url}` : 'https://via.placeholder.com/50'}
                              alt={product.name}
                              width="50"
                              height="50"
                              className="rounded me-2"
                            />
                            <span>{product.name}</span>
                          </div>
                        </td>
                        <td>{product.category?.name || 'N/A'}</td>
                        <td>₱{product.price}</td>
                        <td>{product.stock_quantity}</td>
                        <td>
                          <Badge bg={product.is_available ? 'success' : 'danger'}>
                            {product.is_available ? 'Available' : 'Unavailable'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleShowModal(product)}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                          >
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center text-muted py-4">
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add/Edit Product Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>{editingProduct ? 'Edit Product' : 'Add New Product'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Product Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Product Image</Form.Label>
              <Form.Control
                type="file"
                name="image"
                accept="image/*"
                onChange={handleChange}
              />
              <Form.Text className="text-muted">
                Supported formats: JPEG, PNG, JPG, GIF, SVG. Max size: 2MB
              </Form.Text>
              {editingProduct && editingProduct.image_url && (
                <div className="mt-2">
                  <small className="text-muted">Current image:</small>
                  <br />
                  <img
                    src={editingProduct.image_url ? `${BACKEND_BASE_URL}${editingProduct.image_url}` : 'https://via.placeholder.com/50'}
                    alt="Current product"
                    style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'cover' }}
                    className="border rounded"
                  />
                </div>
              )}
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Price *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Stock Quantity *</Form.Label>
                  <Form.Control
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Category *</Form.Label>
              <Form.Select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="is_available"
                label="Available for sale"
                checked={formData.is_available}
                onChange={handleChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AdminProducts;
