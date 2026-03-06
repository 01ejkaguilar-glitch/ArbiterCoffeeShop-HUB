import React from 'react';
import { Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { FaPlus, FaHeart, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { BACKEND_BASE_URL } from '../../config/api';
import { ProductCardSkeleton, SkeletonGroup } from '../animations/LoadingSkeleton';
import { FadeInOnScroll } from '../animations/AnimationWrappers';
import EnhancedProductCard from './EnhancedProductCard';
import QuickViewModal from './QuickViewModal';

function ProductGrid({
  products,
  loading,
  onAddToCart,
  onQuickView,
  onToggleFavorite,
  favorites,
  addingToCart,
  clearFilters,
  variant = 'desktop',
  quickViewProduct,
  onCloseQuickView,
}) {
  if (variant === 'desktop') {
    return (
      <>
        <Row className="g-4" role="list">
          {loading ? (
            <SkeletonGroup count={6} component={ProductCardSkeleton} />
          ) : products.length > 0 ? (
            products.map((product, index) => (
              <Col key={product.id} sm={6} md={4} lg={3} role="listitem">
                <FadeInOnScroll delay={index * 0.05} once>
                  <EnhancedProductCard
                    product={product}
                    onAddToCart={onAddToCart}
                    onQuickView={onQuickView}
                    onToggleFavorite={onToggleFavorite}
                    isFavorite={favorites.has(product.id)}
                    isAddingToCart={addingToCart.has(product.id)}
                  />
                </FadeInOnScroll>
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

        <QuickViewModal
          show={!!quickViewProduct}
          onHide={onCloseQuickView}
          product={quickViewProduct}
          isFavorite={quickViewProduct ? favorites.has(quickViewProduct.id) : false}
          onToggleFavorite={() => quickViewProduct && onToggleFavorite(quickViewProduct.id)}
        />
      </>
    );
  }

  // Mobile variant
  return (
    <Row className="g-4">
      {products.length > 0 ? (
        products.map((product) => {
          const isNew = (() => {
            const d = new Date(product.created_at);
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 7);
            return d > cutoff;
          })();

          return (
            <Col key={product.id} xs={12} sm={6}>
              <Card className="product-card h-100 position-relative">
                {isNew && (
                  <Badge bg="success" className="position-absolute top-0 start-0 m-2">New</Badge>
                )}
                <div className="position-absolute top-0 end-0 m-2">
                  <Button
                    variant="light"
                    size="sm"
                    className={`rounded-circle ${favorites.has(product.id) ? 'text-danger' : 'text-muted'}`}
                    onClick={() => onToggleFavorite(product.id)}
                    title={favorites.has(product.id) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <FaHeart className={favorites.has(product.id) ? 'fas' : 'far'} />
                  </Button>
                </div>
                <Card.Img
                  variant="top"
                  src={product.image_url ? `${BACKEND_BASE_URL}${product.image_url}` : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDMwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjZGRkIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTI1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjM1ZW0iIGZpbGw9IiM5OTkiIGZvbnQtc2l6ZT0iMTYiPkNvZmZlZTwvdGV4dD4KPHN2Zz4='}
                  alt={`${product.name}${product.category?.name ? ` - ${product.category.name}` : ''}`}
                  loading="lazy"
                  className="product-image img-h-200"
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
                      {product.stock_quantity > 0 ? (
                        <Badge bg="success">
                          <FaCheckCircle className="me-1" aria-hidden="true" />
                          In Stock
                        </Badge>
                      ) : (
                        <Badge bg="danger">
                          <FaTimesCircle className="me-1" aria-hidden="true" />
                          Out of Stock
                        </Badge>
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
                        onClick={() => onAddToCart(product)}
                        disabled={product.stock_quantity === 0}
                      >
                        <FaPlus />
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })
      ) : (
        <Col className="text-center py-5">
          <p className="text-muted">No products found matching your criteria</p>
          <Button variant="outline-primary" onClick={clearFilters}>
            Clear Filters
          </Button>
        </Col>
      )}
    </Row>
  );
}

export default ProductGrid;
