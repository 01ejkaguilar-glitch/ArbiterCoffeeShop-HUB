/**
 * Authentication Context
 * Manages user authentication state across the application
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import apiService from '../services/api.service';
import { API_ENDPOINTS } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();

    // Listen for online/offline events
    const handleOnline = () => {
      console.log('User came back online, re-checking authentication...');
      checkAuth();
    };

    const handleOffline = () => {
      console.log('User went offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');
      const tokenExpiry = localStorage.getItem('tokenExpiry');

      if (!token) {
        setLoading(false);
        return;
      }

      // Check if user is online
      if (!apiService.isOnline()) {
        console.log('Offline: Using cached user data');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setIsAuthenticated(true);
          } catch (parseError) {
            console.error('Failed to parse cached user data');
          }
        }
        setLoading(false);
        return;
      }

      // Check if token is expired locally first
      if (tokenExpiry && new Date(tokenExpiry) < new Date()) {
        console.log('Token expired locally, attempting refresh...');
        const refreshSuccess = await refreshToken();
        if (!refreshSuccess) {
          logout();
          return;
        }
      }

      // Try to get fresh user data
      const response = await apiService.get(API_ENDPOINTS.AUTH.USER);
      if (response.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        // Update stored user data
        localStorage.setItem('user', JSON.stringify(response.data.user));
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      console.error('Auth check failed:', error);

      // Handle different error types
      if (error.message === 'No internet connection') {
        // Offline - use cached data
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setIsAuthenticated(true);
            console.log('Using cached user data (offline mode)');
          } catch (parseError) {
            logout();
          }
        } else {
          logout();
        }
      } else if (error.response?.status === 401) {
        // Authentication error
        logout();
      } else {
        // Other errors - try to use cached data
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setIsAuthenticated(true);
            console.log('Using cached user data due to server error');
          } catch (parseError) {
            logout();
          }
        } else {
          logout();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await apiService.post(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });

      if (response.success) {
        const { token, user, expires_in } = response.data;

        // Calculate token expiry (expires_in is "7 days")
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7); // Add 7 days

        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('tokenExpiry', expiryDate.toISOString());

        setUser(user);
        setIsAuthenticated(true);
        return { success: true, user };
      }

      return { success: false, message: response.message };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiService.post(API_ENDPOINTS.AUTH.REGISTER, userData);
      
      if (response.success) {
        const { token, user, expires_in } = response.data;

        // Calculate token expiry (expires_in is "7 days")
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7); // Add 7 days

        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('tokenExpiry', expiryDate.toISOString());

        setUser(user);
        setIsAuthenticated(true);
        return { success: true, user };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
        errors: error.response?.data?.errors || {},
      };
    }
  };

  const logout = async () => {
    try {
      await apiService.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('tokenExpiry');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const refreshToken = async () => {
    try {
      const response = await apiService.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN);
      if (response.success) {
        const { token, expires_in } = response.data;

        // Calculate new token expiry
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7); // Add 7 days

        localStorage.setItem('authToken', token);
        localStorage.setItem('tokenExpiry', expiryDate.toISOString());

        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  // Periodic token refresh (every 6 hours when user is active)
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      const tokenExpiry = localStorage.getItem('tokenExpiry');
      if (tokenExpiry) {
        const expiryDate = new Date(tokenExpiry);
        const now = new Date();
        const timeUntilExpiry = expiryDate - now;

        // Refresh if token expires within 2 hours
        if (timeUntilExpiry < 2 * 60 * 60 * 1000) {
          console.log('Auto-refreshing token...');
          await refreshToken();
        }
      }
    }, 6 * 60 * 60 * 1000); // Check every 6 hours

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated]);

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    checkAuth,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
