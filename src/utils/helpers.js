// CONSTANTS
export const API_BASE_URL = 'http://localhost:5000';

export const ORDER_STATUS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  SHIPPING: 'Shipping',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
};

export const USER_ROLES = {
  ADMIN: 'admin',
  CUSTOMER: 'customer',
};

export const BOOK_STATUS = {
  ACTIVE: 'Active',
  OUT_OF_STOCK: 'Out of Stock',
  INACTIVE: 'Inactive',
};

export const CATEGORY_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

export const VOUCHER_STATUS = {
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  INACTIVE: 'Inactive',
};

// FORMATTERS
// Dùng local time (YYYY-MM-DD) theo múi giờ địa phương để tránh lệch ngày
export const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Format tiền tệ chuẩn quốc tế có dấu phẩy ngăn cách hàng nghìn ($10,000.00)
export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const truncateText = (text, maxLength = 80) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// VALIDATORS
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.trim().replace(/^(\+84)/, '0');
  return /^(0[35789])[0-9]{8}$/.test(cleaned);
};

export const isValidPassword = (password) => {
  return typeof password === 'string' && password.length >= 6 && password.length <= 18;
};

export const isValidFullName = (name) => {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const isLettersOnly = /^[\p{L}\s]+$/u.test(trimmed);
  return isLettersOnly && words.length >= 2 && trimmed.length >= 3;
};

export const isValidAddress = (address) => {
  if (!address || typeof address !== 'string') return false;
  const trimmed = address.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  return words.length >= 2 && trimmed.length >= 5;
};

// Chuẩn hóa loại bỏ dấu tiếng Việt để tìm kiếm linh hoạt (gõ không dấu vẫn tìm ra)
export const removeVietnameseTones = (str = '') => {
  if (!str || typeof str !== 'string') return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
};

// Kiểm tra chuỗi có khớp tìm kiếm (hỗ trợ cả có dấu lẫn không dấu, không phân biệt hoa thường)
export const matchesSearch = (text = '', query = '') => {
  if (!query || !query.trim()) return true;
  const rawQ = query.toLowerCase().trim();
  const toneQ = removeVietnameseTones(query);
  const rawT = (text || '').toLowerCase();
  const toneT = removeVietnameseTones(text || '');
  return rawT.includes(rawQ) || toneT.includes(toneQ);
};

// AUTH & USERS
export const formatUserDisplayName = (user) => {
  if (!user) return 'Guest';
  return user.name || user.fullName || user.username || user.email?.split('@')[0] || 'User';
};

// REVIEWS & RATINGS
export const calculateAverageRating = (reviews = []) => {
  if (!reviews || !reviews.length) return 0;
  const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
  return Number((sum / reviews.length).toFixed(2));
};

export const getRatingBreakdown = (reviews = []) => {
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  if (!reviews) return breakdown;
  reviews.forEach((r) => {
    const stars = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 0)));
    breakdown[stars] = (breakdown[stars] || 0) + 1;
  });
  return breakdown;
};

// FILTERS
export const filterBooks = (books = [], { category, search, minPrice, maxPrice, sort } = {}) => {
  let result = [...books];
  if (category && category !== 'All') {
    if (category === 'uncategorized') {
      result = result.filter((b) => !b.categoryId || b.categoryId === '' || b.categoryId === 'uncategorized');
    } else {
      result = result.filter((b) => String(b.categoryId) === String(category) || b.category === category);
    }
  }
  if (search) {
    result = result.filter(
      (b) => matchesSearch(b.title, search) || matchesSearch(b.author, search)
    );
  }
  if (minPrice != null && minPrice !== '') {
    result = result.filter((b) => Number(b.price) >= Number(minPrice));
  }
  if (maxPrice != null && maxPrice !== '') {
    result = result.filter((b) => Number(b.price) <= Number(maxPrice));
  }
  if (sort === 'price-asc') {
    result.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sort === 'price-desc') {
    result.sort((a, b) => Number(b.price) - Number(a.price));
  } else if (sort === 'rating') {
    result.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
  } else if (sort === 'name-asc') {
    result.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'vi', { sensitivity: 'base' }));
  } else if (sort === 'name-desc') {
    result.sort((a, b) => (b.title || '').localeCompare(a.title || '', 'vi', { sensitivity: 'base' }));
  }
  return result;
};

