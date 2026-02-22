import api from "../axios";

export const getNotices = async () => {
    return api.get("/notices/").then((r) => r.data);
};

export const createNotice = async (data) => {
    return api.post("/notices/", data).then((r) => r.data);
};

export const updateNotice = async (id, data) => {
    return api.patch(`/notices/${id}/`, data).then((r) => r.data);
};

export const deleteNotice = async (id) => {
    return api.delete(`/notices/${id}/`).then((r) => r.data);
};
