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
      setError("Định dạng email chưa đúng (VD: user@example.com).");
      return;
    }

    if (!password) {
      setError("Vui lòng nhập mật khẩu của bạn.");
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await authApi.login(normalizedEmail);
      if (res.data.length > 0) {
        const user = res.data[0];
        if (user.password !== password) {
          setError("Email hoặc mật khẩu không chính xác.");
          setLoading(false);
          return;
        }
        if (user.status === "blocked") {
          setError("Tài khoản của bạn hiện đang bị tạm khóa. Vui lòng liên hệ bộ phận hỗ trợ.");
          setLoading(false);
          return;
        }
        dispatch(login(user));
        const isAdmin = user.role === "admin";
        if (!isAdmin) {
          dispatch(fetchWishlist(user.id));
          dispatch(fetchCart(user.id));
        }
        toast.success(`Chào mừng ${user.name} đã quay trở lại!`);
        const redirectPath = location.state?.from
          ? location.state.from.pathname + (location.state.from.search || "")
          : (isAdmin ? "/admin" : "/");
        navigate(redirectPath);
      } else {
        setError("Email hoặc mật khẩu không chính xác.");
      }
    } catch (err) {
      if (err.code === "ERR_NETWORK" || !err.response) {
        setError("Không thể kết nối đến hệ thống. Vui lòng kiểm tra lại kết nối mạng và thử lại.");
      } else {
        setError("Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.");
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
              <h2 className="text-center mb-4 fw-bold text-dark">Đăng nhập</h2>
              {error && (
                <Alert variant="danger" className="py-2 mb-3" dismissible onClose={() => setError("")}>
                  {error}
                </Alert>
              )}
              <Form onSubmit={handleSubmit} noValidate>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-dark">Địa chỉ Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email của bạn"
                    autoComplete="email"
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <Form.Label className="fw-semibold text-dark mb-0">Mật khẩu</Form.Label>
                    <Link to="/forgot-password" className="small text-decoration-none">
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <div className="position-relative">
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu"
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
                      title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      tabIndex={-1}
                    >
                      {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                    </button>
                  </div>
                </Form.Group>
                <Button type="submit" variant="primary" className="w-100 py-2 fw-bold fs-6" disabled={loading}>
                  {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>
              </Form>
              <div className="text-center mt-4">
                <span className="text-muted">Chưa có tài khoản? </span>
                <Link to="/register" className="fw-bold text-decoration-none">
                  Đăng ký ngay
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
