import axiosClient from "./axiosClient";

const voucherApi = {
  getAll: () => axiosClient.get("/vouchers"),
  getByCode: (code) =>
    axiosClient.get("/vouchers").then((res) => ({
      ...res,
      data: (res.data || []).filter(
        (v) => (v.code || "").toUpperCase() === (code || "").toUpperCase().trim()
      ),
    })),
  create: (data) => axiosClient.post("/vouchers", data),
  update: (id, data) => axiosClient.patch(`/vouchers/${id}`, data),
  delete: (id) => axiosClient.delete(`/vouchers/${id}`),
};

export default voucherApi;
