/**
 * API Service for making HTTP requests
 * Handles authentication, error handling, and request/response formatting
 */

import axios from 'axios';
import API_BASE_URL from '../config/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response) {
      // Handle specific error codes
      switch (error.response.status) {
        case 401:
          // Unauthorized - Try to refresh token first (except for auth endpoints)
          if (!originalRequest.url.includes('/auth/') && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
              const refreshResponse = await apiClient.post('/auth/refresh-token');
              if (refreshResponse.data.success) {
                const { token, expires_in } = refreshResponse.data.data;

                // Calculate new token expiry
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 7);

                localStorage.setItem('authToken', token);
                localStorage.setItem('tokenExpiry', expiryDate.toISOString());

                // Retry the original request with new token
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return apiClient(originalRequest);
              }
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
            }
          }

          // If refresh failed or it's an auth endpoint, clear token and redirect
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('tokenExpiry');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;
        case 403:
          // Forbidden
          console.error('Access forbidden');
          break;
        case 404:
          // Not found
          console.error('Resource not found');
          break;
        case 422:
          // Validation error
          console.error('Validation error:', error.response.data);
          break;
        case 500:
          // Server error
          console.error('Server error occurred');
          break;
        default:
          console.error('An error occurred:', error.response.data);
      }
    } else if (error.request) {
      // Request made but no response
      console.error('No response from server');
    } else {
      // Error in request setup
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// API Service methods
const apiService = {
  // Check if user is online
  isOnline: () => {
    return navigator.onLine;
  },

  // GET request
  get: async (url, params = {}, bustCache = false) => {
    if (!apiService.isOnline()) {
      throw new Error('No internet connection');
    }
    try {
      const config = { params };
      if (bustCache) {
        config.headers = {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        };
        // Add timestamp to URL to bypass browser cache
        config.params = { ...params, _t: Date.now() };
      }
      const response = await apiClient.get(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // POST request
  post: async (url, data = {}, config = {}) => {
    try {
      const response = await apiClient.post(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // PUT request
  put: async (url, data = {}) => {
    try {
      const response = await apiClient.put(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // PATCH request
  patch: async (url, data = {}) => {
    try {
      const response = await apiClient.patch(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // DELETE request
  delete: async (url) => {
    try {
      const response = await apiClient.delete(url, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Upload file
  upload: async (url, formData, onUploadProgress = null) => {
    try {
      const response = await apiClient.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default apiService;
