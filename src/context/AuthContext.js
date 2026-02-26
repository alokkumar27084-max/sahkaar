// ─────────────────────────────────────────────
// AuthContext.js — Login state for the entire app
//
// Stores: who is logged in, their role (customer/contractor/admin),
// their JWT token, and functions to login/logout.
//
// Security notes:
// - Token stored in memory (not localStorage) to prevent XSS theft
// - Also stored in httpOnly cookie by backend (safest approach)
// - On page refresh, we re-verify with the /auth/me endpoint
// ─────────────────────────────────────────────
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);   // user object or null
  const [loading, setLoading]   = useState(true);   // true while checking login status

  // ── On app load: check if user is already logged in ──────────
  useEffect(() => {
    async function checkAuth() {
      try {
        // Ask backend: "is this browser session still valid?"
        const res = await api.get("/auth/me");
        setUser(res.data.user);
      } catch {
        // Not logged in — that's fine
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  // ── Login function ────────────────────────────────────────────
  const login = useCallback((userData) => {
    setUser(userData);
  }, []);

  // ── Logout function ───────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout"); // tell backend to clear cookie
    } catch { /* ignore network errors on logout */ }
    setUser(null);
  }, []);

  // ── Helper: is the user a contractor? ────────────────────────
  const isContractor = user?.role === "contractor";
  const isAdmin      = user?.role === "admin";
  const isCustomer   = user?.role === "customer";

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isContractor, isAdmin, isCustomer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
