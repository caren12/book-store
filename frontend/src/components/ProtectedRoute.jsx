import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

// Wraps routes that require any logged-in user
export function ProtectedRoute({ children }) {
  const { token, user, status } = useSelector((state) => state.auth);

  // Still resolving auth on first load (token exists, user not fetched yet)
  if (token && !user && status !== "failed") {
    return <div className="p-8 text-center text-ink/50">Loading...</div>;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Wraps routes that require an admin user
export function AdminRoute({ children }) {
  const { token, user, status } = useSelector((state) => state.auth);

  if (token && !user && status !== "failed") {
    return <div className="p-8 text-center text-ink/50">Loading...</div>;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Adjust this check once the backend confirms the exact field name
  // (e.g. user.role === "admin" or user.is_admin === true)
  const isAdmin = user.role === "admin" || user.is_admin === true;

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}