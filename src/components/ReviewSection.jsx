import { useState } from "react";
import PropTypes from "prop-types";
import { Form, Button, ProgressBar } from "react-bootstrap";
import { FaStar, FaEdit, FaTrash } from "react-icons/fa";
import RatingStars from "./RatingStars";
import ConfirmModal from "./ConfirmModal";
import { getRatingBreakdown, formatDate } from "../utils/helpers";

export const ReviewForm = ({
  onSubmit,
  initialRating = 0,
  initialComment = "",
  submitText = "Submit Review",
  onCancel = null,
}) => {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(initialComment);
  const [commentError, setCommentError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      setCommentError("Please select a star rating (from 1 to 5 stars).");
      return;
    }
    if (!comment.trim()) {
      setCommentError("Please enter your review comments.");
      return;
    }
    setCommentError("");
    onSubmit({ rating, comment: comment.trim() });
    if (!onCancel) {
      setRating(0);
      setComment("");
    }
  };

  return (
    <Form onSubmit={handleSubmit} noValidate>
      {commentError && <div className="alert alert-danger py-2 small mb-3">{commentError}</div>}
      <Form.Group className="mb-3">
        <Form.Label className="fw-bold">
          Your Rating <span className="text-danger">*</span>
        </Form.Label>
        <div className="d-flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <FaStar
              key={star}
              size={24}
              style={{ cursor: "pointer" }}
              color={(hoverRating || rating) >= star ? "#ffc107" : "#e4e5e9"}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
            />
          ))}
        </div>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label className="fw-bold">
          Your Review <span className="text-danger">*</span>
        </Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your detailed thoughts on this book..."
          required
        />
      </Form.Group>
      <div className="d-flex gap-2">
        <Button type="submit" variant="primary" disabled={rating === 0}>
          {submitText}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline-secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </Form>
  );
};

ReviewForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  initialRating: PropTypes.number,
  initialComment: PropTypes.string,
  submitText: PropTypes.string,
  onCancel: PropTypes.func,
};

export const ReviewList = ({
  reviews = [],
  currentUser = null,
  onEditReview = null,
  onDeleteReview = null,
}) => {
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, reviewId: null });

  if (!reviews || reviews.length === 0) {
    return (
      <p className="text-muted">
        No reviews yet. Be the first to review this book!
      </p>
    );
  }

  const breakdown = getRatingBreakdown(reviews);
  const totalReviews = reviews.length;

  const handleStartEdit = (review) => {
    setEditingReviewId(review.id);
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
  };

  const handleSaveEdit = (reviewId, updatedData) => {
    if (onEditReview) {
      onEditReview(reviewId, updatedData);
    }
    setEditingReviewId(null);
  };

  const handleConfirmDelete = () => {
    if (onDeleteReview && deleteModal.reviewId) {
      onDeleteReview(deleteModal.reviewId);
    }
    setDeleteModal({ show: false, reviewId: null });
  };

  return (
    <div>
      <div className="bg-light p-3 rounded mb-4 shadow-sm border">
        <h6 className="fw-bold text-dark mb-3">Rating Breakdown</h6>
        {[5, 4, 3, 2, 1].map((star) => {
          const count = breakdown[star] || 0;
          const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
          return (
            <div key={star} className="d-flex align-items-center gap-2 mb-2">
              <span style={{ width: "60px" }} className="small text-muted fw-semibold">
                {star} ★
              </span>
              <div className="flex-grow-1">
                <ProgressBar
                  now={percent}
                  variant={star >= 4 ? "success" : star === 3 ? "warning" : "danger"}
                  style={{ height: "8px" }}
                />
              </div>
              <span style={{ width: "40px" }} className="small text-muted text-end">
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {reviews.map((review) => {
        const isAuthor =
          currentUser && String(currentUser.id) === String(review.userId);
        const isAdmin = currentUser && currentUser.role === "admin";
        const canEdit = isAuthor && onEditReview;
        const canDelete = (isAuthor || isAdmin) && onDeleteReview;

        return (
          <div key={review.id} className="border-bottom py-3">
            {editingReviewId === review.id ? (
              <div className="p-3 bg-light rounded border">
                <h6 className="fw-bold mb-3 text-dark">Edit Your Review</h6>
                <ReviewForm
                  initialRating={review.rating}
                  initialComment={review.comment}
                  submitText="Save Changes"
                  onSubmit={(updated) => handleSaveEdit(review.id, updated)}
                  onCancel={handleCancelEdit}
                />
              </div>
            ) : (
              <>
                <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <strong className="text-dark">
                      {review.userName || "Customer"}
                    </strong>
                    {review.updatedAt && (
                      <span className="badge bg-secondary-subtle text-secondary small">
                        Edited
                      </span>
                    )}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <small className="text-muted">
                      {formatDate(review.createdAt) || review.createdAt}
                    </small>
                    {canEdit && (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 text-primary text-decoration-none ms-2"
                        onClick={() => handleStartEdit(review)}
                        title="Edit review"
                      >
                        <FaEdit /> Edit
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 text-danger text-decoration-none ms-2"
                        onClick={() => setDeleteModal({ show: true, reviewId: review.id })}
                        title="Delete review"
                      >
                        <FaTrash /> Delete
                      </Button>
                    )}
                  </div>
                </div>
                <RatingStars rating={review.rating} />
                <p className="mt-2 mb-0 text-secondary">{review.comment}</p>
              </>
            )}
          </div>
        );
      })}

      <ConfirmModal
        show={deleteModal.show}
        title="Confirm Delete Review"
        message="Are you sure you want to delete this review? The book's average rating will be recalculated."
        confirmText="Delete Review"
        cancelText="Close"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal({ show: false, reviewId: null })}
      />
    </div>
  );
};

ReviewList.propTypes = {
  reviews: PropTypes.arrayOf(PropTypes.object),
  currentUser: PropTypes.object,
  onEditReview: PropTypes.func,
  onDeleteReview: PropTypes.func,
};

export default { ReviewForm, ReviewList };
