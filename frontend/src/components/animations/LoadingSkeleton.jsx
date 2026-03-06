import React from 'react';
import { motion } from 'framer-motion';
import './LoadingSkeleton.css';

/**
 * LoadingSkeleton - Animated loading placeholder
 * @param {Object} props - Component props
 * @param {string} props.variant - Skeleton variant: 'text', 'title', 'circular', 'rectangular', 'card' (default: 'text')
 * @param {string} props.width - Width (CSS value, default: '100%')
 * @param {string} props.height - Height (CSS value, default varies by variant)
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.lines - Number of text lines for 'text' variant (default: 1)
 */
export const LoadingSkeleton = ({ 
  variant = 'text', 
  width = '100%', 
  height, 
  className = '',
  lines = 1 
}) => {
  // Default heights based on variant
  const defaultHeights = {
    text: '16px',
    title: '32px',
    circular: '40px',
    rectangular: '200px',
    card: '300px'
  };

  const skeletonHeight = height || defaultHeights[variant];

  const shimmer = {
    backgroundImage: 'linear-gradient(90deg, #f0f0f0 0%, #f8f8f8 50%, #f0f0f0 100%)',
    backgroundSize: '200% 100%',
  };

  const animation = {
    animate: {
      backgroundPosition: ['0% 0%', '100% 0%'],
    },
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear'
    }
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`skeleton-text-group ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <motion.div
            key={index}
            className="skeleton-text"
            style={{
              ...shimmer,
              width: index === lines - 1 ? '80%' : width,
              height: skeletonHeight,
              marginBottom: index < lines - 1 ? '8px' : 0
            }}
            {...animation}
          />
        ))}
      </div>
    );
  }

  const circularStyle = variant === 'circular' ? {
    borderRadius: '50%',
    width: skeletonHeight
  } : {};

  return (
    <motion.div
      className={`skeleton-${variant} ${className}`}
      style={{
        ...shimmer,
        ...circularStyle,
        width: variant === 'circular' ? skeletonHeight : width,
        height: skeletonHeight,
      }}
      {...animation}
      aria-label="Loading..."
      role="status"
    />
  );
};

/**
 * ProductCardSkeleton - Loading skeleton for product cards
 */
export const ProductCardSkeleton = ({ className = '' }) => {
  return (
    <div className={`product-card-skeleton ${className}`}>
      <LoadingSkeleton variant="rectangular" height="200px" />
      <div className="p-3">
        <LoadingSkeleton variant="title" width="80%" />
        <LoadingSkeleton variant="text" lines={2} className="mt-2" />
        <div className="d-flex justify-content-between align-items-center mt-3">
          <LoadingSkeleton variant="text" width="60px" height="24px" />
          <LoadingSkeleton variant="rectangular" width="100px" height="36px" />
        </div>
      </div>
    </div>
  );
};

/**
 * TableRowSkeleton - Loading skeleton for table rows
 * @param {Object} props - Component props
 * @param {number} props.columns - Number of columns (default: 5)
 */
export const TableRowSkeleton = ({ columns = 5, className = '' }) => {
  return (
    <tr className={`table-row-skeleton ${className}`}>
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index}>
          <LoadingSkeleton variant="text" height="20px" />
        </td>
      ))}
    </tr>
  );
};

/**
 * StatCardSkeleton - Loading skeleton for dashboard stat cards
 */
export const StatCardSkeleton = ({ className = '' }) => {
  return (
    <div className={`stat-card-skeleton p-4 ${className}`}>
      <div className="d-flex justify-content-between align-items-start">
        <div style={{ flex: 1 }}>
          <LoadingSkeleton variant="text" width="60%" height="14px" />
          <LoadingSkeleton variant="title" width="80%" className="mt-2" />
        </div>
        <LoadingSkeleton variant="circular" width="48px" height="48px" />
      </div>
      <LoadingSkeleton variant="text" width="40%" height="12px" className="mt-3" />
    </div>
  );
};

/**
 * ListItemSkeleton - Loading skeleton for list items
 */
export const ListItemSkeleton = ({ className = '' }) => {
  return (
    <div className={`list-item-skeleton d-flex align-items-center p-3 ${className}`}>
      <LoadingSkeleton variant="circular" width="40px" height="40px" />
      <div className="flex-grow-1 ms-3">
        <LoadingSkeleton variant="text" width="70%" height="16px" />
        <LoadingSkeleton variant="text" width="50%" height="14px" className="mt-1" />
      </div>
    </div>
  );
};

/**
 * SkeletonGroup - Render multiple skeletons
 * @param {Object} props - Component props
 * @param {number} props.count - Number of skeletons to render (default: 3)
 * @param {React.Component} props.component - Skeleton component to render (default: ProductCardSkeleton)
 * @param {string} props.className - Additional CSS classes
 */
export const SkeletonGroup = ({ count = 3, component: Component = ProductCardSkeleton, className = '' }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Component key={index} className={className} />
      ))}
    </>
  );
};

export default LoadingSkeleton;
