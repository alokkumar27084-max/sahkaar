// ProtectedRoute.jsx
// Wraps pages that require login.
// If not logged in, redirects to /login.
// If wrong role (e.g. customer visiting contractor dashboard), redirects home.
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Still checking auth status — show spinner
  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  // Not logged in
  if (!user) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  // Wrong role check (supports single role or array of allowed roles)
  if (requiredRole) {
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowed.includes(user.role) && user.role !== "admin") {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
