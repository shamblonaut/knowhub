import { useQuery } from "@tanstack/react-query";
import { getRecommendations } from "../api/endpoints/search";
import Spinner from "./Spinner";
import Badge from "./Badge";

export default function RecommendPanel({ resource, onClose }) {
    const { data, isLoading } = useQuery({
        queryKey: ["recommend", resource.id],
        queryFn: () => getRecommendations(resource.id),
    });

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-30 z-50 flex justify-end"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-white h-full shadow-xl overflow-y-auto p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-bold text-primary text-lg">Similar Resources</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-xl"
                    >
                        ✕
                    </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-1">
                        <Badge
                            type={resource.file_format || "url"}
                            label={(resource.file_format || "URL").toUpperCase()}
                        />
                        <span className="text-xs text-gray-500">
                            {resource.subject_code}
                        </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">
                        {resource.title}
                    </p>
                </div>

                {isLoading ? (
                    <Spinner />
                ) : (
                    <div className="space-y-3">
                        {(data?.recommendations || []).map((r) => (
                            <div key={r.id} className="border border-gray-100 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge
                                        type={r.file_format || "url"}
                                        label={(r.file_format || "URL").toUpperCase()}
                                    />
                                    <span className="text-xs text-gray-400">
                                        {r.subject_code}
                                    </span>
                                    <span className="ml-auto text-xs text-accent font-medium">
                                        {(r.similarity_score * 100).toFixed(0)}% match
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-gray-800">{r.title}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
