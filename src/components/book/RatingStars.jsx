import React from "react";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

const RatingStars = ({ rating, size = 14 }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  for (let i = 0; i < fullStars; i++) {
    stars.push(<FaStar key={`full-${i}`} className="text-warning" size={size} />);
  }
  if (hasHalf) {
    stars.push(<FaStarHalfAlt key="half" className="text-warning" size={size} />);
  }
  const remaining = 5 - fullStars - (hasHalf ? 1 : 0);
  for (let i = 0; i < remaining; i++) {
    stars.push(<FaRegStar key={`empty-${i}`} className="text-warning" size={size} />);
  }

  return <span className="d-inline-flex align-items-center gap-1">{stars}</span>;
};

export default RatingStars;
