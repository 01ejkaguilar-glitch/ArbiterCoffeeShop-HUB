import React, { useState, useCallback } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearchPlus, FaSearchMinus, FaExpand, FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';
import './ImageGallery.css';

/**
 * ImageGallery - Enhanced product image display with zoom and fullscreen
 * 
 * Features:
 * - Thumbnail navigation for multiple images
 * - Image zoom on hover
 * - Fullscreen modal view
 * - Keyboard navigation support
 * - Smooth animations
 */
const ImageGallery = ({ 
  images = [], 
  productName = 'Product',
  placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiBmaWxsPSIjZjBmMGYwIi8+Cjx0ZXh0IHg9IjI1MCIgeT0iMjUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjM1ZW0iIGZpbGw9IiM5OTkiIGZvbnQtc2l6ZT0iMjQiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4='
}) => {
  // Ensure we have at least one image
  const galleryImages = images.length > 0 ? images : [{ url: placeholderImage, alt: productName }];
  
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const activeImage = galleryImages[activeIndex];

  // Handle mouse move for zoom effect
  const handleMouseMove = useCallback((e) => {
    if (!isZoomed) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  }, [isZoomed]);

  // Navigate to previous image
  const goToPrevious = useCallback(() => {
    setActiveIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  }, [galleryImages.length]);

  // Navigate to next image
  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  }, [galleryImages.length]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowLeft') {
      goToPrevious();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    } else if (e.key === 'Escape') {
      setShowFullscreen(false);
    }
  }, [goToPrevious, goToNext]);

  // Zoom controls for fullscreen
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 1));
  };

  return (
    <div className="image-gallery" role="region" aria-label={`Image gallery for ${productName}`}>
      {/* Main Image Container */}
      <div 
        className={`main-image-container ${isZoomed ? 'zoomed' : ''}`}
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => {
          setIsZoomed(false);
          setZoomPosition({ x: 50, y: 50 });
        }}
        onMouseMove={handleMouseMove}
        onClick={() => setShowFullscreen(true)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`View ${productName} fullscreen. Press Enter to expand.`}
      >
        <motion.img
          key={activeIndex}
          src={activeImage.url || activeImage}
          alt={activeImage.alt || `${productName} - Image ${activeIndex + 1}`}
          className="main-image"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={isZoomed ? {
            transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
            transform: 'scale(2)'
          } : {}}
          loading="eager"
        />
        
        {/* Zoom indicator */}
        <div className="zoom-indicator" aria-hidden="true">
          <FaSearchPlus />
          <span>Click to expand</span>
        </div>

        {/* Navigation arrows for multiple images */}
        {galleryImages.length > 1 && (
          <>
            <button
              className="nav-arrow nav-arrow-left"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              aria-label="Previous image"
            >
              <FaChevronLeft />
            </button>
            <button
              className="nav-arrow nav-arrow-right"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              aria-label="Next image"
            >
              <FaChevronRight />
            </button>
          </>
        )}

        {/* Fullscreen button */}
        <button
          className="fullscreen-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowFullscreen(true);
          }}
          aria-label="View image fullscreen"
        >
          <FaExpand />
        </button>
      </div>

      {/* Thumbnails */}
      {galleryImages.length > 1 && (
        <div 
          className="thumbnails-container" 
          role="tablist" 
          aria-label="Image thumbnails"
        >
          {galleryImages.map((image, index) => (
            <motion.button
              key={index}
              className={`thumbnail ${index === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(index)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`View image ${index + 1} of ${galleryImages.length}`}
            >
              <img
                src={image.url || image}
                alt={`Thumbnail ${index + 1}`}
                loading="lazy"
              />
            </motion.button>
          ))}
        </div>
      )}

      {/* Image counter */}
      {galleryImages.length > 1 && (
        <div className="image-counter" aria-live="polite">
          {activeIndex + 1} / {galleryImages.length}
        </div>
      )}

      {/* Fullscreen Modal */}
      <Modal
        show={showFullscreen}
        onHide={() => {
          setShowFullscreen(false);
          setZoomLevel(1);
        }}
        size="xl"
        centered
        className="fullscreen-modal"
        aria-labelledby="fullscreen-modal-title"
      >
        <Modal.Header className="border-0 bg-dark">
          <Modal.Title id="fullscreen-modal-title" className="text-white">
            {productName}
          </Modal.Title>
          <div className="d-flex align-items-center gap-2">
            <Button
              variant="outline-light"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 1}
              aria-label="Zoom out"
            >
              <FaSearchMinus />
            </Button>
            <span className="text-white">{Math.round(zoomLevel * 100)}%</span>
            <Button
              variant="outline-light"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3}
              aria-label="Zoom in"
            >
              <FaSearchPlus />
            </Button>
            <Button
              variant="outline-light"
              size="sm"
              onClick={() => {
                setShowFullscreen(false);
                setZoomLevel(1);
              }}
              aria-label="Close fullscreen"
            >
              <FaTimes />
            </Button>
          </div>
        </Modal.Header>
        <Modal.Body 
          className="bg-dark p-0 d-flex align-items-center justify-content-center"
          style={{ minHeight: '70vh' }}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              className="fullscreen-image-container"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <img
                src={activeImage.url || activeImage}
                alt={activeImage.alt || `${productName} - Image ${activeIndex + 1}`}
                className="fullscreen-image"
                style={{ transform: `scale(${zoomLevel})` }}
              />
            </motion.div>
          </AnimatePresence>

          {/* Navigation arrows in fullscreen */}
          {galleryImages.length > 1 && (
            <>
              <button
                className="nav-arrow nav-arrow-left fullscreen-nav"
                onClick={goToPrevious}
                aria-label="Previous image"
              >
                <FaChevronLeft />
              </button>
              <button
                className="nav-arrow nav-arrow-right fullscreen-nav"
                onClick={goToNext}
                aria-label="Next image"
              >
                <FaChevronRight />
              </button>
            </>
          )}
        </Modal.Body>

        {/* Thumbnails in fullscreen */}
        {galleryImages.length > 1 && (
          <Modal.Footer className="bg-dark border-0 justify-content-center">
            <div className="fullscreen-thumbnails">
              {galleryImages.map((image, index) => (
                <button
                  key={index}
                  className={`fullscreen-thumbnail ${index === activeIndex ? 'active' : ''}`}
                  onClick={() => setActiveIndex(index)}
                  aria-label={`View image ${index + 1}`}
                >
                  <img
                    src={image.url || image}
                    alt={`Thumbnail ${index + 1}`}
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </Modal.Footer>
        )}
      </Modal>
    </div>
  );
};

export default ImageGallery;
