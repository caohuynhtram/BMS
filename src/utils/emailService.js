import emailjs from "@emailjs/browser";

/**
 * Sinh mã OTP ngẫu nhiên gồm 6 chữ số (từ 100000 đến 999999)
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Ẩn một phần địa chỉ email để bảo vệ quyền riêng tư
 * Ví dụ: "wtskane@gmail.com" -> "wt***ne@gmail.com"
 *        "user@gmail.com"    -> "u***r@gmail.com"
 */
export const maskEmail = (email = "") => {
  if (!email || typeof email !== "string" || !email.includes("@")) return email;
  const [localPart, domain] = email.split("@");
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  if (localPart.length <= 4) {
    return `${localPart[0]}***${localPart.slice(-1)}@${domain}`;
  }
  return `${localPart.slice(0, 2)}***${localPart.slice(-2)}@${domain}`;
};

/**
 * Kiểm tra xem các biến môi trường EmailJS đã được cấu hình hay chưa
 */
export const isEmailJsConfigured = () => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) return false;
  if (
    serviceId.includes("service_infinia") ||
    templateId.includes("template_infinia") ||
    publicKey.includes("your_public_key")
  ) {
    return false;
  }
  return true;
};

/**
 * Gửi mã OTP xác thực trực tiếp qua EmailJS đến Gmail người dùng
 * @param {Object} params
 * @param {string} params.toEmail - Địa chỉ Gmail người nhận
 * @param {string} params.toName - Tên người nhận
 * @param {string} params.otpCode - Mã OTP gồm 6 chữ số
 * @param {'register' | 'forgot_password'} params.type - Loại xác thực
 */
export const sendOtpEmail = async ({ toEmail, toName, otpCode, type = "register" }) => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    throw new Error(
      "Missing EmailJS configuration in .env (VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY)."
    );
  }

  if (!isEmailJsConfigured()) {
    throw new Error(
      "Please update valid EmailJS credentials (Service ID, Template ID, Public Key) in .env to send emails."
    );
  }

  const subject =
    type === "register"
      ? "Verify your INFINIA STORE account"
      : "Reset Password Verification - INFINIA STORE";

  const templateParams = {
    to_email: toEmail.trim(),
    email: toEmail.trim(),
    recipient_email: toEmail.trim(),
    to_name: toName || toEmail.split("@")[0],
    user_name: toName || toEmail.split("@")[0],
    name: toName || toEmail.split("@")[0],
    otp_code: otpCode,
    otp: otpCode,
    passcode: otpCode,
    code: otpCode,
    subject: subject,
    title: subject,
    expiry_time: "5 minutes",
    brand_name: "INFINIA STORE",
    company_name: "INFINIA STORE",
    support_email: "support@infiniastore.vn",
    current_year: new Date().getFullYear(),
  };

  try {
    const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
    return response;
  } catch (error) {
    console.error("EmailJS Send Error:", error);
    const errorMsg =
      error?.text ||
      error?.message ||
      "Could not send email via EmailJS. Please check your network connection or configuration.";
    throw new Error(errorMsg, { cause: error });
  }
};

