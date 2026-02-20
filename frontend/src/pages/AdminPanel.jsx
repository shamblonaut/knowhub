import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getSubjects,
    createSubject,
    deleteSubject,
} from "../api/endpoints/subjects";
import { createFaculty, setUserActive, getFaculties } from "../api/endpoints/auth";
import Layout from "../components/Layout";
import Spinner from "../components/Spinner";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import toast from "react-hot-toast";

function SubjectsTab() {
    const queryClient = useQueryClient();
    const [form, setForm] = useState({
        code: "",
        name: "",
        semester: "",
        faculty_id: "",
    });

    const { data: subjectsData, isLoading } = useQuery({
        queryKey: ["subjects"],
        queryFn: () => getSubjects(),
    });

    const { data: faculties } = useQuery({
        queryKey: ["faculties"],
        queryFn: getFaculties,
    });
    const facultyList = faculties || [];

    const createMutation = useMutation({
        mutationFn: createSubject,
        onSuccess: () => {
            toast.success("Subject created successfully");
            setForm({ code: "", name: "", semester: "", faculty_id: "" });
            queryClient.invalidateQueries(["subjects"]);
        },
        onError: () => toast.error("Failed to create subject"),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteSubject,
        onSuccess: () => {
            toast.success("Subject deleted");
            queryClient.invalidateQueries(["subjects"]);
        },
        onError: () => toast.error("Failed to delete subject"),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const faculty = facultyList.find((f) => f.id === form.faculty_id);
        createMutation.mutate({
            ...form,
            semester: Number(form.semester),
            faculty_name: faculty ? faculty.name : "",
        });
    };

    const handleChange = (e) =>
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const subjects = subjectsData?.results || [];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">All Subjects</h2>
                {isLoading ? (
                    <Spinner />
                ) : subjects.length === 0 ? (
                    <EmptyState title="No subjects added" />
                ) : (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                <tr>
                                    <th className="px-4 py-3">Code</th>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Sem</th>
                                    <th className="px-4 py-3">Faculty</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {subjects.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3 font-semibold text-gray-800">
                                            {sub.code}
                                        </td>
                                        <td className="px-4 py-3">{sub.name}</td>
                                        <td className="px-4 py-3">{sub.semester}</td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {sub.faculty_name || "—"}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => deleteMutation.mutate(sub.id)}
                                                className="text-red-500 hover:text-red-700 font-medium text-xs"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Add Subject
                </h2>
                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4"
                >
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Subject Code *
                        </label>
                        <input
                            name="code"
                            value={form.code}
                            onChange={handleChange}
                            placeholder="e.g. BCA401"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Subject Name *
                        </label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Data Structures"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Semester *
                        </label>
                        <select
                            name="semester"
                            value={form.semester}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none"
                        >
                            <option value="">Select Sem</option>
                            {[1, 2, 3, 4, 5, 6].map((s) => (
                                <option key={s} value={s}>
                                    Semester {s}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Assign Faculty
                        </label>
                        <select
                            name="faculty_id"
                            value={form.faculty_id}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none"
                        >
                            <option value="">None</option>
                            {facultyList.map((fac) => (
                                <option key={fac.id} value={fac.id}>
                                    {fac.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={createMutation.isPending}
                        className="w-full bg-primary text-white py-2 rounded-lg font-medium text-sm hover:bg-opacity-90 transition disabled:opacity-60"
                    >
                        {createMutation.isPending ? "Adding..." : "Add Subject"}
                    </button>
                </form>
            </div>
        </div>
    );
}

function FacultyTab() {
    const queryClient = useQueryClient();
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);

    const { data: faculties, isLoading } = useQuery({
        queryKey: ["faculties"],
        queryFn: getFaculties,
    });

    const createMutation = useMutation({
        mutationFn: createFaculty,
        onSuccess: () => {
            toast.success("Faculty created successfully");
            setForm({ name: "", email: "", password: "" });
            queryClient.invalidateQueries(["faculties"]);
        },
        onError: () => toast.error("Failed to create faculty"),
    });

    const activeMutation = useMutation({
        mutationFn: ({ id, isActive }) => setUserActive(id, isActive),
        onSuccess: (data) => {
            toast.success(data.message || "Faculty status updated");
            queryClient.invalidateQueries(["faculties"]);
        },
        onError: () => toast.error("Failed to update status"),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(form);
    };

    const handleChange = (e) =>
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const facultyList = faculties || [];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">Faculty Members</h2>
                {isLoading ? (
                    <Spinner />
                ) : facultyList.length === 0 ? (
                    <EmptyState title="No faculty members" />
                ) : (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                <tr>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {facultyList.map((fac) => (
                                    <tr key={fac.id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3 font-semibold text-gray-800">
                                            {fac.name}
                                        </td>
                                        <td className="px-4 py-3">{fac.email}</td>
                                        <td className="px-4 py-3">
                                            {fac.is_active ? (
                                                <Badge type="approved" label="Active" />
                                            ) : (
                                                <Badge type="gray" label="Inactive" />
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() =>
                                                    activeMutation.mutate({
                                                        id: fac.id,
                                                        isActive: !fac.is_active,
                                                    })
                                                }
                                                className={`${fac.is_active
                                                    ? "text-red-500 hover:text-red-700"
                                                    : "text-green-600 hover:text-green-800"
                                                    } font-medium text-xs`}
                                            >
                                                {fac.is_active ? "Deactivate" : "Activate"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Add Faculty
                </h2>
                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4"
                >
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name *
                        </label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Prof. Name"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email *
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="faculty@bca.edu"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Temporary Password *
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={createMutation.isPending}
                        className="w-full bg-primary text-white py-2 rounded-lg font-medium text-sm hover:bg-opacity-90 transition disabled:opacity-60"
                    >
                        {createMutation.isPending ? "Creating..." : "Create Account"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function AdminPanel() {
    const [tab, setTab] = useState("subjects");

    return (
        <Layout>
            <h1 className="text-2xl font-bold text-primary mb-6">Admin Panel</h1>

            <div className="flex gap-2 mb-6 border-b border-gray-200">
                {["subjects", "faculty"].map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition ${tab === t
                            ? "border-accent text-accent"
                            : "border-transparent text-gray-500 hover:text-gray-800"
                            }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {tab === "subjects" && <SubjectsTab />}
            {tab === "faculty" && <FacultyTab />}
        </Layout>
    );
}
