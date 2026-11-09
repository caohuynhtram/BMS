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
      setError("Vui lòng nhập đầy đủ cả họ và tên.");
      return;
    }
    if (!isValidFullName(formData.name)) {
      setError("Họ và tên phải có ít nhất 2 từ và chỉ bao gồm chữ cái.");
      return;
    }
    if (!formData.email.trim()) {
      setError("Vui lòng nhập địa chỉ email.");
      return;
    }
    if (!isValidEmail(formData.email)) {
      setError("Định dạng email chưa đúng (VD: user@example.com).");
      return;
    }
    if (!formData.phone.trim()) {
      setError("Vui lòng nhập số điện thoại.");
      return;
    }
    if (!isValidPhone(formData.phone)) {
      setError("Số điện thoại không hợp lệ. Vui lòng nhập số gồm 10 chữ số (VD: 0912345678).");
      return;
    }
    if (!formData.address.trim()) {
      setError("Vui lòng nhập địa chỉ nhận hàng.");
      return;
    }
    if (!isValidAddress(formData.address)) {
      setError("Vui lòng nhập địa chỉ nhận hàng chi tiết hơn (ít nhất 2 từ).");
      return;
    }
    if (!formData.password) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }
    if (!isValidPassword(formData.password)) {
      setError("Mật khẩu phải có độ dài từ 6 đến 18 ký tự.");
      return;
    }
    if (!formData.confirmPassword) {
      setError("Vui lòng nhập lại mật khẩu để xác nhận.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không trùng khớp.");
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
        setError("Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.");
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
      toast.success("Đăng ký tài khoản thành công! Vui lòng đăng nhập để tiếp tục.");
      navigate("/login", { state: { email: normalizedEmail } });
    } catch (err) {
      console.error("Register Error:", err);
      setError("Đăng ký chưa thành công do lỗi hệ thống. Vui lòng thử lại sau.");
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
                <h2 className="fw-bold text-dark mb-1">Đăng ký tài khoản</h2>
                <p className="text-muted small">
                  Tạo tài khoản INFINIA STORE để nhận nhiều ưu đãi và quản lý tủ sách của bạn
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
                    Họ và tên <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nhập đầy đủ họ và tên"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-dark">
                    Địa chỉ Email <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="VD: user@example.com"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-dark">
                    Số điện thoại <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="VD: 0912345678"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-dark">
                    Địa chỉ nhận hàng mặc định <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành"
                    required
                  />
                </Form.Group>

                <hr className="my-4" />

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-dark">
                    Mật khẩu <span className="text-danger">*</span>
                  </Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Từ 6 đến 18 ký tự"
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
                      title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      tabIndex={-1}
                    >
                      {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                    </button>
                  </div>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold text-dark">
                    Xác nhận mật khẩu <span className="text-danger">*</span>
                  </Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Nhập lại mật khẩu để xác nhận"
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
                      title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
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
                      <span>Đang khởi tạo tài khoản...</span>
                    </>
                  ) : (
                    <span>Đăng ký tài khoản</span>
                  )}
                </Button>
              </Form>

              <div className="text-center mt-4">
                <p className="text-muted small mb-0">
                  Đã có tài khoản?{" "}
                  <Link to="/login" className="text-decoration-none fw-bold text-primary">
                    Đăng nhập ngay
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
