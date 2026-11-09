import { useEffect } from "react";
import { Container, Row, Col, Card, Button, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { removeWishlistItem, removeFromWishlist, fetchWishlist } from "../../redux/wishlistSlice";
import { addToCart, syncCartToApi } from "../../redux/cartSlice";
import { formatCurrency } from "../../utils/helpers";
import { toast } from "react-toastify";
import { FaTrash, FaCartPlus, FaArrowLeft } from "react-icons/fa";

const WishlistPage = () => {
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.wishlist);
  const { user } = useSelector((state) => state.auth);
  const cart = useSelector((state) => state.cart);

  // Đồng bộ danh sách yêu thích khi vào trang
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchWishlist(user.id));
    }
  }, [dispatch, user?.id]);

  const handleRemove = (item) => {
    const targetBookId = String(item.bookId || item.id);
    dispatch(removeFromWishlist(targetBookId));
    dispatch(
      removeWishlistItem({
        wishlistEntryId: item.id,
        bookId: targetBookId,
        userId: user?.id,
      })
    );
    toast.info("Removed from wishlist", { toastId: `wishlist-${targetBookId}` });
  };

  const handleAddToCart = (item) => {
    const targetBookId = String(item.bookId || item.id);
    if (
      item.stock <= 0 ||
      item.isDeleted ||
      item.status === "Inactive" ||
      item.status === "Out of Stock"
    ) {
      toast.error("This book is currently out of stock.", { toastId: `stock-${targetBookId}` });
      return;
    }

    const currentCartItem = cart.items.find((i) => String(i.bookId) === targetBookId);
    if (currentCartItem && currentCartItem.quantity >= item.stock) {
      toast.warning(`You have selected the maximum available quantity (${item.stock} books).`, {
        toastId: `max-${targetBookId}`,
      });
      return;
    }

    dispatch(
      addToCart({
        ...item,
        id: targetBookId,
        bookId: targetBookId,
      })
    );
    toast.success(`Added "${item.title}" to cart`, { toastId: `cart-${targetBookId}` });

    if (user?.id) {
      const updatedItems = cart.items.map((i) => ({
        bookId: String(i.bookId),
        quantity: String(i.bookId) === targetBookId ? i.quantity + 1 : i.quantity,
      }));
      if (!updatedItems.find((i) => String(i.bookId) === targetBookId)) {
        updatedItems.push({ bookId: targetBookId, quantity: 1 });
      }
      dispatch(syncCartToApi({ userId: user.id, items: updatedItems }));
    }
  };

  if (!items || items.length === 0) {
    return (
      <Container className="py-5 text-center">
        <h3 className="mb-3 fw-bold text-dark">Your Wishlist is Empty</h3>
        <p className="text-muted">Explore our collection and save your favorite books!</p>
        <Button as={Link} to="/books" variant="primary">
          <FaArrowLeft className="me-2" />
          Explore Books
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="fw-bold mb-0 text-dark">Wishlist ({items.length})</h2>
        <Button
          as={Link}
          to="/books"
          variant="outline-secondary"
          size="sm"
          className="btn-back d-inline-flex align-items-center"
        >
          <FaArrowLeft className="me-2 flex-shrink-0" />
          <span>Back to Books</span>
        </Button>
      </div>
      <Row className="g-3">
        {items.map((item) => {
          const targetBookId = String(item.bookId || item.id);
          const isOutOfStock =
            item.stock <= 0 ||
            item.status === "Out of Stock" ||
            item.isDeleted ||
            item.status === "Inactive";
          return (
            <Col xs={12} sm={6} md={4} lg={3} key={targetBookId}>
              <Card className="h-100 shadow-sm border-0 bg-white">
                <Link to={`/books/${targetBookId}`}>
                  <Card.Img
                    variant="top"
                    src={item.image}
                    alt={item.title}
                    style={{ height: "200px", objectFit: "cover" }}
                  />
                </Link>
                <Card.Body className="d-flex flex-column">
                  <Link to={`/books/${targetBookId}`} className="text-decoration-none">
                    <Card.Title className="fs-6 fw-bold text-dark text-truncate">
                      {item.title}
                    </Card.Title>
                  </Link>
                  <Card.Text className="text-muted small">{item.author}</Card.Text>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="fw-bold text-primary">{formatCurrency(item.price)}</span>
                    {isOutOfStock ? (
                      <Badge bg="danger">Out of Stock</Badge>
                    ) : (
                      <Badge bg="success">{item.stock} in stock</Badge>
                    )}
                  </div>
                  <div className="mt-auto d-flex gap-2">
                    <Button
                      size="sm"
                      variant={isOutOfStock ? "secondary" : "primary"}
                      className="flex-grow-1 d-inline-flex align-items-center justify-content-center"
                      disabled={isOutOfStock}
                      onClick={() => handleAddToCart(item)}
                    >
                      <FaCartPlus className="me-2 flex-shrink-0" />
                      <span>{isOutOfStock ? "Out of Stock" : "Add to Cart"}</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleRemove(item)}
                      title="Remove from wishlist"
                      className="d-inline-flex align-items-center justify-content-center"
                    >
                      <FaTrash />
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Container>
  );
};

export default WishlistPage;
