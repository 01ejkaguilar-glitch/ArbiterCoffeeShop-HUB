import { useState, useMemo, useEffect } from 'react';

/**
 * Hook for pagination functionality
 * Usage: const { paginatedData, pagination, handlePageChange, handleItemsPerPageChange } = usePagination(data, defaultItemsPerPage);
 */
const usePagination = (data, defaultItemsPerPage = 25) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  // Calculate pagination values
  const totalItems = data?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Get paginated data
  const paginatedData = useMemo(() => {
    if (!data) return [];
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  // Handle page change
  const handlePageChange = (page) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  // Reset pagination when data changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  return {
    paginatedData,
    pagination: {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage
    },
    handlePageChange,
    handleItemsPerPageChange,
    resetPagination: () => setCurrentPage(1)
  };
};

export default usePagination;
