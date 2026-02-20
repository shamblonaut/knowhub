import api from "../axios";
import { USE_MOCK } from "../config";
import { MOCK_ANALYTICS } from "../mock";

export const getSummary = async () => {
    if (USE_MOCK) return MOCK_ANALYTICS.summary;
    return api.get("/analytics/summary/").then((r) => r.data);
};

export const getUploadsBySemester = async () => {
    if (USE_MOCK) return { data: MOCK_ANALYTICS.uploadsBySemester };
    return api.get("/analytics/uploads-by-semester/").then((r) => r.data);
};

export const getTopResources = async () => {
    if (USE_MOCK) return { data: MOCK_ANALYTICS.topResources };
    return api.get("/analytics/top-resources/").then((r) => r.data);
};

export const getFacultyActivity = async () => {
    if (USE_MOCK) return { data: MOCK_ANALYTICS.facultyActivity };
    return api.get("/analytics/faculty-activity/").then((r) => r.data);
};

export const getUploadsByFormat = async () => {
    if (USE_MOCK) return { data: MOCK_ANALYTICS.uploadsByFormat };
    return api.get("/analytics/uploads-by-format/").then((r) => r.data);
};
