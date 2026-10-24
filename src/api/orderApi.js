import axiosClient from "./axiosClient";

const orderApi = {
  getAll: (params) => axiosClient.get("/orders", { params }),
  getByUser: (userId) =>
    axiosClient.get("/orders", {
      params: userId !== undefined && userId !== null ? { userId: String(userId) } : {},
    }),
  getById: (id) => axiosClient.get(`/orders/${id}`),
  create: (data) => axiosClient.post("/orders", data),
  updateStatus: (id, status) => axiosClient.patch(`/orders/${id}`, { status }),
  getOrderItems: (orderId) =>
    axiosClient.get("/orderItems", {
      params: orderId !== undefined && orderId !== null ? { orderId: String(orderId) } : {},
    }),
  createOrderItem: (data) => axiosClient.post("/orderItems", data),
};

export default orderApi;
