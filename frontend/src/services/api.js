import axios from "axios";

// In production (Vercel), VITE_API_URL must be set to the live Render
// backend URL, e.g. https://book-store-xxxx.onrender.com/api
// Locally, falls back to /api, which works if vite.config.js proxies
// /api to your local Flask server — otherwise set VITE_API_URL in a
// local .env file too, e.g. VITE_API_URL=http://localhost:5000/api
const baseURL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL,
  timeout: 4000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("booked_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
