import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { Form, Button, Alert, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { FaShieldAlt, FaArrowLeft, FaRedo, FaCheckCircle } from "react-icons/fa";
import { maskEmail } from "../utils/emailService";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

const OtpVerificationForm = ({
  email,
  onVerify,
  onResend,
  onBack,
  backLabel = "Back to edit details",
  title = "OTP Verification",
  showLoginLink = true,
}) => {
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(""));
  // Sử dụng ref song song để luôn đồng bộ trạng thái mới nhất tức thì, tránh lỗi stale closure khi gõ phím nhanh
  const digitsRef = useRef(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SECONDS);
  const inputRefs = useRef([]);

  const updateDigits = (newDigits) => {
    digitsRef.current = newDigits;
    setOtpDigits([...newDigits]);
    if (error) setError("");
  };

  // Tự động focus vào ô đầu tiên khi component được mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
      inputRefs.current[0]?.select();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Bộ đếm thời gian 60 giây cho nút Gửi lại OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  // Chống nhảy cóc: Nếu click/focus vào ô phía sau trong khi các ô trước còn trống -> kéo về ô trống đầu tiên
  const handleFocus = (index) => {
    const firstEmptyIndex = digitsRef.current.findIndex((d) => !d);
    if (firstEmptyIndex !== -1 && index > firstEmptyIndex) {
      inputRefs.current[firstEmptyIndex]?.focus();
      inputRefs.current[firstEmptyIndex]?.select();
      return;
    }
    inputRefs.current[index]?.select();
  };

  // Xử lý sự kiện nhấn phím trực tiếp: điền tuần tự, xóa lùi dồn mảng, không bao giờ để lỗ trống ở giữa
  const handleKeyDown = (index, e) => {
    // 1. Nhập chữ số (0 - 9)
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      const firstEmptyIndex = digitsRef.current.findIndex((d) => !d);
      const targetIndex = firstEmptyIndex !== -1 && firstEmptyIndex < index ? firstEmptyIndex : index;

      const next = [...digitsRef.current];
      next[targetIndex] = e.key;
      updateDigits(next);

      // Tự động chuyển và bôi đen ô kế tiếp
      if (targetIndex < OTP_LENGTH - 1) {
        inputRefs.current[targetIndex + 1]?.focus();
        inputRefs.current[targetIndex + 1]?.select();
      }
      return;
    }

    // 2. Phím Backspace (Xóa lùi: xóa và dồn số, bảo toàn tính liên tục)
    if (e.key === "Backspace") {
      e.preventDefault();
      const currentDigits = [...digitsRef.current];

      if (currentDigits[index]) {
        // Xóa ký tự tại ô hiện tại và dồn mảng về trước
        currentDigits.splice(index, 1);
        currentDigits.push("");
        updateDigits(currentDigits);
      } else if (index > 0) {
        // Nếu ô hiện tại trống -> lùi về ô trước xóa và focus ô trước
        currentDigits.splice(index - 1, 1);
        currentDigits.push("");
        updateDigits(currentDigits);
        inputRefs.current[index - 1]?.focus();
      }
      return;
    }

    // 3. Phím Delete (Xóa tại chỗ và dồn số)
    if (e.key === "Delete") {
      e.preventDefault();
      const currentDigits = [...digitsRef.current];
      if (currentDigits[index]) {
        currentDigits.splice(index, 1);
        currentDigits.push("");
        updateDigits(currentDigits);
      }
      return;
    }

    // 4. Phím mũi tên trái / phải
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
      inputRefs.current[index - 1]?.select();
      return;
    }
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      e.preventDefault();
      const firstEmptyIndex = digitsRef.current.findIndex((d) => !d);
      if (firstEmptyIndex === -1 || index < firstEmptyIndex) {
        inputRefs.current[index + 1]?.focus();
        inputRefs.current[index + 1]?.select();
      }
      return;
    }
  };

  // Fallback onChange cho bàn phím ảo (mobile) hoặc autofill
  const handleDigitChange = (index, e) => {
    const val = e.target.value;
    const cleaned = val.replace(/\D/g, "");
    if (!cleaned) {
      const currentDigits = [...digitsRef.current];
      if (currentDigits[index]) {
        currentDigits.splice(index, 1);
        currentDigits.push("");
        updateDigits(currentDigits);
      }
      return;
    }

    // Nếu paste hoặc autofill nhiều ký tự
    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, OTP_LENGTH).split("");
      const next = Array(OTP_LENGTH).fill("");
      chars.forEach((c, i) => {
        next[i] = c;
      });
      updateDigits(next);
      const nextFocus = Math.min(OTP_LENGTH - 1, chars.length);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    // Nhập 1 chữ số: đảm bảo không bỏ trống ô phía trước
    const firstEmptyIndex = digitsRef.current.findIndex((d) => !d);
    const targetIndex = firstEmptyIndex !== -1 && firstEmptyIndex < index ? firstEmptyIndex : index;
    const next = [...digitsRef.current];
    next[targetIndex] = cleaned;
    updateDigits(next);
    if (targetIndex < OTP_LENGTH - 1) {
      inputRefs.current[targetIndex + 1]?.focus();
      inputRefs.current[targetIndex + 1]?.select();
    }
  };

  // Hỗ trợ dán (paste) 6 chữ số từ Clipboard vào bất kỳ ô nào
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;

    const chars = pasted.split("");
    const next = Array(OTP_LENGTH).fill("");
    chars.forEach((c, i) => {
      next[i] = c;
    });
    updateDigits(next);

    const focusIndex = Math.min(OTP_LENGTH - 1, chars.length);
    inputRefs.current[focusIndex]?.focus();
  };

  // Xác nhận OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const enteredOtp = digitsRef.current.join("");
    if (enteredOtp.length < OTP_LENGTH) {
      setError(`Please enter all ${OTP_LENGTH} digits of the OTP verification code.`);
      return;
    }

    setVerifying(true);
    try {
      const result = await onVerify(enteredOtp);
      if (result && result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(err?.message || "An error occurred while verifying the OTP code.");
    } finally {
      setVerifying(false);
    }
  };

  // Gửi lại OTP
  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setError("");
    setResending(true);
    try {
      await onResend();
      setCountdown(RESEND_COOLDOWN_SECONDS);
      updateDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err?.message || "Failed to resend OTP code. Please try again later.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-4">
        <div
          className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle mb-3"
          style={{ width: "70px", height: "70px" }}
        >
          <FaShieldAlt className="text-primary fs-2" />
        </div>
        <h2 className="fw-bold text-dark mb-2">{title}</h2>
        <p className="text-muted small mb-1">
          A {OTP_LENGTH}-digit OTP verification code has been sent to
        </p>
        <p className="fw-bold text-dark fs-6 mb-2">
          {maskEmail(email)}
        </p>
        <p className="text-muted small" style={{ fontSize: "0.85rem" }}>
          Please check your inbox (or Spam/Junk folder) and enter the code valid for <strong>5 minutes</strong>.
        </p>
      </div>

      {error && (
        <Alert variant="danger" className="py-2 mb-3 text-center small" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Form onSubmit={handleSubmit} noValidate>
        <Form.Group className="mb-4">
          <Form.Label className="fw-semibold text-dark d-block text-center mb-3">
            Enter OTP code (6 digits)
          </Form.Label>
          <div
            className="d-flex justify-content-center gap-2 mb-2 flex-nowrap"
            onPaste={handlePaste}
          >
            {otpDigits.map((digit, idx) => (
              <Form.Control
                key={`otp-digit-${idx}`}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onFocus={() => handleFocus(idx)}
                onClick={() => handleFocus(idx)}
                disabled={verifying}
                className="text-center fw-bold fs-4 shadow-sm"
                style={{
                  width: "48px",
                  height: "54px",
                  borderRadius: "8px",
                  border: digit ? "2px solid #2563eb" : "1px solid #ced4da",
                  backgroundColor: digit ? "#f0f7ff" : "#ffffff",
                  maxWidth: "14%",
                }}
                autoComplete={idx === 0 ? "one-time-code" : "off"}
              />
            ))}
          </div>
        </Form.Group>

        <Button
          type="submit"
          variant="primary"
          className="w-100 py-2 fw-bold mb-3 d-flex align-items-center justify-content-center"
          disabled={verifying || otpDigits.join("").length < OTP_LENGTH}
        >
          {verifying ? (
            <>
              <Spinner size="sm" animation="border" className="me-2" />
              <span>Verifying code...</span>
            </>
          ) : (
            <>
              <FaCheckCircle className="me-2" />
              <span>Verify OTP Code</span>
            </>
          )}
        </Button>

        <div className="text-center mb-3">
          {countdown > 0 ? (
            <span className="text-muted small">
              Didn't receive the code? Resend in <strong className="text-primary">{countdown}s</strong>
            </span>
          ) : (
            <Button
              variant="link"
              size="sm"
              onClick={handleResend}
              disabled={resending}
              className="text-decoration-none fw-semibold p-0"
            >
              {resending ? (
                <>
                  <Spinner size="sm" animation="border" className="me-1" />
                  <span>Resending code...</span>
                </>
              ) : (
                <>
                  <FaRedo className="me-1" />
                  <span>Didn't receive code? Resend OTP</span>
                </>
              )}
            </Button>
          )}
        </div>

        {onBack && (
          <div className="text-center mb-2">
            <Button
              variant="link"
              size="sm"
              onClick={onBack}
              className="text-decoration-none text-secondary"
            >
              <FaArrowLeft className="me-1" /> {backLabel}
            </Button>
          </div>
        )}

        {showLoginLink && (
          <div className="text-center mt-3 pt-3 border-top">
            <Link to="/login" className="text-decoration-none small text-muted">
              Already have an account? <strong className="text-primary">Log In</strong>
            </Link>
          </div>
        )}
      </Form>
    </div>
  );
};

OtpVerificationForm.propTypes = {
  email: PropTypes.string.isRequired,
  onVerify: PropTypes.func.isRequired,
  onResend: PropTypes.func.isRequired,
  onBack: PropTypes.func,
  backLabel: PropTypes.string,
  title: PropTypes.string,
  showLoginLink: PropTypes.bool,
};

export default OtpVerificationForm;
