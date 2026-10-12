import React, { useState, useEffect } from "react";
import { Container, Row, Col, Image, Button, Badge, Alert } from "react-bootstrap";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, syncCartToApi } from "../../redux/slices/cartSlice";
import { addWishlistItem, removeWishlistItem } from "../../redux/slices/wishlistSlice";
import bookApi from "../../api/bookApi";
import userApi from "../../api/userApi";
import orderApi from "../../api/orderApi";
import axiosClient from "../../api/axiosClient";
import RatingStars from "../../components/book/RatingStars";
import ReviewList from "../../components/book/ReviewList";
import ReviewForm from "../../components/book/ReviewForm";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { FaCartPlus, FaHeart, FaRegHeart } from "react-icons/fa";
import { toast } from "react-toastify";

const BookDetailPage = () => {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const cartItems = useSelector((state) => state.cart.items);
  const isInWishlist = book
    ? wishlistItems.some((item) => String(item.bookId) === String(book.id))
    : false;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookRes, reviewsRes, usersRes] = await Promise.all([
          bookApi.getById(id),
          bookApi.getReviews(id),
          userApi.getAll(),
        ]);
        setBook(bookRes.data);
        setReviews(reviewsRes.data);
        setUsers(usersRes.data);

        // Fetch category name
        if (bookRes.data.categoryId) {
          const catRes = await bookApi.getCategories();
          const cat = catRes.data.find(
            (c) => String(c.id) === String(bookRes.data.categoryId)
          );
          setCategory(cat);
        }

        // Check if user has purchased this book (in a Delivered order)
        if (user?.id) {
          const ordersRes = await orderApi.getByUser(user.id);
          const deliveredOrders = ordersRes.data.filter(
            (o) => o.status === "Delivered"
          );
          if (deliveredOrders.length > 0) {
            const orderItemsRes = await axiosClient.get("/orderItems");
            const deliveredOrderIds = deliveredOrders.map((o) => String(o.id));
            const purchased = orderItemsRes.data.some(
              (item) =>
                deliveredOrderIds.includes(String(item.orderId)) &&
                String(item.bookId) === String(id)
            );
            setHasPurchased(purchased);
          }
          // Check if user already reviewed
          const alreadyReviewed = reviewsRes.data.some(
            (r) => String(r.userId) === String(user.id)
          );
          setHasReviewed(alreadyReviewed);
        }
      } catch (err) {
        console.error("Failed to fetch book:", err);
      }
      setLoading(false);
    };
    fetchData();
  }, [id, user]);

  const handleAddToCart = () => {
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
        quantity:
          String(i.bookId) === String(book.id) ? i.quantity + 1 : i.quantity,
      }));
      if (!updatedItems.find((i) => String(i.bookId) === String(book.id))) {
        updatedItems.push({ bookId: book.id, quantity: 1 });
      }
      dispatch(syncCartToApi({ userId: user.id, items: updatedItems }));
    }
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast.warning("Please login to use wishlist");
      return;
    }
    if (isInWishlist) {
      const entry = wishlistItems.find(
        (item) => String(item.bookId) === String(book.id)
      );
      if (entry) {
        dispatch(
          removeWishlistItem({ wishlistEntryId: entry.id, bookId: book.id })
        );
        toast.info("Removed from wishlist");
      }
    } else {
      dispatch(addWishlistItem({ userId: user.id, book }));
      toast.success("Added to wishlist");
    }
  };

  const handleReviewSubmit = async (reviewData) => {
    try {
      const newReview = {
        bookId: parseInt(id) || id,
        userId: user.id,
        rating: reviewData.rating,
        comment: reviewData.comment,
        createdAt: new Date().toISOString().split("T")[0],
      };
      const res = await bookApi.createReview(newReview);
      
      const updatedReviews = [...reviews, res.data];
      const newReviewCount = updatedReviews.length;
      const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
      const newRating = Number((totalRating / newReviewCount).toFixed(1));

      await bookApi.update(book.id, {
        rating: newRating,
        reviewCount: newReviewCount,
      });

      setBook({ ...book, rating: newRating, reviewCount: newReviewCount });
      setReviews(updatedReviews);
      setHasReviewed(true);
      toast.success("Review submitted successfully!");
    } catch (err) {
      toast.error("Failed to submit review");
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!book)
    return (
      <Container className="py-5 text-center">
        <h3>Book not found</h3>
      </Container>
    );

  // Use actual review count
  const actualReviewCount = reviews.length;

  return (
    <Container className="py-4">
      <Row className="g-4">
        <Col md={4}>
          <Image
            src={book.image}
            alt={book.title}
            fluid
            rounded
            className="shadow"
            style={{ maxHeight: "500px", objectFit: "cover", width: "100%" }}
          />
        </Col>
        <Col md={8}>
          <h1 className="fw-bold">{book.title}</h1>
          <p className="text-muted fs-5">by {book.author}</p>

          {category && (
            <Badge bg="secondary" className="mb-3">
              {category.name}
            </Badge>
          )}

          <div className="mb-3 d-flex align-items-center gap-2">
            <RatingStars rating={book.rating} size={20} />
            <span className="text-muted">
              {book.rating} ({actualReviewCount} reviews)
            </span>
          </div>

          <h2 className="text-primary fw-bold mb-3">${book.price}</h2>

          <p className="mb-3">{book.description}</p>

          <p className="mb-4">
            <strong>Stock: </strong>
            {book.stock > 0 ? (
              <Badge bg="success">{book.stock} available</Badge>
            ) : (
              <Badge bg="danger">Out of stock</Badge>
            )}
          </p>

          <div className="d-flex gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={handleAddToCart}
              disabled={book.stock === 0}
            >
              <FaCartPlus className="me-2" />
              Add to Cart
            </Button>
            <Button
              variant={isInWishlist ? "danger" : "outline-danger"}
              size="lg"
              onClick={handleWishlist}
            >
              {isInWishlist ? (
                <FaHeart className="me-2" />
              ) : (
                <FaRegHeart className="me-2" />
              )}
              {isInWishlist ? "In Wishlist" : "Add to Wishlist"}
            </Button>
          </div>
        </Col>
      </Row>

      {/* Reviews Section */}
      <div className="mt-5">
        <h3 className="fw-bold mb-4">Reviews ({actualReviewCount})</h3>
        <ReviewList reviews={reviews} users={users} />

        {isAuthenticated && (
          <div className="mt-4">
            {hasReviewed ? (
              <Alert variant="info">
                You have already reviewed this book.
              </Alert>
            ) : hasPurchased ? (
              <>
                <h4 className="fw-bold mb-3">Write a Review</h4>
                <ReviewForm onSubmit={handleReviewSubmit} />
              </>
            ) : (
              <Alert variant="warning">
                You must purchase and receive this book before you can write a review.
              </Alert>
            )}
          </div>
        )}
      </div>
    </Container>
  );
};

export default BookDetailPage;
