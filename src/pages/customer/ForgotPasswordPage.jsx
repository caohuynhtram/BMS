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
      setError("Please enter your email address.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Invalid email format (e.g. user@example.com).");
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
        setError("No account found matching this email.");
        setLoading(false);
        return;
      }

      // Bảo mật: Không cho phép tài khoản Admin đặt lại mật khẩu qua trang quên mật khẩu của khách
      if (matchedUser.role === "admin") {
        setError(
          "Administrator accounts cannot reset password here. Please contact high-level management."
        );
        setLoading(false);
        return;
      }

      if (matchedUser.status === "blocked") {
        setError("Your account is currently blocked. Please contact support.");
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
      toast.success("OTP verification code has been sent to your email. Please check your inbox!");
    } catch (err) {
      console.error("Forgot Password OTP Send Error:", err);
      setError(
        err?.message ||
          "Failed to send verification code to email. Please check EmailJS configuration or try again later."
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
    toast.success("A new OTP verification code has been sent to your email.");
  };

  // Bước 2: Kiểm tra OTP
  const handleVerifyOtp = async (enteredOtp) => {
    if (!sentOtp) {
      return { error: "Invalid or expired OTP code. Please request a new code." };
    }

    // Kiểm tra thời hạn 5 phút
    if (otpExpiresAt && Date.now() > otpExpiresAt) {
      return {
        error: "OTP verification code has expired (valid for 5 minutes). Please resend a new code.",
      };
    }

    // Kiểm tra số lần nhập sai
    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      return {
        error:
          "You have exceeded the maximum allowed attempts. This OTP has been invalidated. Please request a new code.",
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
            "Incorrect code entered 5 times. This OTP was cancelled for security. Please request a new code.",
        };
      }
      return {
        error: `Incorrect OTP code. You have ${MAX_FAILED_ATTEMPTS - newAttempts} attempt(s) remaining.`,
      };
    }

    // Huỷ mã OTP sau khi sử dụng thành công (chỉ cho phép dùng 1 lần)
    setSentOtp("");
    setStep(3);
    toast.success("Identity verified successfully! Please set your new password.");
    return { success: true };
  };

  // Bước 3: Đặt lại mật khẩu mới
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }

    if (!isValidPassword(newPassword)) {
      setError("New password must be between 6 and 18 characters.");
      return;
    }

    if (!confirmPassword) {
      setError("Please re-enter password to confirm.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await authApi.updateProfile(targetUser.id, { password: newPassword });
      toast.success("Password reset successfully! Please log in with your new password.");
      navigate("/login");
    } catch (err) {
      setError("Failed to update password. Please try again later.");
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
                    <h2 className="fw-bold text-dark mb-1">Forgot Password</h2>
                    <p className="text-muted small">
                      Enter your account email address to receive an OTP verification code
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
                        Email Address <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. user@example.com"
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
                          <span>Checking & sending code...</span>
                        </>
                      ) : (
                        <span>Send Verification Code</span>
                      )}
                    </Button>
                  </Form>

                  <div className="text-center mt-4">
                    <Link to="/login" className="text-decoration-none small text-muted">
                      <FaArrowLeft className="me-1" /> Back to Login
                    </Link>
                  </div>
                </>
              )}

              {step === 2 && (
                <OtpVerificationForm
                  email={email}
                  title="OTP Verification"
                  onVerify={handleVerifyOtp}
                  onResend={handleResendOtp}
                  onBack={() => setStep(1)}
                  backLabel="Re-enter email"
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
                    <h2 className="fw-bold text-dark mb-1">Reset Password</h2>
                    <p className="text-muted small">
                      Account: <strong>{targetUser?.email}</strong>. Please enter your new password.
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
                        New Password <span className="text-danger">*</span>
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="6 to 18 characters"
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
                          title={showNewPassword ? "Hide password" : "Show password"}
                          aria-label={showNewPassword ? "Hide password" : "Show password"}
                          tabIndex={-1}
                        >
                          {showNewPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="fw-semibold text-dark">
                        Confirm New Password <span className="text-danger">*</span>
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
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
                          <span>Updating password...</span>
                        </>
                      ) : (
                        <span>Save New Password</span>
                      )}
                    </Button>
                  </Form>

                  <div className="text-center mt-4">
                    <Link to="/login" className="text-decoration-none small text-muted">
                      <FaArrowLeft className="me-1" /> Back to Login
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
