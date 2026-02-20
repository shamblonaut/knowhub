import Badge from "./Badge";
import { downloadResource } from "../api/endpoints/resources";

export default function FileCard({ resource }) {
    const isUrl = resource.resource_type === "url";

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition">
            <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                        type={isUrl ? "url" : resource.file_format}
                        label={isUrl ? "URL" : resource.file_format?.toUpperCase()}
                    />
                    <span className="text-xs text-gray-400">{resource.subject_code}</span>
                    {resource.unit && (
                        <span className="text-xs text-gray-400">{resource.unit}</span>
                    )}
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                    ↓ {resource.download_count}
                </span>
            </div>

            <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2">
                {resource.title}
            </h3>
            {resource.description && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                    {resource.description}
                </p>
            )}

            <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-400">
                    by {resource.uploader_name}
                    {resource.uploader_role === "student" && " (student)"}
                </span>

                {isUrl ? (
                    <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent font-medium hover:underline"
                    >
                        Open link →
                    </a>
                ) : (
                    <button
                        onClick={() =>
                            downloadResource(resource.id, resource.original_filename)
                        }
                        className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-opacity-90 transition"
                    >
                        Download
                    </button>
                )}
            </div>
        </div>
    );
}
