/**
 * useSearch Hook
 * 
 * Advanced search hook with debouncing, fuzzy search,
 * search history, and API integration.
 * 
 * @module hooks/useSearch
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Fuse from 'fuse.js';

const SEARCH_HISTORY_KEY = 'arbiter_search_history';
const POPULAR_SEARCHES_KEY = 'arbiter_popular_searches';
const MAX_HISTORY_ITEMS = 10;
const MAX_POPULAR_ITEMS = 5;
const DEBOUNCE_DELAY = 300;

/**
 * Custom hook for advanced search functionality
 * 
 * @param {Object} options - Configuration options
 * @param {Array} options.data - Data array to search through
 * @param {Array} options.keys - Keys to search within objects
 * @param {Function} options.onSearch - Async search function for API
 * @param {number} options.debounceMs - Debounce delay in ms
 * @param {number} options.threshold - Fuse.js threshold (0-1, lower = stricter)
 * @param {boolean} options.enableHistory - Enable search history
 * @param {number} options.minChars - Minimum characters to trigger search
 */
const useSearch = ({
  data = [],
  keys = ['name', 'description'],
  onSearch = null,
  debounceMs = DEBOUNCE_DELAY,
  threshold = 0.3,
  enableHistory = true,
  minChars = 2
} = {}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [popularSearches, setPopularSearches] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const debounceRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Initialize Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    return new Fuse(data, {
      keys,
      threshold,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: minChars,
      ignoreLocation: true,
      useExtendedSearch: true
    });
  }, [data, keys, threshold, minChars]);

  // Load search history from localStorage
  useEffect(() => {
    if (!enableHistory) return;
    
    try {
      const history = localStorage.getItem(SEARCH_HISTORY_KEY);
      const popular = localStorage.getItem(POPULAR_SEARCHES_KEY);
      
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
      if (popular) {
        setPopularSearches(JSON.parse(popular));
      }
    } catch (err) {
      console.error('Failed to load search history:', err);
    }
  }, [enableHistory]);

  // Save search to history
  const saveToHistory = useCallback((searchQuery) => {
    if (!enableHistory || !searchQuery.trim()) return;
    
    setSearchHistory(prev => {
      const filtered = prev.filter(item => 
        item.query.toLowerCase() !== searchQuery.toLowerCase()
      );
      const updated = [
        { query: searchQuery, timestamp: Date.now() },
        ...filtered
      ].slice(0, MAX_HISTORY_ITEMS);
      
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save search history:', err);
      }
      
      return updated;
    });

    // Update popular searches
    setPopularSearches(prev => {
      const existing = prev.find(item => 
        item.query.toLowerCase() === searchQuery.toLowerCase()
      );
      
      let updated;
      if (existing) {
        updated = prev.map(item => 
          item.query.toLowerCase() === searchQuery.toLowerCase()
            ? { ...item, count: item.count + 1 }
            : item
        ).sort((a, b) => b.count - a.count);
      } else {
        updated = [...prev, { query: searchQuery, count: 1 }]
          .sort((a, b) => b.count - a.count)
          .slice(0, MAX_POPULAR_ITEMS);
      }
      
      try {
        localStorage.setItem(POPULAR_SEARCHES_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save popular searches:', err);
      }
      
      return updated;
    });
  }, [enableHistory]);

  // Clear search history
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (err) {
      console.error('Failed to clear search history:', err);
    }
  }, []);

  // Remove specific item from history
  const removeFromHistory = useCallback((queryToRemove) => {
    setSearchHistory(prev => {
      const updated = prev.filter(item => item.query !== queryToRemove);
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to update search history:', err);
      }
      return updated;
    });
  }, []);

  // Perform local fuzzy search
  const performLocalSearch = useCallback((searchQuery) => {
    if (!fuse || searchQuery.length < minChars) {
      return [];
    }
    
    const fuseResults = fuse.search(searchQuery);
    return fuseResults.map(result => ({
      ...result.item,
      _score: result.score,
      _matches: result.matches
    }));
  }, [fuse, minChars]);

  // Perform API search
  const performApiSearch = useCallback(async (searchQuery) => {
    if (!onSearch) return [];
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      const results = await onSearch(searchQuery, {
        signal: abortControllerRef.current.signal
      });
      return results;
    } catch (err) {
      if (err.name === 'AbortError') {
        return null; // Request was cancelled
      }
      throw err;
    }
  }, [onSearch]);

  // Main search function with debouncing
  const search = useCallback((searchQuery) => {
    setQuery(searchQuery);
    setError(null);
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // If query is too short, clear results
    if (searchQuery.length < minChars) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    
    debounceRef.current = setTimeout(async () => {
      try {
        let searchResults;
        
        if (onSearch) {
          // API search
          searchResults = await performApiSearch(searchQuery);
          if (searchResults === null) return; // Request was cancelled
        } else if (fuse) {
          // Local fuzzy search
          searchResults = performLocalSearch(searchQuery);
        } else {
          searchResults = [];
        }
        
        setResults(searchResults);
      } catch (err) {
        console.error('Search error:', err);
        setError(err.message || 'Search failed');
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, debounceMs);
  }, [minChars, onSearch, fuse, debounceMs, performApiSearch, performLocalSearch]);

  // Handle search submission
  const handleSubmit = useCallback((submittedQuery = query) => {
    if (submittedQuery.trim()) {
      saveToHistory(submittedQuery.trim());
    }
    setShowSuggestions(false);
  }, [query, saveToHistory]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setShowSuggestions(false);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Get suggestions (history + popular when query is empty)
  const suggestions = useMemo(() => {
    if (query.length > 0) {
      // Filter history/popular that match current query
      const matchingHistory = searchHistory
        .filter(item => 
          item.query.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 3);
      
      const matchingPopular = popularSearches
        .filter(item => 
          item.query.toLowerCase().includes(query.toLowerCase()) &&
          !matchingHistory.some(h => h.query === item.query)
        )
        .slice(0, 2);
      
      return {
        history: matchingHistory,
        popular: matchingPopular
      };
    }
    
    return {
      history: searchHistory.slice(0, 5),
      popular: popularSearches.slice(0, 5)
    };
  }, [query, searchHistory, popularSearches]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    query,
    results,
    isSearching,
    error,
    showSuggestions,
    suggestions,
    searchHistory,
    popularSearches,
    
    // Actions
    search,
    setQuery,
    handleSubmit,
    clearSearch,
    clearHistory,
    removeFromHistory,
    setShowSuggestions,
    
    // Utilities
    hasResults: results.length > 0,
    isEmpty: query.length === 0,
    isMinLength: query.length >= minChars
  };
};

export default useSearch;
