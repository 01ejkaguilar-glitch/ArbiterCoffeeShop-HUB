import React, { useState } from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FaShoppingCart, FaHeart, FaRegHeart, FaEye, FaCheckCircle, FaTimesCircle, FaStar } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { BACKEND_BASE_URL } from '../../config/api';
import './EnhancedProductCard.css';

/**
 * EnhancedProductCard - Improved product card with hover effects and quick actions
 * 
 * Features:
 * - Image hover zoom effect
 * - Quick view button overlay
 * - Add to cart with animation
 * - Favorite toggle
 * - New/Popular/Sale badges
 * - Stock status indicator
 * - Smooth hover transitions
 */
const EnhancedProductCard = ({
  product,
  onAddToCart,
  onQuickView,
  onToggleFavorite,
  isFavorite = false,
  isAddingToCart = false
}) => {
  const [, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!product) return null;

  const productImage = product.image_url 
    ? `${BACKEND_BASE_URL}${product.image_url}` 
    : null;

  const isInStock = product.stock_quantity > 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;

  // Safe price formatter — returns "0.00" when value is null/undefined/NaN
  const formatPrice = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };
  
  // Calculate if product is new (created within last 7 days)
  const isNew = product.created_at && 
    new Date(product.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  // Check if product has been marked as popular (could be based on sales or views)
  const isPopular = product.is_popular || product.total_sold > 50;
  
  // Check for sale price
  const isOnSale = product.sale_price && parseFloat(product.sale_price) < parseFloat(product.price);
  const discountPercent = isOnSale 
    ? Math.round((1 - parseFloat(product.sale_price) / parseFloat(product.price)) * 100) 
    : 0;

  const cardVariants = {
    initial: { y: 0 },
    hover: { y: -8, transition: { duration: 0.3 } }
  };

  const imageVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.08, transition: { duration: 0.4 } }
  };

  const overlayVariants = {
    initial: { opacity: 0 },
    hover: { opacity: 1, transition: { duration: 0.3 } }
  };

  return (
    <motion.article
      className="enhanced-product-card"
      variants={cardVariants}
      initial="initial"
      whileHover="hover"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card className="h-100 border-0 shadow-sm">
        {/* Image Container */}
        <div className="product-image-container">
          {/* Badges */}
          <div className="product-badges">
            {isNew && <Badge bg="success" className="badge-new">New</Badge>}
            {isPopular && <Badge bg="warning" text="dark" className="badge-popular">
              <FaStar className="me-1" size={10} />Popular
            </Badge>}
            {isOnSale && <Badge bg="danger" className="badge-sale">-{discountPercent}%</Badge>}
          </div>

          {/* Favorite Button */}
          {onToggleFavorite && (
            <motion.button
              className={`favorite-btn ${isFavorite ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(product.id);
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavorite ? <FaHeart /> : <FaRegHeart />}
            </motion.button>
          )}

          {/* Product Image */}
          <Link to={`/products/${product.id}`} className="product-image-link">
            <motion.div 
              className="product-image-wrapper"
              variants={imageVariants}
            >
              {productImage ? (
                <img
                  src={productImage}
                  alt={product.name}
                  className={`product-image ${imageLoaded ? 'loaded' : ''}`}
                  loading="lazy"
                  onLoad={() => setImageLoaded(true)}
                />
              ) : (
                <div className="product-image-placeholder">
                  <span>No Image</span>
                </div>
              )}
            </motion.div>

            {/* Hover Overlay */}
            <motion.div 
              className="product-overlay"
              variants={overlayVariants}
            >
              {onQuickView && (
                <Button
                  variant="light"
                  className="quick-view-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onQuickView(product);
                  }}
                >
                  <FaEye className="me-2" />
                  Quick View
                </Button>
              )}
            </motion.div>
          </Link>

          {/* Stock Status Ribbon */}
          {!isInStock && (
            <div className="out-of-stock-ribbon">
              Out of Stock
            </div>
          )}
        </div>

        {/* Card Body */}
        <Card.Body className="d-flex flex-column">
          {/* Category */}
          {product.category && (
            <span className="product-category">{product.category.name}</span>
          )}

          {/* Title */}
          <Link to={`/products/${product.id}`} className="product-title-link">
            <h3 className="product-title">{product.name}</h3>
          </Link>

          {/* Description */}
          <p className="product-description">
            {product.description 
              ? product.description.substring(0, 60) + (product.description.length > 60 ? '...' : '')
              : 'No description available'}
          </p>

          {/* Spacer */}
          <div className="mt-auto">
            {/* Price */}
            <div className="product-price-container">
              {isOnSale ? (
                <>
                  <span className="product-price-sale">₱{formatPrice(product.sale_price)}</span>
                  <span className="product-price-original">₱{formatPrice(product.price)}</span>
                </>
              ) : (
                <span className="product-price">₱{formatPrice(product.price)}</span>
              )}
            </div>

            {/* Stock Status */}
            <div className="stock-status mb-3">
              {isInStock ? (
                <span className={`stock-indicator ${isLowStock ? 'low' : 'in-stock'}`}>
                  <FaCheckCircle className="me-1" />
                  {isLowStock ? `Only ${product.stock_quantity} left` : 'In Stock'}
                </span>
              ) : (
                <span className="stock-indicator out-of-stock">
                  <FaTimesCircle className="me-1" />
                  Out of Stock
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="product-actions">
              <Button
                as={Link}
                to={`/products/${product.id}`}
                variant="outline-primary"
                size="sm"
                className="view-details-btn"
              >
                View Details
              </Button>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="primary"
                  size="sm"
                  className="add-to-cart-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    onAddToCart && onAddToCart(product);
                  }}
                  disabled={!isInStock || isAddingToCart}
                  aria-label={`Add ${product.name} to cart`}
                >
                  {isAddingToCart ? (
                    <span className="spinner-border spinner-border-sm" />
                  ) : (
                    <FaShoppingCart />
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </Card.Body>
      </Card>
    </motion.article>
  );
};

export default EnhancedProductCard;
