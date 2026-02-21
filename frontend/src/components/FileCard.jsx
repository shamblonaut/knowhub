import Badge from "./Badge";
import { downloadResource } from "../api/endpoints/resources";
import { useAuth } from "../context/AuthContext";

export default function FileCard({ resource, onSelect, onDelete }) {
    const { user } = useAuth();
    const isUrl = resource.resource_type === "url";

    const isUploader = user?.id === resource.uploaded_by;
    const isHod = user?.role === "hod";
    const isFacultyOwner = user?.role === "faculty" && (user?.subject_ids || []).includes(resource.subject_id);
    const canDelete = isUploader || isHod || isFacultyOwner;

    return (
        <div
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition cursor-pointer"
            onClick={onSelect}
        >
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
                        onClick={(e) => e.stopPropagation()}
                    >
                        Open link →
                    </a>
                ) : (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            downloadResource(resource.id, resource.original_filename);
                        }}
                        className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-opacity-90 transition"
                    >
                        Download
                    </button>
                )}
                {canDelete && onDelete && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("Are you sure you want to delete this resource?")) {
                                onDelete(resource.id);
                            }
                        }}
                        className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition ml-2 font-medium"
                    >
                        Delete
                    </button>
                )}
            </div>
        </div>
    );
}
