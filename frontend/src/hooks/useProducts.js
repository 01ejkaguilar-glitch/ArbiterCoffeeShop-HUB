import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/api.service';
import { API_ENDPOINTS } from '../config/api';

// Query keys
export const productKeys = {
  all: ['products'],
  lists: () => [...productKeys.all, 'list'],
  list: (filters) => [...productKeys.lists(), filters],
  details: () => [...productKeys.all, 'detail'],
  detail: (id) => [...productKeys.details(), id],
};

// Fetch all products
export const useProducts = (filters = {}) => {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: async () => {
      const response = await apiService.get(API_ENDPOINTS.PRODUCTS.LIST);
      
      if (response && response.success) {
        // Handle paginated response - extract the data array
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          return response.data.data;
        }
      }
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Fetch single product
export const useProduct = (id) => {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const response = await apiService.get(API_ENDPOINTS.PRODUCTS.DETAIL(id));
      
      if (response && response.success) {
        return response.data;
      }
      throw new Error('Product not found');
    },
    enabled: !!id, // Only run if id exists
    staleTime: 5 * 60 * 1000,
    // Don't retry 404s — the product doesn't exist; retrying wastes requests
    retry: (failureCount, error) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 3;
    },
  });
};

// Create product mutation
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (productData) => {
      const response = await apiService.post(API_ENDPOINTS.PRODUCTS.CREATE, productData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch products list
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
};

// Update product mutation
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiService.put(API_ENDPOINTS.PRODUCTS.UPDATE(id), data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate specific product and lists
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
};

// Delete product mutation
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await apiService.delete(API_ENDPOINTS.PRODUCTS.DELETE(id));
      return response.data;
    },
    onSuccess: () => {
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
};
