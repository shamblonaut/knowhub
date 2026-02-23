import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login } from "../api/endpoints/auth";
import Spinner from "../components/Spinner";
import toast from "react-hot-toast";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login: authLogin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isDemoMode, setIsDemoMode] = useState(() => localStorage.getItem("demo_mode") === "true");
    const from = location.state?.from?.pathname || "/dashboard";

    useEffect(() => {
        localStorage.setItem("demo_mode", isDemoMode);
    }, [isDemoMode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await login({ email, password });
            authLogin(data.user, data.access, data.refresh);
            toast.success(`Welcome back, ${data.user.name}!`);
            navigate(from, { replace: true });
        } catch (err) {
            toast.error(err?.response?.data?.error || "Login failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 relative">
            {/* Float Settings Toggle */}
            <Link
                to="/settings"
                title="Corpus Connectivity Settings"
                className="absolute top-6 right-6 p-3 bg-white border border-gray-100 shadow-sm rounded-full text-gray-400 hover:text-accent hover:border-accent hover:shadow-md transition-all duration-300"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.399.505.71.93.78l.894.15c.542.09.94.56.94 1.109v1.094c0 .55-.398 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527a1.125 1.125 0 01-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.399-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.402-.166.713-.506.781-.93l.148-.894z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </Link>

            <div className="w-full max-w-md">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <div className="text-4xl mb-2">📚</div>
                    <h1 className="text-2xl font-bold text-primary">Corpus</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        BCA Department Resource Portal
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
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
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent pr-10"
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
                            disabled={loading}
                            className="w-full bg-primary text-white py-2 rounded-lg font-medium text-sm hover:bg-opacity-90 transition disabled:opacity-60"
                        >
                            {loading ? <Spinner size="sm" /> : "Sign In"}
                        </button>
                    </form>

                    {/* Demo Mode Toggle */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-gray-700">Demo Mode</span>
                                <span className="text-[10px] text-gray-400">
                                    {isDemoMode ? "Using mock data" : "Using live backend"}
                                </span>
                            </div>
                            <button
                                onClick={() => setIsDemoMode(!isDemoMode)}
                                role="switch"
                                aria-checked={isDemoMode}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isDemoMode ? "bg-accent" : "bg-gray-200"
                                    }`}
                            >
                                <span
                                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isDemoMode ? "translate-x-5" : "translate-x-1"
                                        }`}
                                />
                            </button>
                        </div>
                        {isDemoMode && (
                            <div className="mt-2 text-[10px] text-accent space-y-1">
                                <div className="animate-pulse">
                                    Tip: Use any password with these emails:
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-gray-500 font-mono">
                                    <div title="Head of Department">hod@bca.edu</div>
                                    <div title="Faculty Member">faculty@bca.edu</div>
                                    <div title="Student account">student@bca.edu</div>
                                </div>
                            </div>
                        )}
                    </div>

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


            </div>
        </div>
    );
}
