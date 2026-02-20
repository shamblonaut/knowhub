import api from "../axios";
import { USE_MOCK } from "../config";
import { MOCK_SUBJECTS } from "../mock";

export const getSubjects = async (semester = null) => {
    if (USE_MOCK) {
        const results = semester
            ? MOCK_SUBJECTS.filter((s) => s.semester === Number(semester))
            : MOCK_SUBJECTS;
        return { count: results.length, results };
    }
    return api
        .get("/subjects/", { params: semester ? { semester } : {} })
        .then((r) => r.data);
};

export const getSemesters = async () => {
    if (USE_MOCK) return { semesters: [1, 2, 3, 4, 5, 6] };
    return api.get("/semesters/").then((r) => r.data);
};

export const createSubject = async (data) => {
    if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 400));
        return {
            ...data,
            id: "sub_new_" + Date.now(),
            created_at: new Date().toISOString(),
        };
    }
    return api.post("/subjects/", data).then((r) => r.data);
};

export const updateSubject = async (id, data) => {
    if (USE_MOCK) return { ...MOCK_SUBJECTS[0], ...data, id };
    return api.patch(`/subjects/${id}/`, data).then((r) => r.data);
};

export const deleteSubject = async (id) => {
    if (USE_MOCK) return { message: "Subject deleted." };
    return api.delete(`/subjects/${id}/`).then((r) => r.data);
};
