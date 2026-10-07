import axiosClient from "./axiosClient";

const voucherApi = {
  getAll: () => axiosClient.get("/vouchers"),
  getByCode: (code) => axiosClient.get(`/vouchers?code=${code}`),
  create: (data) => axiosClient.post("/vouchers", data),
  update: (id, data) => axiosClient.patch(`/vouchers/${id}`, data),
  delete: (id) => axiosClient.delete(`/vouchers/${id}`),
};

export default voucherApi;
