import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShoppingCart, FaMinus, FaPlus, FaTimes, FaHeart, FaRegHeart, FaExternalLinkAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { BACKEND_BASE_URL } from '../../config/api';
import { useCart } from '../../context/CartContext';
import { useToast } from '../animations/Toast';
import './QuickViewModal.css';

/**
 * QuickViewModal - Quick product preview without leaving current page
 * 
 * Features:
 * - Animated modal entry/exit
 * - Product image with zoom
 * - Add to cart functionality
 * - Quantity selector
 * - Link to full product page
 * - Favorite toggle
 */
const QuickViewModal = ({ 
  show, 
  onHide, 
  product,
  isFavorite = false,
  onToggleFavorite = null
}) => {
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart } = useCart();
  const toast = useToast();

  if (!product) return null;

  const productImage = product.image_url 
    ? `${BACKEND_BASE_URL}${product.image_url}` 
    : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiBmaWxsPSIjZjBmMGYwIi8+Cjx0ZXh0IHg9IjI1MCIgeT0iMjUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjM1ZW0iIGZpbGw9IiM5OTkiIGZvbnQtc2l6ZT0iMjQiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4=';

  const isInStock = product.stock_quantity > 0;

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= product.stock_quantity) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (!isInStock) return;
    
    setIsAddingToCart(true);
    try {
      const result = await addToCart(product, quantity, specialInstructions);
      if (result.success) {
        toast.success(`${product.name} added to cart!`);
        onHide();
        setQuantity(1);
        setSpecialInstructions('');
      } else {
        toast.error(result.message || 'Failed to add to cart');
      }
    } catch (error) {
      toast.error('Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleFavoriteClick = () => {
    if (onToggleFavorite) {
      onToggleFavorite(product.id);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        type: 'spring', 
        stiffness: 300, 
        damping: 25 
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      y: 20,
      transition: { duration: 0.2 }
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <Modal
          show={show}
          onHide={onHide}
          centered
          size="lg"
          className="quick-view-modal"
          aria-labelledby="quick-view-title"
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="qvm-inner"
          >
            {/* Overlay close button */}
            <button
              className="qvm-close"
              onClick={onHide}
              aria-label="Close quick view"
            >
              <FaTimes size={14} />
            </button>

            <Modal.Body className="p-0">
              <div className="qvm-layout">
                {/* Image side */}
                <div className="qvm-image-col">
                  <div className="qvm-image-wrap">
                    <motion.img
                      src={productImage}
                      alt={product.name}
                      className="qvm-image"
                      initial={{ opacity: 0, scale: 1.04 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35 }}
                      onError={(e) => {
                        e.target.src = '/assets/images/product-placeholder.png';
                      }}
                    />

                    {/* Badges */}
                    {(product.is_new || product.is_popular || !isInStock) && (
                      <div className="qvm-badges">
                        {product.is_new && <span className="qvm-badge new">New</span>}
                        {product.is_popular && <span className="qvm-badge popular">Popular</span>}
                        {!isInStock && <span className="qvm-badge oos">Sold Out</span>}
                      </div>
                    )}

                    {/* Favorite */}
                    {onToggleFavorite && (
                      <button
                        className={`quick-view-favorite${isFavorite ? ' active' : ''}`}
                        onClick={handleFavoriteClick}
                        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        {isFavorite ? <FaHeart /> : <FaRegHeart />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Info side */}
                <motion.div
                  className="qvm-details"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                >
                  {product.category && (
                    <span className="quick-view-category">{product.category.name}</span>
                  )}

                  <h2 id="quick-view-title" className="quick-view-title">{product.name}</h2>

                  <div className="quick-view-price">
                    ₱{(parseFloat(product.price) || 0).toFixed(2)}
                  </div>

                  <div className="qvm-stock">
                    {isInStock ? (
                      <span className="qvm-stock-ok">
                        <FaCheckCircle size={11} /> {product.stock_quantity} available
                      </span>
                    ) : (
                      <span className="qvm-stock-no">
                        <FaTimesCircle size={11} /> Out of Stock
                      </span>
                    )}
                  </div>

                  {product.description && (
                    <p className="quick-view-description">{product.description}</p>
                  )}

                  {isInStock && (
                    <div className="qvm-actions">
                      {/* Quantity */}
                      <div className="qvm-qty-row">
                        <button
                          className="qvm-qty-btn"
                          onClick={() => handleQuantityChange(-1)}
                          disabled={quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          <FaMinus size={10} />
                        </button>
                        <span className="qvm-qty-value" aria-live="polite">{quantity}</span>
                        <button
                          className="qvm-qty-btn"
                          onClick={() => handleQuantityChange(1)}
                          disabled={quantity >= product.stock_quantity}
                          aria-label="Increase quantity"
                        >
                          <FaPlus size={10} />
                        </button>
                      </div>

                      {/* Special instructions */}
                      <textarea
                        rows={2}
                        className="form-control qvm-textarea"
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        placeholder="Special instructions (optional)"
                        aria-label="Special instructions"
                      />

                      {/* Add to cart */}
                      <button
                        className="add-to-cart-btn"
                        onClick={handleAddToCart}
                        disabled={isAddingToCart}
                      >
                        {isAddingToCart ? 'Adding…' : (
                          <>
                            <FaShoppingCart size={14} />
                            Add to Cart · ₱{((parseFloat(product.price) || 0) * quantity).toFixed(2)}
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <div className="text-center mt-3">
                    <Link
                      to={`/products/${product.id}`}
                      className="view-details-link"
                      onClick={onHide}
                    >
                      View Full Details <FaExternalLinkAlt size={11} className="ms-1" />
                    </Link>
                  </div>
                </motion.div>
              </div>
            </Modal.Body>
          </motion.div>
        </Modal>
      )}
    </AnimatePresence>
  );
};

export default QuickViewModal;
