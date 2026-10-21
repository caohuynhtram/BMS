import { useState } from "react";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import authApi from "../../api/authApi";
import axiosClient from "../../api/axiosClient";
import { isValidEmail, isValidPassword } from "../../utils/helpers";
import { generateOTP, sendOtpEmail } from "../../utils/emailService";
import OtpVerificationForm from "../../components/OtpVerificationForm";
import { toast } from "react-toastify";
import { FaArrowLeft, FaEye, FaEyeSlash, FaKey } from "react-icons/fa";

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 phút hiệu lực
const MAX_FAILED_ATTEMPTS = 5; // Giới hạn 5 lần nhập sai

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1); // 1: Nhập email, 2: Xác thực OTP, 3: Mật khẩu mới
  const [email, setEmail] = useState("");
  const [targetUser, setTargetUser] = useState(null);

  // Quản lý trạng thái OTP
  const [sentOtp, setSentOtp] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState(null);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Quản lý mật khẩu mới
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Bước 1: Kiểm tra email và gửi OTP qua EmailJS
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Vui lòng nhập địa chỉ email của bạn.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Định dạng email chưa đúng (VD: user@example.com).");
      return;
    }

    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const allUsersRes = await axiosClient.get("/users");
      const matchedUser = (allUsersRes.data || []).find(
        (u) => (u.email || "").toLowerCase() === normalizedEmail
      );

      if (!matchedUser) {
        setError("Không tìm thấy tài khoản nào khớp với email này.");
        setLoading(false);
        return;
      }

      // Bảo mật: Không cho phép tài khoản Admin đặt lại mật khẩu qua trang quên mật khẩu của khách
      if (matchedUser.role === "admin") {
        setError(
          "Tài khoản quản trị viên không thể đặt lại mật khẩu tại đây. Vui lòng liên hệ quản lý cấp cao."
        );
        setLoading(false);
        return;
      }

      if (matchedUser.status === "blocked") {
        setError("Tài khoản của bạn hiện đang bị khóa. Vui lòng liên hệ hỗ trợ.");
        setLoading(false);
        return;
      }

      // Tạo mã OTP 6 chữ số và gửi qua EmailJS (KHÔNG hiển thị mã trên Toast)
      const generatedCode = generateOTP();
      const expiresAt = Date.now() + OTP_EXPIRY_MS;

      await sendOtpEmail({
        toEmail: matchedUser.email,
        toName: matchedUser.name,
        otpCode: generatedCode,
        type: "forgot_password",
      });

      setSentOtp(generatedCode);
      setOtpExpiresAt(expiresAt);
      setFailedAttempts(0);
      setTargetUser(matchedUser);
      setStep(2);
      toast.success("Mã xác thực OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư!");
    } catch (err) {
      console.error("Forgot Password OTP Send Error:", err);
      setError(
        err?.message ||
          "Không thể gửi mã xác thực đến email. Vui lòng kiểm tra cấu hình EmailJS hoặc thử lại sau."
      );
    }
    setLoading(false);
  };

  // Gửi lại mã OTP qua EmailJS
  const handleResendOtp = async () => {
    if (!targetUser) return;
    const newCode = generateOTP();
    const expiresAt = Date.now() + OTP_EXPIRY_MS;

    await sendOtpEmail({
      toEmail: targetUser.email,
      toName: targetUser.name,
      otpCode: newCode,
      type: "forgot_password",
    });

    setSentOtp(newCode);
    setOtpExpiresAt(expiresAt);
    setFailedAttempts(0);
    toast.success("Mã xác thực OTP mới đã được gửi đến email của bạn.");
  };

  // Bước 2: Kiểm tra OTP
  const handleVerifyOtp = async (enteredOtp) => {
    if (!sentOtp) {
      return { error: "Mã OTP không hợp lệ hoặc đã hết hiệu lực. Vui lòng gửi lại mã mới." };
    }

    // Kiểm tra thời hạn 5 phút
    if (otpExpiresAt && Date.now() > otpExpiresAt) {
      return {
        error: "Mã xác thực OTP đã hết hạn (hiệu lực 5 phút). Vui lòng nhấn gửi lại mã mới.",
      };
    }

    // Kiểm tra số lần nhập sai
    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      return {
        error:
          "Bạn đã nhập sai quá số lần quy định. Mã OTP này đã bị vô hiệu hóa. Vui lòng gửi lại mã mới.",
      };
    }

    // Kiểm tra tính chính xác của OTP (Bỏ hoàn toàn backdoor)
    if (enteredOtp !== sentOtp) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        setSentOtp(""); // Hủy mã khi sai quá 5 lần
        return {
          error:
            "Bạn đã nhập sai 5 lần liên tiếp. Mã OTP này đã bị hủy để đảm bảo an toàn. Vui lòng gửi lại mã mới.",
        };
      }
      return {
        error: `Mã OTP không chính xác. Bạn còn ${MAX_FAILED_ATTEMPTS - newAttempts} lần thử.`,
      };
    }

    // Huỷ mã OTP sau khi sử dụng thành công (chỉ cho phép dùng 1 lần)
    setSentOtp("");
    setStep(3);
    toast.success("Xác thực danh tính thành công! Vui lòng thiết lập mật khẩu mới.");
    return { success: true };
  };

  // Bước 3: Đặt lại mật khẩu mới
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!newPassword) {
      setError("Vui lòng nhập mật khẩu mới.");
      return;
    }

    if (!isValidPassword(newPassword)) {
      setError("Mật khẩu mới phải có độ dài từ 6 đến 18 ký tự.");
      return;
    }

    if (!confirmPassword) {
      setError("Vui lòng nhập lại mật khẩu để xác nhận.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    setLoading(true);
    try {
      await authApi.updateProfile(targetUser.id, { password: newPassword });
      toast.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.");
      navigate("/login");
    } catch (err) {
      setError("Cập nhật mật khẩu chưa thành công. Vui lòng thử lại sau.");
    }
    setLoading(false);
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow border-0 bg-white">
            <Card.Body className="p-4 p-md-5">
              {step === 1 && (
                <>
                  <div className="text-center mb-4">
                    <div
                      className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle mb-3"
                      style={{ width: "65px", height: "65px" }}
                    >
                      <FaKey className="text-primary fs-3" />
                    </div>
                    <h2 className="fw-bold text-dark mb-1">Quên mật khẩu</h2>
                    <p className="text-muted small">
                      Nhập địa chỉ email tài khoản của bạn để nhận mã xác thực OTP gửi về Gmail
                    </p>
                  </div>

                  {error && (
                    <Alert variant="danger" className="py-2 mb-4" dismissible onClose={() => setError("")}>
                      {error}
                    </Alert>
                  )}

                  <Form onSubmit={handleEmailSubmit} noValidate>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-semibold text-dark">
                        Địa chỉ Email <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="VD: user@example.com"
                        required
                      />
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
                          <span>Đang kiểm tra & gửi mã...</span>
                        </>
                      ) : (
                        <span>Gửi mã xác thực</span>
                      )}
                    </Button>
                  </Form>

                  <div className="text-center mt-4">
                    <Link to="/login" className="text-decoration-none small text-muted">
                      <FaArrowLeft className="me-1" /> Quay lại đăng nhập
                    </Link>
                  </div>
                </>
              )}

              {step === 2 && (
                <OtpVerificationForm
                  email={email}
                  title="Xác thực mã OTP"
                  onVerify={handleVerifyOtp}
                  onResend={handleResendOtp}
                  onBack={() => setStep(1)}
                  backLabel="Nhập lại email"
                  showLoginLink={true}
                />
              )}

              {step === 3 && (
                <>
                  <div className="text-center mb-4">
                    <div
                      className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle mb-3"
                      style={{ width: "65px", height: "65px" }}
                    >
                      <FaKey className="text-primary fs-3" />
                    </div>
                    <h2 className="fw-bold text-dark mb-1">Đặt lại mật khẩu</h2>
                    <p className="text-muted small">
                      Tài khoản: <strong>{targetUser?.email}</strong>. Vui lòng nhập mật khẩu mới.
                    </p>
                  </div>

                  {error && (
                    <Alert variant="danger" className="py-2 mb-4" dismissible onClose={() => setError("")}>
                      {error}
                    </Alert>
                  )}

                  <Form onSubmit={handlePasswordSubmit} noValidate>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold text-dark">
                        Mật khẩu mới <span className="text-danger">*</span>
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Từ 6 đến 18 ký tự"
                          minLength={6}
                          maxLength={18}
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
                            setShowNewPassword((prev) => !prev);
                          }}
                          title={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                          aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                          tabIndex={-1}
                        >
                          {showNewPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="fw-semibold text-dark">
                        Xác nhận mật khẩu mới <span className="text-danger">*</span>
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Nhập lại mật khẩu mới"
                          minLength={6}
                          maxLength={18}
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
                          <span>Đang cập nhật mật khẩu...</span>
                        </>
                      ) : (
                        <span>Lưu mật khẩu mới</span>
                      )}
                    </Button>
                  </Form>

                  <div className="text-center mt-4">
                    <Link to="/login" className="text-decoration-none small text-muted">
                      <FaArrowLeft className="me-1" /> Quay lại đăng nhập
                    </Link>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ForgotPasswordPage;
