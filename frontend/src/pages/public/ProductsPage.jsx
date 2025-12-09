import React, { useEffect, useState, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Tabs, Tab, Badge } from 'react-bootstrap';
import { FaSearch, FaPlus, FaCoffee, FaCocktail, FaUtensils, FaBox, FaCookieBite } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import apiService from '../../services/api.service';
import { API_ENDPOINTS, BACKEND_BASE_URL } from '../../config/api';
import { useCart } from '../../context/CartContext';
import Loading from '../../components/common/Loading';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.PRODUCTS.LIST);

      if (response && response.success) {
        // Handle paginated response - extract the data array
        let productsData = [];

        if (response.data) {
          if (Array.isArray(response.data)) {
            productsData = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            productsData = response.data.data;
          }
        }

        setProducts(productsData);
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

  const handleAddToCart = async (product) => {
    const result = await addToCart(product, 1);
    if (result.success) {
      alert('Product added to cart!');
    }
  };

  const getCategoryIcon = (categoryName) => {
    const iconMap = {
      'Specialty Coffee': FaCoffee,
      'Beverages': FaCocktail,
      'Rice Bowls': FaUtensils,
      'Noodles': FaUtensils,
      'Combo': FaBox,
      'Desserts': FaCookieBite,
    };
    const IconComponent = iconMap[categoryName] || FaCoffee;
    return <IconComponent />;
  };

  const getProductBadge = (product) => {
    const productDate = new Date(product.created_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    if (productDate > sevenDaysAgo) {
      return (
        <Badge bg="success" className="position-absolute top-0 start-0 m-2">
          New
        </Badge>
      );
    }
    return null;
  };

  const filteredProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) {
      return [];
    }

    return products.filter((product) => {
      if (!product) return false;

      // Filter by search term
      const matchesSearch = !searchTerm ||
        (product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filter by category (handle both string and number IDs)
      const matchesCategory = activeCategory === 'all' ||
        (product.category_id && product.category_id.toString() === activeCategory.toString());

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, activeCategory]);

  if (loading) {
    return <Loading message="Loading products..." />;
  }

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h1 className="display-4 fw-bold">Our Products</h1>
          <p className="lead text-muted">Discover our premium coffee selection</p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
      </Row>

      {/* Category Tabs */}
      <Tabs
        activeKey={activeCategory}
        onSelect={(k) => setActiveCategory(k)}
        className="mb-4"
      >
        <Tab eventKey="all" title={<><FaCoffee className="me-2" />All Products</>} />
        {categories.map((category) => (
          <Tab
            key={category.id}
            eventKey={category.id}
            title={
              <>
                {getCategoryIcon(category.name)}
                <span className="ms-2">{category.name}</span>
              </>
            }
          />
        ))}
      </Tabs>

      <Row className="g-4">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <Col key={product.id} md={4} lg={3}>
              <Card className="product-card h-100 position-relative">
                {getProductBadge(product)}
                <Card.Img
                  variant="top"
                  src={product.image_url ? `${BACKEND_BASE_URL}${product.image_url}` : 'https://via.placeholder.com/300x250?text=Coffee'}
                  className="product-image"
                  style={{ height: '200px', objectFit: 'cover' }}
                />
                <Card.Body className="d-flex flex-column">
                  <Card.Title>{product.name || 'Unnamed Product'}</Card.Title>
                  <Card.Text className="text-muted flex-grow-1">
                    {product.description ? product.description.substring(0, 80) + '...' : 'No description available'}
                  </Card.Text>
                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="product-price">
                        ₱{product.price ? parseFloat(product.price).toFixed(2) : '0.00'}
                      </span>
                      {product.stock_quantity !== undefined && product.stock_quantity > 0 ? (
                        <span className="badge bg-success">In Stock</span>
                      ) : (
                        <span className="badge bg-danger">Out of Stock</span>
                      )}
                    </div>
                    <div className="d-flex gap-2">
                      <Button
                        as={Link}
                        to={`/products/${product.id}`}
                        variant="outline-primary"
                        size="sm"
                        className="flex-grow-1"
                      >
                        View
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock_quantity === 0}
                      >
                        <FaPlus />
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <Col className="text-center py-5">
            <p className="text-muted">No products found</p>
          </Col>
        )}
      </Row>
    </Container>
  );
};

export default ProductsPage;
