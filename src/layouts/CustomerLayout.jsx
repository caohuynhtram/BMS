import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";

/**
 * Layout chung cho toàn bộ giao diện khách hàng (Storefront).
 * Bao gồm Header điều hướng trên cùng, Footer cuối trang, và Suspense fallback khi nạp trang động.
 */
const CustomerLayout = () => {
  return (
    <div className="d-flex flex-column min-vh-100 position-relative">
      <Header />
      <main className="flex-grow-1 d-flex flex-column position-relative" style={{ zIndex: 1 }}>
        <Suspense fallback={<LoadingSpinner />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default CustomerLayout;

