import axiosClient from "./axiosClient";

const orderApi = {
  getAll: (params) => axiosClient.get("/orders", { params }),
  getByUser: async (userId) => {
    const res = await axiosClient.get("/orders");
    if (userId !== undefined && userId !== null) {
      const filtered = (res.data || []).filter(
        (o) => String(o.userId) === String(userId)
      );
      return { ...res, data: filtered };
    }
    return res;
  },
  getById: (id) => axiosClient.get(`/orders/${id}`),
  create: (data) => axiosClient.post("/orders", data),
  updateStatus: (id, status) => axiosClient.patch(`/orders/${id}`, { status }),
  getOrderItems: async (orderId) => {
    const res = await axiosClient.get("/orderItems");
    if (orderId !== undefined && orderId !== null) {
      const filtered = (res.data || []).filter(
        (item) => String(item.orderId) === String(orderId)
      );
      return { ...res, data: filtered };
    }
    return res;
  },
  createOrderItem: (data) => axiosClient.post("/orderItems", data),
};

export default orderApi;
