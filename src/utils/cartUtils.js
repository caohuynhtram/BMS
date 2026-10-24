/**
 * Tính giá trị giảm giá dựa trên voucher (không vượt quá tổng tiền hàng)
 */
export const calculateDiscount = (totalAmount, voucher) => {
  if (!voucher) return 0;
  const value = Number(voucher.value ?? voucher.discount) || 0;
  const minOrder = Number(voucher.minOrderValue ?? voucher.minSpend) || 0;

  if (minOrder && totalAmount < minOrder) return 0;

  let discount;
  if (voucher.type === 'percentage' || voucher.type === 'percent') {
    const raw = (totalAmount * value) / 100;
    discount = voucher.maxDiscount ? Math.min(raw, voucher.maxDiscount) : raw;
  } else {
    discount = value;
  }

  // Giảm tối đa không vượt subtotal và làm tròn 2 chữ số thập phân
  const capped = Math.min(discount, totalAmount);
  return Math.round(capped * 100) / 100;
};

export const calculateOrderTotal = (subtotal = 0, shippingFee = 0, discount = 0) => {
  const total = Math.max(0, Number(subtotal) + Number(shippingFee) - Number(discount));
  return Math.round(total * 100) / 100;
};

/**
 * Kiểm tra voucher hết hạn — hết hạn cuối ngày 23:59:59 giờ Việt Nam (UTC+7).
 * Nếu không có ngày hết hạn (bỏ trống/null) -> không bao giờ hết hạn.
 */
export const isVoucherExpired = (expirationDate) => {
  if (!expirationDate) return false;

  const dateStr = String(expirationDate).trim();
  if (!dateStr) return false;

  let expiryTime;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    expiryTime = new Date(`${dateStr}T23:59:59.999+07:00`).getTime();
  } else {
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return false;
    parsed.setHours(23, 59, 59, 999);
    expiryTime = parsed.getTime();
  }

  return Date.now() > expiryTime;
};

/**
 * Kiểm tra voucher có hợp lệ để áp dụng không (chưa xóa, đang kích hoạt, còn hạn và còn lượt dùng)
 */
export const isVoucherValid = (voucher) => {
  if (!voucher) return false;
  if (voucher.isDeleted) return false;
  if (voucher.status === 'Inactive') return false;
  if (voucher.expirationDate && isVoucherExpired(voucher.expirationDate)) return false;
  if (voucher.usageLimit && Number(voucher.used || 0) >= Number(voucher.usageLimit)) return false;
  return true;
};
