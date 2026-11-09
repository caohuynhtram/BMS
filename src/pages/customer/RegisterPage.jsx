import { useState } from "react";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import authApi from "../../api/authApi";
import axiosClient from "../../api/axiosClient";
import {
  isValidFullName,
  isValidEmail,
  isValidPhone,
  isValidAddress,
  isValidPassword,
} from "../../utils/helpers";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash, FaUserPlus } from "react-icons/fa";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  // Xử lý gửi biểu mẫu đăng ký
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!isValidFullName(formData.name)) {
      setError("Full name must contain at least 2 words and only letters.");
      return;
    }
    if (!formData.email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!isValidEmail(formData.email)) {
      setError("Invalid email format (e.g. user@example.com).");
      return;
    }
    if (!formData.phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    if (!isValidPhone(formData.phone)) {
      setError("Invalid phone number. Please enter a 10-digit number (e.g. 0912345678).");
      return;
    }
    if (!formData.address.trim()) {
      setError("Please enter your shipping address.");
      return;
    }
    if (!isValidAddress(formData.address)) {
      setError("Please enter a more detailed shipping address (at least 2 words).");
      return;
    }
    if (!formData.password) {
      setError("Please enter a password.");
      return;
    }
    if (!isValidPassword(formData.password)) {
      setError("Password must be between 6 and 18 characters.");
      return;
    }
    if (!formData.confirmPassword) {
      setError("Please re-enter password to confirm.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const normalizedEmail = formData.email.trim().toLowerCase();
      const allUsersRes = await axiosClient.get("/users");
      const emailExists = (allUsersRes.data || []).some(
        (u) => (u.email || "").toLowerCase() === normalizedEmail
      );
      if (emailExists) {
        setError("This email is already registered. Please use another email or log in.");
        setLoading(false);
        return;
      }

      const allUsers = allUsersRes.data || [];
      const numericIds = allUsers
        .map((u) => Number(u.id))
        .filter((n) => !isNaN(n) && Number.isInteger(n));
      const nextId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : allUsers.length + 1;

      // Tạo tài khoản người dùng mới
      const res = await authApi.register({
        id: String(nextId),
        name: formData.name.trim(),
        email: normalizedEmail,
        password: formData.password,
        role: "customer",
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        status: "active",
      });

      // Khởi tạo giỏ hàng rỗng trong DB
      await axiosClient.post("/carts", {
        userId: String(res.data.id),
        items: [],
      });

      // Theo chuẩn nghiệp vụ TMĐT: Đăng ký thành công -> Báo thành công -> Chuyển hướng sang trang Đăng nhập
      toast.success("Account registered successfully! Please log in to continue.");
      navigate("/login", { state: { email: normalizedEmail } });
    } catch (err) {
      console.error("Register Error:", err);
      setError("Registration failed due to a system error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={7} lg={6}>
          <Card className="shadow border-0 bg-white">
            <Card.Body className="p-4 p-md-5">
              <div className="text-center mb-4">
                <div
                  className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle mb-3"
                  style={{ width: "65px", height: "65px" }}
                >
                  <FaUserPlus className="text-primary fs-3" />
                </div>
                <h2 className="fw-bold text-dark mb-1">Create an Account</h2>
                <p className="text-muted small">
                  Create an INFINIA STORE account to receive exclusive offers and manage your bookshelf
                </p>
              </div>

              {error && (
                <Alert variant="danger" className="py-2 mb-4" dismissible onClose={() => setError("")}>
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit} noValidate>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-dark">
                    Full Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-dark">
                    Email Address <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. user@example.com"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-dark">
                    Phone Number <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. 0912345678"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-dark">
                    Default Shipping Address <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Street address, ward, district, city/province"
                    required
                  />
                </Form.Group>

                <hr className="my-4" />

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-dark">
                    Password <span className="text-danger">*</span>
                  </Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="6 to 18 characters"
                      required
                      minLength={6}
                      maxLength={18}
                      className="pe-5"
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

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold text-dark">
                    Confirm Password <span className="text-danger">*</span>
                  </Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter password to confirm"
                      required
                      minLength={6}
                      maxLength={18}
                      className="pe-5"
                    />
                    <button
                      type="button"
                      className="btn position-absolute top-50 end-0 translate-middle-y text-secondary border-0 bg-transparent shadow-none d-flex align-items-center justify-content-center p-2 me-2"
                      style={{ zIndex: 10, cursor: "pointer", width: "36px", height: "36px" }}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.preventDefault();
                        setShowConfirmPassword((prev) => !prev);
                      }}
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                    </button>
                  </div>
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-100 py-2 fw-bold d-flex align-items-center justify-content-center"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" animation="border" className="me-2" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </Button>
              </Form>

              <div className="text-center mt-4">
                <p className="text-muted small mb-0">
                  Already have an account?{" "}
                  <Link to="/login" className="text-decoration-none fw-bold text-primary">
                    Log in now
                  </Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default RegisterPage;
