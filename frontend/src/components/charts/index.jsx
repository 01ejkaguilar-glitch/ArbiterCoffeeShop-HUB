/**
 * Chart Components
 * 
 * Reusable chart components built with Recharts
 * Includes: SalesLineChart, OrdersBarChart, RevenuePieChart, AreaMetricChart
 * 
 * @module components/charts
 */

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card } from 'react-bootstrap';
import { motion } from 'framer-motion';
import './Charts.css';

// Brand colors from design system
const CHART_COLORS = {
  primary: '#2E7D32',      // Forest Green
  secondary: '#8D6E63',    // Coffee Brown
  accent: '#D4A574',       // Warm Caramel
  success: '#4CAF50',      // Success Green
  warning: '#FF9800',      // Warning Orange
  danger: '#f44336',       // Danger Red
  info: '#006837',         // Brand Green
  dark: '#1B5E20',         // Dark Green
  light: '#E8F5E9',        // Light Green
  muted: '#9E9E9E'         // Muted Gray
};

const PIE_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.accent,
  CHART_COLORS.success,
  CHART_COLORS.info,
  CHART_COLORS.warning
];

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, valuePrefix = '', valueSuffix = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="chart-tooltip-value" style={{ color: entry.color }}>
            {entry.name}: {valuePrefix}{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}{valueSuffix}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Chart wrapper component with title and animation
const ChartWrapper = ({ title, subtitle, children, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={`chart-card border-0 shadow-sm ${className}`}>
        <Card.Body>
          {title && (
            <div className="chart-header mb-3">
              <h3 className="chart-title">{title}</h3>
              {subtitle && <p className="chart-subtitle text-muted mb-0">{subtitle}</p>}
            </div>
          )}
          <div className="chart-container">
            {children}
          </div>
        </Card.Body>
      </Card>
    </motion.div>
  );
};

/**
 * Sales Line Chart
 * Shows sales trends over time with optional comparison line
 */
export const SalesLineChart = ({ 
  data, 
  title = 'Sales Trend',
  subtitle,
  dataKey = 'sales',
  comparisonKey,
  xAxisKey = 'date',
  height = 300,
  showGrid = true,
  showLegend = true,
  valuePrefix = '₱',
  color = CHART_COLORS.primary,
  comparisonColor = CHART_COLORS.muted
}) => {
  return (
    <ChartWrapper title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />}
          <XAxis 
            dataKey={xAxisKey} 
            tick={{ fontSize: 12, fill: '#666' }}
            tickLine={false}
            axisLine={{ stroke: '#e0e0e0' }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#666' }}
            tickLine={false}
            axisLine={{ stroke: '#e0e0e0' }}
            tickFormatter={(value) => `${valuePrefix}${value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}`}
          />
          <Tooltip content={<CustomTooltip valuePrefix={valuePrefix} />} />
          {showLegend && <Legend />}
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color}
            strokeWidth={3}
            dot={{ r: 4, fill: color }}
            activeDot={{ r: 6, fill: color }}
            name="Current Period"
          />
          {comparisonKey && (
            <Line 
              type="monotone" 
              dataKey={comparisonKey} 
              stroke={comparisonColor}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3, fill: comparisonColor }}
              name="Previous Period"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
};

/**
 * Orders Bar Chart
 * Shows order distribution by category, time, or status
 */
export const OrdersBarChart = ({
  data,
  title = 'Orders Overview',
  subtitle,
  dataKey = 'orders',
  xAxisKey = 'category',
  height = 300,
  showGrid = true,
  showLegend = false,
  color = CHART_COLORS.primary,
  secondaryDataKey,
  secondaryColor = CHART_COLORS.secondary,
  layout = 'vertical'
}) => {
  const isVertical = layout === 'vertical';
  
  return (
    <ChartWrapper title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart 
          data={data} 
          layout={isVertical ? 'vertical' : 'horizontal'}
          margin={{ top: 5, right: 30, left: isVertical ? 80 : 20, bottom: 5 }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />}
          {isVertical ? (
            <>
              <XAxis type="number" tick={{ fontSize: 12, fill: '#666' }} />
              <YAxis 
                dataKey={xAxisKey} 
                type="category" 
                tick={{ fontSize: 12, fill: '#666' }}
                width={70}
              />
            </>
          ) : (
            <>
              <XAxis 
                dataKey={xAxisKey} 
                tick={{ fontSize: 12, fill: '#666' }}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 12, fill: '#666' }} />
            </>
          )}
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
          <Bar 
            dataKey={dataKey} 
            fill={color}
            radius={[4, 4, 0, 0]}
            name="Orders"
          />
          {secondaryDataKey && (
            <Bar 
              dataKey={secondaryDataKey} 
              fill={secondaryColor}
              radius={[4, 4, 0, 0]}
              name="Previous"
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
};

/**
 * Revenue Pie Chart
 * Shows revenue distribution by category
 */
export const RevenuePieChart = ({
  data,
  title = 'Revenue Distribution',
  subtitle,
  dataKey = 'value',
  nameKey = 'name',
  height = 300,
  showLegend = true,
  showLabel = true,
  innerRadius = 60,
  outerRadius = 100,
  colors = PIE_COLORS
}) => {
  const renderLabel = ({ name, percent }) => {
    return `${name} (${(percent * 100).toFixed(0)}%)`;
  };

  return (
    <ChartWrapper title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey={dataKey}
            nameKey={nameKey}
            label={showLabel ? renderLabel : false}
            labelLine={showLabel}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [`₱${value.toLocaleString()}`, 'Revenue']}
          />
          {showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
};

/**
 * Area Metric Chart
 * Shows metrics over time with filled area
 */
export const AreaMetricChart = ({
  data,
  title = 'Performance Metrics',
  subtitle,
  dataKey = 'value',
  xAxisKey = 'date',
  height = 300,
  showGrid = true,
  showLegend = false,
  color = CHART_COLORS.primary,
  gradientId = 'colorValue',
  secondaryDataKey,
  secondaryColor = CHART_COLORS.secondary
}) => {
  return (
    <ChartWrapper title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
            {secondaryDataKey && (
              <linearGradient id={`${gradientId}Secondary`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={secondaryColor} stopOpacity={0}/>
              </linearGradient>
            )}
          </defs>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />}
          <XAxis 
            dataKey={xAxisKey} 
            tick={{ fontSize: 12, fill: '#666' }}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#666' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
          <Area 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            name="Current"
          />
          {secondaryDataKey && (
            <Area 
              type="monotone" 
              dataKey={secondaryDataKey} 
              stroke={secondaryColor}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#${gradientId}Secondary)`}
              name="Previous"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
};

/**
 * Mini Sparkline Chart
 * Small inline chart for stat cards
 */
export const SparklineChart = ({
  data,
  dataKey = 'value',
  color = CHART_COLORS.primary,
  height = 40,
  width = 100,
  showDots = false
}) => {
  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <Line 
          type="monotone" 
          dataKey={dataKey} 
          stroke={color}
          strokeWidth={2}
          dot={showDots ? { r: 2, fill: color } : false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

/**
 * Comparison Bar Chart
 * Shows this week vs last week comparison
 */
export const ComparisonBarChart = ({
  data,
  title = 'Weekly Comparison',
  subtitle,
  currentKey = 'current',
  previousKey = 'previous',
  xAxisKey = 'name',
  height = 300,
  currentLabel = 'This Week',
  previousLabel = 'Last Week'
}) => {
  return (
    <ChartWrapper title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey={xAxisKey} 
            tick={{ fontSize: 12, fill: '#666' }}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 12, fill: '#666' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey={currentKey} 
            fill={CHART_COLORS.primary}
            radius={[4, 4, 0, 0]}
            name={currentLabel}
          />
          <Bar 
            dataKey={previousKey} 
            fill={CHART_COLORS.muted}
            radius={[4, 4, 0, 0]}
            name={previousLabel}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
};

export { CHART_COLORS, ChartWrapper };
