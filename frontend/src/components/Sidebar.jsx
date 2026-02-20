import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = [
    {
        to: "/dashboard",
        label: "Dashboard",
        icon: "🏠",
        roles: ["hod", "faculty", "student"],
    },
    {
        to: "/repository",
        label: "Repository",
        icon: "📁",
        roles: ["hod", "faculty", "student"],
    },
    {
        to: "/upload",
        label: "Upload",
        icon: "⬆",
        roles: ["hod", "faculty", "student"],
    },
    {
        to: "/my-submissions",
        label: "My Submissions",
        icon: "📋",
        roles: ["student"],
    },
    { to: "/review", label: "Review", icon: "✅", roles: ["hod", "faculty"] },
    {
        to: "/notices",
        label: "Notices",
        icon: "📢",
        roles: ["hod", "faculty", "student"],
    },
    { to: "/ask", label: "AI Assistant", icon: "🤖", roles: ["hod", "faculty", "student"] },
    { to: "/analytics", label: "Analytics", icon: "📊", roles: ["hod"] },
    { to: "/admin", label: "Admin Panel", icon: "⚙", roles: ["hod"] },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    if (!user) return null;

    const visibleNav = NAV.filter((n) => n.roles.includes(user.role));

    return (
        <aside className="w-60 min-h-screen bg-primary text-white flex flex-col shrink-0">
            {/* Logo */}
            <div className="px-6 py-5 border-b border-white border-opacity-10">
                <div className="text-xl font-bold">📚 Knowledge Hub</div>
                <div className="text-xs text-blue-200 mt-0.5">BCA Department</div>
            </div>

            {/* User info */}
            <div className="px-6 py-4 border-b border-white border-opacity-10">
                <div className="text-sm font-semibold">{user.name}</div>
                <div className="text-xs text-blue-200 capitalize">{user.role}</div>
                {user.role === "student" && (
                    <div className="text-xs text-blue-200 mt-0.5">
                        Sem {user.semester} · {user.usn}
                    </div>
                )}
            </div>

            {/* Nav links */}
            <nav className="flex-1 py-4 px-3">
                {visibleNav.map(({ to, label, icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-1 transition ${isActive
                                ? "bg-white/15 font-semibold text-white"
                                : "text-blue-100 hover:bg-white/10 hover:text-white"
                            }`
                        }
                    >
                        <span>{icon}</span>
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Logout */}
            <div className="px-3 py-4 border-t border-white border-opacity-10">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-200 hover:bg-white hover:bg-opacity-10 transition"
                >
                    <span>🚪</span>
                    <span>Sign out</span>
                </button>
            </div>
        </aside>
    );
}
