import React from "react";
import RatingStars from "./RatingStars";

const ReviewList = ({ reviews, users }) => {
  if (!reviews || reviews.length === 0) {
    return <p className="text-muted">No reviews yet. Be the first to write one!</p>;
  }

  const getUserName = (userId) => {
    const user = users?.find((u) => u.id === userId);
    return user ? user.name : "Anonymous";
  };

  return (
    <div>
      {reviews.map((review) => (
        <div key={review.id} className="border-bottom py-3">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <strong>{getUserName(review.userId)}</strong>
            <small className="text-muted">{review.createdAt}</small>
          </div>
          <RatingStars rating={review.rating} />
          <p className="mt-2 mb-0">{review.comment}</p>
        </div>
      ))}
    </div>
  );
};

export default ReviewList;
