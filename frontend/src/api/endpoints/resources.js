import api from "../axios";
import { API_BASE } from "../config";

export const getResources = async (filters = {}) => {
    return api.get("/resources/", { params: filters }).then((r) => r.data);
};

export const getResource = async (id) => {
    return api.get(`/resources/${id}/`).then((r) => r.data);
};

export const uploadResource = async (formData) => {
    const isFile = formData instanceof FormData;
    return api
        .post("/resources/upload/", formData, {
            headers: isFile ? { "Content-Type": "multipart/form-data" } : {},
        })
        .then((r) => r.data);
};

export const getPendingResources = async () => {
    return api.get("/resources/pending/").then((r) => r.data);
};
export const getMySubmissions = async (filters = {}) => {
    return api.get("/resources/my-submissions/", { params: filters }).then((r) => r.data);
};

export const approveResource = async (id) => {
    return api.post(`/resources/${id}/approve/`).then((r) => r.data);
};

export const rejectResource = async (id, reason = "") => {
    return api.post(`/resources/${id}/reject/`, { reason }).then((r) => r.data);
};

export const deleteResource = async (id) => {
    return api.delete(`/resources/${id}/`).then((r) => r.data);
};

export const downloadResource = (id, filename) => {
    // Direct browser download
    const token = localStorage.getItem("access_token");
    const a = document.createElement("a");
    a.href = `${API_BASE}/resources/${id}/download/?token=${token}`;
    a.download = filename;
    a.click();
};
