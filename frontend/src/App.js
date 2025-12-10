import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './components/common/NotificationSystem';

// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Public Pages
import HomePage from './pages/public/HomePage';
import ProductsPage from './pages/public/ProductsPage';
import ProductDetailPage from './pages/public/ProductDetailPage';
import AboutPage from './pages/public/AboutPage';
import ContactPage from './pages/public/ContactPage';
import AnnouncementsPage from './pages/public/AnnouncementsPage';
import InquiriesPage from './pages/public/InquiriesPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerProfile from './pages/customer/CustomerProfile';
import OrderHistory from './pages/customer/OrderHistory';
import OrderDetailPage from './pages/customer/OrderDetailPage';
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAnalytics from './pages/admin/AdminAnalytics';

// Barista Pages
import BaristaDashboard from './pages/barista/BaristaDashboard';
import OrderQueue from './pages/barista/OrderQueue';
import CoffeeBeanControl from './pages/barista/CoffeeBeanControl';
import TrainingInsights from './pages/barista/TrainingInsights';
import CompletedOrders from './pages/barista/CompletedOrders';
import TodaysOriginManagement from './pages/barista/TodaysOriginManagement';
import InventoryChecklist from './pages/barista/InventoryChecklist';

// Protected Route Component
import ProtectedRoute from './components/common/ProtectedRoute';

// Import Styles
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/theme.css';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <div className="App d-flex flex-column min-vh-100">
            <Navbar />
            <main className="flex-grow-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/announcements" element={<AnnouncementsPage />} />
                <Route path="/inquiries" element={<InquiriesPage />} />

                {/* Auth Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Customer Routes - Protected */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <CustomerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <CustomerProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <OrderHistory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders/:id"
                  element={
                    <ProtectedRoute>
                      <OrderDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/cart" element={<CartPage />} />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes - Protected */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute role="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/products"
                  element={
                    <ProtectedRoute role="admin">
                      <AdminProducts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/orders"
                  element={
                    <ProtectedRoute role="admin">
                      <AdminOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute role="admin">
                      <AdminUsers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/analytics"
                  element={
                    <ProtectedRoute role="admin">
                      <AdminAnalytics />
                    </ProtectedRoute>
                  }
                />

                {/* Barista Routes - Protected */}
                <Route
                  path="/barista/dashboard"
                  element={
                    <ProtectedRoute role="barista">
                      <BaristaDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/barista/orders"
                  element={
                    <ProtectedRoute role="barista">
                      <OrderQueue />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/barista/beans"
                  element={
                    <ProtectedRoute role="barista">
                      <CoffeeBeanControl />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/barista/training"
                  element={
                    <ProtectedRoute role="barista">
                      <TrainingInsights />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/barista/completed"
                  element={
                    <ProtectedRoute role="barista">
                      <CompletedOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/barista/featured-origins"
                  element={
                    <ProtectedRoute role="barista">
                      <TodaysOriginManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/barista/inventory"
                  element={
                    <ProtectedRoute role="barista">
                      <InventoryChecklist />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </NotificationProvider>
      </CartProvider>
    </AuthProvider>
    </Router>
  );
}

// Simple 404 Page Component
const NotFoundPage = () => (
  <div className="container py-5 text-center">
    <h1 className="display-1">404</h1>
    <h2>Page Not Found</h2>
    <p className="lead">The page you're looking for doesn't exist.</p>
    <a href="/" className="btn btn-primary">
      Go Home
    </a>
  </div>
);

export default App;
