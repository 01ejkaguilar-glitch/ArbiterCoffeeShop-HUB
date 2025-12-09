/**
 * Auto Refresh Hook
 * Provides automatic data refreshing with manual refresh capability
 */

import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import { Button, Badge, Spinner } from 'react-bootstrap';
import { FaRedo, FaPlay, FaPause } from 'react-icons/fa';

export const useAutoRefresh = (
  fetchFunction,
  interval = 30000, // 30 seconds default
  enabled = true
) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(enabled);

  const refresh = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const result = await fetchFunction();
      setData(result);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.message || 'Failed to refresh data');
      console.error('Auto refresh error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto refresh interval
  useEffect(() => {
    if (!isAutoRefreshEnabled) return;

    const intervalId = setInterval(() => {
      refresh(false); // Don't show loading for auto refresh
    }, interval);

    return () => clearInterval(intervalId);
  }, [refresh, interval, isAutoRefreshEnabled]);

  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefreshEnabled(prev => !prev);
  }, []);

  return {
    data,
    loading,
    error,
    lastRefresh,
    isAutoRefreshEnabled,
    refresh: () => refresh(true), // Manual refresh with loading
    toggleAutoRefresh
  };
};

/**
 * Auto Refresh Component
 * UI component for manual refresh and auto-refresh toggle
 */

export const AutoRefreshControls = ({
  loading,
  lastRefresh,
  isAutoRefreshEnabled,
  onRefresh,
  onToggleAutoRefresh
}) => {
  const formatLastRefresh = (date) => {
    if (!date) return 'Never';

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  };

  return (
    <div className="d-flex align-items-center gap-2">
      {/* Auto-refresh status */}
      <Badge
        bg={isAutoRefreshEnabled ? 'success' : 'secondary'}
        className="d-flex align-items-center"
      >
        {isAutoRefreshEnabled ? (
          <FaPlay className="me-1" size={10} />
        ) : (
          <FaPause className="me-1" size={10} />
        )}
        {isAutoRefreshEnabled ? 'Auto' : 'Manual'}
      </Badge>

      {/* Last refresh time */}
      {lastRefresh && (
        <small className="text-muted">
          Updated {formatLastRefresh(lastRefresh)}
        </small>
      )}

      {/* Toggle auto-refresh */}
      <Button
        variant="outline-secondary"
        size="sm"
        onClick={onToggleAutoRefresh}
        title={isAutoRefreshEnabled ? 'Disable auto-refresh' : 'Enable auto-refresh'}
      >
        {isAutoRefreshEnabled ? <FaPause /> : <FaPlay />}
      </Button>

      {/* Manual refresh */}
      <Button
        variant="outline-primary"
        size="sm"
        onClick={onRefresh}
        disabled={loading}
        title="Refresh now"
      >
        {loading ? (
          <Spinner animation="border" size="sm" />
        ) : (
          <FaRedo />
        )}
      </Button>
    </div>
  );
};