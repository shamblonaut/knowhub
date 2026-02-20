export default function NoticeCard({ notice, canDelete, onDelete }) {
    return (
        <div
            className={`bg-white rounded-xl border shadow-sm p-5 ${notice.is_pinned ? "border-accent" : "border-gray-100"}`}
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                    {notice.is_pinned && (
                        <span className="text-xs bg-accent text-white px-2 py-0.5 rounded font-semibold">
                            📌 PINNED
                        </span>
                    )}
                    {notice.is_new && (
                        <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded font-semibold animate-pulse">
                            NEW
                        </span>
                    )}
                </div>
                {canDelete && (
                    <button
                        onClick={() => onDelete(notice.id)}
                        className="text-xs text-red-400 hover:text-red-600"
                    >
                        Delete
                    </button>
                )}
            </div>

            <h3 className="font-semibold text-gray-800 mb-1">{notice.title}</h3>
            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                {notice.body}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Posted by {notice.posted_by_name}</span>
                <span>
                    {new Date(notice.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                    })}
                </span>
            </div>
        </div>
    );
}
