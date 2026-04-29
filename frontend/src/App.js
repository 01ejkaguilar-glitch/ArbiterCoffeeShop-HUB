import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { KITCHEN_THEME, KITCHEN_INVENTORY_TYPES } from './constants/workforceThemes';
import apiService from './services/api.service';
import { API_ENDPOINTS } from './config/api';
import { CartProvider } from './context/CartContext';
import { NotificationCenterProvider } from './context/NotificationContext';
import { NotificationProvider } from './components/common/NotificationSystem';
import { ToastProvider } from './components/animations/Toast';

// Styles loaded in index.js (bootstrap -> variables -> overrides -> utilities)

// Layout Components
import PublicLayout from './components/layout/PublicLayout';
const AuthLayout = lazy(() => import('./components/layout/AuthLayout'));
const CustomerLayout = lazy(() => import('./components/layout/CustomerLayout'));
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const BaristaLayout = lazy(() => import('./components/layout/BaristaLayout'));
const KitchenLayout = lazy(() => import('./components/layout/KitchenLayout'));

// Common Components
import LoadingFallback from './components/common/LoadingFallback';
import ErrorBoundary from './components/common/ErrorBoundary';
const DashboardRedirect = lazy(() => import('./components/common/DashboardRedirect'));

// Public Pages - Keep the homepage eager; lazy-load secondary pages to trim the initial bundle
import HomePage from './pages/public/HomePage';
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));

// Auth Pages - Lazy loaded (accessed infrequently after first visit)
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));

// Lazy Load Public Pages
const ProductsPage = lazy(() => import('./pages/public/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/public/ProductDetailPage'));
const AboutPage = lazy(() => import('./pages/public/AboutPage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));
const AnnouncementsPage = lazy(() => import('./pages/public/AnnouncementsPage'));
const AnnouncementDetailPage = lazy(() => import('./pages/public/AnnouncementDetailPage'));
const InquiriesPage = lazy(() => import('./pages/public/InquiriesPage'));
const PrivacyPage = lazy(() => import('./pages/public/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/public/TermsPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchInterval: 90 * 1000,
      refetchIntervalInBackground: false,
    },
  },
});

// Lazy Load Customer Pages
const CustomerDashboard = lazy(() => import('./pages/customer/CustomerDashboard'));
const CustomerProfile = lazy(() => import('./pages/customer/CustomerProfile'));
const OrderHistory = lazy(() => import('./pages/customer/OrderHistory'));
const OrderDetailPage = lazy(() => import('./pages/customer/OrderDetailPage'));
const CartPage = lazy(() => import('./pages/customer/CartPage'));
const CheckoutPage = lazy(() => import('./pages/customer/CheckoutPage'));
const CustomerInsightsPage = lazy(() => import('./pages/customer/CustomerInsightsPage'));

// Lazy Load Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminInventory = lazy(() => import('./pages/admin/AdminInventory'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminCoffeeBeans = lazy(() => import('./pages/admin/AdminCoffeeBeans'));
const AdminEmployees = lazy(() => import('./pages/admin/AdminEmployees'));
const AdminAttendance = lazy(() => import('./pages/admin/AdminAttendance'));
const AdminTasks = lazy(() => import('./pages/admin/AdminTasks'));
const AdminShifts = lazy(() => import('./pages/admin/AdminShifts'));
const AdminLeaveRequests = lazy(() => import('./pages/admin/AdminLeaveRequests'));
const AdminPerformance = lazy(() => import('./pages/admin/AdminPerformance'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));

// Lazy Load Barista Pages
const BaristaDashboard = lazy(() => import('./pages/barista/BaristaDashboard'));
const OrderQueue = lazy(() => import('./pages/barista/OrderQueue'));
const CoffeeBeanControl = lazy(() => import('./pages/barista/CoffeeBeanControl'));
const TrainingInsights = lazy(() => import('./pages/barista/TrainingInsights'));
const CompletedOrders = lazy(() => import('./pages/barista/CompletedOrders'));
const TodaysOriginManagement = lazy(() => import('./pages/barista/TodaysOriginManagement'));
const InventoryChecklist = lazy(() => import('./components/workforce/EmployeeInventory'));

// Lazy Load Barista Workforce Pages
const BaristaAttendance = lazy(() => import('./components/workforce/EmployeeAttendance'));
const MyTasks = lazy(() => import('./components/workforce/EmployeeMyTasks'));
const MyShifts = lazy(() => import('./components/workforce/EmployeeMyShifts'));
const LeaveRequest = lazy(() => import('./components/workforce/EmployeeLeaveRequest'));
const MyPerformance = lazy(() => import('./components/workforce/EmployeeMyPerformance'));

// Lazy Load Barista POS (full-screen, no sidebar)
const PosPage = lazy(() => import('./pages/barista/PosPage'));

// Lazy Load Kitchen Staff Pages
const KitchenDashboard = lazy(() => import('./pages/kitchen/KitchenDashboard'));
const FoodOrderQueue = lazy(() => import('./pages/kitchen/FoodOrderQueue'));
const CompletedFoodOrders = lazy(() => import('./pages/kitchen/CompletedFoodOrders'));
const KitchenInventory = lazy(() => import('./components/workforce/EmployeeInventory'));

// Lazy Load Kitchen Workforce Pages
const KitchenAttendance = lazy(() => import('./components/workforce/EmployeeAttendance'));
const KitchenMyTasks = lazy(() => import('./components/workforce/EmployeeMyTasks'));
const KitchenMyShifts = lazy(() => import('./components/workforce/EmployeeMyShifts'));
const KitchenLeaveRequest = lazy(() => import('./components/workforce/EmployeeLeaveRequest'));
const KitchenMyPerformance = lazy(() => import('./components/workforce/EmployeeMyPerformance'));

// Kitchen inventory config for inline route props
const kitchenEndpoints = {
  inventory: () => apiService.get(API_ENDPOINTS.KITCHEN.INVENTORY, { per_page: 200 }),
  adjust: (itemId, payload) => apiService.post(API_ENDPOINTS.KITCHEN.INVENTORY_ADJUST(itemId), payload),
};
const kitchenBuildPayload = (_item, newQty) => ({ quantity: newQty, reason: 'Kitchen checklist adjustment' });

// Lazy Load Notification Pages
const NotificationCenter = lazy(() => import('./pages/notifications/NotificationCenter'));
const NotificationPreferences = lazy(() => import('./pages/notifications/NotificationPreferences'));

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <CartProvider>
              <NotificationCenterProvider>
                <ToastProvider>
                  <NotificationProvider>
                    <ErrorBoundary>
                      <Suspense fallback={<LoadingFallback />}>
                        <AnimatedRoutes />
                      </Suspense>
                    </ErrorBoundary>
                  </NotificationProvider>
                </ToastProvider>
              </NotificationCenterProvider>
            </CartProvider>
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleFocus = () => {
      queryClient.refetchQueries({ type: 'active' });
    };

    const handleOnline = () => {
      queryClient.refetchQueries({ type: 'active' });
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [queryClient]);

  useEffect(() => {
    queryClient.refetchQueries({ type: 'active' });
  }, [location.pathname, queryClient]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>

        {/* Auth Routes: Full-screen, no Navbar/Footer */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Public Routes: Navbar + Footer + BottomNav */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/announcements/:id" element={<AnnouncementDetailPage />} />
          <Route path="/inquiries" element={<InquiriesPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Route>

        {/* Customer Routes: Navbar + Footer, auth required */}
        <Route element={<CustomerLayout />}>
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/profile" element={<CustomerProfile />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/insights" element={<CustomerInsightsPage />} />
          <Route path="/notifications" element={<NotificationCenter />} />
          <Route path="/notifications/settings" element={<NotificationPreferences />} />
        </Route>

        {/* Admin Routes: Sidebar, admin role required */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="coffee-beans" element={<AdminCoffeeBeans />} />
          <Route path="employees" element={<AdminEmployees />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="tasks" element={<AdminTasks />} />
          <Route path="shifts" element={<AdminShifts />} />
          <Route path="leave-requests" element={<AdminLeaveRequests />} />
          <Route path="performance" element={<AdminPerformance />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Barista Routes: Sidebar, barista role required */}
        <Route path="/barista" element={<BaristaLayout />}>
          <Route index element={<BaristaDashboard />} />
          <Route path="dashboard" element={<BaristaDashboard />} />
          <Route path="orders" element={<OrderQueue />} />
          <Route path="beans" element={<CoffeeBeanControl />} />
          <Route path="training" element={<TrainingInsights />} />
          <Route path="completed" element={<CompletedOrders />} />
          <Route path="featured-origins" element={<TodaysOriginManagement />} />
          <Route path="inventory" element={<InventoryChecklist defaultTab="bar" title="Inventory Checklist" subtitle="Monitor and update bar stock levels" />} />
          <Route path="attendance" element={<BaristaAttendance />} />
          <Route path="tasks" element={<MyTasks />} />
          <Route path="shifts" element={<MyShifts />} />
          <Route path="leave-request" element={<LeaveRequest />} />
          <Route path="performance" element={<MyPerformance />} />
        </Route>

        {/* Barista POS: Full-screen, no sidebar */}
        <Route path="/barista/pos" element={<PosPage />} />

        {/* Kitchen Staff Routes: Sidebar, kitchen-staff role required */}
        <Route path="/kitchen" element={<KitchenLayout />}>
          <Route index element={<KitchenDashboard />} />
          <Route path="dashboard" element={<KitchenDashboard />} />
          <Route path="orders" element={<FoodOrderQueue />} />
          <Route path="completed" element={<CompletedFoodOrders />} />
          <Route path="inventory" element={<KitchenInventory theme={KITCHEN_THEME} inventoryTypes={KITCHEN_INVENTORY_TYPES} defaultTab="kitchen" title="Kitchen Inventory" subtitle="Check and adjust kitchen stock levels" endpoints={kitchenEndpoints} buildAdjustPayload={kitchenBuildPayload} />} />
          <Route path="attendance" element={<KitchenAttendance theme={KITCHEN_THEME} />} />
          <Route path="tasks" element={<KitchenMyTasks theme={KITCHEN_THEME} />} />
          <Route path="shifts" element={<KitchenMyShifts theme={KITCHEN_THEME} />} />
          <Route path="leave-request" element={<KitchenLeaveRequest theme={KITCHEN_THEME} />} />
          <Route path="performance" element={<KitchenMyPerformance theme={KITCHEN_THEME} liveEndpoint={API_ENDPOINTS.KITCHEN.PERFORMANCE} />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
