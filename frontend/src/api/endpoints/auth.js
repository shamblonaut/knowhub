import api from "../axios";
import { USE_MOCK } from "../config";
import { MOCK_USER_HOD, MOCK_USER_FACULTY, MOCK_USER_STUDENT } from "../mock";

// Change this to test different roles during development:
// MOCK_USER_HOD | MOCK_USER_FACULTY | MOCK_USER_STUDENT
let ACTIVE_MOCK_USER = MOCK_USER_HOD;

export const login = async ({ email, password }) => {
    if (USE_MOCK) {
        if (email.includes("hod")) ACTIVE_MOCK_USER = MOCK_USER_HOD;
        else if (email.includes("faculty")) ACTIVE_MOCK_USER = MOCK_USER_FACULTY;
        else if (email.includes("student")) ACTIVE_MOCK_USER = MOCK_USER_STUDENT;

        await new Promise((r) => setTimeout(r, 400)); // simulate network delay
        return {
            access: "mock_access_token",
            refresh: "mock_refresh_token",
            user: ACTIVE_MOCK_USER,
        };
    }
    return api.post("/auth/login/", { email, password }).then((r) => r.data);
};

export const register = async (data) => {
    if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 400));
        return {
            message: "Registration successful.",
            user: { ...data, id: "new001", role: "student" },
        };
    }
    return api.post("/auth/register/", data).then((r) => r.data);
};

export const getMe = async () => {
    if (USE_MOCK) return ACTIVE_MOCK_USER;
    return api.get("/auth/me/").then((r) => r.data);
};

export const createFaculty = async (data) => {
    if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 400));
        return {
            message: "Faculty account created.",
            user: { ...data, id: "fac_new", role: "faculty" },
        };
    }
    return api.post("/auth/faculty/create/", data).then((r) => r.data);
};

export const setUserActive = async (userId, isActive) => {
    if (USE_MOCK)
        return {
            message: isActive ? "User activated." : "User deactivated.",
            user_id: userId,
            is_active: isActive,
        };
    return api
        .patch(`/auth/users/${userId}/activate/`, { is_active: isActive })
        .then((r) => r.data);
};

// DEV HELPER: Switch mock role without reloading
export const _setMockRole = (role) => {
    const map = {
        hod: MOCK_USER_HOD,
        faculty: MOCK_USER_FACULTY,
        student: MOCK_USER_STUDENT,
    };
    ACTIVE_MOCK_USER = map[role];
};
