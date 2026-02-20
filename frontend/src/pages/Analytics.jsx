import { useQuery } from "@tanstack/react-query";
import {
    getSummary,
    getUploadsBySemester,
    getTopResources,
    getUploadsByFormat,
    getFacultyActivity,
} from "../api/endpoints/analytics";
import Layout from "../components/Layout";
import Spinner from "../components/Spinner";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";

const COLORS = [
    "#2E86AB",
    "#1E3A5F",
    "#1B5E20",
    "#E65100",
    "#4A148C",
    "#B71C1C",
];

function StatCard({ label, value, icon, highlight }) {
    return (
        <div
            className={`bg-white rounded-xl p-5 border shadow-sm ${highlight ? "border-orange-300" : "border-gray-100"}`}
        >
            <div className="text-2xl mb-1">{icon}</div>
            <div
                className={`text-3xl font-bold ${highlight ? "text-orange-600" : "text-primary"}`}
            >
                {value ?? "—"}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
        </div>
    );
}

export default function Analytics() {
    const { data: summary, isLoading } = useQuery({
        queryKey: ["analytics-summary"],
        queryFn: getSummary,
    });
    const { data: bySem } = useQuery({
        queryKey: ["uploads-by-semester"],
        queryFn: getUploadsBySemester,
    });
    const { data: topRes } = useQuery({
        queryKey: ["top-resources"],
        queryFn: getTopResources,
    });
    const { data: byFormat } = useQuery({
        queryKey: ["uploads-by-format"],
        queryFn: getUploadsByFormat,
    });

    if (isLoading)
        return (
            <Layout>
                <Spinner />
            </Layout>
        );

    return (
        <Layout>
            <h1 className="text-2xl font-bold text-primary mb-6">
                Analytics Dashboard
            </h1>

            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                    label="Total Resources"
                    value={summary?.total_resources}
                    icon="📁"
                />
                <StatCard
                    label="Total Downloads"
                    value={summary?.total_downloads}
                    icon="⬇"
                />
                <StatCard
                    label="Total Students"
                    value={summary?.total_students}
                    icon="🎓"
                />
                <StatCard
                    label="Pending Approvals"
                    value={summary?.pending_approvals}
                    icon="⏳"
                    highlight={summary?.pending_approvals > 0}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Uploads by Semester */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">
                        Uploads by Semester
                    </h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                            data={bySem?.data || []}
                            margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="semester"
                                tickFormatter={(s) => `Sem ${s}`}
                                tick={{ fontSize: 11 }}
                            />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v) => [v, "Uploads"]} />
                            <Bar dataKey="count" fill="#2E86AB" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Uploads by Format */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">
                        Uploads by Format
                    </h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie
                                data={byFormat?.data || []}
                                dataKey="count"
                                nameKey="format"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label={({ format, percent }) =>
                                    `${format} ${(percent * 100).toFixed(0)}%`
                                }
                            >
                                {(byFormat?.data || []).map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Resources */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 md:col-span-2">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">
                        Top 10 Most Downloaded
                    </h2>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart
                            data={topRes?.data || []}
                            layout="vertical"
                            margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis
                                type="category"
                                dataKey="title"
                                tick={{ fontSize: 10 }}
                                width={180}
                            />
                            <Tooltip formatter={(v) => [v, "Downloads"]} />
                            <Bar
                                dataKey="download_count"
                                fill="#1E3A5F"
                                radius={[0, 4, 4, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </Layout>
    );
}
