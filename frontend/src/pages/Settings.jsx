import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Settings() {
    const navigate = useNavigate();
    const [url, setUrl] = useState(
        localStorage.getItem("CORPUS_URL") || 
        import.meta.env.VITE_CORPUS_API_URL || 
        "http://localhost:8000/api/v1"
    );

    const handleSave = (e) => {
        e.preventDefault();
        try {
            new URL(url); // Basic validation
            if (url) {
                localStorage.setItem("CORPUS_URL", url);
                toast.success("Corpus URL updated. Reloading...");
                setTimeout(() => window.location.reload(), 1000);
            } else {
                localStorage.removeItem("CORPUS_URL");
                toast.success("Corpus URL reset to default. Reloading...");
                setTimeout(() => window.location.reload(), 1000);
            }
        } catch {
            toast.error("Please enter a valid URL (e.g., https://api.example.com)");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-lg">
                <div className="mb-8 flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Corpus Settings</h1>
                        <p className="text-sm text-gray-500">Configure your connection to the Corpus knowledge base.</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
                    <form onSubmit={handleSave} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Corpus API URL
                            </label>
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://your-corpus-api.com/api/v1"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-accent focus:outline-none transition"
                            />
                            <p className="mt-2 text-xs text-gray-400">
                                Default: <code className="bg-gray-50 px-1 rounded">{import.meta.env.VITE_CORPUS_API_URL || "http://localhost:8000/api/v1"}</code>
                            </p>
                        </div>

                        <div className="flex gap-4 pt-2">
                            <button
                                type="submit"
                                className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-opacity-90 transition shadow-sm"
                            >
                                Save Configuration
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    localStorage.removeItem("CORPUS_URL");
                                    toast.success("Resetting...");
                                    setTimeout(() => window.location.reload(), 1000);
                                }}
                                className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition"
                            >
                                Reset
                            </button>
                        </div>
                    </form>

                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4">
                        <div className="bg-blue-100 p-2 rounded-xl text-blue-500 shrink-0 self-start">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                            </svg>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-blue-900">About Corpus Settings</p>
                            <p className="text-xs text-blue-700 leading-relaxed">
                                Changing the Corpus URL will update where the application fetches all resource data including subjects, faculty, and documents. Only change this if you are using a custom Corpus instance.
                            </p>
                        </div>
                    </div>
                </div>

                <p className="text-center mt-8 text-sm text-gray-400">
                    Version 1.0.0 &bull; Corpus Open Source
                </p>
            </div>
        </div>
    );
}
