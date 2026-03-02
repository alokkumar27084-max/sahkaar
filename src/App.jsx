import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Navbar from "./components/common/Navbar";
import ProtectedRoute from "./components/common/ProtectedRoute";
import LoadingSpinner from "./components/common/LoadingSpinner";
import Icon from "./components/common/Icon";
import LocationPromptModal from "./components/common/LocationPromptModal";

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
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3200,
                style: {
                  borderRadius: "12px",
                  color: "#111827",
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  fontSize: "14px",
                },
                success: { iconTheme: { primary: "#10B981", secondary: "#ffffff" } },
              }}
            />

            <div className="app-shell">
              <div className="content-layer">
                <LocationPromptModal />
                <Navbar />

                <Suspense fallback={<PageFallback />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route
                      path="/search"
                      element={
                        <ProtectedRoute>
                          <SearchPage />
                        </ProtectedRoute>
                      }
                    />
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
                          <div className="bg-white border border-slate-200 rounded-2xl p-10 max-w-lg text-center shadow-sm">
                            <div className="mb-4 flex justify-center text-[#06B6D4]">
                              <Icon name="compass" className="w-14 h-14" />
                            </div>
                            <h2 className="font-['Poppins'] text-3xl text-[#111827] font-semibold mb-2">Page Not Found</h2>
                            <p className="text-slate-500 mb-6">This page does not exist or was moved.</p>
                            <Link to="/" className="btn-primary">
                              Return Home
                            </Link>
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
      </ThemeProvider>
    </BrowserRouter>
  );
}
