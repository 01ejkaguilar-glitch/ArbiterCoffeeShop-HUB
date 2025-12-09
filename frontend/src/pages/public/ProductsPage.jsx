import React, { useEffect, useState, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Tabs, Tab, Badge, Dropdown, Offcanvas } from 'react-bootstrap';
import { FaSearch, FaPlus, FaCoffee, FaCocktail, FaUtensils, FaBox, FaCookieBite, FaHeart, FaFilter, FaSort, FaSlidersH } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import apiService from '../../services/api.service';
import { API_ENDPOINTS, BACKEND_BASE_URL } from '../../config/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Loading from '../../components/common/Loading';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [availabilityFilter, setAvailabilityFilter] = useState('all'); // all, in_stock, out_of_stock
  const [favorites, setFavorites] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    if (user) {
      fetchFavorites();
    }
  }, [user]);

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

  const fetchFavorites = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.CUSTOMER.FAVORITES);
      if (response.success && response.data) {
        const favoriteIds = new Set(response.data.map(fav => fav.product.id));
        setFavorites(favoriteIds);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const handleAddToCart = async (product) => {
    const result = await addToCart(product, 1);
    if (result.success) {
      alert('Product added to cart!');
    }
  };

  const handleToggleFavorite = async (productId) => {
    if (!user) {
      alert('Please login to add favorites');
      return;
    }

    try {
      const response = await apiService.post(API_ENDPOINTS.CUSTOMER.TOGGLE_FAVORITE, {
        product_id: productId
      });

      if (response.success) {
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          if (response.data.is_favorited) {
            newFavorites.add(productId);
          } else {
            newFavorites.delete(productId);
          }
          return newFavorites;
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
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

      // Filter by price range
      const price = parseFloat(product.price) || 0;
      const matchesPrice = (!priceRange.min || price >= parseFloat(priceRange.min)) &&
                          (!priceRange.max || price <= parseFloat(priceRange.max));

      // Filter by availability
      const matchesAvailability = availabilityFilter === 'all' ||
        (availabilityFilter === 'in_stock' && product.stock_quantity > 0) ||
        (availabilityFilter === 'out_of_stock' && product.stock_quantity === 0);

      return matchesSearch && matchesCategory && matchesPrice && matchesAvailability;
    }).sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'price':
          aValue = parseFloat(a.price) || 0;
          bValue = parseFloat(b.price) || 0;
          break;
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [products, searchTerm, activeCategory, priceRange, availabilityFilter, sortBy, sortOrder]);

  const clearFilters = () => {
    setSearchTerm('');
    setActiveCategory('all');
    setPriceRange({ min: '', max: '' });
    setAvailabilityFilter('all');
    setSortBy('name');
    setSortOrder('asc');
  };

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

      {/* Search and Controls */}
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
        <Col md={6} className="d-flex gap-2 justify-content-end">
          <Button
            variant="outline-secondary"
            onClick={() => setShowFilters(true)}
            className="d-md-none"
          >
            <FaFilter /> Filters
          </Button>
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary">
              <FaSort className="me-2" />
              Sort by {sortBy === 'name' ? 'Name' : sortBy === 'price' ? 'Price' : 'Date'}
              {sortOrder === 'asc' ? ' ↑' : ' ↓'}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => { setSortBy('name'); setSortOrder('asc'); }}>
                Name (A-Z)
              </Dropdown.Item>
              <Dropdown.Item onClick={() => { setSortBy('name'); setSortOrder('desc'); }}>
                Name (Z-A)
              </Dropdown.Item>
              <Dropdown.Item onClick={() => { setSortBy('price'); setSortOrder('asc'); }}>
                Price (Low to High)
              </Dropdown.Item>
              <Dropdown.Item onClick={() => { setSortBy('price'); setSortOrder('desc'); }}>
                Price (High to Low)
              </Dropdown.Item>
              <Dropdown.Item onClick={() => { setSortBy('date'); setSortOrder('desc'); }}>
                Newest First
              </Dropdown.Item>
              <Dropdown.Item onClick={() => { setSortBy('date'); setSortOrder('asc'); }}>
                Oldest First
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>

      {/* Desktop Filters */}
      <Row className="mb-4 d-none d-md-flex">
        <Col md={3}>
          <Card className="p-3">
            <h6 className="mb-3">
              <FaSlidersH className="me-2" />
              Filters
            </h6>

            {/* Price Range Filter */}
            <div className="mb-3">
              <Form.Label>Price Range</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  size="sm"
                />
                <Form.Control
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  size="sm"
                />
              </div>
            </div>

            {/* Availability Filter */}
            <div className="mb-3">
              <Form.Label>Availability</Form.Label>
              <Form.Select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                size="sm"
              >
                <option value="all">All Products</option>
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </Form.Select>
            </div>

            <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </Card>
        </Col>
        <Col md={9}>
          {/* Category Tabs */}
          <Tabs
            activeKey={activeCategory}
            onSelect={(k) => setActiveCategory(k)}
            className="mb-4"
          >
            <Tab eventKey="all" title={<><FaCoffee className="me-2" />All Products ({filteredProducts.length})</>} />
            {categories.map((category) => {
              const categoryCount = products.filter(p =>
                p.category_id && p.category_id.toString() === category.id.toString()
              ).length;
              return (
                <Tab
                  key={category.id}
                  eventKey={category.id}
                  title={
                    <>
                      {getCategoryIcon(category.name)}
                      <span className="ms-2">{category.name} ({categoryCount})</span>
                    </>
                  }
                />
              );
            })}
          </Tabs>

          {/* Products Grid */}
          <Row className="g-4">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <Col key={product.id} md={6} lg={4}>
                  <Card className="product-card h-100 position-relative">
                    {getProductBadge(product)}
                    <div className="position-absolute top-0 end-0 m-2">
                      <Button
                        variant="light"
                        size="sm"
                        className={`rounded-circle ${favorites.has(product.id) ? 'text-danger' : 'text-muted'}`}
                        onClick={() => handleToggleFavorite(product.id)}
                        title={favorites.has(product.id) ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <FaHeart className={favorites.has(product.id) ? 'fas' : 'far'} />
                      </Button>
                    </div>
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
                          <span className="product-price fw-bold">
                            ₱{product.price ? parseFloat(product.price).toFixed(2) : '0.00'}
                          </span>
                          {product.stock_quantity !== undefined && product.stock_quantity > 0 ? (
                            <Badge bg="success">In Stock</Badge>
                          ) : (
                            <Badge bg="danger">Out of Stock</Badge>
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
                            View Details
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
                <p className="text-muted">No products found matching your criteria</p>
                <Button variant="outline-primary" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </Col>
            )}
          </Row>
        </Col>
      </Row>

      {/* Mobile Filters Offcanvas */}
      <Offcanvas show={showFilters} onHide={() => setShowFilters(false)} placement="start">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            <FaFilter className="me-2" />
            Filters
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {/* Price Range Filter */}
          <div className="mb-3">
            <Form.Label>Price Range</Form.Label>
            <div className="d-flex gap-2 mb-2">
              <Form.Control
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                size="sm"
              />
              <Form.Control
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                size="sm"
              />
            </div>
          </div>

          {/* Availability Filter */}
          <div className="mb-3">
            <Form.Label>Availability</Form.Label>
            <Form.Select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              size="sm"
            >
              <option value="all">All Products</option>
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </Form.Select>
          </div>

          <div className="d-grid gap-2">
            <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
            <Button variant="primary" onClick={() => setShowFilters(false)}>
              Apply Filters
            </Button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Mobile Layout */}
      <div className="d-md-none">
        {/* Category Tabs */}
        <Tabs
          activeKey={activeCategory}
          onSelect={(k) => setActiveCategory(k)}
          className="mb-4"
        >
          <Tab eventKey="all" title={<><FaCoffee className="me-2" />All Products ({filteredProducts.length})</>} />
          {categories.map((category) => {
            const categoryCount = products.filter(p =>
              p.category_id && p.category_id.toString() === category.id.toString()
            ).length;
            return (
              <Tab
                key={category.id}
                eventKey={category.id}
                title={
                  <>
                    {getCategoryIcon(category.name)}
                    <span className="ms-2">{category.name} ({categoryCount})</span>
                  </>
                }
              />
            );
          })}
        </Tabs>

        {/* Products Grid */}
        <Row className="g-4">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <Col key={product.id} xs={12} sm={6}>
                <Card className="product-card h-100 position-relative">
                  {getProductBadge(product)}
                  <div className="position-absolute top-0 end-0 m-2">
                    <Button
                      variant="light"
                      size="sm"
                      className={`rounded-circle ${favorites.has(product.id) ? 'text-danger' : 'text-muted'}`}
                      onClick={() => handleToggleFavorite(product.id)}
                      title={favorites.has(product.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <FaHeart className={favorites.has(product.id) ? 'fas' : 'far'} />
                    </Button>
                  </div>
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
                        <span className="product-price fw-bold">
                          ₱{product.price ? parseFloat(product.price).toFixed(2) : '0.00'}
                        </span>
                        {product.stock_quantity !== undefined && product.stock_quantity > 0 ? (
                          <Badge bg="success">In Stock</Badge>
                        ) : (
                          <Badge bg="danger">Out of Stock</Badge>
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
                          View Details
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
              <p className="text-muted">No products found matching your criteria</p>
              <Button variant="outline-primary" onClick={clearFilters}>
                Clear Filters
              </Button>
            </Col>
          )}
        </Row>
      </div>
    </Container>
  );
};

export default ProductsPage;
