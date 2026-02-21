import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { uploadResource } from "../api/endpoints/resources";
import { getSubjects, getSemesters } from "../api/endpoints/subjects";
import Layout from "../components/Layout";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";

const ALLOWED = ["pdf", "ppt", "pptx", "doc", "docx", "jpg", "jpeg", "png"];

export default function Upload() {
    const [mode, setMode] = useState("file"); // 'file' | 'url'
    const [form, setForm] = useState({
        title: "",
        description: "",
        semester: "",
        subject_id: "",
        unit: "",
        tags: "",
        url: "",
    });
    const [file, setFile] = useState(null);
    const [fileError, setFileError] = useState("");
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (user?.role === "student" && user?.semester) {
            setForm((prev) => ({ ...prev, semester: user.semester.toString() }));
        }
    }, [user]);

    const { data: semData } = useQuery({
        queryKey: ["semesters"],
        queryFn: getSemesters,
    });
    const { data: subData } = useQuery({
        queryKey: ["subjects", form.semester],
        queryFn: () => getSubjects(form.semester || null),
        enabled: !!form.semester,
    });

    const mutation = useMutation({
        mutationFn: uploadResource,
        onSuccess: () => {
            toast.success("Upload successful!");
            queryClient.invalidateQueries(["resources"]);
            navigate("/repository");
        },
        onError: (err) =>
            toast.error(err?.response?.data?.error || "Upload failed."),
    });

    const handleFile = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        const ext = f.name.split(".").pop().toLowerCase();
        if (!ALLOWED.includes(ext)) {
            setFileError(
                `File type .${ext} is not allowed. Use: ${ALLOWED.join(", ")}`,
            );
            setFile(null);
            return;
        }
        if (f.size > 52428800) {
            setFileError("File is too large. Maximum size is 50MB.");
            setFile(null);
            return;
        }
        setFileError("");
        setFile(f);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (mode === "file") {
            if (!file) return toast.error("Please select a file.");
            const fd = new FormData();
            fd.append("file", file);
            fd.append("resource_type", "file");
            Object.entries(form).forEach(([k, v]) => {
                if (v) fd.append(k, v);
            });
            mutation.mutate(fd);
        } else {
            mutation.mutate({
                ...form,
                resource_type: "url",
                tags: form.tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
            });
        }
    };

    const handle = (e) =>
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    return (
        <Layout>
            <h1 className="text-2xl font-bold text-primary mb-6">Upload Resource</h1>

            <div className="max-w-2xl bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                {/* Toggle */}
                <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg w-fit">
                    {["file", "url"].map((m) => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${mode === m ? "bg-white text-primary shadow-sm" : "text-gray-500"}`}
                        >
                            {m === "file" ? "📄 File" : "🔗 URL"}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title *
                        </label>
                        <input
                            name="title"
                            value={form.title}
                            onChange={handle}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handle}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Semester *
                            </label>
                            <select
                                name="semester"
                                value={form.semester}
                                onChange={handle}
                                required
                                disabled={user?.role === "student"}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none ${user?.role === "student" ? "bg-gray-50 opacity-70" : ""}`}
                            >
                                <option value="">Select</option>
                                {(semData?.semesters || []).map((s) => (
                                    <option key={s} value={s}>
                                        Semester {s}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Subject *
                            </label>
                            <select
                                name="subject_id"
                                value={form.subject_id}
                                onChange={handle}
                                required
                                disabled={!form.semester}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none disabled:opacity-50"
                            >
                                <option value="">Select semester first</option>
                                {(subData?.results || []).map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.code} — {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Unit
                            </label>
                            <input
                                name="unit"
                                value={form.unit}
                                onChange={handle}
                                placeholder="e.g. Unit 3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tags
                            </label>
                            <input
                                name="tags"
                                value={form.tags}
                                onChange={handle}
                                placeholder="trees, graphs, BFS"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none"
                            />
                        </div>
                    </div>

                    {mode === "file" ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                File *
                            </label>
                            <input
                                type="file"
                                onChange={handleFile}
                                accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png"
                                className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-white file:text-sm"
                            />
                            {fileError && (
                                <p className="text-red-600 text-xs mt-1">{fileError}</p>
                            )}
                            {file && (
                                <p className="text-green-600 text-xs mt-1">
                                    ✓ {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
                                </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                                Accepted: PDF, PPT, PPTX, DOC, DOCX, JPG, PNG — max 50MB
                            </p>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                URL *
                            </label>
                            <input
                                name="url"
                                value={form.url}
                                onChange={handle}
                                type="url"
                                placeholder="https://..."
                                required={mode === "url"}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="w-full bg-primary text-white py-2.5 rounded-lg font-medium text-sm hover:bg-opacity-90 transition disabled:opacity-60"
                    >
                        {mutation.isPending ? "Uploading..." : "Upload Resource"}
                    </button>
                </form>
            </div>
        </Layout>
    );
}
