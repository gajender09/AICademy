import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // ✅ FIXED
});

// attach token
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`; // ✅ standard way
  }

  return req;
});

export default API;