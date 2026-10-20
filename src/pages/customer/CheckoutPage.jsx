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

  const validateAndApplyVoucher = (voucher) => {
    setVoucherError("");

    if (!voucher || voucher.isDeleted || voucher.status === "Inactive") {
      const msg = "Mã giảm giá này hiện không còn áp dụng.";
      setVoucherError(msg);
      return false;
    }

    if (usedVoucherIds.has(String(voucher.id))) {
      const msg = "Bạn đã sử dụng mã giảm giá này ở đơn hàng trước rồi.";
      setVoucherError(msg);
      return false;
    }

    if (voucher.status === "Expired" || (voucher.expirationDate && isVoucherExpired(voucher.expirationDate))) {
      const msg = "Mã giảm giá này đã hết hạn sử dụng.";
      setVoucherError(msg);
      return false;
    }

    if (voucher.usageLimit && Number(voucher.used || 0) >= Number(voucher.usageLimit)) {
      const msg = "Mã giảm giá này đã hết lượt sử dụng.";
      setVoucherError(msg);
      return false;
    }

    if (!isVoucherValid(voucher)) {
      const msg = "Mã giảm giá không hợp lệ hoặc không còn áp dụng được.";
      setVoucherError(msg);
      return false;
    }

    if (totalPrice < Number(voucher.minOrderValue || 0)) {
      const msg = `Đơn hàng tối thiểu để áp dụng mã này là ${formatCurrency(voucher.minOrderValue)}. Giá trị giỏ hàng hiện tại: ${formatCurrency(totalPrice)}.`;
      setVoucherError(msg);
      return false;
    }

    const calculatedDiscount = calculateDiscount(totalPrice, voucher);
    setDiscount(calculatedDiscount);
    setAppliedVoucher(voucher);
    toast.success(`Đã áp dụng mã giảm giá "${voucher.code}" thành công!`);
    return true;
  };

  const handleApplyVoucher = () => {
    const trimmed = voucherCode.trim().toUpperCase();
    if (!trimmed) {
      setVoucherError("Vui lòng nhập mã giảm giá trước khi nhấn áp dụng.");
      return;
    }

    const matched = allVouchers.find(
      (v) => (v.code || "").toUpperCase() === trimmed
    );

    if (!matched) {
      setVoucherError(`Mã giảm giá "${trimmed}" không tồn tại trên hệ thống.`);
      return;
    }

    validateAndApplyVoucher(matched);
  };

  const handleSelectVoucher = (voucher) => {
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
      </div>

      {error && (
        <Alert variant="danger" className="mb-4" dismissible onClose={() => setError("")}>
          <div className="d-flex align-items-center pe-3">
            <FaExclamationCircle className="me-2 flex-shrink-0" />
            <div>{error}</div>
          </div>
        </Alert>
      )}

      <Row className="g-4 mb-4 align-items-start">
        {/* CỘT TRÁI (50%): THÔNG TIN GIAO HÀNG & MÃ GIẢM GIÁ */}
        <Col lg={6}>
          {/* KHỐI 1: THÔNG TIN NGƯỜI NHẬN HÀNG */}
          <Card className="shadow-sm border-0 bg-white mb-4">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center mb-3">
                <FaTruck className="text-primary me-2 fs-5" />
                <h5 className="fw-bold mb-0 text-dark">Thông tin người nhận hàng</h5>
              </div>

              {shippingError && (
                <Alert
                  variant="danger"
                  className="mb-3"
                  dismissible
                  onClose={() => setShippingError("")}
                >
                  <div className="d-flex align-items-center pe-3">
                    <FaExclamationCircle className="me-2 flex-shrink-0" />
                    <div>{shippingError}</div>
                  </div>
                </Alert>
              )}

              <Form noValidate>
                <Row className="g-3 mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark">
                        Họ và tên người nhận <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={shippingInfo.name}
                        onChange={handleShippingChange}
                        placeholder="Nguyễn Văn A"
                        isInvalid={Boolean(fieldErrors.name)}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {fieldErrors.name}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark">
                        Số điện thoại <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={shippingInfo.phone}
                        onChange={handleShippingChange}
                        placeholder="0912345678"
                        isInvalid={Boolean(fieldErrors.phone)}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {fieldErrors.phone}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-0">
                  <Form.Label className="fw-semibold text-dark">
                    Địa chỉ giao hàng <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="address"
                    value={shippingInfo.address}
                    onChange={handleShippingChange}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..."
                    isInvalid={Boolean(fieldErrors.address)}
                    required
                    style={{ resize: "vertical" }}
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.address}
                  </Form.Control.Feedback>
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>

          {/* KHỐI 2: MÃ GIẢM GIÁ */}
          <Card className="shadow-sm border-0 bg-white">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center mb-3">
                <FaTag className="text-primary me-2 fs-5" />
                <h5 className="fw-bold mb-0 text-dark">Mã giảm giá</h5>
              </div>

              {voucherError && (
                <Alert
                  variant="danger"
                  className="py-2 mb-3"
                  dismissible
                  onClose={() => setVoucherError("")}
                >
                  <div className="d-flex align-items-center pe-3">
                    <FaExclamationCircle className="me-2 flex-shrink-0" />
                    <div>{voucherError}</div>
                  </div>
                </Alert>
              )}

              <div className="d-flex gap-2 mb-3 align-items-center w-100">
                <Form.Control
                  type="text"
                  placeholder="Nhập mã giảm giá"
                  value={voucherCode}
                  onChange={(e) => {
                    setVoucherCode(e.target.value.toUpperCase());
                    if (voucherError) setVoucherError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyVoucher();
                    }
                  }}
                  disabled={Boolean(appliedVoucher)}
                  className="flex-grow-1 text-uppercase"
                />
                {appliedVoucher ? (
                  <Button
                    type="button"
                    variant="outline-danger"
                    onClick={handleRemoveVoucher}
                    className="text-nowrap px-4"
                  >
                    Gỡ mã
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleApplyVoucher}
                    className="text-nowrap px-4"
                  >
                    Áp dụng
                  </Button>
                )}
              </div>

              {appliedVoucher && (
                <Alert variant="success" className="py-2 d-flex align-items-center mb-3">
                  <FaCheckCircle className="me-2 text-success flex-shrink-0" />
                  <strong className="text-dark">Đã áp dụng mã: {appliedVoucher.code}</strong>
                  <span className="ms-2 text-success fw-bold">(-{formatCurrency(discount)})</span>
                </Alert>
              )}

              {!appliedVoucher && availableVouchers.length > 0 && (
                <>
                  <h6 className="fw-bold mt-3 mb-2 text-dark">Mã giảm giá khả dụng</h6>
                  <ListGroup>
                    {availableVouchers.map((voucher) => {
                      const meetsMinOrder = totalPrice >= Number(voucher.minOrderValue || 0);
    </Container>
  );
};

export default CheckoutPage;
