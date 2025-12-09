/**
 * Cart Context
 * Manages shopping cart state across the application
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import apiService from '../services/api.service';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  // Load cart from localStorage for guests, or fetch from API for authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      loadLocalCart();
    }
  }, [isAuthenticated]);

  // Update cart count whenever cart changes
  useEffect(() => {
    if (cart && cart.items) {
      const count = cart.items.reduce((total, item) => total + item.quantity, 0);
      setCartCount(count);
    } else {
      setCartCount(0);
    }
  }, [cart]);

  const fetchCart = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await apiService.get(API_ENDPOINTS.CART.GET);
      if (response.success) {
        setCart(response.data);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLocalCart = () => {
    const localCart = localStorage.getItem('guestCart');
    if (localCart) {
      setCart(JSON.parse(localCart));
    } else {
      setCart({ items: [], subtotal: 0 });
    }
  };

  const saveLocalCart = (cartData) => {
    localStorage.setItem('guestCart', JSON.stringify(cartData));
  };

  const addToCart = async (product, quantity = 1, specialInstructions = '') => {
    try {
      setLoading(true);

      if (isAuthenticated) {
        // Add to server cart
        const response = await apiService.post(API_ENDPOINTS.CART.ADD_ITEM, {
          product_id: product.id,
          quantity,
          special_instructions: specialInstructions,
        });

        if (response.success) {
          setCart(response.data);
          return { success: true, message: 'Product added to cart' };
        }
      } else {
        // Add to local cart
        const localCart = { ...cart };
        const existingItem = localCart.items?.find((item) => item.product_id === product.id);

        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          if (!localCart.items) localCart.items = [];
          localCart.items.push({
            id: Date.now(),
            product_id: product.id,
            product,
            quantity,
            unit_price: product.price,
            special_instructions: specialInstructions,
          });
        }

        // Recalculate subtotal
        localCart.subtotal = localCart.items.reduce(
          (total, item) => total + item.unit_price * item.quantity,
          0
        );

        setCart(localCart);
        saveLocalCart(localCart);
        return { success: true, message: 'Product added to cart' };
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add product to cart',
      };
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    try {
      setLoading(true);

      if (isAuthenticated) {
        const response = await apiService.put(API_ENDPOINTS.CART.UPDATE_ITEM(itemId), {
          quantity,
        });

        if (response.success) {
          setCart(response.data);
          return { success: true };
        }
      } else {
        const localCart = { ...cart };
        const item = localCart.items.find((item) => item.id === itemId);

        if (item) {
          item.quantity = quantity;

          // Recalculate subtotal
          localCart.subtotal = localCart.items.reduce(
            (total, item) => total + item.unit_price * item.quantity,
            0
          );

          setCart(localCart);
          saveLocalCart(localCart);
          return { success: true };
        }
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      setLoading(true);

      if (isAuthenticated) {
        const response = await apiService.delete(API_ENDPOINTS.CART.REMOVE_ITEM(itemId));

        if (response.success) {
          setCart(response.data);
          return { success: true };
        }
      } else {
        const localCart = { ...cart };
        localCart.items = localCart.items.filter((item) => item.id !== itemId);

        // Recalculate subtotal
        localCart.subtotal = localCart.items.reduce(
          (total, item) => total + item.unit_price * item.quantity,
          0
        );

        setCart(localCart);
        saveLocalCart(localCart);
        return { success: true };
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);

      if (isAuthenticated) {
        await apiService.post(API_ENDPOINTS.CART.CLEAR);
      }

      setCart({ items: [], subtotal: 0 });
      localStorage.removeItem('guestCart');
      return { success: true };
    } catch (error) {
      console.error('Error clearing cart:', error);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    cart,
    cartCount,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
