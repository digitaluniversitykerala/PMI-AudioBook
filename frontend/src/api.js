import axios from "axios";

const API_BASE_URL = "/api";

const API = axios.create({
  // Use the API base; callers should include "/auth/..." or other namespaces explicitly
  baseURL: API_BASE_URL,
});


// Attach the JWT token to every request if available
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Handle unauthorized responses globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // If we're not already on the login page, redirect
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login?expired=true";
      }
    }
    return Promise.reject(error);
  }
);

const BASE_URL = "";

export { BASE_URL };
export default API;
