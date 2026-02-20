import { useQuery } from "@tanstack/react-query";
import { getSubjects, getSemesters } from "../api/endpoints/subjects";

export default function FilterBar({ filters, onFilter }) {
    const { data: semData } = useQuery({
        queryKey: ["semesters"],
        queryFn: getSemesters,
    });
    const { data: subData } = useQuery({
        queryKey: ["subjects", filters.semester],
        queryFn: () => getSubjects(filters.semester || null),
    });

    const semesters = semData?.semesters || [];
    const subjects = subData?.results || [];

    const handle = (key, val) =>
        onFilter({ ...filters, [key]: val || undefined });

    return (
        <div className="flex flex-wrap gap-3 mb-6">
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
                value={filters.format || ""}
                onChange={(e) => handle("format", e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-accent focus:outline-none"
            >
                <option value="">All Formats</option>
                {["pdf", "ppt", "doc", "image"].map((f) => (
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
