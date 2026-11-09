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
      const msg = "This voucher is no longer applicable.";
      setVoucherError(msg);
      return false;
    }

    if (usedVoucherIds.has(String(voucher.id))) {
      const msg = "You have already used this voucher on a previous order.";
      setVoucherError(msg);
      return false;
    }

    if (voucher.status === "Expired" || (voucher.expirationDate && isVoucherExpired(voucher.expirationDate))) {
      const msg = "This voucher has expired.";
      setVoucherError(msg);
      return false;
    }

    if (voucher.usageLimit && Number(voucher.used || 0) >= Number(voucher.usageLimit)) {
      const msg = "This voucher has reached its usage limit.";
      setVoucherError(msg);
      return false;
    }

    if (!isVoucherValid(voucher)) {
      const msg = "Invalid or inactive voucher code.";
      setVoucherError(msg);
      return false;
    }

    if (totalPrice < Number(voucher.minOrderValue || 0)) {
      const msg = `Minimum order value to apply this voucher is ${formatCurrency(voucher.minOrderValue)}. Current cart total: ${formatCurrency(totalPrice)}.`;
      setVoucherError(msg);
      return false;
    }

    const calculatedDiscount = calculateDiscount(totalPrice, voucher);
    setDiscount(calculatedDiscount);
    setAppliedVoucher(voucher);
    toast.success(`Voucher "${voucher.code}" applied successfully!`);
    return true;
  };

  const handleApplyVoucher = () => {
    const trimmed = voucherCode.trim().toUpperCase();
    if (!trimmed) {
      setVoucherError("Please enter a voucher code before applying.");
      return;
    }

    const matched = allVouchers.find(
      (v) => (v.code || "").toUpperCase() === trimmed
    );

    if (!matched) {
      setVoucherError(`Voucher code "${trimmed}" does not exist.`);
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
    toast.info("Voucher removed from order.");
  };

  useEffect(() => {
    if (appliedVoucher) {
      if (totalPrice < Number(appliedVoucher.minOrderValue || 0)) {
        setAppliedVoucher(null);
        setDiscount(0);
        setVoucherError(
          `Voucher "${appliedVoucher.code}" removed because order total (${formatCurrency(totalPrice)}) is below minimum spend ${formatCurrency(appliedVoucher.minOrderValue)}.`
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
      if (!shippingInfo.name.trim()) newFieldErrors.name = "Please enter recipient full name.";
      if (!shippingInfo.phone.trim()) newFieldErrors.phone = "Please enter recipient phone number.";
      if (!shippingInfo.address.trim()) newFieldErrors.address = "Please enter shipping address.";
      setFieldErrors(newFieldErrors);
      setShippingError("Please fill in all shipping details.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!isValidFullName(shippingInfo.name)) {
      newFieldErrors.name = "Full name must contain at least 2 words and only letters.";
      setFieldErrors(newFieldErrors);
      setShippingError("Recipient name is invalid.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!isValidPhone(shippingInfo.phone)) {
      newFieldErrors.phone = "Invalid phone number (must be 10 digits, e.g. 0912345678).";
      setFieldErrors(newFieldErrors);
      setShippingError("Recipient phone number is invalid (10 digits required).");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!isValidAddress(shippingInfo.address)) {
      newFieldErrors.address = "Shipping address must contain at least 2 words.";
      setFieldErrors(newFieldErrors);
      setShippingError("Shipping address is invalid (must have at least 2 words).");
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
          const msg = `"${item.title}" is discontinued. Please return to cart to update.`;
          setError(msg);
          window.scrollTo({ top: 0, behavior: "smooth" });
          setLoading(false);
          return;
        }
        if (bookOnServer.stock <= 0 || bookOnServer.status === "Out of Stock") {
          const msg = `"${item.title}" is out of stock. Please return to cart to remove it before checkout.`;
          setError(msg);
          window.scrollTo({ top: 0, behavior: "smooth" });
          setLoading(false);
          return;
        }
        if (Number(bookOnServer.price) !== Number(item.price)) {
          const msg = `Price for "${item.title}" was updated from ${formatCurrency(item.price)} to ${formatCurrency(bookOnServer.price)}. Please review your cart.`;
          setError(msg);
          window.scrollTo({ top: 0, behavior: "smooth" });
          setLoading(false);
          return;
        }
        if (item.quantity > bookOnServer.stock) {
          const msg = `Only ${bookOnServer.stock} copies of "${item.title}" in stock. Please adjust cart quantity.`;
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
            const msg = `Voucher "${appliedVoucher.code}" has expired or is no longer valid. Please check again.`;
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
        toast.success("Order placed successfully! Thank you for shopping with Infinia Store.");
        navigate(`/orders/${resultAction.payload.id}`);
      } else {
        const msg = resultAction.payload || "Order placement failed. Please try again later.";
        setError(msg);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      const msg = "An error occurred while processing your order. Please try again later.";
      setError(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    setLoading(false);
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="fw-bold mb-0 text-dark">Checkout & Payment</h2>
        <Button
          as={Link}
          to="/cart"
          variant="outline-secondary"
          size="sm"
          className="btn-back d-inline-flex align-items-center"
        >
          <FaArrowLeft className="me-2 flex-shrink-0" />
          <span>Back to Cart</span>
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
                <h5 className="fw-bold mb-0 text-dark">Shipping Information</h5>
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
                        Recipient Full Name <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={shippingInfo.name}
                        onChange={handleShippingChange}
                        placeholder="John Doe"
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
                        Phone Number <span className="text-danger">*</span>
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
                    Shipping Address <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="address"
                    value={shippingInfo.address}
                    onChange={handleShippingChange}
                    placeholder="Street address, ward/commune, district, city/province..."
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
                <h5 className="fw-bold mb-0 text-dark">Vouchers & Promo Codes</h5>
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
                  placeholder="Enter voucher code"
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
                    Remove
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleApplyVoucher}
                    className="text-nowrap px-4"
                  >
                    Apply
                  </Button>
                )}
              </div>

              {appliedVoucher && (
                <Alert variant="success" className="py-2 d-flex align-items-center mb-3">
                  <FaCheckCircle className="me-2 text-success flex-shrink-0" />
                  <strong className="text-dark">Voucher applied: {appliedVoucher.code}</strong>
                  <span className="ms-2 text-success fw-bold">(-{formatCurrency(discount)})</span>
                </Alert>
              )}

              {!appliedVoucher && availableVouchers.length > 0 && (
                <>
                  <h6 className="fw-bold mt-3 mb-2 text-dark">Available Vouchers</h6>
                  <ListGroup>
                    {availableVouchers.map((voucher) => {
                      const meetsMinOrder = totalPrice >= Number(voucher.minOrderValue || 0);
                      return (
                        <ListGroup.Item
                          key={voucher.id}
                          className={`d-flex justify-content-between align-items-center ${
                            meetsMinOrder ? "list-group-item-action cursor-pointer" : "opacity-75"
                          }`}
                          onClick={() => meetsMinOrder && handleSelectVoucher(voucher)}
                        >
                          <div>
                            <div className="fw-bold text-dark">
                              <Badge bg="primary" className="me-2">
                                {voucher.code}
                              </Badge>
                              {voucher.title}
                            </div>
                            <small className="text-muted">
                              {voucher.type === "percentage"
                                ? `${voucher.value}% OFF`
                                : `${formatCurrency(voucher.value)} OFF`}
                              {" · "}Min Spend: {formatCurrency(voucher.minOrderValue || 0)}
                              {voucher.expirationDate ? ` · Expires: ${voucher.expirationDate}` : " · No expiration"}
                            </small>
                          </div>
                          <div>
                            {meetsMinOrder ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline-success"
                                onClick={(e) => {
                                   e.stopPropagation();
                                  handleSelectVoucher(voucher);
                                }}
                              >
                                Apply
                              </Button>
                            ) : (
                              <Badge bg="secondary">
                                Min Spend {formatCurrency(voucher.minOrderValue)}
                              </Badge>
                            )}
                          </div>
                        </ListGroup.Item>
                      );
                    })}
                  </ListGroup>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* CỘT PHẢI (50%): TÓM TẮT ĐƠN HÀNG */}
        <Col lg={6}>
          <div className="sticky-top" style={{ top: "85px", zIndex: 10 }}>
            <Card className="shadow-sm border-0 bg-white">
              <Card.Body className="p-4">
                <h5 className="fw-bold mb-3 text-dark">Order Summary</h5>
                <div className="mb-3" style={{ maxHeight: "280px", overflowY: "auto" }}>
                  {items.map((item) => (
                    <div key={item.bookId} className="d-flex justify-content-between mb-2">
                      <span className="text-truncate text-secondary" style={{ maxWidth: "70%" }}>
                        {item.title} x{item.quantity}
                      </span>
                      <span className="fw-semibold text-dark">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div>
                  <hr className="my-2" />
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Subtotal</span>
                    <span className="fw-semibold text-dark">{formatCurrency(totalPrice)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="d-flex justify-content-between mb-2 text-success">
                      <span>Discount ({appliedVoucher?.code})</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <hr className="my-2" />
                  <div className="d-flex justify-content-between mb-3">
                    <strong className="fs-5 text-dark">Total</strong>
                    <strong className="text-primary fs-5">
                      {formatCurrency(finalPrice)}
                    </strong>
                  </div>
                  <Button
                    variant="primary"
                    className="w-100 py-3 fw-bold"
                    size="lg"
                    onClick={handlePlaceOrder}
                    disabled={loading}
                  >
                    {loading ? "Processing Order..." : "Place Order"}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default CheckoutPage;
