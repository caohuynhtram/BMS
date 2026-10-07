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
  getReviews: (bookId) => axiosClient.get(`/reviews?bookId=${bookId}`),
  createReview: (data) => axiosClient.post("/reviews", data),
};

export default bookApi;
