import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import AdminSidebar from "../components/AdminSidebar";
import LoadingSpinner from "../components/LoadingSpinner";

/**
 * Layout cho trang Quản trị viên (Admin Portal).
 * Thiết kế sidebar cố định bên trái, khu vực nội dung cuộn độc lập bên phải.
 */
const AdminLayout = () => {
  return (
    <div className="d-flex flex-column" style={{ height: "100vh", overflow: "hidden" }}>
      <Header />
      <div className="d-flex flex-grow-1" style={{ minHeight: 0, overflow: "hidden" }}>
        <AdminSidebar />
        <main
          className="flex-grow-1 bg-light p-4"
          style={{ minWidth: 0, height: "100%", overflowY: "auto" }}
        >
          <Suspense fallback={<LoadingSpinner />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

