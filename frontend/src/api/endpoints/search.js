import api from "../axios";

export const search = async (params) => {
    return api.get("/search/", { params }).then((r) => r.data);
};

export const getRecommendations = async (resourceId) => {
    return api.get(`/search/recommend/${resourceId}/`).then((r) => r.data);
};
