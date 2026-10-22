import { Container, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaHome, FaExclamationTriangle } from "react-icons/fa";

const NotFoundPage = () => {
  const { user } = useSelector((state) => state.auth);
  const isStaffOrAdmin = user?.role === "admin" || user?.role === "staff";

  return (
    <Container className="py-5 text-center my-auto">
      <div className="py-5">
        <FaExclamationTriangle className="text-warning mb-4" style={{ fontSize: "4rem" }} />
        <h1 className="display-4 fw-bold text-dark mb-2">404 - Không tìm thấy trang</h1>
        <p className="lead text-muted mb-4">
          Trang bạn đang truy cập không tồn tại hoặc đã được chuyển sang địa chỉ khác.
        </p>
        <Button
          as={Link}
          to={isStaffOrAdmin ? "/admin" : "/"}
          variant="primary"
          size="lg"
          className="px-4 d-inline-flex align-items-center"
        >
          <FaHome className="me-2" />
          <span>{isStaffOrAdmin ? "Quay về Trang quản trị" : "Quay về Trang chủ"}</span>
        </Button>
      </div>
    </Container>
  );
};

export default NotFoundPage;

