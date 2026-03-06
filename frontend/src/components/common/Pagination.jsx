import React from 'react';
import { Pagination as BSPagination, Form } from 'react-bootstrap';

/**
 * Pagination Component
 * Provides pagination controls for large datasets
 */
const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
  itemsPerPageOptions = [10, 25, 50, 100]
}) => {
  // Calculate page range to display
  const getPageRange = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const pageRange = getPageRange();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalPages <= 1 && !showItemsPerPage) {
    return null;
  }

  return (
    <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap">
      <div className="text-muted mb-2 mb-md-0">
        Showing {startItem} to {endItem} of {totalItems} entries
      </div>

      <div className="d-flex align-items-center gap-3">
        {showItemsPerPage && (
          <div className="d-flex align-items-center">
            <label className="me-2 mb-0 text-nowrap">Items per page:</label>
            <Form.Select
              size="sm"
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              style={{ width: 'auto' }}
            >
              {itemsPerPageOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Form.Select>
          </div>
        )}

        {totalPages > 1 && (
          <BSPagination className="mb-0">
            <BSPagination.First
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
            />
            <BSPagination.Prev
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            />

            {pageRange.map((page, index) => {
              if (page === '...') {
                return (
                  <BSPagination.Ellipsis key={`ellipsis-${index}`} disabled />
                );
              }

              return (
                <BSPagination.Item
                  key={page}
                  active={page === currentPage}
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </BSPagination.Item>
              );
            })}

            <BSPagination.Next
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            />
            <BSPagination.Last
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
            />
          </BSPagination>
        )}
      </div>
    </div>
  );
};

export default Pagination;
