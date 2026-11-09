import { Container, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaHome, FaExclamationTriangle } from "react-icons/fa";

const NotFoundPage = () => {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === "admin";

  return (
    <Container className="py-5 text-center my-auto">
      <div className="py-5">
        <FaExclamationTriangle className="text-warning mb-4" style={{ fontSize: "4rem" }} />
        <h1 className="display-4 fw-bold text-dark mb-2">404 - Page Not Found</h1>
        <p className="lead text-muted mb-4">
          The page you are looking for does not exist or has been moved.
        </p>
        <Button
          as={Link}
          to={isAdmin ? "/admin" : "/"}
          variant="primary"
          size="lg"
          className="px-4 d-inline-flex align-items-center"
        >
          <FaHome className="me-2" />
          <span>{isAdmin ? "Back to Admin Dashboard" : "Back to Home"}</span>
        </Button>
      </div>
    </Container>
  );
};

export default NotFoundPage;

