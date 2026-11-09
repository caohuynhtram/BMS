import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

/**
 * Route guard bảo vệ khu vực quản trị Admin Portal.
 * Chỉ cho phép người dùng có vai trò "admin" đang ở trạng thái active.
 */
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.status === "blocked") {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;

