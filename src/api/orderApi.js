import axiosClient from "./axiosClient";

const orderApi = {
  getAll: (params) => axiosClient.get("/orders", { params }),
  getByUser: (userId) => axiosClient.get(`/orders?userId=${userId}`),
  getById: (id) => axiosClient.get(`/orders/${id}`),
  create: (data) => axiosClient.post("/orders", data),
  updateStatus: (id, status) => axiosClient.patch(`/orders/${id}`, { status }),
  getOrderItems: (orderId) =>
    axiosClient.get(`/orderItems?orderId=${orderId}`),
  createOrderItem: (data) => axiosClient.post("/orderItems", data),
};

export default orderApi;
