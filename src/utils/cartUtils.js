export const calculateDiscount = (totalAmount, voucher) => {
  if (!voucher || !voucher.discount) return 0;
  if (voucher.minSpend && totalAmount < voucher.minSpend) return 0;
  if (voucher.type === 'percent') {
    const discount = (totalAmount * voucher.discount) / 100;
    return voucher.maxDiscount ? Math.min(discount, voucher.maxDiscount) : discount;
  }
  return Math.min(voucher.discount, totalAmount);
};

export const calculateOrderTotal = (subtotal = 0, shippingFee = 0, discount = 0) => {
  return Math.max(0, subtotal + shippingFee - discount);
};
