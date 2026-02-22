import api from "../axios";

export const login = async ({ email, password }) => {
    return api.post("/auth/login/", { email, password }).then((r) => r.data);
};

export const register = async (data) => {
    return api.post("/auth/register/", data).then((r) => r.data);
};

export const getMe = async () => {
    return api.get("/auth/me/").then((r) => r.data);
};

export const createFaculty = async (data) => {
    return api.post("/auth/faculty/create/", data).then((r) => r.data);
};

export const setUserActive = async (userId, isActive) => {
    return api
        .patch(`/auth/users/${userId}/activate/`, { is_active: isActive })
        .then((r) => r.data);
};

export const getFaculties = async () => {
    return api.get("/auth/users/", { params: { role: "faculty" } }).then((r) => r.data);
};
