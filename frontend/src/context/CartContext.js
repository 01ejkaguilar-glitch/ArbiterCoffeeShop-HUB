/**
 * Cart Context
 * Manages shopping cart state across the application
 */

import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
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
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  // Load cart from localStorage for guests, or fetch from API for authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      mergeGuestCartThenFetch();
    } else {
      loadLocalCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  /**
   * On login, merge any guest cart items into the server cart, then fetch.
   */
  const mergeGuestCartThenFetch = async () => {
    try {
      const localCartRaw = localStorage.getItem('guestCart');
      if (localCartRaw) {
        const guestCart = JSON.parse(localCartRaw);
        if (guestCart.items && guestCart.items.length > 0) {
          // Add each guest item to the server cart
          for (const item of guestCart.items) {
            try {
              await apiService.post(API_ENDPOINTS.CART.ADD_ITEM, {
                product_id: item.product_id,
                quantity: item.quantity,
                special_instructions: item.special_instructions || '',
              });
            } catch (err) {
              // Item may no longer be available — skip silently
              console.warn('Could not merge guest cart item:', item.product_id, err);
            }
          }
        }
        localStorage.removeItem('guestCart');
      }
    } catch (err) {
      console.error('Error merging guest cart:', err);
      localStorage.removeItem('guestCart');
    }
    await fetchCart();
  };

  // Memoize cartCount from cart to avoid separate state
  const cartCount = useMemo(() => {
    if (cart && cart.items) {
      return cart.items.reduce((total, item) => total + item.quantity, 0);
    }
    return 0;
  }, [cart]);

  const fetchCart = useCallback(async () => {
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
  }, [isAuthenticated]);

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

  const addToCart = useCallback(async (product, quantity = 1, specialInstructions = '') => {
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
        // Add to local cart (deep copy to avoid state mutation)
        const localCart = { ...cart, items: cart.items ? cart.items.map(i => ({ ...i })) : [] };
        const existingItem = localCart.items.find((item) => item.product_id === product.id);

        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
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
  }, [isAuthenticated, cart]);

  const updateCartItem = useCallback(async (itemId, quantity) => {
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
        // Deep copy to avoid state mutation
        const localCart = { ...cart, items: cart.items ? cart.items.map(i => ({ ...i })) : [] };
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
  }, [isAuthenticated, cart]);

  const removeFromCart = useCallback(async (itemId) => {
    try {
      setLoading(true);

      if (isAuthenticated) {
        const response = await apiService.delete(API_ENDPOINTS.CART.REMOVE_ITEM(itemId));

        if (response.success) {
          setCart(response.data);
          return { success: true };
        }
      } else {
        const localCart = {
          ...cart,
          items: cart.items ? cart.items.filter((item) => item.id !== itemId) : [],
        };

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
  }, [isAuthenticated, cart]);

  const clearCart = useCallback(async () => {
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
  }, [isAuthenticated]);

  const value = useMemo(() => ({
    cart,
    cartCount,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    fetchCart,
  }), [cart, cartCount, loading, addToCart, updateCartItem, removeFromCart, clearCart, fetchCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
