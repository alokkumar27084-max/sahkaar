// ProtectedRoute.jsx
// Wraps pages that require login.
// If not logged in, redirects to /login.
// If wrong role (e.g. customer visiting contractor dashboard), redirects home.
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  // Still checking auth status — show spinner
  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  // Not logged in
  if (!user) return <Navigate to="/login" replace />;

  // Wrong role
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/" replace />;

  return children;
}
