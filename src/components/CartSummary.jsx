import { useMemo } from "react";
import PropTypes from "prop-types";
import { Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { calculateOrderTotal } from "../utils/cartUtils";
import { formatCurrency } from "../utils/helpers";

// Áp dụng useMemo để tính toán lại tổng tiền khi subtotal hoặc discount thay đổi.
const CartSummary = ({
  items = [],
  totalPrice = 0,
  totalQuantity = 0,
  discount = 0,
  showCheckoutButton = true,
  disableCheckout = false,
  checkoutButtonText = "Proceed to Checkout",
  onCheckoutClick,
}) => {
  const finalPrice = useMemo(() => {
    return calculateOrderTotal(totalPrice, 0, discount);
  }, [totalPrice, discount]);

  return (
    <Card className="shadow-sm border-0 bg-white">
      <Card.Body>
        <h5 className="fw-bold mb-3 text-dark">Order Summary</h5>

        {items && items.length > 0 && (
          <div className="mb-3">
            {(items || []).map((item) => (
              <div key={item.bookId} className="d-flex justify-content-between mb-2">
                <span className="text-truncate text-secondary" style={{ maxWidth: "70%" }}>
                  {item.title} x{item.quantity}
                </span>
                <span className="fw-semibold text-dark">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
            <hr />
          </div>
        )}

        <div className="d-flex justify-content-between mb-2">
          <span className="text-muted">Subtotal ({totalQuantity} {totalQuantity === 1 ? "item" : "items"})</span>
          <span className="fw-semibold text-dark">{formatCurrency(totalPrice)}</span>
        </div>
        {discount > 0 && (
          <div className="d-flex justify-content-between mb-2 text-success">
            <span>Discount</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}
        <hr />
        <div className="d-flex justify-content-between mb-3">
          <strong className="text-dark fs-5">Total</strong>
          <strong className="text-primary fs-5">
            {formatCurrency(finalPrice)}
          </strong>
        </div>

        {showCheckoutButton && (
          <Button
            as={onCheckoutClick ? undefined : Link}
            to={onCheckoutClick ? undefined : "/checkout"}
            onClick={onCheckoutClick}
            variant="primary"
            className="w-100 py-2 fw-bold"
            disabled={disableCheckout || totalQuantity === 0}
          >
            {checkoutButtonText}
          </Button>
        )}
      </Card.Body>
    </Card>
  );
};

CartSummary.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      bookId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string,
      price: PropTypes.number,
      quantity: PropTypes.number,
    })
  ),
  totalPrice: PropTypes.number,
  totalQuantity: PropTypes.number,
  discount: PropTypes.number,
  showCheckoutButton: PropTypes.bool,
  disableCheckout: PropTypes.bool,
  checkoutButtonText: PropTypes.string,
  onCheckoutClick: PropTypes.func,
};

export default CartSummary;
