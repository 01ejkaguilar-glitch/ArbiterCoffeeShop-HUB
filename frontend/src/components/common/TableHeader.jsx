import React from 'react';
import { FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';

/**
 * Sortable Table Header Component
 * Provides column sorting functionality for tables
 */
const TableHeader = ({ label, sortKey, currentSort, onSort, align = 'left' }) => {
  const isSorted = currentSort.key === sortKey;
  const direction = currentSort.direction;

  const handleSort = () => {
    if (onSort && sortKey) {
      const newDirection = isSorted && direction === 'asc' ? 'desc' : 'asc';
      onSort(sortKey, newDirection);
    }
  };

  const getSortIcon = () => {
    if (!sortKey) return null;
    
    if (isSorted) {
      return direction === 'asc' ? (
        <FaSortUp className="ms-1" />
      ) : (
        <FaSortDown className="ms-1" />
      );
    }
    return <FaSort className="ms-1 text-muted" />;
  };

  return (
    <th 
      onClick={handleSort}
      style={{ 
        cursor: sortKey ? 'pointer' : 'default',
        textAlign: align,
        userSelect: 'none'
      }}
      className={sortKey ? 'sortable-header' : ''}
    >
      <div className="d-flex align-items-center justify-content-between">
        <span>{label}</span>
        {getSortIcon()}
      </div>
    </th>
  );
};

export default TableHeader;
