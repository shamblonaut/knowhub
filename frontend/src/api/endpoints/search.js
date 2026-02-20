import api from "../axios";
import { USE_MOCK } from "../config";
import { MOCK_SEARCH_RESULTS, MOCK_RESOURCES } from "../mock";

export const search = async (params) => {
    if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 500));
        return MOCK_SEARCH_RESULTS(params.q || "");
    }
    return api.get("/search/", { params }).then((r) => r.data);
};

export const getRecommendations = async (resourceId) => {
    if (USE_MOCK) {
        return {
            resource_id: resourceId,
            recommendations: MOCK_RESOURCES.slice(0, 3).map((r) => ({
                ...r,
                similarity_score: 0.87,
            })),
        };
    }
    return api.get(`/search/recommend/${resourceId}/`).then((r) => r.data);
};
