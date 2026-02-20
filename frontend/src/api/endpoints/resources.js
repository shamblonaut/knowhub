import api from "../axios";
import { API_BASE, USE_MOCK } from "../config";
import { MOCK_RESOURCES, MOCK_PENDING_RESOURCES } from "../mock";

export const getResources = async (filters = {}) => {
    if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 300));
        let results = [...MOCK_RESOURCES];
        if (filters.semester)
            results = results.filter((r) => r.semester === Number(filters.semester));
        if (filters.subject)
            results = results.filter((r) => r.subject_id === filters.subject);
        if (filters.format)
            results = results.filter((r) => r.file_format === filters.format);
        return { count: results.length, page: 1, page_size: 20, results };
    }
    return api.get("/resources/", { params: filters }).then((r) => r.data);
};

export const getResource = async (id) => {
    if (USE_MOCK) return MOCK_RESOURCES.find((r) => r.id === id) || null;
    return api.get(`/resources/${id}/`).then((r) => r.data);
};

export const uploadResource = async (formData) => {
    if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 800));
        return {
            ...MOCK_RESOURCES[0],
            id: "res_new_" + Date.now(),
            title: formData.get?.("title") || formData.title,
        };
    }
    const isFile = formData instanceof FormData;
    return api
        .post("/resources/upload/", formData, {
            headers: isFile ? { "Content-Type": "multipart/form-data" } : {},
        })
        .then((r) => r.data);
};

export const getPendingResources = async () => {
    if (USE_MOCK)
        return {
            count: MOCK_PENDING_RESOURCES.length,
            results: MOCK_PENDING_RESOURCES,
        };
    return api.get("/resources/pending/").then((r) => r.data);
};
export const getMySubmissions = async (filters = {}) => {
    if (USE_MOCK) return { count: 0, results: [] };
    return api.get("/resources/my-submissions/", { params: filters }).then((r) => r.data);
};

export const approveResource = async (id) => {
    if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 300));
        return {
            message: "Resource approved.",
            resource_id: id,
            status: "approved",
        };
    }
    return api.post(`/resources/${id}/approve/`).then((r) => r.data);
};

export const rejectResource = async (id, reason = "") => {
    if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 300));
        return {
            message: "Resource rejected and deleted.",
            resource_id: id,
            status: "rejected",
        };
    }
    return api.post(`/resources/${id}/reject/`, { reason }).then((r) => r.data);
};

export const deleteResource = async (id) => {
    if (USE_MOCK) return { message: "Resource deleted." };
    return api.delete(`/resources/${id}/`).then((r) => r.data);
};

export const downloadResource = (id, filename) => {
    if (USE_MOCK) {
        alert(`[MOCK] Would download file: ${filename}`);
        return;
    }
    // Direct browser download
    const token = localStorage.getItem("access_token");
    const a = document.createElement("a");
    a.href = `${API_BASE}/resources/${id}/download/?token=${token}`;
    a.download = filename;
    a.click();
};
