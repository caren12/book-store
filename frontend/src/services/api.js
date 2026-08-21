import axios from "axios";
import { handleMockRequest } from "./mockApi";

const api = axios.create({
  baseURL: "/api",
  timeout: 4000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("booked_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Dev convenience: if there's no real backend responding (network error,
// timeout, or the dev-server proxy failing with a 500 because nothing is
// listening on the target port), transparently serve mock data instead so
// the frontend is fully usable on its own. A real backend, once running,
// takes over automatically — no configuration needed.
let warnedAboutMock = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const noRealServer = !error.response || error.response.status >= 500;
    if (noRealServer) {
      if (!warnedAboutMock) {
        console.info(
          "%cBooked: no backend detected — using built-in mock data for this session.",
          "color: #B8863B; font-weight: bold;"
        );
        warnedAboutMock = true;
      }
      return handleMockRequest(error.config);
    }
    return Promise.reject(error);
  }
);

export default api;