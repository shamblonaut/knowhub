const defaultUrl = import.meta.env.VITE_CORPUS_API_URL || "http://localhost:8000/api/v1";
export const API_BASE = localStorage.getItem("CORPUS_URL") || defaultUrl;

export const setCorpusUrl = (url) => {
    if (url) localStorage.setItem("CORPUS_URL", url);
    else localStorage.removeItem("CORPUS_URL");
};
