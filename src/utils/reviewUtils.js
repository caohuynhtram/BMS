export const calculateAverageRating = (reviews = []) => {
  if (!reviews || !reviews.length) return 0;
  const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
  return Number((sum / reviews.length).toFixed(1));
};

export const getRatingBreakdown = (reviews = []) => {
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  if (!reviews) return breakdown;
  reviews.forEach((r) => {
    const stars = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 0)));
    breakdown[stars] = (breakdown[stars] || 0) + 1;
  });
  return breakdown;
};
