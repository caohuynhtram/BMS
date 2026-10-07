import React from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";

// Public pages
import HomePage from "../pages/Home/HomePage";
import BookListPage from "../pages/Home/BookListPage";
import BookDetailPage from "../pages/BookDetail/BookDetailPage";
import LoginPage from "../pages/Home/LoginPage";
import RegisterPage from "../pages/Home/RegisterPage";

// User pages
import CartPage from "../pages/Cart/CartPage";
import CheckoutPage from "../pages/Checkout/CheckoutPage";
import OrdersPage from "../pages/Orders/OrdersPage";
import OrderDetailPage from "../pages/Orders/OrderDetailPage";
import WishlistPage from "../pages/Home/WishlistPage";
import ProfilePage from "../pages/Profile/ProfilePage";

// Admin pages
import AdminDashboard from "../pages/Admin/AdminDashboard";
import AdminBooks from "../pages/Admin/AdminBooks";
import AdminCategories from "../pages/Admin/AdminCategories";
import AdminUsers from "../pages/Admin/AdminUsers";
import AdminOrders from "../pages/Admin/AdminOrders";
import AdminVouchers from "../pages/Admin/AdminVouchers";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/books" element={<BookListPage />} />
      <Route path="/books/:id" element={<BookDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* User Protected Routes */}
      <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
      <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
      <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
      <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/books" element={<AdminRoute><AdminBooks /></AdminRoute>} />
      <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
      <Route path="/admin/vouchers" element={<AdminRoute><AdminVouchers /></AdminRoute>} />
    </Routes>
  );
};

export default AppRoutes;
