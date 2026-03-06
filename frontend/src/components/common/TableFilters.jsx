import React from 'react';
import { Row, Col, Form, InputGroup, Button } from 'react-bootstrap';
import { FaSearch, FaTimes } from 'react-icons/fa';

/**
 * Reusable Table Filters Component
 * Provides consistent filtering UI across admin pages
 */
const TableFilters = ({ 
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [], // Array of filter objects: { name, label, value, onChange, options }
  onClearFilters,
  showClearButton = true
}) => {
  const hasActiveFilters = () => {
    if (searchValue) return true;
    return filters.some(filter => 
      filter.value && filter.value !== 'all' && filter.value !== ''
    );
  };

  return (
    <div className="mb-3">
      <Row className="g-3 align-items-end">
        {/* Search Input */}
        <Col md={4}>
          <Form.Group>
            <Form.Label className="small text-muted">Search</Form.Label>
            <InputGroup>
              <InputGroup.Text>
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                aria-label="Search"
              />
            </InputGroup>
          </Form.Group>
        </Col>

        {/* Dynamic Filters */}
        {filters.map((filter, index) => (
          <Col md={filter.width || 4} key={filter.name || index}>
            <Form.Group>
              <Form.Label className="small text-muted">
                {filter.label}
              </Form.Label>
              <Form.Select
                value={filter.value}
                onChange={filter.onChange}
                aria-label={filter.label}
              >
                <option value="all">All {filter.label}</option>
                {filter.options.map(option => (
                  <option 
                    key={typeof option === 'string' ? option : option.value} 
                    value={typeof option === 'string' ? option : option.value}
                  >
                    {typeof option === 'string' ? option : option.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        ))}

        {/* Clear Filters Button */}
        {showClearButton && hasActiveFilters() && (
          <Col md="auto">
            <Button
              variant="outline-secondary"
              onClick={onClearFilters}
              aria-label="Clear all filters"
            >
              <FaTimes className="me-1" />
              Clear Filters
            </Button>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default TableFilters;
