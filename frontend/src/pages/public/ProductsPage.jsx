import React, { useEffect, useState, useMemo } from 'react';
import { Container, Row, Col, Button, Form, InputGroup, Dropdown } from 'react-bootstrap';
import { FaSearch, FaCoffee, FaCocktail, FaUtensils, FaBox, FaCookieBite, FaFilter, FaSort } from 'react-icons/fa';
import { useSearchParams } from 'react-router-dom';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../hooks/useProducts';
import BottomNavigation from '../../components/mobile/BottomNavigation';
import PullToRefresh from '../../components/mobile/PullToRefresh';
import { useCategories } from '../../hooks/useCategories';
import SEO from '../../components/SEO';
import { BreadcrumbSchema } from '../../components/StructuredData';
import { useToast } from '../../components/animations/Toast';
import ProductFilterForm from '../../components/product/ProductFilterForm';
import ProductCategoryTabs from '../../components/product/ProductCategoryTabs';
import ProductGrid from '../../components/product/ProductGrid';
import '../../components/product/EnhancedProductCard.css';
import '../../components/product/QuickViewModal.css';

const ProductsPage = () => {
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [activeCategory, setActiveCategory] = useState(null);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [favorites, setFavorites] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [addingToCart, setAddingToCart] = useState(new Set());
  const { addToCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();

  const loading = productsLoading || categoriesLoading;

  useEffect(() => {
    const searchQuery = searchParams.get('search');
    if (searchQuery && searchQuery !== searchTerm) {
      setSearchTerm(searchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        setSearchParams({ search: searchTerm }, { replace: true });
      } else {
        searchParams.delete('search');
        setSearchParams(searchParams, { replace: true });
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  useEffect(() => {
    if (user) fetchFavorites();
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.CUSTOMER.FAVORITES);
      if (response.success && response.data) {
        setFavorites(new Set(response.data.map(fav => fav.product.id)));
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const handleAddToCart = async (product) => {
    setAddingToCart(prev => new Set(prev).add(product.id));
    try {
      const result = await addToCart(product, 1);
      if (result.success) {
        toast.success(`${product.name} added to cart!`);
      } else {
        toast.error(result.message || 'Failed to add product to cart');
      }
    } finally {
      setAddingToCart(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }
  };

  const handleToggleFavorite = async (productId) => {
    if (!user) {
      toast.warning('Please login to add favorites');
      return;
    }
    try {
      const response = await apiService.post(API_ENDPOINTS.CUSTOMER.TOGGLE_FAVORITE, { product_id: productId });
      if (response.success) {
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          if (response.data.is_favorited) {
            newFavorites.add(productId);
            toast.success('Added to favorites!');
          } else {
            newFavorites.delete(productId);
            toast.info('Removed from favorites');
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

  const filteredProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];

    return products.filter((product) => {
      if (!product) return false;
      const matchesSearch = !searchTerm || (product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = !activeCategory || (product.category_id && product.category_id.toString() === activeCategory.toString());
      const price = parseFloat(product.price) || 0;
      const matchesPrice = (!priceRange.min || price >= parseFloat(priceRange.min)) && (!priceRange.max || price <= parseFloat(priceRange.max));
      const matchesAvailability = availabilityFilter === 'all' ||
        (availabilityFilter === 'in_stock' && product.stock_quantity > 0) ||
        (availabilityFilter === 'out_of_stock' && product.stock_quantity === 0);
      return matchesSearch && matchesCategory && matchesPrice && matchesAvailability;
    }).sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'price': aValue = parseFloat(a.price) || 0; bValue = parseFloat(b.price) || 0; break;
        case 'name': aValue = (a.name || '').toLowerCase(); bValue = (b.name || '').toLowerCase(); break;
        case 'date': aValue = new Date(a.created_at); bValue = new Date(b.created_at); break;
        default: return 0;
      }
      return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });
  }, [products, searchTerm, activeCategory, priceRange, availabilityFilter, sortBy, sortOrder]);

  // No auto-selection of category — show all products by default

  const clearFilters = () => {
    setSearchTerm('');
    setActiveCategory(null);
    setPriceRange({ min: '', max: '' });
    setAvailabilityFilter('all');
    setSortBy('name');
    setSortOrder('asc');
  };

  const productCount = filteredProducts.length;
  const categoryName = !activeCategory
    ? 'Products'
    : categories.find(c => c.id.toString() === activeCategory)?.name || 'Products';

  // Handler to reload products
  const reloadProducts = () => {
    window.location.reload(); // Replace with better logic if available
  };

  return (
    <main role="main">
      <PullToRefresh onRefresh={reloadProducts}>
        <Container className="py-5">
        <SEO
          title={`${categoryName} - Browse Our Premium Coffee Collection`}
          description={`Explore ${productCount} premium coffee products. Shop specialty coffee, espresso, lattes, merchandise, and more.`}
          keywords="coffee products, specialty coffee, espresso, latte, coffee beans, coffee merchandise, buy coffee online"
          url="/products"
          canonical={`${window.location.origin}/products`}
          type="website"
        />
        <BreadcrumbSchema items={[{ name: 'Home', url: '/' }, { name: 'Products', url: '/products' }]} />

        <div className="page-header-modern mb-0" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <h1>Our Products</h1>
          <p>Discover our premium coffee selection</p>
        </div>

        {/* Search, Sort & Filter Controls */}
        <Row className="mb-3 align-items-center g-2">
          <Col md={5} sm={12}>
            <Form role="search" aria-label="Search products">
              <InputGroup>
                <InputGroup.Text><FaSearch aria-hidden="true" /></InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search products by name"
                />
              </InputGroup>
            </Form>
          </Col>
          <Col md={7} sm={12} className="d-flex gap-2 justify-content-md-end mt-2 mt-md-0 flex-wrap">
            <Button
              variant={showFilters ? 'primary' : 'outline-secondary'}
              onClick={() => setShowFilters(prev => !prev)}
              aria-label="Toggle product filters"
              aria-expanded={showFilters}
              size="sm"
            >
              <FaFilter className="me-1" aria-hidden="true" />
              {showFilters ? 'Hide Filters' : 'Filters'}
            </Button>
            <Dropdown show={dropdownOpen} onToggle={(isOpen) => setDropdownOpen(isOpen)}>
              <Dropdown.Toggle variant="outline-secondary" size="sm" aria-label="Sort products menu">
                <FaSort className="me-1" aria-hidden="true" />
                {sortBy === 'name' ? 'Name' : sortBy === 'price' ? 'Price' : 'Date'}
                {sortOrder === 'asc' ? ' \u2191' : ' \u2193'}
              </Dropdown.Toggle>
              <Dropdown.Menu role="menu">
                <Dropdown.Item onClick={() => { setSortBy('name'); setSortOrder('asc'); }}>Name (A-Z)</Dropdown.Item>
                <Dropdown.Item onClick={() => { setSortBy('name'); setSortOrder('desc'); }}>Name (Z-A)</Dropdown.Item>
                <Dropdown.Item onClick={() => { setSortBy('price'); setSortOrder('asc'); }}>Price (Low to High)</Dropdown.Item>
                <Dropdown.Item onClick={() => { setSortBy('price'); setSortOrder('desc'); }}>Price (High to Low)</Dropdown.Item>
                <Dropdown.Item onClick={() => { setSortBy('date'); setSortOrder('desc'); }}>Newest First</Dropdown.Item>
                <Dropdown.Item onClick={() => { setSortBy('date'); setSortOrder('asc'); }}>Oldest First</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Col>
        </Row>

        {/* Inline Collapsible Filters */}
        {showFilters && (
          <div className="product-filters-bar mb-4">
            <ProductFilterForm
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              availabilityFilter={availabilityFilter}
              setAvailabilityFilter={setAvailabilityFilter}
              clearFilters={clearFilters}
              isInline
            />
          </div>
        )}

        {/* Category Tabs */}
        <ProductCategoryTabs
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
          categories={categories}
          products={products}
          filteredCount={filteredProducts.length}
          getCategoryIcon={getCategoryIcon}
        />

        {/* Product Grid — Full Width */}
        <section aria-labelledby="products-heading">
          <h2 id="products-heading" className="visually-hidden">Product List ({filteredProducts.length} items)</h2>

          {/* Desktop Grid */}
          <div className="d-none d-md-block">
            <ProductGrid
              products={filteredProducts}
              loading={loading}
              onAddToCart={handleAddToCart}
              onQuickView={setQuickViewProduct}
              onToggleFavorite={handleToggleFavorite}
              favorites={favorites}
              addingToCart={addingToCart}
              clearFilters={clearFilters}
              variant="desktop"
              quickViewProduct={quickViewProduct}
              onCloseQuickView={() => setQuickViewProduct(null)}
            />
          </div>

          {/* Mobile Grid */}
          <div className="d-md-none">
            <ProductGrid
              products={filteredProducts}
              loading={loading}
              onAddToCart={handleAddToCart}
              onToggleFavorite={handleToggleFavorite}
              favorites={favorites}
              addingToCart={addingToCart}
              clearFilters={clearFilters}
              variant="mobile"
            />
          </div>
        </section>
      </Container>
    </PullToRefresh>
      <BottomNavigation />
    </main>
  );
};

export default ProductsPage;
