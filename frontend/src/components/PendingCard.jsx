import Badge from "./Badge";

export default function PendingCard({ resource, onApprove, onReject }) {
    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
                <Badge
                    type={resource.file_format || "url"}
                    label={(resource.file_format || "URL").toUpperCase()}
                />
                <span className="text-xs text-gray-400">
                    {resource.subject_code} · {resource.unit}
                </span>
                <Badge type="pending" label="Pending" />
            </div>

            <h3 className="font-semibold text-gray-800 text-sm mb-1">
                {resource.title}
            </h3>
            <p className="text-xs text-gray-500 mb-1">
                Uploaded by <strong>{resource.uploader_name}</strong>
            </p>
            <p className="text-xs text-gray-400 mb-4">
                {new Date(resource.upload_date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                })}
            </p>

            {resource.resource_type === "file" && resource.file_url && (
                <a
                    href={resource.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent underline block mb-4"
                >
                    Preview file →
                </a>
            )}

            <div className="flex gap-2">
                <button
                    onClick={() => onApprove(resource.id)}
                    className="flex-1 py-2 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700 transition"
                >
                    ✓ Approve
                </button>
                <button
                    onClick={() => onReject(resource.id)}
                    className="flex-1 py-2 bg-red-100 text-red-700 text-sm rounded-lg font-medium hover:bg-red-200 transition"
                >
                    ✕ Reject
                </button>
            </div>
        </div>
    );
}
