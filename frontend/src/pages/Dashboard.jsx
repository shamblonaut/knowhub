import { useAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getResources, getPendingResources } from "../api/endpoints/resources";
import { getSummary } from "../api/endpoints/analytics";
import Layout from "../components/Layout";
import Spinner from "../components/Spinner";
import Badge from "../components/Badge";
import { Link } from "react-router-dom";

export default function Dashboard() {
    const { user } = useAuth();

    return (
        <Layout>
            <h1 className="text-2xl font-bold text-primary mb-1">
                Welcome back, {user.name} 👋
            </h1>
            <p className="text-gray-500 text-sm mb-8 capitalize">
                {user.role} · Corpus
            </p>

            {user.role === "hod" && <HODDashboard />}
            {user.role === "faculty" && <FacultyDashboard />}
            {user.role === "student" && <StudentDashboard />}
        </Layout>
    );
}

function HODDashboard() {
    const { data: summary, isLoading } = useQuery({
        queryKey: ["analytics-summary"],
        queryFn: getSummary,
    });

    if (isLoading) return <Spinner />;

    const stats = [
        { label: "Total Students", value: summary?.total_students, icon: "🎓" },
        { label: "Total Faculty", value: summary?.total_faculty, icon: "👨‍🏫" },
        { label: "Resources", value: summary?.total_resources, icon: "📁" },
        {
            label: "Pending Approvals",
            value: summary?.pending_approvals,
            icon: "⏳",
            alert: summary?.pending_approvals > 0,
        },
    ];

    return (
        <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {stats.map((s) => (
                    <div
                        key={s.label}
                        className={`bg-white rounded-xl p-5 border ${s.alert ? "border-orange-300" : "border-gray-100"} shadow-sm`}
                    >
                        <div className="text-2xl mb-1">{s.icon}</div>
                        <div
                            className={`text-2xl font-bold ${s.alert ? "text-orange-600" : "text-primary"}`}
                        >
                            {s.value ?? "—"}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                    </div>
                ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
                <Link
                    to="/analytics"
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium text-center"
                >
                    View Analytics →
                </Link>
                <Link
                    to="/admin"
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 text-center"
                >
                    Manage Subjects →
                </Link>
            </div>
        </div>
    );
}

function FacultyDashboard() {
    const { data: pending } = useQuery({
        queryKey: ["pending"],
        queryFn: getPendingResources,
    });
    const count = pending?.count || 0;

    return (
        <div className="space-y-4">
            <div
                className={`bg-white rounded-xl p-5 border shadow-sm flex items-center gap-4 ${count > 0 ? "border-orange-300" : "border-gray-100"}`}
            >
                <div className="text-3xl">⏳</div>
                <div>
                    <div
                        className={`text-2xl font-bold ${count > 0 ? "text-orange-600" : "text-gray-800"}`}
                    >
                        {count}
                    </div>
                    <div className="text-sm text-gray-500">
                        Student uploads awaiting your review
                    </div>
                </div>
                {count > 0 && (
                    <Link
                        to="/review"
                        className="ml-auto px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium"
                    >
                        Review Now →
                    </Link>
                )}
            </div>
            <div className="flex gap-3">
                <Link
                    to="/upload"
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
                >
                    Upload Resource →
                </Link>
                <Link
                    to="/repository"
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700"
                >
                    Browse Repository →
                </Link>
            </div>
        </div>
    );
}

function StudentDashboard() {
    const { data, isLoading } = useQuery({
        queryKey: ["resources", {}],
        queryFn: () => getResources(),
    });
    const recent = data?.results?.slice(0, 3) || [];

    return (
        <div className="space-y-6">
            <div className="flex gap-3">
                <Link
                    to="/repository"
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
                >
                    Browse Resources →
                </Link>
                <Link
                    to="/upload"
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700"
                >
                    Upload Notes →
                </Link>
            </div>
            <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Recently Added
                </h2>
                {isLoading ? (
                    <Spinner />
                ) : (
                    recent.map((r) => (
                        <div
                            key={r.id}
                            className="bg-white rounded-lg border border-gray-100 px-4 py-3 mb-2 flex items-center gap-3"
                        >
                            <Badge
                                type={r.resource_type === "url" ? "url" : r.file_format}
                                label={
                                    r.resource_type === "url"
                                        ? "URL"
                                        : r.file_format?.toUpperCase()
                                }
                            />
                            <span className="text-sm font-medium text-gray-800">
                                {r.title}
                            </span>
                            <span className="text-xs text-gray-400 ml-auto">
                                {r.subject_code}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
