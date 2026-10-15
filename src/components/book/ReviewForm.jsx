import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import { FaStar } from "react-icons/fa";

const ReviewForm = ({ onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) return;
    onSubmit({ rating, comment });
    setRating(0);
    setComment("");
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label className="fw-bold">Your Rating</Form.Label>
        <div className="d-flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <FaStar
              key={star}
              size={24}
              className="cursor-pointer"
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
        <Form.Label className="fw-bold">Your Review</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write your review here..."
          required
        />
      </Form.Group>
      <Button type="submit" variant="primary" disabled={rating === 0}>
        Submit Review
      </Button>
    </Form>
  );
};

export default ReviewForm;
