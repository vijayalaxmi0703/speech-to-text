import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // normalize errors for callers
    const error = err?.response?.data?.message || err.message || "Network error";
    return Promise.reject(new Error(error));
  }
);

export default api;
