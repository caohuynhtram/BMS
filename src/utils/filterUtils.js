export const filterBooks = (books = [], { category, search, minPrice, maxPrice, sort } = {}) => {
  let result = [...books];
  if (category && category !== 'All') {
    result = result.filter((b) => b.category === category);
  }
  if (search) {
    const q = search.toLowerCase().trim();
    result = result.filter(
      (b) =>
        b.title?.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q)
    );
  }
  if (minPrice != null && minPrice !== '') {
    result = result.filter((b) => Number(b.price) >= Number(minPrice));
  }
  if (maxPrice != null && maxPrice !== '') {
    result = result.filter((b) => Number(b.price) <= Number(maxPrice));
  }
  if (sort === 'price-asc') {
    result.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sort === 'price-desc') {
    result.sort((a, b) => Number(b.price) - Number(a.price));
  } else if (sort === 'rating') {
    result.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
  }
  return result;
};
