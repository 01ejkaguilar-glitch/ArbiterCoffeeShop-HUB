import {
  FaBoxes, FaShoppingBag, FaUsers, FaChartLine, FaUserCheck,
  FaTasks, FaCalendarAlt, FaUtensils, FaCoffee, FaCheckCircle, FaCog,
  FaCashRegister,
} from 'react-icons/fa';

// Admin navigation - Business Management
export const ADMIN_BUSINESS_ITEMS = [
  { path: '/admin/products', label: 'Products', icon: FaBoxes, iconColor: 'text-primary', description: 'Manage product catalog' },
  { path: '/admin/orders', label: 'Orders', icon: FaShoppingBag, iconColor: 'text-success', description: 'View and manage orders' },
  { path: '/admin/users', label: 'Users', icon: FaUsers, iconColor: 'text-info', description: 'Manage user accounts' },
  { path: '/admin/analytics', label: 'Analytics', icon: FaChartLine, iconColor: 'text-warning', description: 'View business analytics' },
  { path: '/admin/inventory', label: 'Inventory', icon: FaBoxes, iconColor: 'text-secondary', description: 'Manage stock levels' },
  { path: '/admin/coffee-beans', label: 'Coffee Beans', icon: FaCoffee, iconColor: 'text-warning', description: 'Manage coffee inventory' },
  { path: '/admin/reports', label: 'Reports', icon: FaChartLine, iconColor: 'text-success', description: 'View comprehensive reports' },
  { path: '/admin/settings', label: 'Settings', icon: FaCog, iconColor: 'text-secondary', description: 'Site content & configuration' },
];

// Admin navigation - Workforce Management
export const ADMIN_WORKFORCE_ITEMS = [
  { path: '/admin/employees', label: 'Employees', icon: FaUsers, iconColor: 'text-primary', description: 'Manage workforce' },
  { path: '/admin/attendance', label: 'Attendance', icon: FaUserCheck, iconColor: 'text-success', description: 'Track employee attendance' },
  { path: '/admin/tasks', label: 'Tasks', icon: FaTasks, iconColor: 'text-info', description: 'Manage daily tasks' },
  { path: '/admin/shifts', label: 'Shifts', icon: FaCalendarAlt, iconColor: 'text-warning', description: 'Schedule work shifts' },
  { path: '/admin/leave-requests', label: 'Leave Requests', icon: FaCalendarAlt, iconColor: 'text-danger', description: 'Review leave requests' },
  { path: '/admin/performance', label: 'Performance', icon: FaChartLine, iconColor: 'text-info', description: 'Employee performance reviews' },
];

// All admin items combined (for sidebar)
export const ADMIN_NAV_ITEMS = [...ADMIN_BUSINESS_ITEMS, ...ADMIN_WORKFORCE_ITEMS];

// Barista navigation - Operations
export const BARISTA_OPERATIONS_ITEMS = [
  { path: '/barista/pos', label: 'POS Terminal', icon: FaCashRegister, iconColor: 'text-success', description: 'Point of Sale' },
  { path: '/barista/orders', label: 'Order Queue', icon: FaUtensils, iconColor: 'text-primary', description: 'View order queue' },
  { path: '/barista/beans', label: 'Coffee Beans', icon: FaCoffee, iconColor: 'text-warning', description: 'Manage coffee beans' },
  { path: '/barista/completed', label: 'Completed Orders', icon: FaCheckCircle, iconColor: 'text-success', description: 'View completed orders' },
  { path: '/barista/featured-origins', label: 'Featured Origins', icon: FaCoffee, iconColor: 'text-info', description: "Today's featured origins" },
  { path: '/barista/inventory', label: 'Inventory', icon: FaBoxes, iconColor: 'text-secondary', description: 'Inventory checklist' },
  { path: '/barista/training', label: 'Training', icon: FaChartLine, iconColor: 'text-warning', description: 'Training insights' },
];

// Barista navigation - Workforce
export const BARISTA_WORKFORCE_ITEMS = [
  { path: '/barista/tasks', label: 'My Tasks', icon: FaTasks, iconColor: 'text-info', description: 'View assigned tasks' },
  { path: '/barista/shifts', label: 'My Shifts', icon: FaCalendarAlt, iconColor: 'text-success', description: 'View shift schedule' },
  { path: '/barista/attendance', label: 'Attendance', icon: FaUserCheck, iconColor: 'text-primary', description: 'Check in/out' },
  { path: '/barista/leave-request', label: 'Leave Request', icon: FaCalendarAlt, iconColor: 'text-danger', description: 'Request time off' },
  { path: '/barista/performance', label: 'Performance', icon: FaChartLine, iconColor: 'text-warning', description: 'View your performance' },
];

// All barista items combined (for sidebar)
export const BARISTA_NAV_ITEMS = [...BARISTA_OPERATIONS_ITEMS, ...BARISTA_WORKFORCE_ITEMS];

// Kitchen Staff navigation - Operations
export const KITCHEN_OPERATIONS_ITEMS = [
  { path: '/kitchen/orders', label: 'Food Orders', icon: FaUtensils, iconColor: 'text-primary', description: 'View food order queue' },
  { path: '/kitchen/completed', label: 'Completed Orders', icon: FaCheckCircle, iconColor: 'text-success', description: 'View completed food orders' },
  { path: '/kitchen/inventory', label: 'Inventory', icon: FaBoxes, iconColor: 'text-secondary', description: 'Kitchen inventory checklist' },
];

// Kitchen Staff navigation - Workforce
export const KITCHEN_WORKFORCE_ITEMS = [
  { path: '/kitchen/tasks', label: 'My Tasks', icon: FaTasks, iconColor: 'text-info', description: 'View assigned tasks' },
  { path: '/kitchen/shifts', label: 'My Shifts', icon: FaCalendarAlt, iconColor: 'text-success', description: 'View shift schedule' },
  { path: '/kitchen/attendance', label: 'Attendance', icon: FaUserCheck, iconColor: 'text-primary', description: 'Check in/out' },
  { path: '/kitchen/leave-request', label: 'Leave Request', icon: FaCalendarAlt, iconColor: 'text-danger', description: 'Request time off' },
  { path: '/kitchen/performance', label: 'Performance', icon: FaChartLine, iconColor: 'text-warning', description: 'View your performance' },
];

// All kitchen staff items combined (for sidebar)
export const KITCHEN_NAV_ITEMS = [...KITCHEN_OPERATIONS_ITEMS, ...KITCHEN_WORKFORCE_ITEMS];


