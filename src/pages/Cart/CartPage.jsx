import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { removeFromCart, updateQuantity, clearCart, syncCartToApi } from "../../redux/slices/cartSlice";
import CartItem from "../../components/cart/CartItem";
import CartSummary from "../../components/cart/CartSummary";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FaTrashAlt, FaArrowLeft } from "react-icons/fa";

const CartPage = () => {
  const dispatch = useDispatch();
  const { items, totalPrice, totalQuantity } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  const syncCart = (updatedItems) => {
    if (user?.id) {
      const apiItems = updatedItems.map((i) => ({
        bookId: i.bookId,
        quantity: i.quantity,
      }));
      dispatch(syncCartToApi({ userId: user.id, items: apiItems }));
    }
  };

  const handleUpdateQuantity = (bookId, quantity) => {
    if (quantity < 1) return;
    dispatch(updateQuantity({ bookId, quantity }));
    // Sync to API with updated quantity
    const updatedItems = items.map((i) =>
      String(i.bookId) === String(bookId) ? { ...i, quantity } : i
    );
    syncCart(updatedItems);
  };

  const handleRemove = (bookId) => {
    dispatch(removeFromCart(bookId));
    toast.info("Item removed from cart");
    // Sync to API with item removed
    const updatedItems = items.filter((i) => String(i.bookId) !== String(bookId));
    syncCart(updatedItems);
  };

  const handleClearCart = () => {
    dispatch(clearCart());
    toast.info("Cart cleared");
    syncCart([]);
  };

  if (items.length === 0) {
    return (
      <Container className="py-5 text-center">
        <h3 className="mb-3">Your cart is empty</h3>
        <p className="text-muted">Add some books to get started!</p>
        <Link to="/books">
          <Button variant="primary">
            <FaArrowLeft className="me-2" />
            Continue Shopping
          </Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Shopping Cart</h2>
        <Button variant="outline-danger" size="sm" onClick={handleClearCart}>
          <FaTrashAlt className="me-1" />
          Clear Cart
        </Button>
      </div>
      <Row className="g-4">
        <Col lg={8}>
          {/* Header */}
          <Row className="text-muted small fw-bold pb-2 border-bottom d-none d-md-flex">
            <Col xs={2}>Image</Col>
            <Col xs={4}>Product</Col>
            <Col xs={2} className="text-center">Price</Col>
            <Col xs={2}>Qty</Col>
            <Col xs={1} className="text-center">Total</Col>
            <Col xs={1}></Col>
          </Row>
          {items.map((item) => (
            <CartItem
              key={item.bookId}
              item={item}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemove}
            />
          ))}
        </Col>
        <Col lg={4}>
          <CartSummary totalPrice={totalPrice} totalQuantity={totalQuantity} />
        </Col>
      </Row>
    </Container>
  );
};

export default CartPage;
