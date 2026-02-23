import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMySubmissions, deleteResource } from "../api/endpoints/resources";
import Layout from "../components/Layout";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import Badge from "../components/Badge";
import { format } from "date-fns";

const StatusBadge = ({ status }) => {
    const colors = {
        approved: "bg-green-100 text-green-800 border-green-200",
        pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
        rejected: "bg-red-100 text-red-800 border-red-200",
    };

    const colorClass = colors[status] || "bg-gray-100 text-gray-800 border-gray-200";

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${colorClass}`}>
            {status}
        </span>
    );
};

export default function MySubmissions() {
    const queryClient = useQueryClient();
    const { data, isLoading, error } = useQuery({
        queryKey: ["my-submissions"],
        queryFn: getMySubmissions,
    });

    const submissions = data?.results || [];
    const isProcessing = submissions.some(s => s.indexing_status === "processing");

    // Re-run query with polling if processing
    useQuery({
        queryKey: ["my-submissions"],
        queryFn: getMySubmissions,
        enabled: isProcessing,
        refetchInterval: 15000,
    });



    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this resource?")) return;
        try {
            await deleteResource(id);
            queryClient.invalidateQueries({ queryKey: ["my-submissions"] });
        } catch (error) {
            alert(error.response?.data?.error || "Failed to delete resource");
        }
    };

    return (
        <Layout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-primary">My Submissions</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    View the status of your uploaded resources
                </p>
            </div>

            {isLoading ? (
                <Spinner />
            ) : error ? (
                <div className="text-red-500">Failed to load submissions.</div>
            ) : submissions.length === 0 ? (
                <EmptyState
                    icon="📤"
                    title="No uploads yet"
                    description="When you upload resources, they will appear here along with their approval status."
                />
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Title</th>
                                    <th className="px-6 py-4 font-medium">Subject</th>
                                    <th className="px-6 py-4 font-medium">Type</th>
                                    <th className="px-6 py-4 font-medium">Date</th>
                                    <th className="px-6 py-4 font-medium">Approval</th>
                                    <th className="px-6 py-4 font-medium">Indexing</th>
                                    <th className="px-6 py-4 font-medium text-right">Action</th>

                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {submissions.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{sub.title}</div>
                                            {sub.description && (
                                                <div className="text-xs text-gray-500 truncate max-w-[250px] mt-0.5">
                                                    {sub.description}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {sub.subject_code}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {sub.resource_type === 'file' ? String(sub.file_format).toUpperCase() : 'URL'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                            {format(new Date(sub.upload_date), "MMM d, yyyy")}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={sub.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            {sub.indexing_status === "completed" ? (
                                                <Badge type="completed" label="Ready" />
                                            ) : sub.indexing_status === "processing" ? (
                                                <Badge type="processing" label="Processing..." />
                                            ) : sub.indexing_status === "failed" ? (
                                                <Badge type="failed" label="Failed" />
                                            ) : (
                                                <span className="text-gray-400 text-xs">-</span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            {(sub.url || sub.file_url) && (
                                                <a
                                                    href={sub.url || sub.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors mr-3"
                                                >
                                                    View
                                                </a>
                                            )}
                                            <button
                                                onClick={() => handleDelete(sub.id)}
                                                className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </Layout>
    );
}
