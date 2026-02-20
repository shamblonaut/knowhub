import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getPendingResources,
    approveResource,
    rejectResource,
} from "../api/endpoints/resources";
import Layout from "../components/Layout";
import PendingCard from "../components/PendingCard";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import toast from "react-hot-toast";

export default function Review() {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["pending"],
        queryFn: getPendingResources,
    });

    const approveMutation = useMutation({
        mutationFn: approveResource,
        onSuccess: () => {
            toast.success("Resource approved!");
            queryClient.invalidateQueries(["pending"]);
        },
        onError: () => toast.error("Approval failed."),
    });

    const rejectMutation = useMutation({
        mutationFn: rejectResource,
        onSuccess: () => {
            toast.success("Resource rejected.");
            queryClient.invalidateQueries(["pending"]);
        },
        onError: () => toast.error("Rejection failed."),
    });

    const pending = data?.results || [];

    return (
        <Layout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-primary">Review Uploads</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    {isLoading
                        ? "Loading..."
                        : `${pending.length} pending upload${pending.length !== 1 ? "s" : ""}`}
                </p>
            </div>

            {isLoading ? (
                <Spinner />
            ) : pending.length === 0 ? (
                <EmptyState
                    icon="✅"
                    title="All caught up!"
                    description="No student uploads pending review."
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pending.map((r) => (
                        <PendingCard
                            key={r.id}
                            resource={r}
                            onApprove={(id) => approveMutation.mutate(id)}
                            onReject={(id) => rejectMutation.mutate(id)}
                        />
                    ))}
                </div>
            )}
        </Layout>
    );
}
