import React from 'react';
import { Card } from 'react-bootstrap';
import { 
  FaChartLine, FaChartBar, FaChartPie, FaChartArea 
} from 'react-icons/fa';

/**
 * Simple Chart Components without external dependencies
 * Uses CSS and HTML for basic visualizations
 */

// Bar Chart Component
export const BarChart = ({ data, title, color = '#0d6efd', height = 200 }) => {
  if (!data || data.length === 0) {
    return (
      <Card className="shadow-sm">
        <Card.Header className="d-flex align-items-center">
          <FaChartBar className="me-2" />
          <strong>{title}</strong>
        </Card.Header>
        <Card.Body>
          <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '14px' }}>
            No data available
          </div>
        </Card.Body>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value)) || 1;
  const chartAreaHeight = height - 40; // reserve 40px for labels below

  return (
    <Card className="shadow-sm">
      <Card.Header className="d-flex align-items-center">
        <FaChartBar className="me-2" />
        <strong>{title}</strong>
      </Card.Header>
      <Card.Body>
        {/* Chart area */}
        <div style={{ display: 'flex', alignItems: 'flex-end', height: `${chartAreaHeight}px`, gap: '6px', paddingTop: '24px', boxSizing: 'border-box' }}>
          {data.map((item, index) => {
            const barHeight = Math.max(2, Math.round((item.value / maxValue) * (chartAreaHeight - 24)));
            return (
              <div
                key={index}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  height: '100%',
                }}
              >
                {/* Value label above bar */}
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151', marginBottom: '3px', whiteSpace: 'nowrap' }}>
                  {item.value.toLocaleString()}
                </span>
                {/* Bar */}
                <div
                  style={{
                    width: '100%',
                    height: `${barHeight}px`,
                    backgroundColor: color,
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease',
                    minHeight: '2px',
                  }}
                  title={`${item.label}: ${item.value}`}
                />
              </div>
            );
          })}
        </div>
        {/* Labels row */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
          {data.map((item, index) => (
            <div key={index} style={{ flex: 1, textAlign: 'center', fontSize: '11px', color: '#6b7280', wordBreak: 'break-word', lineHeight: '1.2' }}>
              {item.label}
            </div>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
};

// Line Chart Component
export const LineChart = ({ data, title, color = '#198754', height = 200 }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;
  
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - (((item.value - minValue) / range) * 100);
    return `${x},${y}`;
  }).join(' ');

  return (
    <Card className="shadow-sm">
      <Card.Header className="d-flex align-items-center">
        <FaChartLine className="me-2" />
        <strong>{title}</strong>
      </Card.Header>
      <Card.Body>
        <svg 
          width="100%" 
          height={height} 
          viewBox="0 0 100 100" 
          preserveAspectRatio="none"
          style={{ display: 'block' }}
        >
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - (((item.value - minValue) / range) * 100);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill={color}
                vectorEffect="non-scaling-stroke"
              >
                <title>{`${item.label}: ${item.value}`}</title>
              </circle>
            );
          })}
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px' }}>
          {data.map((item, index) => (
            <div key={index} style={{ textAlign: 'center', flex: 1 }}>
              {item.label}
            </div>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
};

// Pie Chart Component
export const PieChart = ({ data, title, colors = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6c757d'] }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  const slices = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
    const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
    const x2 = 50 + 40 * Math.cos((currentAngle - 90) * Math.PI / 180);
    const y2 = 50 + 40 * Math.sin((currentAngle - 90) * Math.PI / 180);
    const largeArc = angle > 180 ? 1 : 0;

    return {
      ...item,
      percentage: percentage.toFixed(1),
      path: `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color: colors[index % colors.length]
    };
  });

  return (
    <Card className="shadow-sm">
      <Card.Header className="d-flex align-items-center">
        <FaChartPie className="me-2" />
        <strong>{title}</strong>
      </Card.Header>
      <Card.Body>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <svg width="200" height="200" viewBox="0 0 100 100">
            {slices.map((slice, index) => (
              <path
                key={index}
                d={slice.path}
                fill={slice.color}
                stroke="white"
                strokeWidth="0.5"
              >
                <title>{`${slice.label}: ${slice.value} (${slice.percentage}%)`}</title>
              </path>
            ))}
          </svg>
          <div style={{ flex: 1 }}>
            {slices.map((slice, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <div 
                  style={{ 
                    width: '16px', 
                    height: '16px', 
                    backgroundColor: slice.color, 
                    marginRight: '8px',
                    borderRadius: '2px'
                  }} 
                />
                <span style={{ fontSize: '14px' }}>
                  {slice.label}: <strong>{slice.value}</strong> ({slice.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

// Stats Card Component
export const StatsCard = ({ icon: Icon, title, value, trend, trendValue, color = 'primary' }) => {
  const trendColor = trend === 'up' ? 'success' : trend === 'down' ? 'danger' : 'secondary';
  
  return (
    <Card className="shadow-sm h-100">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <p className="text-muted mb-1">{title}</p>
            <h2 className="mb-0">{value}</h2>
            {trendValue && (
              <small className={`text-${trendColor}`}>
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
              </small>
            )}
          </div>
          <div className={`bg-${color} bg-opacity-10 p-3 rounded`}>
            <Icon size={24} className={`text-${color}`} />
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

// Area Chart Component (simplified)
export const AreaChart = ({ data, title, color = '#0dcaf0', height = 200 }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;
  
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - (((item.value - minValue) / range) * 80);
    return `${x},${y}`;
  }).join(' ');

  const areaPath = `${points} 100,100 0,100`;

  return (
    <Card className="shadow-sm">
      <Card.Header className="d-flex align-items-center">
        <FaChartArea className="me-2" />
        <strong>{title}</strong>
      </Card.Header>
      <Card.Body>
        <svg width="100%" height={height} viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon
            points={areaPath}
            fill={color}
            fillOpacity="0.2"
          />
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px' }}>
          {data.map((item, index) => (
            <div key={index} style={{ textAlign: 'center', flex: 1 }}>
              {item.label}
            </div>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
};
