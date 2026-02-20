import api from "../axios";
import { USE_MOCK } from "../config";
import { MOCK_NOTICES } from "../mock";

export const getNotices = async () => {
    if (USE_MOCK) return { count: MOCK_NOTICES.length, results: MOCK_NOTICES };
    return api.get("/notices/").then((r) => r.data);
};

export const createNotice = async (data) => {
    if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 400));
        return {
            ...data,
            id: "not_new",
            posted_by: "hod001",
            posted_by_name: "Dr. Mehta",
            is_new: true,
            is_pinned: false,
            created_at: new Date().toISOString(),
        };
    }
    return api.post("/notices/", data).then((r) => r.data);
};

export const updateNotice = async (id, data) => {
    if (USE_MOCK) return { ...MOCK_NOTICES[0], ...data, id };
    return api.patch(`/notices/${id}/`, data).then((r) => r.data);
};

export const deleteNotice = async (id) => {
    if (USE_MOCK) return { message: "Notice deleted." };
    return api.delete(`/notices/${id}/`).then((r) => r.data);
};
