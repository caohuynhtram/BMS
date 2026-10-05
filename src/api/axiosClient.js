import axios from "axios";
import { API_BASE_URL } from "../utils/helpers";

const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json"
    }
});

axiosClient.interceptors.request.use(
    (config) => {
        const token =
            localStorage.getItem("accessToken") || localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;

        if (status === 401 || status === 403) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("token");
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("infinia:unauthorized"));
            }
        }

        return Promise.reject(error);
    }
);

export default axiosClient;
