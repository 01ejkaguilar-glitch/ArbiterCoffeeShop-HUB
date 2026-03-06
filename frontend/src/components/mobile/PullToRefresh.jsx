/**
 * Pull to Refresh Component
 * 
 * Mobile-optimized pull-to-refresh functionality for data pages.
 * Uses touch events to detect pull gesture and trigger refresh.
 * 
 * @module components/mobile/PullToRefresh
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { FaArrowDown, FaSync } from 'react-icons/fa';
import './PullToRefresh.css';

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

/**
 * PullToRefresh Component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to wrap
 * @param {Function} props.onRefresh - Async function to call on refresh
 * @param {boolean} props.disabled - Disable pull to refresh
 * @param {string} props.className - Additional CSS classes
 */
const PullToRefresh = ({ 
  children, 
  onRefresh, 
  disabled = false,
  className = '' 
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullState, setPullState] = useState('idle'); // idle, pulling, threshold, refreshing
  const containerRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  
  const pullDistance = useMotionValue(0);
  const indicatorOpacity = useTransform(pullDistance, [0, PULL_THRESHOLD / 2, PULL_THRESHOLD], [0, 0.5, 1]);
  const indicatorRotate = useTransform(pullDistance, [0, PULL_THRESHOLD], [0, 180]);
  const indicatorScale = useTransform(pullDistance, [0, PULL_THRESHOLD, MAX_PULL], [0.5, 1, 1.1]);

  const handleTouchStart = useCallback((e) => {
    if (disabled || isRefreshing) return;
    
    // Only enable if scrolled to top
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
    setPullState('idle');
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e) => {
    if (disabled || isRefreshing || startY.current === 0) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      startY.current = 0;
      pullDistance.set(0);
      return;
    }
    
    currentY.current = e.touches[0].clientY;
    const diff = Math.max(0, currentY.current - startY.current);
    
    if (diff > 0) {
      // Apply resistance
      const resistance = 1 - Math.min(diff / (MAX_PULL * 2), 0.5);
      const adjustedDiff = Math.min(diff * resistance, MAX_PULL);
      
      pullDistance.set(adjustedDiff);
      
      if (adjustedDiff >= PULL_THRESHOLD) {
        setPullState('threshold');
      } else if (adjustedDiff > 0) {
        setPullState('pulling');
      }
      
      // Prevent scrolling while pulling
      if (diff > 10) {
        e.preventDefault();
      }
    }
  }, [disabled, isRefreshing, pullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing || startY.current === 0) return;
    
    const distance = pullDistance.get();
    
    if (distance >= PULL_THRESHOLD && onRefresh) {
      setPullState('refreshing');
      setIsRefreshing(true);
      
      // Keep indicator visible during refresh
      pullDistance.set(60);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullState('idle');
        pullDistance.set(0);
      }
    } else {
      pullDistance.set(0);
      setPullState('idle');
    }
    
    startY.current = 0;
  }, [disabled, isRefreshing, pullDistance, onRefresh]);

  // Prevent default touch behavior on the container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const preventScroll = (e) => {
      if (pullState === 'pulling' || pullState === 'threshold') {
        e.preventDefault();
      }
    };
    
    container.addEventListener('touchmove', preventScroll, { passive: false });
    return () => container.removeEventListener('touchmove', preventScroll);
  }, [pullState]);

  const getIndicatorContent = () => {
    switch (pullState) {
      case 'threshold':
        return (
          <>
            <FaArrowDown className="ptr-icon threshold" aria-hidden="true" />
            <span className="ptr-text">Release to refresh</span>
          </>
        );
      case 'refreshing':
        return (
          <>
            <FaSync className="ptr-icon refreshing" aria-hidden="true" />
            <span className="ptr-text">Refreshing...</span>
          </>
        );
      case 'pulling':
      default:
        return (
          <>
            <motion.div style={{ rotate: indicatorRotate }}>
              <FaArrowDown className="ptr-icon" aria-hidden="true" />
            </motion.div>
            <span className="ptr-text">Pull to refresh</span>
          </>
        );
    }
  };

  return (
    <div
      ref={containerRef}
      className={`pull-to-refresh-container ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Refresh Indicator */}
      <motion.div
        className="ptr-indicator"
        style={{
          y: pullDistance,
          opacity: indicatorOpacity,
          scale: indicatorScale
        }}
        role="status"
        aria-live="polite"
      >
        <div className="ptr-indicator-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={pullState}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="ptr-indicator-inner"
            >
              {getIndicatorContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        className="ptr-content"
        style={{
          y: useTransform(pullDistance, v => v * 0.5)
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
