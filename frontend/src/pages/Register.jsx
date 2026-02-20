import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api/endpoints/auth";
import toast from "react-hot-toast";

export default function Register() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        usn: "",
        semester: "",
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) =>
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register({ ...form, semester: Number(form.semester) });
            toast.success("Account created! Please sign in.");
            navigate("/login");
        } catch (err) {
            toast.error(err?.response?.data?.error || "Registration failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="text-4xl mb-2">📚</div>
                    <h1 className="text-2xl font-bold text-primary">Knowledge Hub</h1>
                    <p className="text-gray-500 text-sm mt-1">Student Registration</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-6">
                        Create your account
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {[
                            {
                                label: "Full Name",
                                name: "name",
                                type: "text",
                                placeholder: "Rahul Sharma",
                            },
                            {
                                label: "Email",
                                name: "email",
                                type: "email",
                                placeholder: "rahul@student.bca.edu",
                            },
                            {
                                label: "Password",
                                name: "password",
                                type: "password",
                                placeholder: "••••••••",
                            },
                            {
                                label: "USN",
                                name: "usn",
                                type: "text",
                                placeholder: "1BCA21CS001",
                            },
                        ].map((field) => (
                            <div key={field.name}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {field.label}
                                </label>
                                <input
                                    type={field.type}
                                    name={field.name}
                                    value={form[field.name]}
                                    onChange={handleChange}
                                    placeholder={field.placeholder}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                            </div>
                        ))}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Semester
                            </label>
                            <select
                                name="semester"
                                value={form.semester}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                            >
                                <option value="">Select semester</option>
                                {[1, 2, 3, 4, 5, 6].map((s) => (
                                    <option key={s} value={s}>
                                        Semester {s}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white py-2 rounded-lg font-medium text-sm hover:bg-opacity-90 transition disabled:opacity-60"
                        >
                            {loading ? "Creating account..." : "Create Account"}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="text-accent font-medium hover:underline"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
