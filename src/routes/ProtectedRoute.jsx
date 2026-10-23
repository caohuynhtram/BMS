import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

/**
 * Route guard bảo vệ các trang yêu cầu đăng nhập.
 * Chặn các tài khoản chưa đăng nhập hoặc đang bị khóa (status === "blocked").
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.status === "blocked") {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

