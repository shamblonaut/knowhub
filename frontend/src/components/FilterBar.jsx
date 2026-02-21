import { useQuery } from "@tanstack/react-query";
import { getSubjects, getSemesters } from "../api/endpoints/subjects";
import { useAuth } from "../context/AuthContext";

export default function FilterBar({ filters, onFilter }) {
    const { user } = useAuth();
    const { data: semData } = useQuery({
        queryKey: ["semesters"],
        queryFn: getSemesters,
        enabled: user?.role !== "student",
    });

    const effectiveSemester = user?.role === "student" ? user.semester : filters.semester;

    const { data: subData } = useQuery({
        queryKey: ["subjects", effectiveSemester],
        queryFn: () => getSubjects(effectiveSemester || null),
    });

    const semesters = semData?.semesters || [];
    const subjects = subData?.results || [];

    const handle = (key, val) => {
        const newFilters = { ...filters, [key]: val || undefined };
        if (key === "semester") {
            newFilters.subject = undefined;
        }
        onFilter(newFilters);
    };

    return (
        <div className="flex flex-wrap gap-3 mb-6">
            {user?.role !== "student" && (
                <select
                    value={filters.semester || ""}
                    onChange={(e) => handle("semester", e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-accent focus:outline-none"
                >
                    <option value="">All Semesters</option>
                    {semesters.map((s) => (
                        <option key={s} value={s}>
                            Semester {s}
                        </option>
                    ))}
                </select>
            )}

            <select
                value={filters.subject || ""}
                onChange={(e) => handle("subject", e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-accent focus:outline-none"
            >
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                        {s.code} — {s.name}
                    </option>
                ))}
            </select>

            <select
                value={filters.file_format || ""}
                onChange={(e) => handle("file_format", e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-accent focus:outline-none"
            >
                <option value="">All Formats</option>
                {["pdf", "ppt", "doc", "image", "url"].map((f) => (
                    <option key={f} value={f}>
                        {f.toUpperCase()}
                    </option>
                ))}
            </select>

            {Object.values(filters).some(Boolean) && (
                <button
                    onClick={() => onFilter({})}
                    className="px-3 py-2 text-sm text-gray-500 hover:text-red-600 border border-gray-200 rounded-lg bg-white"
                >
                    Clear filters ✕
                </button>
            )}
        </div>
    );
}
