import React from "react";
import { Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

const CartSummary = ({ totalPrice, totalQuantity, discount = 0 }) => {
  const finalPrice = totalPrice - discount;

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <h5 className="fw-bold mb-3">Order Summary</h5>
        <div className="d-flex justify-content-between mb-2">
          <span>Items ({totalQuantity})</span>
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
          <strong>Total</strong>
          <strong className="text-primary fs-5">
            ${finalPrice.toFixed(2)}
          </strong>
        </div>
        <Link to="/checkout">
          <Button variant="primary" className="w-100" disabled={totalQuantity === 0}>
            Proceed to Checkout
          </Button>
        </Link>
      </Card.Body>
    </Card>
  );
};

export default CartSummary;
