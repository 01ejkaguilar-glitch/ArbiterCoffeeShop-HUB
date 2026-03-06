/**
 * Enhanced Stat Card Component
 * 
 * A modern stat card with icon, trend indicator, animated counter, and optional sparkline
 * 
 * @module components/dashboard/EnhancedStatCard
 */

import React, { useState, useEffect } from 'react';
import { Card } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';
import { SparklineChart } from '../charts';
import './EnhancedStatCard.css';

/**
 * Animated counter hook for smooth number transitions
 */
const useAnimatedCounter = (target, duration = 1000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (typeof target !== 'number' || isNaN(target)) {
      setCount(0);
      return;
    }

    const startTime = Date.now();
    const startValue = 0;
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(startValue + (target - startValue) * eased);
      
      setCount(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [target, duration]);

  return count;
};

/**
 * Format number with abbreviation (K, M, B)
 */
const formatNumber = (num, prefix = '', suffix = '') => {
  if (typeof num !== 'number' || isNaN(num)) return `${prefix}0${suffix}`;
  
  if (num >= 1000000000) {
    return `${prefix}${(num / 1000000000).toFixed(1)}B${suffix}`;
  }
  if (num >= 1000000) {
    return `${prefix}${(num / 1000000).toFixed(1)}M${suffix}`;
  }
  if (num >= 1000) {
    return `${prefix}${(num / 1000).toFixed(1)}K${suffix}`;
  }
  return `${prefix}${num.toLocaleString()}${suffix}`;
};

/**
 * Get trend color based on positive/negative value
 */
const getTrendColor = (trend, isNegativeGood = false) => {
  if (trend === 0) return 'muted';
  const isPositive = trend > 0;
  if (isNegativeGood) {
    return isPositive ? 'danger' : 'success';
  }
  return isPositive ? 'success' : 'danger';
};

/**
 * EnhancedStatCard Component
 * 
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {number} props.value - Main numeric value
 * @param {string} props.prefix - Value prefix (e.g., '₱')
 * @param {string} props.suffix - Value suffix (e.g., '%')
 * @param {React.ComponentType} props.icon - Icon component
 * @param {string} props.iconColor - Icon color class (e.g., 'primary', 'success')
 * @param {number} props.trend - Percentage change from previous period
 * @param {string} props.trendLabel - Label for trend (e.g., 'vs last week')
 * @param {boolean} props.isNegativeGood - If true, negative trends show as positive
 * @param {Array} props.sparklineData - Data for sparkline chart
 * @param {string} props.sparklineColor - Color for sparkline
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.delay - Animation delay in seconds
 */
const EnhancedStatCard = ({
  title,
  value,
  prefix = '',
  suffix = '',
  icon: Icon,
  iconColor = 'primary',
  trend,
  trendLabel = 'vs last period',
  isNegativeGood = false,
  sparklineData,
  sparklineColor,
  className = '',
  delay = 0
}) => {
  const animatedValue = useAnimatedCounter(value);
  const trendColorClass = trend !== undefined ? getTrendColor(trend, isNegativeGood) : null;
  
  const TrendIcon = trend > 0 ? FaArrowUp : trend < 0 ? FaArrowDown : FaMinus;

  // Card animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4,
        delay,
        ease: 'easeOut'
      }
    }
  };

  // Icon animation variants
  const iconVariants = {
    hidden: { scale: 0 },
    visible: { 
      scale: 1,
      transition: { 
        type: 'spring',
        stiffness: 260,
        damping: 20,
        delay: delay + 0.2
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className={`enhanced-stat-card border-0 shadow-sm h-100 ${className}`}>
        <Card.Body className="p-4">
          <div className="stat-card-content">
            {/* Header Row */}
            <div className="stat-card-header d-flex justify-content-between align-items-start mb-3">
              <div className="stat-card-title-section">
                <p className="stat-card-title text-muted mb-1">{title}</p>
                <div className="stat-card-value-row d-flex align-items-baseline gap-2">
                  <h3 className="stat-card-value mb-0">
                    {prefix}{animatedValue.toLocaleString()}{suffix}
                  </h3>
                  {trend !== undefined && (
                    <span className={`stat-card-trend text-${trendColorClass} d-flex align-items-center`}>
                      <TrendIcon size={10} className="me-1" />
                      {Math.abs(trend)}%
                    </span>
                  )}
                </div>
                {trend !== undefined && trendLabel && (
                  <small className="stat-card-trend-label text-muted">{trendLabel}</small>
                )}
              </div>
              
              {Icon && (
                <motion.div 
                  variants={iconVariants}
                  className={`stat-card-icon bg-${iconColor} bg-opacity-10`}
                >
                  <Icon size={24} className={`text-${iconColor}`} />
                </motion.div>
              )}
            </div>

            {/* Sparkline Chart */}
            {sparklineData && sparklineData.length > 0 && (
              <div className="stat-card-sparkline mt-3">
                <SparklineChart 
                  data={sparklineData}
                  color={sparklineColor || `var(--bs-${iconColor})`}
                  height={40}
                  width="100%"
                />
              </div>
            )}
          </div>
        </Card.Body>
      </Card>
    </motion.div>
  );
};

/**
 * StatCardGroup Component
 * Container for multiple stat cards with stagger animation
 */
export const StatCardGroup = ({ children, className = '' }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * MiniStatCard Component
 * Compact version for secondary metrics
 */
export const MiniStatCard = ({
  title,
  value,
  icon: Icon,
  iconColor = 'secondary',
  prefix = '',
  suffix = ''
}) => {
  return (
    <div className="mini-stat-card d-flex align-items-center p-3 bg-light rounded">
      {Icon && (
        <div className={`mini-stat-icon me-3 text-${iconColor}`}>
          <Icon size={20} />
        </div>
      )}
      <div className="mini-stat-content">
        <p className="mini-stat-value mb-0 fw-bold">
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </p>
        <small className="mini-stat-title text-muted">{title}</small>
      </div>
    </div>
  );
};

export default EnhancedStatCard;
export { formatNumber, getTrendColor, useAnimatedCounter };
