import { useState } from "react";
import PropTypes from "prop-types";
import { Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, syncCartToApi } from "../redux/cartSlice";
import { addWishlistItem, removeWishlistItem, removeFromWishlist } from "../redux/wishlistSlice";
import RatingStars from "./RatingStars";
import { truncateText, formatCurrency, BOOK_STATUS } from "../utils/helpers";
import { FaHeart, FaRegHeart, FaCartPlus } from "react-icons/fa";
import { toast } from "react-toastify";

// Kết hợp Redux Hooks (useSelector, useDispatch) và PropTypes validation
const BookCard = ({ book, reviewCount }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const cartItems = useSelector((state) => state.cart.items);

  const bookIdStr = String(book.id);
  const isInWishlist = wishlistItems.some(
    (item) => String(item.bookId || item.id) === bookIdStr
  );

  const isOutOfStock =
    book.stock <= 0 ||
    book.status === BOOK_STATUS.OUT_OF_STOCK ||
    book.isDeleted ||
    book.status === BOOK_STATUS.INACTIVE;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!isAuthenticated) {
      toast.warning("Please log in to add books to your cart", { toastId: "auth-cart" });
      return;
    }
    if (isOutOfStock) {
      toast.error("This book is currently out of stock.", { toastId: `stock-${bookIdStr}` });
      return;
    }

    const currentCartItem = cartItems.find((i) => String(i.bookId) === bookIdStr);
    if (currentCartItem && currentCartItem.quantity >= book.stock) {
      toast.warning(`You have selected the maximum available quantity (${book.stock} books).`, {
        toastId: `max-${bookIdStr}`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      dispatch(addToCart(book));
      toast.success(`Added "${book.title}" to cart`, { toastId: `cart-${bookIdStr}` });

      if (user?.id) {
        const updatedItems = cartItems.map((i) => ({
          bookId: String(i.bookId),
          quantity: String(i.bookId) === bookIdStr ? i.quantity + 1 : i.quantity,
        }));
        if (!updatedItems.find((i) => String(i.bookId) === bookIdStr)) {
          updatedItems.push({ bookId: bookIdStr, quantity: 1 });
        }
        await dispatch(syncCartToApi({ userId: user.id, items: updatedItems }));
      }
    } finally {
      setTimeout(() => setIsSubmitting(false), 300);
    }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSubmitting) return;

    if (!isAuthenticated) {
      toast.warning("Please log in to save to your wishlist", {
        toastId: "auth-wishlist",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isInWishlist) {
        const entry = wishlistItems.find(
          (item) => String(item.bookId || item.id) === bookIdStr
        );
        dispatch(removeFromWishlist(bookIdStr));
        await dispatch(
          removeWishlistItem({
            wishlistEntryId: entry?.id,
            bookId: bookIdStr,
            userId: user?.id,
          })
        );
        toast.info("Removed from wishlist", { toastId: `wishlist-${bookIdStr}` });
      } else {
        await dispatch(addWishlistItem({ userId: user.id, book }));
        toast.success("Added to wishlist", { toastId: `wishlist-${bookIdStr}` });
      }
    } finally {
      setTimeout(() => setIsSubmitting(false), 300);
    }
  };

  const displayReviewCount = reviewCount !== undefined ? reviewCount : (book.reviewCount || 0);

  return (
    <Card className="h-100 shadow-sm book-card border-0 bg-white">
      <div className="position-relative overflow-hidden" style={{ height: "250px" }}>
        <Link to={`/books/${book.id}`} className="text-decoration-none">
          <Card.Img
            variant="top"
            src={book.image}
            alt={book.title}
            className="w-100 h-100"
            style={{ objectFit: "cover" }}
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/images/books/book-1.jpg";
            }}
          />
        </Link>
        <Button
          variant="link"
          className="position-absolute top-0 end-0 m-2 p-1"
          onClick={handleWishlist}
          disabled={isSubmitting}
          aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          style={{ fontSize: "1.2rem", zIndex: 10 }}
        >
          {isInWishlist ? (
            <FaHeart className="text-danger" />
          ) : (
            <FaRegHeart className="text-white" />
          )}
        </Button>
      </div>
      <Card.Body className="d-flex flex-column">
        <Link to={`/books/${book.id}`} className="text-decoration-none">
          <Card.Title className="fs-6 fw-bold text-dark text-truncate mb-1">{truncateText(book.title, 50)}</Card.Title>
        </Link>
        <Card.Text className="text-muted small mb-2">{book.author}</Card.Text>
        <div className="mb-2 d-flex align-items-center">
          <RatingStars rating={book.rating} />
          <span className="text-muted small ms-1">({displayReviewCount})</span>
        </div>
        <div className="mt-auto d-flex justify-content-between align-items-center">
          <span className="fw-bold text-primary fs-5">{formatCurrency(book.price)}</span>
          <Button
            size="sm"
            variant={isOutOfStock ? "outline-secondary" : "outline-primary"}
            onClick={handleAddToCart}
            disabled={isOutOfStock || isSubmitting}
            className="d-inline-flex align-items-center justify-content-center"
          >
            <FaCartPlus className="me-1 flex-shrink-0" />
            <span>{isOutOfStock ? "Out of Stock" : "Add"}</span>
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

BookCard.propTypes = {
  book: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    author: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    image: PropTypes.string,
    stock: PropTypes.number,
    rating: PropTypes.number,
    reviewCount: PropTypes.number,
    isDeleted: PropTypes.bool,
  }).isRequired,
  reviewCount: PropTypes.number,
};

export default BookCard;
