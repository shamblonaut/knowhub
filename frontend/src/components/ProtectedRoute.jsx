import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Spinner from "./Spinner";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
    const { user, token, loading } = useAuth();
    const location = useLocation();

    // If no token, redirect to login
    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If user data not loaded yet (but token exists), show spinner
    if (loading) {
        return <Spinner />;
    }

    // Role-based access control
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
