/**
 * API Configuration for Arbiter Coffee Shop
 * Backend API endpoints configuration
 */

const isLocalRuntime = typeof window !== 'undefined'
  && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const isProductionFrontendHost = typeof window !== 'undefined'
  && window.location.hostname === 'arbitercoffee.shop';

const apiBaseFromEnv = process.env.REACT_APP_API_URL;
const backendBaseFromEnv = process.env.REACT_APP_BACKEND_URL;

const sameOriginApiBase = typeof window !== 'undefined'
  ? `${window.location.origin}/api/v1`
  : '/api/v1';

const API_BASE_URL = isProductionFrontendHost
  ? sameOriginApiBase
  : (apiBaseFromEnv || (isLocalRuntime ? 'http://localhost:8000/api/v1' : sameOriginApiBase));

const BACKEND_BASE_URL = isProductionFrontendHost
  ? window.location.origin
  : (backendBaseFromEnv || (isLocalRuntime ? 'http://localhost:8000' : window.location.origin));

export default API_BASE_URL;
export { BACKEND_BASE_URL };

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    USER: `${API_BASE_URL}/auth/user`,
    REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh-token`,
    FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
  },

  // Products
  PRODUCTS: {
    LIST: `${API_BASE_URL}/products`,
    DETAIL: (id) => `${API_BASE_URL}/products/${id}`,
    RECIPE: (id) => `${API_BASE_URL}/products/${id}/recipe`,
    CREATE: `${API_BASE_URL}/products`,
    UPDATE: (id) => `${API_BASE_URL}/products/${id}`,
    DELETE: (id) => `${API_BASE_URL}/products/${id}`,
  },

  // Categories
  CATEGORIES: {
    LIST: `${API_BASE_URL}/categories`,
    DETAIL: (id) => `${API_BASE_URL}/categories/${id}`,
    CREATE: `${API_BASE_URL}/categories`,
    UPDATE: (id) => `${API_BASE_URL}/categories/${id}`,
    DELETE: (id) => `${API_BASE_URL}/categories/${id}`,
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
    CANCEL_REQUEST: (id) => `${API_BASE_URL}/orders/${id}/cancel-request`,
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
    PROFILE_PICTURE: `${API_BASE_URL}/customer/profile/picture`,
    CHANGE_PASSWORD: `${API_BASE_URL}/customer/change-password`,
    ANALYTICS: `${API_BASE_URL}/customer/analytics`,
    NOTIFICATIONS: `${API_BASE_URL}/customer/notifications`,
    TASTE_PREFERENCES: `${API_BASE_URL}/customer/taste-preferences`,
    FAVORITES: `${API_BASE_URL}/customer/favorites`,
    FAVORITE_DETAIL: (id) => `${API_BASE_URL}/customer/favorites/${id}`,
    TOGGLE_FAVORITE: `${API_BASE_URL}/customer/favorites/toggle`,
    ADDRESSES: `${API_BASE_URL}/customer/addresses`,
    ADDRESS_DETAIL: (id) => `${API_BASE_URL}/customer/addresses/${id}`,
    DEACTIVATE_ACCOUNT: `${API_BASE_URL}/customer/account`,
  },

  // Recommendations
  RECOMMENDATIONS: {
    PRODUCTS: `${API_BASE_URL}/recommendations/products`,
    COFFEE_BEANS: `${API_BASE_URL}/recommendations/coffee-beans`,
    HOMEPAGE: `${API_BASE_URL}/recommendations/homepage`,
    AFFINITY_SCORE: `${API_BASE_URL}/recommendations/affinity-score`,
    CLEAR_CACHE: `${API_BASE_URL}/recommendations/clear-cache`,
  },

  // Customer Insights
  CUSTOMER_INSIGHTS: {
    INSIGHTS: `${API_BASE_URL}/customer-insights`,
    PURCHASE_BEHAVIOR: `${API_BASE_URL}/customer-insights/purchase-behavior`,
    PRODUCT_AFFINITY: `${API_BASE_URL}/customer-insights/product-affinity`,
    ENGAGEMENT_SCORE: `${API_BASE_URL}/customer-insights/engagement-score`,
    LIFECYCLE_STAGE: `${API_BASE_URL}/customer-insights/lifecycle-stage`,
    PREDICTIONS: `${API_BASE_URL}/customer-insights/predictions`,
    RECOMMENDATIONS: `${API_BASE_URL}/customer-insights/recommendations`,
    SATISFACTION: `${API_BASE_URL}/customer-insights/satisfaction`,
    CLEAR_CACHE: `${API_BASE_URL}/customer-insights/clear-cache`,
  },

  // Payments
  PAYMENTS: {
    GCASH: `${API_BASE_URL}/payments/gcash`,
    CASH: `${API_BASE_URL}/payments/cash`,
    STATUS: (id) => `${API_BASE_URL}/payments/${id}/status`,
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: `${API_BASE_URL}/notifications`,
    MARK_READ: (id) => `${API_BASE_URL}/notifications/${id}/read`,
    MARK_ALL_READ: `${API_BASE_URL}/notifications/mark-all-read`,
    DELETE: (id) => `${API_BASE_URL}/notifications/${id}`,
    CLEAR_ALL: `${API_BASE_URL}/notifications`,
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
    USER_REACTIVATE: (id) => `${API_BASE_URL}/admin/users/${id}/reactivate`,
    USER_STATISTICS: `${API_BASE_URL}/admin/users/statistics`,
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
      CUSTOMER_SEGMENTS: `${API_BASE_URL}/admin/analytics/customer-segments`,
      BARISTA_PERFORMANCE: `${API_BASE_URL}/admin/analytics/barista-performance`,
    },
    PRODUCTS: {
      LIST: `${API_BASE_URL}/admin/products`,
    },
    INVENTORY: {
      LIST: `${API_BASE_URL}/admin/inventory`,
      LOW_STOCK: `${API_BASE_URL}/admin/inventory/low-stock`,
      CREATE: `${API_BASE_URL}/admin/inventory`,
      UPDATE: (id) => `${API_BASE_URL}/admin/inventory/${id}`,
      DELETE: (id) => `${API_BASE_URL}/admin/inventory/${id}`,
      ADJUST: (id) => `${API_BASE_URL}/admin/inventory/${id}/adjust`,
      LOGS: `${API_BASE_URL}/admin/inventory/logs`,
    },
    REPORTS: {
      ATTENDANCE: `${API_BASE_URL}/admin/reports/attendance`,
      LEAVE_OT: `${API_BASE_URL}/admin/reports/leave-ot`,
      TASK_COMPLETION: `${API_BASE_URL}/admin/reports/task-completion`,
      BEAN_USAGE: `${API_BASE_URL}/admin/reports/bean-usage`,
      EXPORT: `${API_BASE_URL}/admin/reports/export`,
    },
    COFFEE_BEANS: {
      LIST: `${API_BASE_URL}/coffee-beans`,
      CREATE: `${API_BASE_URL}/admin/coffee-beans`,
      UPDATE: (id) => `${API_BASE_URL}/admin/coffee-beans/${id}`,
      DELETE: (id) => `${API_BASE_URL}/admin/coffee-beans/${id}`,
    },
    SETTINGS: {
      TIMELINE: `${API_BASE_URL}/admin/company-timeline`,
      TEAM: `${API_BASE_URL}/admin/team-members`,
    },
  },

  // Workforce
  WORKFORCE: {
    // Employee Management
    EMPLOYEES: `${API_BASE_URL}/workforce/employees`,
    EMPLOYEE_DETAIL: (id) => `${API_BASE_URL}/workforce/employees/${id}`,
    EMPLOYEE_STATS: `${API_BASE_URL}/workforce/employees/statistics`,

    // Attendance Management
    ATTENDANCE: `${API_BASE_URL}/workforce/attendance`,
    ATTENDANCE_MARK: `${API_BASE_URL}/workforce/attendance/mark`,
    ATTENDANCE_SUMMARY: `${API_BASE_URL}/workforce/attendance/summary`,
    CLOCK_IN: `${API_BASE_URL}/employee/attendance/clock-in`,
    CLOCK_OUT: `${API_BASE_URL}/employee/attendance/clock-out`,
    MY_ATTENDANCE: `${API_BASE_URL}/employee/attendance`,

    // Shift Scheduling
    SHIFTS: `${API_BASE_URL}/workforce/shifts`,
    SHIFT_DETAIL: (id) => `${API_BASE_URL}/workforce/shifts/${id}`,
    WEEKLY_SCHEDULE: `${API_BASE_URL}/workforce/shifts/weekly-schedule`,
    EMPLOYEE_SHIFTS: (id) => `${API_BASE_URL}/workforce/shifts/employee/${id}`,
    MY_SHIFTS: `${API_BASE_URL}/employee/shifts`,

    // Task Management
    TASKS: `${API_BASE_URL}/workforce/tasks`,
    TASK_DETAIL: (id) => `${API_BASE_URL}/workforce/tasks/${id}`,
    MY_TASKS: `${API_BASE_URL}/employee/tasks`,
    MY_TASK_UPDATE: (id) => `${API_BASE_URL}/employee/tasks/${id}`,

    // Leave Requests
    LEAVE_REQUESTS: `${API_BASE_URL}/workforce/leave-requests`,
    LEAVE_REQUEST_DETAIL: (id) => `${API_BASE_URL}/workforce/leave-requests/${id}`,

    // Performance Reviews
    PERFORMANCE_REVIEWS: `${API_BASE_URL}/workforce/performance/reviews`,
    PERFORMANCE_REVIEW_DETAIL: (id) => `${API_BASE_URL}/workforce/performance/reviews/${id}`,

    // Inventory (Barista checklist)
    INVENTORY: `${API_BASE_URL}/barista/inventory`,
    INVENTORY_ITEM: (id) => `${API_BASE_URL}/barista/inventory/${id}`,
    INVENTORY_ADJUST: (id) => `${API_BASE_URL}/barista/inventory/${id}/adjust`,
    INVENTORY_LOW_STOCK: `${API_BASE_URL}/barista/inventory/low-stock/alert`,
  },

  // Barista
  BARISTA: {
    DASHBOARD: `${API_BASE_URL}/barista/dashboard`,
    ORDER_QUEUE: `${API_BASE_URL}/barista/orders/queue`,
    UPDATE_ORDER: (id) => `${API_BASE_URL}/barista/orders/${id}/status`,
    COMPLETED_ORDERS: `${API_BASE_URL}/barista/orders/completed`,
    PERFORMANCE: `${API_BASE_URL}/barista/performance`,
    SHIFT_CURRENT: `${API_BASE_URL}/barista/shift/current`,
    TASKS_TODAY: `${API_BASE_URL}/barista/tasks/today`,
    COFFEE_BEANS: {
      LIST: `${API_BASE_URL}/barista/beans`,
      CREATE: `${API_BASE_URL}/barista/beans`,
      UPDATE_STOCK: (id) => `${API_BASE_URL}/barista/beans/${id}/stock`,
      ARCHIVE: (id) => `${API_BASE_URL}/barista/beans/${id}`,
    },
    FEATURED_ORIGINS: {
      LIST: `${API_BASE_URL}/barista/featured-origins`,
      CREATE: `${API_BASE_URL}/barista/featured-origins`,
      UPDATE: (id) => `${API_BASE_URL}/barista/featured-origins/${id}`,
      DELETE: (id) => `${API_BASE_URL}/barista/featured-origins/${id}`,
      AVAILABLE_BEANS: `${API_BASE_URL}/barista/featured-origins/available-beans`,
      TODAY: `${API_BASE_URL}/barista/featured-origins/today`,
      BY_DATE: `${API_BASE_URL}/barista/featured-origins/by-date`,
    },
    POS: {
      PRODUCTS: `${API_BASE_URL}/barista/pos/products`,
      CREATE_ORDER: `${API_BASE_URL}/barista/pos/orders`,
      HOLD_ORDER: `${API_BASE_URL}/barista/pos/orders/hold`,
      HELD_ORDERS: `${API_BASE_URL}/barista/pos/orders/held`,
      RESUME_HELD: (id) => `${API_BASE_URL}/barista/pos/orders/held/${id}/resume`,
      VOID_ORDER: (id) => `${API_BASE_URL}/barista/pos/orders/${id}/void`,
      DAILY_SUMMARY: `${API_BASE_URL}/barista/pos/summary`,
      RECENT_TRANSACTIONS: `${API_BASE_URL}/barista/pos/transactions`,
    },
  },

  // Kitchen Staff
  KITCHEN: {
    DASHBOARD: `${API_BASE_URL}/kitchen/dashboard`,
    ORDER_QUEUE: `${API_BASE_URL}/kitchen/orders/queue`,
    UPDATE_ORDER: (id) => `${API_BASE_URL}/kitchen/orders/${id}/status`,
    COMPLETED_ORDERS: `${API_BASE_URL}/kitchen/orders/completed`,
    PERFORMANCE: `${API_BASE_URL}/kitchen/performance`,
    SHIFT_CURRENT: `${API_BASE_URL}/kitchen/shift/current`,
    TASKS_TODAY: `${API_BASE_URL}/kitchen/tasks/today`,
    INVENTORY: `${API_BASE_URL}/kitchen/inventory`,
    INVENTORY_ITEM: (id) => `${API_BASE_URL}/kitchen/inventory/${id}`,
    INVENTORY_ADJUST: (id) => `${API_BASE_URL}/kitchen/inventory/${id}/adjust`,
    INVENTORY_LOW_STOCK: `${API_BASE_URL}/kitchen/inventory/low-stock/alert`,
  },
};
