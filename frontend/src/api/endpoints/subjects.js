import api from "../axios";

export const getSubjects = async (semester = null) => {
    return api
        .get("/subjects/", { params: semester ? { semester } : {} })
        .then((r) => r.data);
};

export const getSemesters = async () => {
    return api.get("/semesters/").then((r) => r.data);
};

export const createSubject = async (data) => {
    return api.post("/subjects/", data).then((r) => r.data);
};

export const updateSubject = async (id, data) => {
    return api.patch(`/subjects/${id}/`, data).then((r) => r.data);
};

export const deleteSubject = async (id) => {
    return api.delete(`/subjects/${id}/`).then((r) => r.data);
};
