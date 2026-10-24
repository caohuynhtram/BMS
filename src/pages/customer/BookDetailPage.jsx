import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Container, Row, Col, Image, Button, Badge, Alert } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, syncCartToApi } from "../../redux/cartSlice";
import { addWishlistItem, removeWishlistItem, removeFromWishlist } from "../../redux/wishlistSlice";
import bookApi from "../../api/bookApi";
import orderApi from "../../api/orderApi";
import axiosClient from "../../api/axiosClient";
import RatingStars from "../../components/RatingStars";
import LoadingSpinner from "../../components/LoadingSpinner";
import { ReviewForm, ReviewList } from "../../components/ReviewSection";
import {
  formatCurrency,
  BOOK_STATUS,
  getLocalDateString,
  calculateAverageRating,
} from "../../utils/helpers";
import { FaHeart, FaRegHeart, FaCartPlus, FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify";

const BookDetailPage = () => {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [category, setCategory] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const cartItems = useSelector((state) => state.cart.items);
  const isInWishlist = book
    ? wishlistItems.some((item) => String(item.bookId || item.id) === String(book.id))
    : false;

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [bookRes, reviewsRes] = await Promise.all([
          bookApi.getById(id),
          bookApi.getReviews(id),
        ]);

        if (!isMounted) return;

        if (
          !bookRes.data ||
          bookRes.data.isDeleted ||
          bookRes.data.status === BOOK_STATUS.INACTIVE
        ) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const freshReviews = reviewsRes.data || [];
        const freshReviewCount = freshReviews.length;
        const freshRating =
          freshReviewCount > 0 ? calculateAverageRating(freshReviews) : 0;

        // Tự động đồng bộ lại điểm đánh giá và số lượng nếu có sai lệch
        if (
          Number(bookRes.data.rating) !== freshRating ||
          Number(bookRes.data.reviewCount) !== freshReviewCount
        ) {
          try {
            await bookApi.update(bookRes.data.id, {
              rating: freshRating,
              reviewCount: freshReviewCount,
            });
            bookRes.data.rating = freshRating;
            bookRes.data.reviewCount = freshReviewCount;
          } catch (syncErr) {
            console.error("Auto-sync rating failed:", syncErr);
          }
        }

        setBook(bookRes.data);
        setReviews(freshReviews);

        // Fetch category name — hiển thị "Chưa phân loại" nếu category bị xóa hoặc không tìm thấy
        if (bookRes.data.categoryId) {
          try {
            const catRes = await bookApi.getCategories();
            const cat = (catRes.data || []).find(
              (c) => String(c.id) === String(bookRes.data.categoryId)
            );
            if (cat && !cat.isDeleted && cat.status !== "Inactive") {
              setCategory(cat);
            } else {
              setCategory({ name: "Chưa phân loại" });
            }
          } catch (_err) {
            setCategory({ name: "Chưa phân loại" });
          }
        } else {
          setCategory({ name: "Chưa phân loại" });
        }

        // Kiểm tra khách hàng đã từng mua sách này và đơn đã giao thành công chưa
        if (user?.id) {
          const ordersRes = await orderApi.getByUser(user.id);
          const deliveredOrders = (ordersRes.data || []).filter(
            (o) => o.status === "Delivered"
          );
          if (deliveredOrders.length > 0) {
            const orderItemsRes = await axiosClient.get("/orderItems");
            const deliveredOrderIds = deliveredOrders.map((o) => String(o.id));
            const purchased = (orderItemsRes.data || []).some(
              (item) =>
                deliveredOrderIds.includes(String(item.orderId)) &&
                String(item.bookId) === String(id)
            );
            setHasPurchased(purchased);
          }
          const alreadyReviewed = freshReviews.some(
            (r) => String(r.userId) === String(user.id)
          );
          setHasReviewed(alreadyReviewed);
        }
      } catch (err) {
        if (isMounted) setNotFound(true);
      }
      if (isMounted) setLoading(false);
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id, user]);

  const handleAddToCart = async () => {
    if (isSubmitting) return;

    if (!isAuthenticated) {
      toast.warning("Vui lòng đăng nhập để thêm sách vào giỏ hàng", { toastId: "auth-cart" });
      return;
    }
    const isOutOfStockNow =
      !book ||
      book.stock <= 0 ||
      book.status === BOOK_STATUS.OUT_OF_STOCK ||
      book.isDeleted ||
      book.status === BOOK_STATUS.INACTIVE;
    if (isOutOfStockNow) {
      toast.error("Sách này hiện đã tạm hết hàng.", { toastId: `stock-${book?.id}` });
      return;
    }

    const currentCartItem = cartItems.find((i) => String(i.bookId) === String(book.id));
    if (currentCartItem && currentCartItem.quantity >= book.stock) {
      toast.warning(`Bạn đã chọn tối đa số lượng có sẵn trong kho (${book.stock} cuốn).`, {
        toastId: `max-${book?.id}`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      dispatch(addToCart(book));
      toast.success(`Đã thêm "${book.title}" vào giỏ hàng`, { toastId: `cart-${book?.id}` });

      if (user?.id) {
        const updated = currentCartItem
          ? cartItems.map((i) =>
              String(i.bookId) === String(book.id)
                ? { ...i, quantity: i.quantity + 1 }
                : i
            )
          : [
              ...cartItems,
              {
                bookId: book.id,
                quantity: 1,
                title: book.title,
                price: book.price,
                image: book.image,
                stock: book.stock,
                isDeleted: false,
              },
            ];
        await dispatch(syncCartToApi({ userId: user.id, items: updated }));
      }
    } finally {
      setTimeout(() => setIsSubmitting(false), 300);
    }
  };

  const handleWishlist = async () => {
    if (isSubmitting) return;

    if (!isAuthenticated) {
      toast.warning("Vui lòng đăng nhập để lưu vào danh sách yêu thích", {
        toastId: "auth-wishlist",
      });
      return;
    }
    const bookIdStr = String(book.id);

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
        toast.info("Đã xóa khỏi danh sách yêu thích", { toastId: `wishlist-${bookIdStr}` });
      } else {
        await dispatch(addWishlistItem({ userId: user.id, book }));
        toast.success("Đã thêm vào danh sách yêu thích", { toastId: `wishlist-${bookIdStr}` });
      }
    } finally {
      setTimeout(() => setIsSubmitting(false), 300);
    }
  };

  // CREATE REVIEW: Lấy trực tiếp danh sách đánh giá mới nhất từ DB để tính toán điểm trung bình
  const handleReviewSubmit = async (reviewData) => {
    try {
      const newReview = {
        bookId: String(id),
        userId: String(user.id),
        userName: user.name || "Khách hàng",
        rating: Number(reviewData.rating) || 5,
        comment: (reviewData.comment || "").trim(),
        createdAt: getLocalDateString(),
      };
      await bookApi.createReview(newReview);

      // Luôn fetch lại reviews mới nhất từ server để tránh race condition / stale state
      const freshRes = await bookApi.getReviews(id);
      const allReviews = freshRes.data || [];
      const newReviewCount = allReviews.length;
      const newRating = calculateAverageRating(allReviews);

      await bookApi.update(book.id, {
        rating: newRating,
        reviewCount: newReviewCount,
      });

      setBook((prev) => ({ ...prev, rating: newRating, reviewCount: newReviewCount }));
      setReviews(allReviews);
      setHasReviewed(true);
      toast.success("Cảm ơn bạn đã gửi đánh giá cho cuốn sách này!");
    } catch (err) {
      toast.error("Không thể gửi đánh giá lúc này. Vui lòng thử lại sau.");
    }
  };

  // UPDATE REVIEW: Cập nhật đánh giá và tính lại rating trung bình
  const handleEditReview = async (reviewId, updatedData) => {
    try {
      await bookApi.updateReview(reviewId, {
        rating: Number(updatedData.rating),
        comment: (updatedData.comment || "").trim(),
        updatedAt: getLocalDateString(),
      });

      const freshRes = await bookApi.getReviews(id);
      const allReviews = freshRes.data || [];
      const newRating = calculateAverageRating(allReviews);

      await bookApi.update(book.id, {
        rating: newRating,
      });

      setBook((prev) => ({ ...prev, rating: newRating }));
      setReviews(allReviews);
      toast.success("Đã cập nhật đánh giá thành công!");
    } catch (err) {
      toast.error("Không thể cập nhật đánh giá lúc này. Vui lòng thử lại sau.");
    }
  };

  // DELETE REVIEW: Xóa đánh giá và tính lại rating trung bình
  const handleDeleteReview = async (reviewId) => {
    try {
      await bookApi.deleteReview(reviewId);

      const freshRes = await bookApi.getReviews(id);
      const allReviews = freshRes.data || [];
      const newReviewCount = allReviews.length;
      const newRating = newReviewCount > 0 ? calculateAverageRating(allReviews) : 0;

      await bookApi.update(book.id, {
        rating: newRating,
        reviewCount: newReviewCount,
      });

      setBook((prev) => ({ ...prev, rating: newRating, reviewCount: newReviewCount }));
      setReviews(allReviews);

      if (user?.id) {
        const stillReviewed = allReviews.some(
          (r) => String(r.userId) === String(user.id)
        );
        setHasReviewed(stillReviewed);
      }

      toast.success("Đã xóa đánh giá thành công!");
    } catch (err) {
      toast.error("Không thể xóa đánh giá lúc này. Vui lòng thử lại sau.");
    }
  };

  if (loading) return <LoadingSpinner />;

  if (notFound || !book) {
    return (
      <Container className="py-5 text-center">
        <h2 className="fw-bold text-dark mb-3">Không tìm thấy sách</h2>
        <p className="text-muted mb-4">
          Cuốn sách bạn đang tìm kiếm không tồn tại hoặc đã ngừng kinh doanh.
        </p>
        <Button as={Link} to="/books" variant="primary">
          <FaArrowLeft className="me-2" />
          Quay lại danh mục sách
        </Button>
      </Container>
    );
  }

  const actualReviewCount = reviews.length;
  const isOutOfStock =
    book.stock <= 0 ||
    book.status === BOOK_STATUS.OUT_OF_STOCK ||
    book.isDeleted ||
    book.status === BOOK_STATUS.INACTIVE;

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <Button
          as={Link}
          to="/books"
          variant="outline-secondary"
          size="sm"
          className="btn-back d-inline-flex align-items-center"
        >
          <FaArrowLeft className="me-2 flex-shrink-0" />
          <span>Quay lại danh mục sách</span>
        </Button>
        {category && (
          <span className="text-muted small">
            Danh mục: <strong className="text-dark">{category.name}</strong>
          </span>
        )}
      </div>
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
          <h1 className="fw-bold text-dark">{book.title}</h1>
          <p className="text-muted fs-5">Tác giả: {book.author}</p>

          {category && (
            <Badge bg="secondary" className="mb-3 px-3 py-2">
              {category.name}
            </Badge>
          )}

          <div className="mb-3 d-flex align-items-center gap-2">
            <RatingStars rating={book.rating} size={20} />
            <span className="text-muted">
              {book.rating} ({actualReviewCount} lượt đánh giá)
            </span>
          </div>

          <h3 className="text-primary fw-bold mb-3">{formatCurrency(book.price)}</h3>
          <p className="lead text-secondary">{book.description}</p>

          <div className="mb-4">
            <span className="fw-bold me-2">Kho hàng:</span>
            {isOutOfStock ? (
              <Badge bg="danger">Tạm hết hàng</Badge>
            ) : (
              <Badge bg="success">Còn {book.stock} cuốn</Badge>
            )}
          </div>

          <div className="d-flex gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={handleAddToCart}
              disabled={isOutOfStock || isSubmitting}
              className="d-inline-flex align-items-center justify-content-center"
            >
              <FaCartPlus className="me-2 flex-shrink-0" />
              <span>{isOutOfStock ? "Tạm hết hàng" : "Thêm vào giỏ hàng"}</span>
            </Button>
            <Button
              variant={isInWishlist ? "danger" : "outline-danger"}
              size="lg"
              onClick={handleWishlist}
              disabled={isSubmitting}
              className="d-inline-flex align-items-center justify-content-center"
            >
              {isInWishlist ? (
                <FaHeart className="me-2 flex-shrink-0" />
              ) : (
                <FaRegHeart className="me-2 flex-shrink-0" />
              )}
              <span>{isInWishlist ? "Đã lưu yêu thích" : "Lưu vào yêu thích"}</span>
            </Button>
          </div>
        </Col>
      </Row>

      {/* Reviews Section */}
      <div className="mt-5">
        <h3 className="fw-bold text-dark mb-4">Đánh giá từ độc giả ({actualReviewCount})</h3>
        <ReviewList
          reviews={reviews}
          currentUser={user}
          onEditReview={handleEditReview}
          onDeleteReview={handleDeleteReview}
        />

        {isAuthenticated && (
          <div className="mt-4">
            {hasReviewed ? (
              <Alert variant="info">
                Bạn đã gửi đánh giá cho cuốn sách này rồi. Bạn có thể chỉnh sửa hoặc xóa đánh giá của mình ở danh sách trên.
              </Alert>
            ) : hasPurchased ? (
              <>
                <h4 className="fw-bold text-dark mb-3">Viết đánh giá của bạn</h4>
                <ReviewForm onSubmit={handleReviewSubmit} />
              </>
            ) : (
              <Alert variant="warning">
                Bạn cần mua và hoàn thành nhận cuốn sách này trước khi viết đánh giá.
              </Alert>
            )}
          </div>
        )}
      </div>
    </Container>
  );
};

export default BookDetailPage;
