import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotices, createNotice, deleteNotice } from "../api/endpoints/notices";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import NoticeCard from "../components/NoticeCard";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import toast from "react-hot-toast";

export default function Notices() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({ title: "", body: "", is_pinned: false });

    const { data, isLoading } = useQuery({
        queryKey: ["notices"],
        queryFn: getNotices,
    });

    const createMutation = useMutation({
        mutationFn: createNotice,
        onSuccess: () => {
            toast.success("Notice posted!");
            setForm({ title: "", body: "", is_pinned: false });
            setIsModalOpen(false);
            queryClient.invalidateQueries(["notices"]);
        },
        onError: () => toast.error("Failed to post notice."),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteNotice,
        onSuccess: () => {
            toast.success("Notice deleted.");
            queryClient.invalidateQueries(["notices"]);
        },
        onError: () => toast.error("Failed to delete notice."),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(form);
    };

    const notices = data?.results || [];

    return (
        <Layout>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Department Notices</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {isLoading ? "Loading..." : `${notices.length} notices available`}
                    </p>
                </div>
                {(user?.role === "hod" || user?.role === "faculty") && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition"
                    >
                        + New Notice
                    </button>
                )}
            </div>

            {isLoading ? (
                <Spinner />
            ) : notices.length === 0 ? (
                <EmptyState
                    icon="📢"
                    title="No notices yet"
                    description="Check back later for updates from the department."
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {notices.map((n) => (
                        <NoticeCard
                            key={n.id}
                            notice={n}
                            canDelete={user?.role === "hod" || (user?.role === "faculty" && n.posted_by === user?.id)}
                            onDelete={(id) => deleteMutation.mutate(id)}
                        />
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Post New Notice</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Message
                                </label>
                                <textarea
                                    value={form.body}
                                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                                    required
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none"
                                />
                            </div>
                            {user?.role === "hod" && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_pinned"
                                        checked={form.is_pinned}
                                        onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
                                        className="rounded text-accent focus:ring-accent"
                                    />
                                    <label htmlFor="is_pinned" className="text-sm text-gray-700">
                                        Pin this notice
                                    </label>
                                </div>
                            )}
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition disabled:opacity-60"
                                >
                                    {createMutation.isPending ? "Posting..." : "Post Notice"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}
