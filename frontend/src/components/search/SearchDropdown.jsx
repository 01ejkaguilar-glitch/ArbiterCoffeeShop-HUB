/**
 * SearchDropdown Component
 * 
 * Advanced search dropdown with instant results, suggestions,
 * keyboard navigation, and highlighted matches.
 * 
 * @module components/search/SearchDropdown
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, 
  FaTimes, 
  FaHistory, 
  FaFire, 
  FaCoffee,
  FaArrowRight,
  FaSpinner
} from 'react-icons/fa';
import useSearch from '../../hooks/useSearch';
import './SearchDropdown.css';

/**
 * Highlight matching text in a string
 */
const HighlightedText = ({ text, matches, fieldKey }) => {
  if (!matches || !text) return <span>{text}</span>;
  
  const fieldMatch = matches.find(m => m.key === fieldKey);
  if (!fieldMatch || !fieldMatch.indices) return <span>{text}</span>;
  
  const parts = [];
  let lastIndex = 0;
  
  fieldMatch.indices.forEach(([start, end], i) => {
    if (start > lastIndex) {
      parts.push(
        <span key={`text-${i}`}>{text.slice(lastIndex, start)}</span>
      );
    }
    parts.push(
      <mark key={`match-${i}`} className="search-highlight">
        {text.slice(start, end + 1)}
      </mark>
    );
    lastIndex = end + 1;
  });
  
  if (lastIndex < text.length) {
    parts.push(<span key="text-end">{text.slice(lastIndex)}</span>);
  }
  
  return <>{parts}</>;
};

/**
 * SearchDropdown Component
 */
const SearchDropdown = ({
  products = [],
  placeholder = "Search products...",
  className = "",
  onResultClick,
  onFocus,
  maxResults = 6
}) => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);

  const {
    query,
    results,
    isSearching,
    suggestions,
    search,
    handleSubmit,
    clearSearch,
    removeFromHistory,
    setShowSuggestions,
    hasResults,
    isEmpty
  } = useSearch({
    data: products,
    keys: ['name', 'description', 'category'],
    threshold: 0.4,
    enableHistory: true,
    minChars: 2
  });

  // Limit displayed results
  const displayedResults = results.slice(0, maxResults);
  const hasMoreResults = results.length > maxResults;

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    const totalItems = displayedResults.length + 
      (suggestions.history.length > 0 ? suggestions.history.length : 0) +
      (suggestions.popular.length > 0 ? suggestions.popular.length : 0);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < totalItems - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : totalItems - 1
        );
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < displayedResults.length) {
          handleResultClick(displayedResults[selectedIndex]);
        } else if (query.trim()) {
          handleSearchSubmit();
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        clearSearch();
        inputRef.current?.blur();
        break;
        
      default:
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedResults, suggestions, selectedIndex, query]);

  // Handle result click
  const handleResultClick = (product) => {
    handleSubmit(query);
    if (onResultClick) {
      onResultClick(product);
    } else {
      navigate(`/products/${product.id}`);
    }
    clearSearch();
  };

  // Handle search submission
  const handleSearchSubmit = () => {
    if (query.trim()) {
      handleSubmit(query);
      navigate(`/products?search=${encodeURIComponent(query.trim())}`);
      clearSearch();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestionQuery) => {
    search(suggestionQuery);
    handleSubmit(suggestionQuery);
    navigate(`/products?search=${encodeURIComponent(suggestionQuery)}`);
    clearSearch();
  };

  // Handle focus/blur
  const handleFocus = () => {
    setIsFocused(true);
    if (onFocus) {
      onFocus();
    }
    setShowSuggestions(true);
  };

  const handleBlur = (e) => {
    // Check if the blur is to an element within the dropdown
    if (dropdownRef.current?.contains(e.relatedTarget)) {
      return;
    }
    
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 150);
  };

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  // Show dropdown condition
  const showDropdown = isFocused && (
    hasResults || 
    (isEmpty && (suggestions.history.length > 0 || suggestions.popular.length > 0)) ||
    isSearching
  );

  return (
    <div className={`search-dropdown-container ${className}`} ref={dropdownRef}>
      {/* Search Input */}
      <div className="search-input-wrapper">
        <FaSearch className="search-icon" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => search(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-label="Search products"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-controls="search-results-listbox"
          role="combobox"
        />
        
        {/* Loading indicator */}
        {isSearching && (
          <FaSpinner className="search-loading" aria-hidden="true" />
        )}
        
        {/* Clear button */}
        {query && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={clearSearch}
            aria-label="Clear search"
          >
            <FaTimes aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            className="search-dropdown"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            id="search-results-listbox"
            role="listbox"
            aria-label="Search results"
          >
            {/* Search Results */}
            {hasResults && (
              <div className="search-results-section">
                <div className="search-section-header">
                  <FaCoffee aria-hidden="true" />
                  <span>Products</span>
                  <span className="search-count">({results.length})</span>
                </div>
                
                <ul className="search-results-list" role="listbox">
                  {displayedResults.map((product, index) => (
                    <li
                      key={product.id}
                      className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
                      onClick={() => handleResultClick(product)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      role="option"
                      aria-selected={index === selectedIndex}
                    >
                      {product.image && (
                        <img
                          src={product.image}
                          alt=""
                          className="search-result-image"
                          width="48"
                          height="48"
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                      <div className="search-result-content">
                        <div className="search-result-name">
                          <HighlightedText 
                            text={product.name} 
                            matches={product._matches}
                            fieldKey="name"
                          />
                        </div>
                        {product.description && (
                          <div className="search-result-description">
                            <HighlightedText 
                              text={product.description.slice(0, 60) + (product.description.length > 60 ? '...' : '')} 
                              matches={product._matches}
                              fieldKey="description"
                            />
                          </div>
                        )}
                        {product.price && (
                          <div className="search-result-price">
                            ₱{Number(product.price).toFixed(2)}
                          </div>
                        )}
                      </div>
                      <FaArrowRight className="search-result-arrow" aria-hidden="true" />
                    </li>
                  ))}
                </ul>

                {hasMoreResults && (
                  <button
                    className="search-view-all"
                    onClick={handleSearchSubmit}
                  >
                    View all {results.length} results
                    <FaArrowRight aria-hidden="true" />
                  </button>
                )}
              </div>
            )}

            {/* No Results */}
            {!hasResults && !isEmpty && !isSearching && (
              <div className="search-no-results">
                <FaSearch aria-hidden="true" />
                <p>No products found for "{query}"</p>
                <span>Try a different search term</span>
              </div>
            )}

            {/* Suggestions (when empty) */}
            {isEmpty && !isSearching && (
              <>
                {/* Recent Searches */}
                {suggestions.history.length > 0 && (
                  <div className="search-suggestions-section">
                    <div className="search-section-header">
                      <FaHistory aria-hidden="true" />
                      <span>Recent Searches</span>
                    </div>
                    <ul className="search-suggestions-list">
                      {suggestions.history.map((item, index) => (
                        <li
                          key={item.query}
                          className="search-suggestion-item"
                          onClick={() => handleSuggestionClick(item.query)}
                        >
                          <FaHistory className="suggestion-icon" aria-hidden="true" />
                          <span>{item.query}</span>
                          <button
                            className="suggestion-remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromHistory(item.query);
                            }}
                            aria-label={`Remove ${item.query} from history`}
                          >
                            <FaTimes aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Popular Searches */}
                {suggestions.popular.length > 0 && (
                  <div className="search-suggestions-section">
                    <div className="search-section-header">
                      <FaFire aria-hidden="true" />
                      <span>Popular Searches</span>
                    </div>
                    <ul className="search-suggestions-list">
                      {suggestions.popular.map((item) => (
                        <li
                          key={item.query}
                          className="search-suggestion-item"
                          onClick={() => handleSuggestionClick(item.query)}
                        >
                          <FaFire className="suggestion-icon popular" aria-hidden="true" />
                          <span>{item.query}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {/* Loading State */}
            {isSearching && (
              <div className="search-loading-state">
                <FaSpinner className="spin" aria-hidden="true" />
                <span>Searching...</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchDropdown;
