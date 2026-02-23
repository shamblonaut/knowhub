import axios from "axios";
import { API_BASE } from "./config";

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        "ngrok-skip-browser-warning": "69420",
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Authorization is already handled by config.headers if provided, 
    // but we use localStorage here for dynamic updates.
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Do not reload/redirect if the 401 is from the login endpoint
            if (error.config && !error.config.url.includes("/auth/login")) {
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;
