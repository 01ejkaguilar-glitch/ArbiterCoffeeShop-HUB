/**
 * Swipeable Gallery Component
 * 
 * Touch-optimized image gallery with swipe gestures
 * for mobile devices. Uses framer-motion for smooth animations.
 * 
 * @module components/mobile/SwipeableGallery
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaExpand } from 'react-icons/fa';
import './SwipeableGallery.css';

const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY = 500;

/**
 * SwipeableGallery Component
 * 
 * @param {Object} props
 * @param {Array} props.images - Array of image URLs
 * @param {string} props.altPrefix - Alt text prefix for images
 * @param {Function} props.onImageClick - Callback when image is clicked
 * @param {boolean} props.showNavigation - Show prev/next arrows
 * @param {boolean} props.showIndicators - Show dot indicators
 * @param {boolean} props.showExpandButton - Show fullscreen button
 * @param {string} props.className - Additional CSS classes
 */
const SwipeableGallery = ({
  images = [],
  altPrefix = 'Image',
  onImageClick,
  showNavigation = true,
  showIndicators = true,
  showExpandButton = true,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  // Motion value for tracking drag position
  useMotionValue(0);
  const containerWidth = containerRef.current?.offsetWidth || 300;

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    
    const { offset, velocity } = info;
    
    // Determine if we should change slides
    if (offset.x < -SWIPE_THRESHOLD || velocity.x < -SWIPE_VELOCITY) {
      // Swipe left - next image
      goToNext();
    } else if (offset.x > SWIPE_THRESHOLD || velocity.x > SWIPE_VELOCITY) {
      // Swipe right - previous image
      goToPrevious();
    }
  };

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const goToIndex = (index) => {
    setCurrentIndex(index);
  };

  const handleImageClick = () => {
    if (!isDragging && onImageClick) {
      onImageClick(currentIndex, images[currentIndex]);
    }
  };

  // Animation variants
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? containerWidth : -containerWidth,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? containerWidth : -containerWidth,
      opacity: 0
    })
  };

  const [[page, direction], setPage] = useState([0, 0]);

  const paginate = (newDirection) => {
    const newIndex = currentIndex + newDirection;
    if (newIndex >= 0 && newIndex < images.length) {
      setPage([page + newDirection, newDirection]);
      setCurrentIndex(newIndex);
    }
  };

  if (!images || images.length === 0) {
    return (
      <div className={`swipeable-gallery empty ${className}`}>
        <div className="swipeable-gallery-placeholder">
          No images available
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`swipeable-gallery ${className}`}
      role="region"
      aria-label="Image gallery"
      aria-roledescription="carousel"
    >
      {/* Main Image Area */}
      <div className="swipeable-gallery-viewport">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={handleImageClick}
            className="swipeable-gallery-slide"
            role="group"
            aria-roledescription="slide"
            aria-label={`${currentIndex + 1} of ${images.length}`}
          >
            <img
              src={images[currentIndex]}
              alt={`${altPrefix} ${currentIndex + 1}`}
              className="swipeable-gallery-image"
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {showNavigation && images.length > 1 && (
          <>
            <button
              className="swipeable-gallery-nav prev"
              onClick={() => paginate(-1)}
              disabled={currentIndex === 0}
              aria-label="Previous image"
            >
              <FaChevronLeft aria-hidden="true" />
            </button>
            <button
              className="swipeable-gallery-nav next"
              onClick={() => paginate(1)}
              disabled={currentIndex === images.length - 1}
              aria-label="Next image"
            >
              <FaChevronRight aria-hidden="true" />
            </button>
          </>
        )}

        {/* Expand Button */}
        {showExpandButton && onImageClick && (
          <button
            className="swipeable-gallery-expand"
            onClick={handleImageClick}
            aria-label="View fullscreen"
          >
            <FaExpand aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Dot Indicators */}
      {showIndicators && images.length > 1 && (
        <div 
          className="swipeable-gallery-indicators"
          role="tablist"
          aria-label="Gallery navigation"
        >
          {images.map((_, index) => (
            <button
              key={index}
              className={`swipeable-gallery-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToIndex(index)}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SwipeableGallery;
