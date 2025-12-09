/**
 * API Configuration for Arbiter Coffee Shop
 * Backend API endpoints configuration
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

export default API_BASE_URL;

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    USER: `${API_BASE_URL}/auth/user`,
    FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
  },

  // Products
  PRODUCTS: {
    LIST: `${API_BASE_URL}/products`,
    DETAIL: (id) => `${API_BASE_URL}/products/${id}`,
    CREATE: `${API_BASE_URL}/products`,
    UPDATE: (id) => `${API_BASE_URL}/products/${id}`,
    DELETE: (id) => `${API_BASE_URL}/products/${id}`,
  },

  // Categories
  CATEGORIES: {
    LIST: `${API_BASE_URL}/categories`,
    DETAIL: (id) => `${API_BASE_URL}/categories/${id}`,
  },

  // Coffee Beans
  COFFEE_BEANS: {
    LIST: `${API_BASE_URL}/coffee-beans`,
    FEATURED: `${API_BASE_URL}/coffee-beans/featured`,
    DETAIL: (id) => `${API_BASE_URL}/coffee-beans/${id}`,
  },

  // Orders
  ORDERS: {
    LIST: `${API_BASE_URL}/orders`,
    CREATE: `${API_BASE_URL}/orders`,
    DETAIL: (id) => `${API_BASE_URL}/orders/${id}`,
    REORDER: (id) => `${API_BASE_URL}/orders/${id}/reorder`,
    CONFIRM: (id) => `${API_BASE_URL}/orders/${id}/confirm`,
  },

  // Cart
  CART: {
    GET: `${API_BASE_URL}/cart`,
    ADD_ITEM: `${API_BASE_URL}/cart/items`,
    UPDATE_ITEM: (id) => `${API_BASE_URL}/cart/items/${id}`,
    REMOVE_ITEM: (id) => `${API_BASE_URL}/cart/items/${id}`,
    CLEAR: `${API_BASE_URL}/cart/clear`,
  },

  // Customer
  CUSTOMER: {
    DASHBOARD: `${API_BASE_URL}/customer/dashboard`,
    PROFILE: `${API_BASE_URL}/customer/profile`,
    ADDRESSES: `${API_BASE_URL}/customer/addresses`,
    ADDRESS_DETAIL: (id) => `${API_BASE_URL}/customer/addresses/${id}`,
  },

  // Payments
  PAYMENTS: {
    GCASH: `${API_BASE_URL}/payments/gcash`,
    CASH: `${API_BASE_URL}/payments/cash`,
    STATUS: (id) => `${API_BASE_URL}/payments/${id}/status`,
  },

  // Announcements
  ANNOUNCEMENTS: {
    LIST: `${API_BASE_URL}/announcements`,
    DETAIL: (id) => `${API_BASE_URL}/announcements/${id}`,
  },

  // Contact
  CONTACT: {
    SUBMIT: `${API_BASE_URL}/contact`,
  },

  // Public
  PUBLIC: {
    OPERATING_HOURS: `${API_BASE_URL}/settings/operating-hours`,
    CONTACT_INFO: `${API_BASE_URL}/settings/contact-info`,
    TEAM_MEMBERS: `${API_BASE_URL}/team-members`,
    TIMELINE: `${API_BASE_URL}/company-timeline`,
    BARISTA_TRAINING: `${API_BASE_URL}/inquiries/barista-training`,
    ARBITER_EXPRESS: `${API_BASE_URL}/inquiries/arbiter-express`,
  },

  // Admin
  ADMIN: {
    USERS: `${API_BASE_URL}/admin/users`,
    USER_DETAIL: (id) => `${API_BASE_URL}/admin/users/${id}`,
    ORDERS: `${API_BASE_URL}/admin/orders`,
    ORDER_DETAIL: (id) => `${API_BASE_URL}/admin/orders/${id}`,
    ORDER_STATUS: (id) => `${API_BASE_URL}/admin/orders/${id}/status`,
    DASHBOARD_STATS: `${API_BASE_URL}/admin/dashboard/stats`,
    ANALYTICS: {
      DASHBOARD: `${API_BASE_URL}/admin/analytics/dashboard`,
      SALES: `${API_BASE_URL}/admin/analytics/sales`,
      CUSTOMERS: `${API_BASE_URL}/admin/analytics/customers`,
      PERFORMANCE: `${API_BASE_URL}/admin/analytics/performance`,
      INVENTORY: `${API_BASE_URL}/admin/analytics/inventory`,
    },
  },

  // Workforce
  WORKFORCE: {
    INVENTORY: `${API_BASE_URL}/workforce/inventory`,
    EMPLOYEES: `${API_BASE_URL}/workforce/employees`,
    ATTENDANCE: `${API_BASE_URL}/workforce/attendance`,
    SHIFTS: `${API_BASE_URL}/workforce/shifts`,
    TASKS: `${API_BASE_URL}/workforce/tasks`,
  },

  // Barista
  BARISTA: {
    DASHBOARD: `${API_BASE_URL}/barista/dashboard`,
    ORDER_QUEUE: `${API_BASE_URL}/barista/orders/queue`,
    UPDATE_ORDER: (id) => `${API_BASE_URL}/barista/orders/${id}/status`,
  },
};
