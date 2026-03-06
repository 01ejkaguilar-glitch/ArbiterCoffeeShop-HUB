import { useState, useMemo } from 'react';

/**
 * Hook for table sorting functionality
 * Usage: const { sortedData, sortConfig, handleSort } = useTableSort(data, defaultKey, defaultDirection);
 */
const useTableSort = (data, defaultKey = null, defaultDirection = 'asc') => {
  const [sortConfig, setSortConfig] = useState({
    key: defaultKey,
    direction: defaultDirection
  });

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !data) {
      return data;
    }

    const sorted = [...data].sort((a, b) => {
      // Get nested property value using dot notation
      const getNestedValue = (obj, path) => {
        return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
      };

      const aValue = getNestedValue(a, sortConfig.key);
      const bValue = getNestedValue(b, sortConfig.key);

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // String comparison (case-insensitive)
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      // Number comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Date comparison
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortConfig.direction === 'asc' 
          ? aValue.getTime() - bValue.getTime() 
          : bValue.getTime() - aValue.getTime();
      }

      // Default comparison
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [data, sortConfig]);

  const handleSort = (key, direction = null) => {
    setSortConfig({
      key,
      direction: direction || (sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc')
    });
  };

  return {
    sortedData,
    sortConfig,
    handleSort,
    setSortConfig
  };
};

export default useTableSort;
