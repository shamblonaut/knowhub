import axios from "axios";
import { API_BASE } from "./config";
import { getMockResponse } from "./mockData";

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        "ngrok-skip-browser-warning": "69420",
    }
});

api.interceptors.request.use((config) => {
    const isDemoMode = localStorage.getItem("demo_mode") === "true";
    
    // Completely bypass network if in demo mode
    if (isDemoMode) {
        config.adapter = async (config) => {
            console.warn(`Demo Mode: Intercepting request to ${config.url}`);
            
            // Merge query params and request body for the mock responder
            let payload = { ...config.params };
            if (config.data) {
                try {
                    const data = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
                    payload = { ...payload, ...data };
                } catch (e) {
                    console.error("Mock Proxy: Failed to parse request data", e);
                }
            }

            const mock = getMockResponse(config.url, payload);
            if (mock) {
                return {
                    data: mock.data,
                    status: 200,
                    statusText: "OK",
                    headers: {},
                    config: config,
                };
            }
            // Fallback for unmocked endpoints in demo mode
            return Promise.reject({
                response: {
                    data: { error: "Endpoint not mocked in Demo Mode" },
                    status: 404
                },
                config
            });
        };
    }

    const token = localStorage.getItem("access_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
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
