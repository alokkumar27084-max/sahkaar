import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/common/Navbar";
import ProtectedRoute from "./components/common/ProtectedRoute";
import LoadingSpinner from "./components/common/LoadingSpinner";
import Icon from "./components/common/Icon";

const HomePage = lazy(() => import("./pages/customer/HomePage"));
const SearchPage = lazy(() => import("./pages/customer/SearchPage"));
const ContractorProfilePage = lazy(() => import("./pages/customer/ContractorProfilePage"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const ContractorRegisterPage = lazy(() => import("./pages/contractor/ContractorRegisterPage"));
const ContractorDashboard = lazy(() => import("./pages/contractor/ContractorDashboard"));
const ContractorEditPage = lazy(() => import("./pages/contractor/ContractorEditPage"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));

function PageFallback() {
  return (
    <div className="min-h-[62vh] flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3200,
              style: {
                borderRadius: "16px",
                color: "#f5f3ef",
                background: "rgba(0,19,38,0.9)",
                border: "1px solid rgba(247,185,128,0.34)",
                backdropFilter: "blur(12px)",
                fontSize: "14px",
              },
              success: { iconTheme: { primary: "#ed985f", secondary: "#001f3d" } },
            }}
          />

          <div className="app-shell">
            <div className="content-layer">
              <Navbar />

              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/contractor/:id" element={<ContractorProfilePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/register/contractor" element={<ContractorRegisterPage />} />

                  <Route
                    path="/contractor/dashboard"
                    element={
                      <ProtectedRoute requiredRole="contractor">
                        <ContractorDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/contractor/edit"
                    element={
                      <ProtectedRoute requiredRole="contractor">
                        <ContractorEditPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/dashboard"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminDashboardPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="*"
                    element={
                      <div className="min-h-[68vh] flex items-center justify-center px-4">
                        <div className="glass-card p-10 max-w-lg text-center">
                          <div className="mb-4 flex justify-center text-cyan-100">
                            <Icon name="compass" className="w-14 h-14" />
                          </div>
                          <h2 className="section-title !text-3xl mb-2">Page Not Found</h2>
                          <p className="text-slate-300/85 mb-6">This page does not exist or was moved.</p>
                          <Link to="/" className="btn-primary">Return Home</Link>
                        </div>
                      </div>
                    }
                  />
                </Routes>
              </Suspense>
            </div>
          </div>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
