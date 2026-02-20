import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login } from "../api/endpoints/auth";
import Spinner from "../components/Spinner";
import toast from "react-hot-toast";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { login: authLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await login({ email, password });
            authLogin(data.user, data.access, data.refresh);
            toast.success(`Welcome back, ${data.user.name}!`);
            navigate("/dashboard");
        } catch (err) {
            toast.error(err?.response?.data?.error || "Login failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <div className="text-4xl mb-2">📚</div>
                    <h1 className="text-2xl font-bold text-primary">Knowledge Hub</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        BCA Department Resource Portal
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-6">
                        Sign in to your account
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@bca.edu"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white py-2 rounded-lg font-medium text-sm hover:bg-opacity-90 transition disabled:opacity-60"
                        >
                            {loading ? <Spinner size="sm" /> : "Sign In"}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        New student?{" "}
                        <Link
                            to="/register"
                            className="text-accent font-medium hover:underline"
                        >
                            Create account
                        </Link>
                    </p>
                </div>

                {/* Dev hint — remove before demo */}
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                    <strong>Dev accounts:</strong> hod@bca.edu | faculty@bca.edu |
                    student@bca.edu — all pw: Demo@123
                </div>
            </div>
        </div>
    );
}
