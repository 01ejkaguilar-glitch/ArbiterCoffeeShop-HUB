import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Badge, Form } from 'react-bootstrap';
import { FaShoppingCart, FaMinus, FaPlus } from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS, BACKEND_BASE_URL } from '../../config/api';
import { useCart } from '../../context/CartContext';
import Loading from '../../components/common/Loading';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.PRODUCTS.DETAIL(id));
      if (response.success) {
        setProduct(response.data);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= product.stock_quantity) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    const result = await addToCart(product, quantity, specialInstructions);
    if (result.success) {
      alert('Product added to cart!');
      navigate('/cart');
    }
  };

  if (loading) {
    return <Loading message="Loading product..." />;
  }

  if (!product) {
    return (
      <Container className="py-5 text-center">
        <h2>Product not found</h2>
        <Button variant="primary" onClick={() => navigate('/products')}>
          Back to Products
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row>
        <Col md={6}>
          <img
            src={product.image_url ? `${BACKEND_BASE_URL}${product.image_url}` : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiBmaWxsPSIjZGRkIi8+Cjx0ZXh0IHg9IjI1MCIgeT0iMjUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjM1ZW0iIGZpbGw9IiM5OTkiIGZvbnQtc2l6ZT0iMjQiPkNvZmZlZTwvdGV4dD4KPHN2Zz4='}
            alt={product.name}
            className="img-fluid rounded shadow-md-green"
          />
        </Col>
        <Col md={6}>
          <h1 className="mb-3">{product.name}</h1>
          <div className="mb-3">
            <Badge bg={product.stock_quantity > 0 ? 'success' : 'danger'} className="me-2">
              {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
            </Badge>
            {product.category && <Badge bg="secondary">{product.category.name}</Badge>}
          </div>
          <h2 className="product-price mb-4">₱{product.price}</h2>
          <p className="lead">{product.description}</p>

          {product.stock_quantity > 0 && (
            <>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Quantity</Form.Label>
                <div className="d-flex align-items-center gap-2">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    <FaMinus />
                  </Button>
                  <span className="px-3 fw-bold">{quantity}</span>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.stock_quantity}
                  >
                    <FaPlus />
                  </Button>
                </div>
                <Form.Text className="text-muted">
                  Available: {product.stock_quantity} units
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Special Instructions (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any special requests for this item?"
                />
              </Form.Group>

              <Button
                variant="primary"
                size="lg"
                className="w-100"
                onClick={handleAddToCart}
              >
                <FaShoppingCart className="me-2" />
                Add to Cart
              </Button>
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ProductDetailPage;
