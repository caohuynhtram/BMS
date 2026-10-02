// Validation helper functions
export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidPhone = (phone) => {
  return /(84|0[3|5|7|8|9])+([0-9]{8})\b/.test(phone);
};

export const isStrongPassword = (password) => {
  return typeof password === 'string' && password.length >= 6;
};
