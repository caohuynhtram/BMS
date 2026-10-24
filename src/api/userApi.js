import axiosClient from "./axiosClient";

const userApi = {
  getAll: () => axiosClient.get("/users"),
  getById: (id) => axiosClient.get(`/users/${id}`),
  create: (data) => axiosClient.post("/users", data),
  update: (id, data) => axiosClient.patch(`/users/${id}`, data),
  delete: (id) => axiosClient.delete(`/users/${id}`),
  updateStatus: (id, status) => axiosClient.patch(`/users/${id}`, { status }),
};

export default userApi;
