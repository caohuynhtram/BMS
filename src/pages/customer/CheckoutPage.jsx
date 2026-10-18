import { useState, useEffect, useMemo, useRef } from "react";
import { Container, Row, Col, Card, Form, Button, Alert, Badge, ListGroup } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { clearCart, syncCartToApi } from "../../redux/cartSlice";
import { createOrder } from "../../redux/orderSlice";
import { updateProfile } from "../../redux/authSlice";
import voucherApi from "../../api/voucherApi";
import bookApi from "../../api/bookApi";
import orderApi from "../../api/orderApi";
import authApi from "../../api/authApi";
import { isValidFullName, isValidPhone, isValidAddress, formatCurrency } from "../../utils/helpers";
import { isVoucherExpired, calculateDiscount, calculateOrderTotal, isVoucherValid } from "../../utils/cartUtils";
import { toast } from "react-toastify";
import { FaTag, FaCheckCircle, FaArrowLeft, FaExclamationCircle, FaTruck } from "react-icons/fa";

const CheckoutPage = () => {
  const { items, totalPrice } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isOrderPlacedRef = useRef(false);

  const [shippingInfo, setShippingInfo] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });
  const [voucherCode, setVoucherCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [allVouchers, setAllVouchers] = useState([]);
  const [usedVoucherIds, setUsedVoucherIds] = useState(new Set());
  const [error, setError] = useState("");
  const [shippingError, setShippingError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [voucherError, setVoucherError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOrderPlacedRef.current && (!items || items.length === 0)) {
      navigate("/cart");
    }
  }, [items, navigate]);

  useEffect(() => {
    let isMounted = true;
    const fetchVouchersAndHistory = async () => {
      try {
        const [voucherRes, ordersRes] = await Promise.all([
          voucherApi.getAll(),
          user?.id ? orderApi.getByUser(user.id) : Promise.resolve({ data: [] }),
        ]);

        if (!isMounted) return;

        const usedIds = new Set(
          (ordersRes.data || [])
            .filter((o) => o.status !== "Cancelled" && o.voucherId)
            .map((o) => String(o.voucherId))
        );
        setUsedVoucherIds(usedIds);

        const rawVouchers = voucherRes.data || [];
        setAllVouchers(rawVouchers);

        const valid = rawVouchers.filter((v) => {
          const notUsedByUser = !usedIds.has(String(v.id));
          return isVoucherValid(v) && notUsedByUser;
        });
        setAvailableVouchers(valid);
      } catch (err) {
        console.error("Failed to fetch vouchers:", err);
      }
    };
    fetchVouchersAndHistory();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const finalPrice = useMemo(() => {
    return calculateOrderTotal(totalPrice, 0, discount);
  }, [totalPrice, discount]);

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (shippingError) {
      setShippingError("");
    }
  };

    setVoucherCode(voucher.code);
    validateAndApplyVoucher(voucher);
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setDiscount(0);
    setVoucherCode("");
    setVoucherError("");
    toast.info("Đã gỡ mã giảm giá khỏi đơn hàng.");
  };

  useEffect(() => {
    if (appliedVoucher) {
      if (totalPrice < Number(appliedVoucher.minOrderValue || 0)) {
        setAppliedVoucher(null);
        setDiscount(0);
        setVoucherError(
          `Mã "${appliedVoucher.code}" đã bị hủy vì giá trị đơn hàng (${formatCurrency(totalPrice)}) không còn đạt mức tối thiểu ${formatCurrency(appliedVoucher.minOrderValue)}.`
        );
      } else {
        const recalculated = calculateDiscount(totalPrice, appliedVoucher);
        setDiscount(recalculated);
      }
    }
  }, [totalPrice, appliedVoucher]);

  const handlePlaceOrder = async () => {
    if (loading || !items || items.length === 0) return;
    setError("");
    setShippingError("");
    const newFieldErrors = {};

    if (!shippingInfo.name.trim() || !shippingInfo.phone.trim() || !shippingInfo.address.trim()) {
      if (!shippingInfo.name.trim()) newFieldErrors.name = "Vui lòng nhập họ và tên người nhận.";
      if (!shippingInfo.phone.trim()) newFieldErrors.phone = "Vui lòng nhập số điện thoại người nhận.";
      if (!shippingInfo.address.trim()) newFieldErrors.address = "Vui lòng nhập địa chỉ nhận hàng.";
      setFieldErrors(newFieldErrors);
      setShippingError("Vui lòng điền đầy đủ tất cả thông tin nhận hàng.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!isValidFullName(shippingInfo.name)) {
      newFieldErrors.name = "Họ và tên phải có ít nhất 2 từ và chỉ bao gồm chữ cái.";
      setFieldErrors(newFieldErrors);
      setShippingError("Họ và tên người nhận hàng chưa hợp lệ.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!isValidPhone(shippingInfo.phone)) {
      newFieldErrors.phone = "Số điện thoại không hợp lệ (cần đúng 10 chữ số, VD: 0912345678).";
      setFieldErrors(newFieldErrors);
      setShippingError("Số điện thoại nhận hàng không hợp lệ (cần 10 chữ số).");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!isValidAddress(shippingInfo.address)) {
      newFieldErrors.address = "Địa chỉ nhận hàng phải có ít nhất 2 từ chi tiết.";
      setFieldErrors(newFieldErrors);
      setShippingError("Địa chỉ nhận hàng chưa hợp lệ (phải có ít nhất 2 từ).");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setFieldErrors({});

    setLoading(true);

    try {
      const booksRes = await bookApi.getAll();
      const currentBooks = booksRes.data || [];

      for (const item of items) {
        const bookOnServer = currentBooks.find((b) => String(b.id) === String(item.bookId));
        if (!bookOnServer || bookOnServer.isDeleted || bookOnServer.status === "Inactive") {
          const msg = `Cuốn sách "${item.title}" hiện đã ngừng kinh doanh. Vui lòng quay lại giỏ hàng để cập nhật.`;
          setError(msg);
          window.scrollTo({ top: 0, behavior: "smooth" });
          setLoading(false);
          return;
        }
        if (bookOnServer.stock <= 0 || bookOnServer.status === "Out of Stock") {
          const msg = `Cuốn sách "${item.title}" hiện đã hết hàng. Vui lòng quay lại giỏ hàng để bỏ sản phẩm này trước khi thanh toán.`;
          setError(msg);
          window.scrollTo({ top: 0, behavior: "smooth" });
          setLoading(false);
          return;
        }
        if (Number(bookOnServer.price) !== Number(item.price)) {
          const msg = `Giá cuốn "${item.title}" vừa cập nhật từ ${formatCurrency(item.price)} sang ${formatCurrency(bookOnServer.price)}. Vui lòng xem lại giỏ hàng.`;
          setError(msg);
          window.scrollTo({ top: 0, behavior: "smooth" });
          setLoading(false);
          return;
        }
        if (item.quantity > bookOnServer.stock) {
          const msg = `Sách "${item.title}" chỉ còn ${bookOnServer.stock} cuốn trong kho. Vui lòng giảm số lượng đặt mua trong giỏ.`;
          setError(msg);
          window.scrollTo({ top: 0, behavior: "smooth" });
          setLoading(false);
          return;
        }
      }

      if (appliedVoucher) {
        try {
          const vFreshRes = await voucherApi.getAll();
          const vFresh = (vFreshRes.data || []).find((v) => String(v.id) === String(appliedVoucher.id));
          if (!vFresh || !isVoucherValid(vFresh)) {
            const msg = `Mã giảm giá "${appliedVoucher.code}" vừa hết hạn hoặc không còn hiệu lực. Vui lòng kiểm tra lại.`;
            setError(msg);
            setAppliedVoucher(null);
            setDiscount(0);
            window.scrollTo({ top: 0, behavior: "smooth" });
            setLoading(false);
            return;
          }
        } catch (vErr) {
          console.error("Voucher re-verification failed:", vErr);
        }
      }

      const orderPayload = {
        userId: user.id,
        items,
        subtotal: totalPrice,
        discountAmount: discount,
        totalPrice: finalPrice,
        voucherId: appliedVoucher ? appliedVoucher.id : null,
        recipientName: shippingInfo.name.trim(),
        phone: shippingInfo.phone.trim(),
        shippingAddress: shippingInfo.address.trim(),
      };

      const resultAction = await dispatch(createOrder(orderPayload));

      if (createOrder.fulfilled.match(resultAction)) {
        isOrderPlacedRef.current = true;
        // Tự động lưu địa chỉ mới vào profile người dùng nếu có thay đổi
        if (user?.id && shippingInfo.address.trim() && shippingInfo.address.trim() !== (user.address || "").trim()) {
          try {
            await authApi.updateProfile(user.id, { address: shippingInfo.address.trim() });
            dispatch(updateProfile({ address: shippingInfo.address.trim() }));
          } catch (addrErr) {
            console.error("Auto-sync address failed:", addrErr);
          }
        }
        dispatch(clearCart());
        if (user?.id) {
          await dispatch(syncCartToApi({ userId: user.id, items: [] }));
        }
        toast.success("Đặt hàng thành công! Cảm ơn bạn đã mua sắm tại Infinia Store.");
        navigate(`/orders/${resultAction.payload.id}`);
      } else {
        const msg = resultAction.payload || "Đặt hàng chưa thành công. Vui lòng thử lại sau.";
        setError(msg);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      const msg = "Đã xảy ra lỗi trong quá trình xử lý đơn hàng. Vui lòng thử lại sau.";
      setError(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    setLoading(false);
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="fw-bold mb-0 text-dark">Đặt hàng & Thanh toán</h2>
        <Button
          as={Link}
          to="/cart"
          variant="outline-secondary"
          size="sm"
          className="btn-back d-inline-flex align-items-center"
        >
          <FaArrowLeft className="me-2 flex-shrink-0" />
          <span>Quay lại giỏ hàng</span>
        </Button>
    </Container>
  );
};

export default CheckoutPage;
