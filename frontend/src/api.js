import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // backend server
});


// Attach tyheb JWT token to every request if available
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
