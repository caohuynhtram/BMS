import axiosClient from "./axiosClient";

const userApi = {
  getAll: () => axiosClient.get("/users"),
  getById: (id) => axiosClient.get(`/users/${id}`),
  update: (id, data) => axiosClient.patch(`/users/${id}`, data),
  delete: (id) => axiosClient.delete(`/users/${id}`),
  updateStatus: (id, status) => axiosClient.patch(`/users/${id}`, { status }),
};

export default userApi;
