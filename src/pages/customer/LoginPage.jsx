import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../../redux/authSlice";
import { fetchWishlist } from "../../redux/wishlistSlice";
import { fetchCart } from "../../redux/cartSlice";
import authApi from "../../api/authApi";
import { isValidEmail } from "../../utils/helpers";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const LoginPage = () => {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isValidEmail(email)) {
      setError("Invalid email format (e.g. user@example.com).");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await authApi.login(normalizedEmail);
      if (res.data.length > 0) {
        const user = res.data[0];
        if (user.password !== password) {
          setError("Incorrect email or password.");
          setLoading(false);
          return;
        }
        if (user.status === "blocked") {
          setError("Your account is currently blocked. Please contact support.");
          setLoading(false);
          return;
        }
        dispatch(login(user));
        const isAdmin = user.role === "admin";
        if (!isAdmin) {
          dispatch(fetchWishlist(user.id));
          dispatch(fetchCart(user.id));
        }
        toast.success(`Welcome back, ${user.name}!`);
        const redirectPath = location.state?.from
          ? location.state.from.pathname + (location.state.from.search || "")
          : (isAdmin ? "/admin" : "/");
        navigate(redirectPath);
      } else {
        setError("Incorrect email or password.");
      }
    } catch (err) {
      if (err.code === "ERR_NETWORK" || !err.response) {
        setError("Unable to connect to system. Please check your network connection and try again.");
      } else {
        setError("Login failed. Please check your credentials.");
      }
    }
    setLoading(false);
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow border-0 bg-white">
            <Card.Body className="p-4 p-md-5">
              <h2 className="text-center mb-4 fw-bold text-dark">Log In</h2>
              {error && (
                <Alert variant="danger" className="py-2 mb-3" dismissible onClose={() => setError("")}>
                  {error}
                </Alert>
              )}
              <Form onSubmit={handleSubmit} noValidate>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-dark">Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    autoComplete="email"
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <Form.Label className="fw-semibold text-dark mb-0">Password</Form.Label>
                    <Link to="/forgot-password" className="small text-decoration-none">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="position-relative">
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="pe-5"
                      required
                    />
                    <button
                      type="button"
                      className="btn position-absolute top-50 end-0 translate-middle-y text-secondary border-0 bg-transparent shadow-none d-flex align-items-center justify-content-center p-2 me-2"
                      style={{ zIndex: 10, cursor: "pointer", width: "36px", height: "36px" }}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.preventDefault();
                        setShowPassword((prev) => !prev);
                      }}
                      title={showPassword ? "Hide password" : "Show password"}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                    </button>
                  </div>
                </Form.Group>
                <Button type="submit" variant="primary" className="w-100 py-2 fw-bold fs-6" disabled={loading}>
                  {loading ? "Logging in..." : "Log In"}
                </Button>
              </Form>
              <div className="text-center mt-4">
                <span className="text-muted">Don't have an account? </span>
                <Link to="/register" className="fw-bold text-decoration-none">
                  Register now
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;
