import React from "react";
import { Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, syncCartToApi } from "../../redux/slices/cartSlice";
import { addWishlistItem, removeWishlistItem } from "../../redux/slices/wishlistSlice";
import RatingStars from "./RatingStars";
import { FaHeart, FaRegHeart, FaCartPlus } from "react-icons/fa";
import { toast } from "react-toastify";

const BookCard = ({ book, reviewCount }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const cartItems = useSelector((state) => state.cart.items);
  const isInWishlist = wishlistItems.some(
    (item) => String(item.bookId) === String(book.id)
  );

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.warning("Please login to add items to cart");
      return;
    }
    dispatch(addToCart(book));
    toast.success(`"${book.title}" added to cart`);
    // Sync to API
    if (user?.id) {
      const updatedItems = cartItems.map((i) => ({
        bookId: i.bookId,
        quantity: String(i.bookId) === String(book.id) ? i.quantity + 1 : i.quantity,
      }));
      if (!updatedItems.find((i) => String(i.bookId) === String(book.id))) {
        updatedItems.push({ bookId: book.id, quantity: 1 });
      }
      dispatch(syncCartToApi({ userId: user.id, items: updatedItems }));
    }
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.warning("Please login to use wishlist");
      return;
    }
    if (isInWishlist) {
      const entry = wishlistItems.find(
        (item) => String(item.bookId) === String(book.id)
      );
      if (entry) {
        dispatch(removeWishlistItem({ wishlistEntryId: entry.id, bookId: book.id }));
        toast.info("Removed from wishlist");
      }
    } else {
      dispatch(addWishlistItem({ userId: user.id, book }));
      toast.success("Added to wishlist");
    }
  };

  // Use actual review count from prop if provided, otherwise use book.reviewCount
  const displayReviewCount = reviewCount !== undefined ? reviewCount : (book.reviewCount || 0);

  return (
    <Card className="h-100 shadow-sm book-card border-0">
      <Link to={`/books/${book.id}`} className="text-decoration-none">
        <div className="position-relative overflow-hidden" style={{ height: "250px" }}>
          <Card.Img
            variant="top"
            src={book.image}
            alt={book.title}
            className="w-100 h-100"
            style={{ objectFit: "cover" }}
          />
          <Button
            variant="link"
            className="position-absolute top-0 end-0 m-2 p-1"
            onClick={handleWishlist}
            style={{ fontSize: "1.2rem", zIndex: 2 }}
          >
            {isInWishlist ? (
              <FaHeart className="text-danger" />
            ) : (
              <FaRegHeart className="text-white" />
            )}
          </Button>
        </div>
      </Link>
      <Card.Body className="d-flex flex-column">
        <Link to={`/books/${book.id}`} className="text-decoration-none text-dark">
          <Card.Title className="fs-6 fw-bold text-truncate">{book.title}</Card.Title>
        </Link>
        <Card.Text className="text-muted small mb-1">{book.author}</Card.Text>
        <div className="mb-2">
          <RatingStars rating={book.rating} />
          <span className="text-muted small ms-1">({displayReviewCount})</span>
        </div>
        <div className="mt-auto d-flex justify-content-between align-items-center">
          <span className="fw-bold text-primary fs-5">${book.price}</span>
          <Button
            size="sm"
            variant="outline-primary"
            onClick={handleAddToCart}
            disabled={book.stock === 0}
          >
            <FaCartPlus className="me-1" />
            {book.stock === 0 ? "Out of stock" : "Add"}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default BookCard;
