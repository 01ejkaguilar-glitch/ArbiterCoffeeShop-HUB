import React from 'react';
import { Form, Button } from 'react-bootstrap';
import { FaSlidersH } from 'react-icons/fa';

function ProductFilterForm({ priceRange, setPriceRange, availabilityFilter, setAvailabilityFilter, clearFilters, onApply, isMobile, isInline }) {
  if (isInline) {
    return (
      <div className="d-flex flex-wrap align-items-end gap-3">
        <div>
          <Form.Label className="small fw-semibold mb-1">Price Range</Form.Label>
          <div className="d-flex gap-2">
            <Form.Control
              type="number"
              placeholder="Min"
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
              size="sm"
              style={{ width: 90 }}
              aria-label="Minimum price"
            />
            <span className="align-self-center text-muted">–</span>
            <Form.Control
              type="number"
              placeholder="Max"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
              size="sm"
              style={{ width: 90 }}
              aria-label="Maximum price"
            />
          </div>
        </div>
        <div>
          <Form.Label className="small fw-semibold mb-1">Availability</Form.Label>
          <Form.Select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            size="sm"
            style={{ width: 150 }}
            aria-label="Filter by availability"
          >
            <option value="all">All Products</option>
            <option value="in_stock">In Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </Form.Select>
        </div>
        <Button variant="outline-secondary" size="sm" onClick={clearFilters} aria-label="Clear all filters">
          Clear Filters
        </Button>
      </div>
    );
  }

  return (
    <>
      {!isMobile && (
        <h2 className="h6 mb-3">
          <FaSlidersH className="me-2" aria-hidden="true" />
          Filters
        </h2>
      )}

      <div className="mb-3">
        <Form.Label>Price Range</Form.Label>
        <div className="d-flex gap-2">
          <Form.Control
            type="number"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
            size="sm"
            aria-label="Minimum price"
          />
          <Form.Control
            type="number"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
            size="sm"
            aria-label="Maximum price"
          />
        </div>
      </div>

      <div className="mb-3">
        <Form.Label>Availability</Form.Label>
        <Form.Select
          value={availabilityFilter}
          onChange={(e) => setAvailabilityFilter(e.target.value)}
          size="sm"
          aria-label="Filter by availability"
        >
          <option value="all">All Products</option>
          <option value="in_stock">In Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </Form.Select>
      </div>

      {isMobile ? (
        <div className="d-grid gap-2">
          <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
            Clear Filters
          </Button>
          <Button variant="primary" onClick={onApply}>
            Apply Filters
          </Button>
        </div>
      ) : (
        <Button variant="outline-secondary" size="sm" onClick={clearFilters} aria-label="Clear all filters">
          Clear Filters
        </Button>
      )}
    </>
  );
}

export default ProductFilterForm;
