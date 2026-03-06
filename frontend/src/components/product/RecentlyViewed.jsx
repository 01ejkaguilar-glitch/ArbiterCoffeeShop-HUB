import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHistory, FaTimes } from 'react-icons/fa';
import { BACKEND_BASE_URL } from '../../config/api';
import './RecentlyViewed.css';

const STORAGE_KEY = 'arbiter_recently_viewed';
const MAX_ITEMS = 8;

/**
 * RecentlyViewed - Display and manage recently viewed products
 * 
 * Features:
 * - Stores last 8 viewed products in localStorage
 * - Excludes current product from display
 * - Clear individual or all items
 * - Smooth animations
 * - Responsive grid layout
 */

/**
 * Add a product to recently viewed history
 * @param {Object} product - Product to add
 */
export const addToRecentlyViewed = (product) => {
  if (!product || !product.id) return;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let items = stored ? JSON.parse(stored) : [];
    
    // Remove if already exists
    items = items.filter(item => item.id !== product.id);
    
    // Add to beginning
    items.unshift({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      category: product.category,
      viewedAt: new Date().toISOString()
    });
    
    // Keep only max items
    items = items.slice(0, MAX_ITEMS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving to recently viewed:', error);
  }
};

/**
 * Get recently viewed products
 * @returns {Array} Recently viewed products
 */
export const getRecentlyViewed = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading recently viewed:', error);
    return [];
  }
};

/**
 * Clear all recently viewed products
 */
export const clearRecentlyViewed = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing recently viewed:', error);
  }
};

/**
 * Remove a single product from recently viewed
 * @param {number} productId - Product ID to remove
 */
export const removeFromRecentlyViewed = (productId) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    let items = JSON.parse(stored);
    items = items.filter(item => item.id !== productId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error removing from recently viewed:', error);
  }
};

/**
 * RecentlyViewed Component
 */
const RecentlyViewed = ({ 
  currentProductId = null,
  maxItems = 4,
  showClearAll = true,
  title = "Recently Viewed"
}) => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load recently viewed on mount
  useEffect(() => {
    const loadItems = () => {
      const storedItems = getRecentlyViewed();
      setItems(storedItems);
      setIsLoading(false);
    };

    loadItems();

    // Listen for storage changes from other tabs
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY) {
        loadItems();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Filter out current product and limit items
  const displayItems = useMemo(() => {
    return items
      .filter(item => item.id !== currentProductId)
      .slice(0, maxItems);
  }, [items, currentProductId, maxItems]);

  const handleRemove = (productId) => {
    removeFromRecentlyViewed(productId);
    setItems(prev => prev.filter(item => item.id !== productId));
  };

  const handleClearAll = () => {
    clearRecentlyViewed();
    setItems([]);
  };

  // Don't render if no items or loading
  if (isLoading || displayItems.length === 0) {
    return null;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };

  return (
    <section className="recently-viewed-section" aria-labelledby="recently-viewed-heading">
      <div className="recently-viewed-header">
        <h2 id="recently-viewed-heading" className="recently-viewed-title">
          <FaHistory className="me-2" aria-hidden="true" />
          {title}
        </h2>
        {showClearAll && displayItems.length > 1 && (
          <button
            className="clear-all-btn"
            onClick={handleClearAll}
            aria-label="Clear all recently viewed products"
          >
            Clear All
          </button>
        )}
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Row className="g-3">
          <AnimatePresence>
            {displayItems.map((item) => (
              <Col key={item.id} xs={6} md={4} lg={3}>
                <motion.div
                  variants={itemVariants}
                  exit="exit"
                  layout
                >
                  <Card className="recently-viewed-card h-100">
                    <button
                      className="remove-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemove(item.id);
                      }}
                      aria-label={`Remove ${item.name} from recently viewed`}
                    >
                      <FaTimes />
                    </button>

                    <Link to={`/products/${item.id}`} className="card-link">
                      <div className="card-image-container">
                        {item.image_url ? (
                          <img
                            src={`${BACKEND_BASE_URL}${item.image_url}`}
                            alt={item.name}
                            className="card-image"
                            loading="lazy"
                          />
                        ) : (
                          <div className="card-image-placeholder">
                            No Image
                          </div>
                        )}
                      </div>
                      <Card.Body className="p-2">
                        {item.category && (
                          <span className="card-category">{item.category.name}</span>
                        )}
                        <h3 className="card-title">{item.name}</h3>
                        <p className="card-price">₱{parseFloat(item.price).toFixed(2)}</p>
                      </Card.Body>
                    </Link>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </AnimatePresence>
        </Row>
      </motion.div>
    </section>
  );
};

export default RecentlyViewed;
