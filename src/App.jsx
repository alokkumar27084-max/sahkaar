import React, { Suspense, lazy, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AnimatePresence } from "framer-motion";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Navbar from "./components/common/Navbar";
import ProtectedRoute from "./components/common/ProtectedRoute";
import LoadingSpinner from "./components/common/LoadingSpinner";
import Icon from "./components/common/Icon";
import LocationPromptModal from "./components/common/LocationPromptModal";
import QuickServiceRequest from "./components/common/QuickServiceRequest";
import SplashScreen from "./components/common/SplashScreen";
import PageWrapper from "./components/common/PageWrapper";
import CustomCursor from "./components/common/CustomCursor";
import usePageTracking from "./hooks/usePageTracking";

const HomePage = lazy(() => import("./pages/customer/HomePage"));
// ... other lazy imports stay same ...
const SearchPage = lazy(() => import("./pages/customer/SearchPage"));
const ContractorProfilePage = lazy(() => import("./pages/customer/ContractorProfilePage"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const ContractorRegisterPage = lazy(() => import("./pages/contractor/ContractorRegisterPage"));
const ContractorDashboard = lazy(() => import("./pages/contractor/ContractorDashboard"));
const ContractorEditPage = lazy(() => import("./pages/contractor/ContractorEditPage"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const QuickServicesPage = lazy(() => import("./pages/customer/QuickServicesPage"));
const ServiceDetailPage = lazy(() => import("./pages/customer/ServiceDetailPage"));
const ChatLayout = lazy(() => import("./pages/chat/ChatLayout"));
const BookingCheckoutPage = lazy(() => import("./pages/customer/BookingCheckoutPage"));
const CustomerDashboard = lazy(() => import("./pages/customer/CustomerDashboard"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));

function PageFallback() {
  return (
    <div className="min-h-[62vh] flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}

function PageTracker() {
  usePageTracking();
  return null;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <PageWrapper><SearchPage /></PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route path="/contractor/:id" element={<PageWrapper><ContractorProfilePage /></PageWrapper>} />
        <Route
          path="/checkout/:id"
          element={
            <ProtectedRoute>
              <PageWrapper><BookingCheckoutPage /></PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/dashboard"
          element={
            <ProtectedRoute>
              <PageWrapper><CustomerDashboard /></PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>} />
        <Route path="/register" element={<PageWrapper><RegisterPage /></PageWrapper>} />
        <Route path="/register/contractor" element={<PageWrapper><ContractorRegisterPage /></PageWrapper>} />
        <Route path="/forgot-password" element={<PageWrapper><ForgotPasswordPage /></PageWrapper>} />
        <Route path="/reset-password" element={<PageWrapper><ResetPasswordPage /></PageWrapper>} />
        <Route path="/quick-services" element={<PageWrapper><QuickServicesPage /></PageWrapper>} />
        <Route path="/services/:slug" element={<PageWrapper><ServiceDetailPage /></PageWrapper>} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <PageWrapper><ChatLayout /></PageWrapper>
            </ProtectedRoute>
          }
        />

        <Route
          path="/contractor/dashboard"
          element={
            <ProtectedRoute requiredRole="contractor">
              <PageWrapper><ContractorDashboard /></PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/contractor/edit"
          element={
            <ProtectedRoute requiredRole="contractor">
              <PageWrapper><ContractorEditPage /></PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <PageWrapper><AdminDashboardPage /></PageWrapper>
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <PageWrapper>
              <div className="min-h-[68vh] flex items-center justify-center px-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-10 max-w-lg text-center shadow-sm">
                  <div className="mb-4 flex justify-center text-[#4F46E5]">
                    <Icon name="compass" className="w-14 h-14" />
                  </div>
                  <h2 className="font-display text-3xl text-[#111827] font-semibold mb-2">Page Not Found</h2>
                  <p className="text-slate-500 mb-6">This page does not exist or was moved.</p>
                  <Link to="/" className="btn-primary">
                    Return Home
                  </Link>
                </div>
              </div>
            </PageWrapper>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "1091767343100-cdkm19c3r5fn3m6ha6nfqk38g16lj5cg.apps.googleusercontent.com";

  useEffect(() => {
    // Check if splash has been shown in this session
    const hasShownSplash = sessionStorage.getItem('hasShownSplash');
    if (hasShownSplash) {
      setShowSplash(false);
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem('hasShownSplash', 'true');
  };

  return (
    <BrowserRouter>
      <PageTracker />
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <Toaster
                position="top-center"
                toastOptions={{
                  duration: 3200,
                  style: {
                    borderRadius: "14px",
                    color: "#0F172A",
                    background: "#ffffff",
                    border: "1px solid #E2E8F0",
                    fontSize: "14px",
                    fontFamily: "Outfit, sans-serif"
                  },
                  success: { iconTheme: { primary: "#4F46E5", secondary: "#ffffff" } },
                }}
              />

              <AnimatePresence>
                {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
              </AnimatePresence>

              <div className="app-shell">
                <CustomCursor />
                <div className="luxury-noise" />
                <div className="content-layer">
                  <LocationPromptModal />
                  <QuickServiceRequest />
                  {!showSplash && <Navbar />}

                  <Suspense fallback={<PageFallback />}>
                    <AnimatedRoutes />
                  </Suspense>
                </div>
              </div>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  );
}
