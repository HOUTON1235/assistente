import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Adiciona o token JWT em todas as requisições (apenas no browser)
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Trata erro 401 — sessão expirada
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      if (!window.location.pathname.includes("/login")) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("plano");
        localStorage.removeItem("trial_dias");
        window.location.replace("/login");
      }
    }
    return Promise.reject(error);
  }
);
