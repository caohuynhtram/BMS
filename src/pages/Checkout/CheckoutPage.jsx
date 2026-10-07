import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Alert, Badge, ListGroup } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearCart, syncCartToApi } from "../../redux/slices/cartSlice";
import { createOrder } from "../../redux/slices/orderSlice";
import voucherApi from "../../api/voucherApi";
import { toast } from "react-toastify";
import { FaTag, FaCheckCircle } from "react-icons/fa";

const CheckoutPage = () => {
  const { items, totalPrice } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [shippingInfo, setShippingInfo] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });
  const [voucherCode, setVoucherCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch available vouchers on mount
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const res = await voucherApi.getAll();
        const now = new Date();
        // Filter valid vouchers
        const valid = res.data.filter((v) => {
          const notExpired = new Date(v.expirationDate) >= now;
          const hasUsage = v.used < v.usageLimit;
          return notExpired && hasUsage;
        });
        setAvailableVouchers(valid);
      } catch (err) {
        console.error("Failed to fetch vouchers:", err);
      }
    };
    fetchVouchers();
  }, []);

  const handleShippingChange = (e) => {
    setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
  };

  const validateAndApplyVoucher = (voucher) => {
    setError("");
    // Check expiry
    if (new Date(voucher.expirationDate) < new Date()) {
      setError("Voucher has expired");
      return false;
    }
    // Check usage limit
    if (voucher.used >= voucher.usageLimit) {
      setError("Voucher usage limit reached");
      return false;
    }
    // Check min order value
    if (totalPrice < voucher.minOrderValue) {
      setError(`Minimum order value is $${voucher.minOrderValue}. Your order is $${totalPrice.toFixed(2)}`);
      return false;
    }

    // Calculate discount
    let discountAmount = 0;
    if (voucher.type === "percentage") {
      discountAmount = (totalPrice * voucher.value) / 100;
    } else {
      discountAmount = voucher.value;
    }
    setDiscount(discountAmount);
    setAppliedVoucher(voucher);
    setVoucherCode(voucher.code);
    toast.success(`Voucher "${voucher.title}" applied!`);
    return true;
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setError("");
    try {
      const res = await voucherApi.getByCode(voucherCode.trim());
      if (res.data.length === 0) {
        setError("Invalid voucher code");
        return;
      }
      validateAndApplyVoucher(res.data[0]);
    } catch (err) {
      setError("Failed to apply voucher");
    }
  };

  const handleSelectVoucher = (voucher) => {
    if (appliedVoucher) return;
    validateAndApplyVoucher(voucher);
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setDiscount(0);
    setVoucherCode("");
    setError("");
  };

  const handlePlaceOrder = async () => {
    if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address) {
      setError("Please fill in all shipping information");
      return;
    }

    setLoading(true);
    try {
      const finalPrice = totalPrice - discount;
      await dispatch(
        createOrder({
          userId: user.id,
          totalPrice: finalPrice,
          voucherId: appliedVoucher?.id || null,
          items: items,
        })
      ).unwrap();

      // Update voucher usage
      if (appliedVoucher) {
        await voucherApi.update(appliedVoucher.id, {
          used: appliedVoucher.used + 1,
        });
      }

      // Clear cart in Redux and API
      dispatch(clearCart());
      if (user?.id) {
        dispatch(syncCartToApi({ userId: user.id, items: [] }));
      }
      toast.success("Order placed successfully!");
      navigate("/orders");
    } catch (err) {
      toast.error("Failed to place order");
    }
    setLoading(false);
  };

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  const finalPrice = totalPrice - discount;

  return (
    <Container className="py-4">
      <h2 className="fw-bold mb-4">Checkout</h2>
      <Row className="g-4">
        <Col lg={8}>
          {/* Shipping Information */}
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <h5 className="fw-bold mb-3">Shipping Information</h5>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    name="name"
                    value={shippingInfo.name}
                    onChange={handleShippingChange}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    name="phone"
                    value={shippingInfo.phone}
                    onChange={handleShippingChange}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="address"
                    value={shippingInfo.address}
                    onChange={handleShippingChange}
                    required
                  />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>

          {/* Voucher Section */}
          <Card className="shadow-sm">
            <Card.Body>
              <h5 className="fw-bold mb-3">
                <FaTag className="me-2" />
                Voucher / Discount
              </h5>

              {error && <Alert variant="danger" className="py-2">{error}</Alert>}

              {/* Voucher code input */}
              <div className="d-flex gap-2 mb-3">
                <Form.Control
                  placeholder="Enter voucher code"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  disabled={!!appliedVoucher}
                />
                {appliedVoucher ? (
                  <Button variant="outline-danger" onClick={handleRemoveVoucher}>
                    Remove
                  </Button>
                ) : (
                  <Button variant="outline-primary" onClick={handleApplyVoucher}>
                    Apply
                  </Button>
                )}
              </div>

              {appliedVoucher && (
                <Alert variant="success" className="py-2 d-flex align-items-center">
                  <FaCheckCircle className="me-2" />
                  <strong>{appliedVoucher.title}</strong>
                  <span className="ms-2">(-${discount.toFixed(2)})</span>
                </Alert>
              )}

              {/* Available vouchers list */}
              {!appliedVoucher && availableVouchers.length > 0 && (
                <>
                  <h6 className="fw-bold mt-3 mb-2">Available Vouchers</h6>
                  <ListGroup>
                    {availableVouchers.map((voucher) => {
                      const meetsMinOrder = totalPrice >= voucher.minOrderValue;
                      return (
                        <ListGroup.Item
                          key={voucher.id}
                          className={`d-flex justify-content-between align-items-center ${
                            meetsMinOrder ? "" : "bg-light"
                          }`}
                          style={{ cursor: meetsMinOrder ? "pointer" : "not-allowed" }}
                          onClick={() => meetsMinOrder && handleSelectVoucher(voucher)}
                        >
                          <div>
                            <div className="fw-bold">
                              <Badge bg="primary" className="me-2">
                                {voucher.code}
                              </Badge>
                              {voucher.title}
                            </div>
                            <small className="text-muted">
                              {voucher.type === "percentage"
                                ? `${voucher.value}% off`
                                : `$${voucher.value} off`}
                              {" · "}Min order: ${voucher.minOrderValue}
                              {" · "}Expires: {voucher.expirationDate}
                              {" · "}Remaining: {voucher.usageLimit - voucher.used}
                            </small>
                          </div>
                          <div>
                            {meetsMinOrder ? (
                              <Button size="sm" variant="outline-success">
                                Use
                              </Button>
                            ) : (
                              <Badge bg="secondary">
                                Min ${voucher.minOrderValue}
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

        <Col lg={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <h5 className="fw-bold mb-3">Order Summary</h5>
              {items.map((item) => (
                <div key={item.bookId} className="d-flex justify-content-between mb-2">
                  <span className="text-truncate" style={{ maxWidth: "70%" }}>
                    {item.title} x{item.quantity}
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <hr />
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="d-flex justify-content-between mb-2 text-success">
                  <span>Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <hr />
              <div className="d-flex justify-content-between mb-3">
                <strong className="fs-5">Total</strong>
                <strong className="text-primary fs-5">
                  ${finalPrice.toFixed(2)}
                </strong>
              </div>
              <Button
                variant="primary"
                className="w-100"
                size="lg"
                onClick={handlePlaceOrder}
                disabled={loading}
              >
                {loading ? "Placing Order..." : "Place Order"}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CheckoutPage;
