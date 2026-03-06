import React from 'react';
import { Col } from 'react-bootstrap';
import EnhancedStatCard, { StatCardGroup } from './EnhancedStatCard';

/**
 * Reusable dashboard stat card grid.
 * Renders a responsive row of EnhancedStatCard components with staggered animations.
 *
 * @param {Object} props
 * @param {Array<Object>} props.stats - Array of stat card configs
 * @param {string} props.stats[].title - Card title
 * @param {number} props.stats[].value - Main numeric value
 * @param {string} [props.stats[].prefix] - Value prefix (e.g. '₱')
 * @param {string} [props.stats[].suffix] - Value suffix (e.g. '%')
 * @param {React.ComponentType} props.stats[].icon - Icon component
 * @param {string} [props.stats[].iconColor] - Icon color class
 * @param {number} [props.stats[].trend] - Trend percentage
 * @param {string} [props.stats[].trendLabel] - Trend label text
 * @param {boolean} [props.stats[].isNegativeGood] - Whether negative trend is good
 * @param {string} [props.stats[].className] - Additional card class
 * @param {number} [props.baseDelay=0] - Starting animation delay
 * @param {number} [props.delayIncrement=0.1] - Delay between each card
 * @param {string} [props.className] - Additional wrapper class
 */
function DashboardStatGrid({
  stats,
  baseDelay = 0,
  delayIncrement = 0.1,
  className = '',
}) {
  if (!stats || stats.length === 0) return null;

  const colSize = stats.length <= 3 ? 4 : 3;

  return (
    <StatCardGroup className={`row g-2 g-md-4 mb-4 mb-md-5 ${className}`.trim()}>
      {stats.map((stat, idx) => (
        <Col xs={6} md={6} lg={colSize} key={stat.title || idx}>
          <EnhancedStatCard
            title={stat.title}
            value={stat.value}
            prefix={stat.prefix}
            suffix={stat.suffix}
            icon={stat.icon}
            iconColor={stat.iconColor}
            trend={stat.trend}
            trendLabel={stat.trendLabel}
            isNegativeGood={stat.isNegativeGood}
            className={stat.className}
            delay={baseDelay + idx * delayIncrement}
          />
        </Col>
      ))}
    </StatCardGroup>
  );
}

export default DashboardStatGrid;
