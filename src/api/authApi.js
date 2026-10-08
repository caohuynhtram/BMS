import axiosClient from "./axiosClient";

const authApi = {
  login: (email) =>
    axiosClient.get(`/users?email=${email}`),
  register: (data) => axiosClient.post("/users", data),
  updateProfile: (id, data) => axiosClient.patch(`/users/${id}`, data),
};

export default authApi;
