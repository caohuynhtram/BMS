import axiosClient from "./axiosClient";

const bookApi = {
  getAll: (params) => axiosClient.get("/books", { params }),
  getById: (id) => axiosClient.get(`/books/${id}`),
  create: (data) => axiosClient.post("/books", data),
  update: (id, data) => axiosClient.patch(`/books/${id}`, data),
  delete: (id) => axiosClient.delete(`/books/${id}`),
  getCategories: () => axiosClient.get("/categories"),
  createCategory: (data) => axiosClient.post("/categories", data),
  updateCategory: (id, data) => axiosClient.patch(`/categories/${id}`, data),
  deleteCategory: (id) => axiosClient.delete(`/categories/${id}`),
  getReviews: async (bookId) => {
    const res = await axiosClient.get("/reviews");
    if (bookId !== undefined && bookId !== null) {
      const filtered = (res.data || []).filter(
        (r) => String(r.bookId) === String(bookId)
      );
      return { ...res, data: filtered };
    }
    return res;
  },
  createReview: (data) => axiosClient.post("/reviews", data),
  updateReview: (id, data) => axiosClient.patch(`/reviews/${id}`, data),
  deleteReview: (id) => axiosClient.delete(`/reviews/${id}`),
};

export default bookApi;
