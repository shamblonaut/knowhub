import api from "../axios";

export const getSummary = async () => {
    return api.get("/analytics/summary/").then((r) => r.data);
};

export const getUploadsBySemester = async () => {
    return api.get("/analytics/uploads-by-semester/").then((r) => r.data);
};

export const getTopResources = async () => {
    return api.get("/analytics/top-resources/").then((r) => r.data);
};

export const getFacultyActivity = async () => {
    return api.get("/analytics/faculty-activity/").then((r) => r.data);
};

export const getUploadsByFormat = async () => {
    return api.get("/analytics/uploads-by-format/").then((r) => r.data);
};
