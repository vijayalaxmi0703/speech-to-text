import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
});

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err?.response?.data?.message || err.message || "Network error";

    if (err?.response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("authUser");
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
