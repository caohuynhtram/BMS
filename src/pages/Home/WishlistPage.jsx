import React from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { removeWishlistItem } from "../../redux/slices/wishlistSlice";
import { addToCart } from "../../redux/slices/cartSlice";
import { syncCartToApi } from "../../redux/slices/cartSlice";
import { Link } from "react-router-dom";
import { FaTrash, FaCartPlus, FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify";

const WishlistPage = () => {
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.wishlist);
  const { user } = useSelector((state) => state.auth);
  const cart = useSelector((state) => state.cart);

  const handleRemove = (item) => {
    dispatch(removeWishlistItem({ wishlistEntryId: item.id, bookId: item.bookId }));
    toast.info("Removed from wishlist");
  };

  const handleAddToCart = (item) => {
    dispatch(addToCart({ id: item.bookId, ...item }));
    toast.success(`"${item.title}" added to cart`);
    // Sync cart to API after adding
    setTimeout(() => {
      const updatedItems = [...cart.items];
      const exists = updatedItems.find((i) => String(i.bookId) === String(item.bookId));
      if (exists) {
        exists.quantity += 1;
      } else {
        updatedItems.push({ bookId: item.bookId, quantity: 1 });
      }
      if (user?.id) {
        dispatch(syncCartToApi({ userId: user.id, items: updatedItems }));
      }
    }, 100);
  };

  if (items.length === 0) {
    return (
      <Container className="py-5 text-center">
        <h3 className="mb-3">Your wishlist is empty</h3>
        <p className="text-muted">Browse books and add your favorites!</p>
        <Link to="/books">
          <Button variant="primary">
            <FaArrowLeft className="me-2" />
            Browse Books
          </Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="fw-bold mb-4">My Wishlist ({items.length})</h2>
      <Row className="g-3">
        {items.map((item) => (
          <Col xs={12} sm={6} md={4} lg={3} key={item.bookId}>
            <Card className="h-100 shadow-sm">
              <Link to={`/books/${item.bookId}`}>
                <Card.Img
                  variant="top"
                  src={item.image}
                  alt={item.title}
                  style={{ height: "200px", objectFit: "cover" }}
                />
              </Link>
              <Card.Body className="d-flex flex-column">
                <Card.Title className="fs-6 fw-bold">{item.title}</Card.Title>
                <Card.Text className="text-muted small">{item.author}</Card.Text>
                <div className="fw-bold text-primary mb-3">${item.price}</div>
                <div className="mt-auto d-flex gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    className="flex-grow-1"
                    onClick={() => handleAddToCart(item)}
                  >
                    <FaCartPlus className="me-1" /> Add to Cart
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => handleRemove(item)}
                  >
                    <FaTrash />
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default WishlistPage;
