import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ToastContainer } from "react-toastify";
import { logout } from "./redux/authSlice";
import { clearCart } from "./redux/cartSlice";
import { clearWishlist } from "./redux/wishlistSlice";
import { clearOrders } from "./redux/orderSlice";

// Layout components
import CustomerLayout from "./layouts/CustomerLayout";
import AdminLayout from "./layouts/AdminLayout";

// Route guards
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";

// UI Helper components
import ScrollToTop from "./components/ScrollToTop";

// Primary Customer Page (Eager Load for instant First Contentful Paint)
import HomePage from "./pages/customer/HomePage";

// Secondary Customer Pages (Code-splitting with React.lazy)
const BookListPage = React.lazy(() => import("./pages/customer/BookListPage"));
const BookDetailPage = React.lazy(() => import("./pages/customer/BookDetailPage"));
const LoginPage = React.lazy(() => import("./pages/customer/LoginPage"));
const RegisterPage = React.lazy(() => import("./pages/customer/RegisterPage"));
const ForgotPasswordPage = React.lazy(() => import("./pages/customer/ForgotPasswordPage"));
const CartPage = React.lazy(() => import("./pages/customer/CartPage"));
const CheckoutPage = React.lazy(() => import("./pages/customer/CheckoutPage"));
const OrderDetailPage = React.lazy(() => import("./pages/customer/OrderDetailPage"));
const WishlistPage = React.lazy(() => import("./pages/customer/WishlistPage"));
const ProfilePage = React.lazy(() => import("./pages/customer/ProfilePage"));
const NotFoundPage = React.lazy(() => import("./pages/customer/NotFoundPage"));

// Admin Portal Pages (Lazy-loaded)
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard"));
const AdminBooks = React.lazy(() => import("./pages/admin/AdminBooks"));
const AdminCategories = React.lazy(() => import("./pages/admin/AdminCategories"));
const AdminUsers = React.lazy(() => import("./pages/admin/AdminUsers"));
const AdminOrders = React.lazy(() => import("./pages/admin/AdminOrders"));
const AdminVouchers = React.lazy(() => import("./pages/admin/AdminVouchers"));

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const handleUnauthorized = () => {
      dispatch(logout());
      dispatch(clearCart());
      dispatch(clearWishlist());
      dispatch(clearOrders());
    };
    window.addEventListener("infinia:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("infinia:unauthorized", handleUnauthorized);
    };
  }, [dispatch]);

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Customer Routes (Storefront) */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/books" element={<BookListPage />} />
          <Route path="/books/:id" element={<BookDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Customer Protected Routes */}
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Navigate to="/profile?tab=orders" replace />
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
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <WishlistPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* 404 Catch-all for Customer */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Admin Routes (Admin Portal) */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="books" element={<AdminBooks />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="vouchers" element={<AdminVouchers />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        limit={1}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
      />
    </>
  );
}

export default App;
