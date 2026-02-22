import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getResources, deleteResource } from "../api/endpoints/resources";
import { search } from "../api/endpoints/search";
import Layout from "../components/Layout";
import FileCard from "../components/FileCard";
import FilterBar from "../components/FilterBar";
import SearchBar from "../components/SearchBar";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import RecommendPanel from "../components/RecommendPanel";
import { Link } from "react-router-dom";

export default function Repository() {
    const [filters, setFilters] = useState({});
    const [searchQuery, setSearchQuery] = useState("");
    const [selected, setSelected] = useState(null);
    const isSearching = searchQuery.trim().length > 0;
    const queryClient = useQueryClient();


    const { data: browseData, isLoading: browseLoading } = useQuery({
        queryKey: ["resources", filters],
        queryFn: () => getResources(filters),
        enabled: !isSearching,
    });

    const { data: searchData, isLoading: searchLoading } = useQuery({
        queryKey: ["search", searchQuery, filters],
        queryFn: () => search({ q: searchQuery, ...filters }),
        enabled: isSearching,
    });

    const isLoading = isSearching ? searchLoading : browseLoading;
    const resources = isSearching
        ? searchData?.results || []
        : browseData?.results || [];
    
    const total = isSearching ? searchData?.count || 0 : browseData?.count || 0;
    const isProcessing = resources.some(r => r.indexing_status === "processing");

    // Add polling to browse query if processing
    useQuery({
        queryKey: ["resources", filters],
        queryFn: () => getResources(filters),
        enabled: !isSearching && isProcessing,
        refetchInterval: 15000,
    });




    const handleDelete = async (id) => {
        try {
            await deleteResource(id);
            queryClient.invalidateQueries({ queryKey: ["resources"] });
            queryClient.invalidateQueries({ queryKey: ["search"] });
            if (selected?.id === id) setSelected(null);
        } catch (error) {
            alert(error.response?.data?.error || "Failed to delete resource");
        }
    };

    return (
        <Layout>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-primary">
                        Resource Repository
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {isLoading
                            ? "Loading..."
                            : `${total} resource${total !== 1 ? "s" : ""} found`}
                    </p>
                </div>
                <Link
                    to="/upload"
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
                >
                    + Upload
                </Link>
            </div>

            <SearchBar onSearch={setSearchQuery} />
            <FilterBar filters={filters} onFilter={setFilters} />

            {isLoading ? (
                <Spinner />
            ) : resources.length === 0 ? (
                <EmptyState
                    icon="📂"
                    title="No resources found"
                    description={
                        isSearching
                            ? `No results for "${searchQuery}"`
                            : "No resources match your filters."
                    }
                    action={
                        <Link
                            to="/upload"
                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm"
                        >
                            Upload the first one →
                        </Link>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {resources.map((r) => (
                        <FileCard key={r.id} resource={r} onSelect={() => setSelected(r)} onDelete={handleDelete} />
                    ))}
                </div>
            )}

            {selected && (
                <RecommendPanel
                    resource={selected}
                    onClose={() => setSelected(null)}
                />
            )}
        </Layout>
    );
}
