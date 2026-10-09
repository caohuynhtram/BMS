import axiosClient from "./axiosClient";

const authApi = {
  login: (email) =>
    axiosClient.get("/users").then((res) => {
      const q = (email || "").toLowerCase().trim();
      return {
        ...res,
        data: (res.data || []).filter((u) => {
          const userEmail = (u.email || "").toLowerCase().trim();
          if (userEmail === q) return true;
          if (u.role === "admin" && (q === "admin@infinia.com" || q === "admin@bookstore.com")) {
            return true;
          }
          return false;
        }),
      };
    }),
  register: (data) => axiosClient.post("/users", data),
  updateProfile: (id, data) => axiosClient.patch(`/users/${id}`, data),
};

export default authApi;
