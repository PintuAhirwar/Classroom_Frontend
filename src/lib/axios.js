// lib/axios.js (update)
import axios from "axios";
import { API_BASE } from "@/lib/api";

const api = axios.create({
  baseURL: `${API_BASE}/api/`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalReq = err.config;
    if (err.response?.status === 401 && !originalReq._retry ) {
      try {
        const refresh = localStorage.getItem("refresh_token");
        const res = await axios.post(`${API_BASE}/api/token/refresh/`,
          localStorage.setItem("access_token", res.data.access));
          originalReq.headers.Authorization = `Bearer ${res.data.access}`;
          return api(originalReq);
      } catch {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
