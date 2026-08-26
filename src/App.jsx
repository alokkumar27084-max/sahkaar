import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AnimatePresence } from "framer-motion";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { LocationProvider } from "./context/LocationContext";
import { NotificationProvider } from "./context/NotificationContext";
import LocationSelectorModal from "./components/common/LocationSelectorModal";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import ProtectedRoute from "./components/common/ProtectedRoute";
import LoadingSpinner from "./components/common/LoadingSpinner";
import Icon from "./components/common/Icon";
import PageWrapper from "./components/common/PageWrapper";
import ErrorBoundary from "./components/common/ErrorBoundary";
import usePageTracking from "./hooks/usePageTracking";

const HomePage = lazy(() => import("./pages/customer/HomePage"));
const SearchPage = lazy(() => import("./pages/customer/SearchPage"));
const ContractorProfilePage = lazy(() => import("./pages/customer/ContractorProfilePage"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const ContractorRegisterPage = lazy(() => import("./pages/contractor/ContractorRegisterPage"));
const ContractorDashboard = lazy(() => import("./pages/contractor/ContractorDashboard"));
const ContractorEditPage = lazy(() => import("./pages/contractor/ContractorEditPage"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const ChatLayout = lazy(() => import("./pages/chat/ChatLayout"));
const BookingCheckoutPage = lazy(() => import("./pages/customer/BookingCheckoutPage"));
const CustomerDashboard = lazy(() => import("./pages/customer/CustomerDashboard"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));
const MyProfilePage = lazy(() => import("./pages/customer/MyProfilePage"));
const PrivacyPolicy = lazy(() => import("./pages/customer/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/customer/TermsOfService"));
const RefundPolicy = lazy(() => import("./pages/customer/RefundPolicy"));

// Pivot Pages
const QuickBookingPage = lazy(() => import("./pages/customer/QuickBookingPage"));
const MeetingBookingPage = lazy(() => import("./pages/customer/MeetingBookingPage"));
const LabourSearchPage = lazy(() => import("./pages/customer/LabourSearchPage"));
const LabourProfilePage = lazy(() => import("./pages/customer/LabourProfilePage"));
const ServiceSelectPage = lazy(() => import("./pages/customer/ServiceSelectPage"));
const ProjectDashboard = lazy(() => import("./pages/project/ProjectDashboard"));
const ProjectListPage = lazy(() => import("./pages/project/ProjectListPage"));
const AllCategoriesPage = lazy(() => import("./pages/customer/AllCategoriesPage"));
const FederationAdminDashboard = lazy(() => import("./pages/admin/FederationAdminDashboard"));
const SocietyAdminDashboard = lazy(() => import("./pages/admin/SocietyAdminDashboard"));

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

function useLenisScroll() {
  useEffect(() => {
    if (!window.Lenis || !window.gsap) return;

    const lenis = new window.Lenis({
      lerp: 0.09,
      duration: 0.7,
      smoothWheel: true,
      wheelMultiplier: 1,
    });

    lenis.on("scroll", window.ScrollTrigger?.update);

    const handleTick = (time) => {
      lenis.raf(time * 1000);
    };
    window.gsap.ticker.add(handleTick);

    window.gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;

    return () => {
      window.gsap.ticker.remove(handleTick);
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);
}

function ThemedToaster() {
  const { isDark } = useTheme();
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: {
          borderRadius: "14px",
          color: isDark ? "#ECEEF6" : "#0C0F1D",
          background: isDark ? "#1A1C28" : "#FFFFFF",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E8EAF2"}`,
          fontSize: "14px",
          fontFamily: "'Inter', sans-serif",
          boxShadow: isDark
            ? "0 8px 32px rgba(0,0,0,0.3)"
            : "0 4px 24px rgba(0,0,0,0.06)",
        },
        success: {
          iconTheme: { primary: "#6366F1", secondary: isDark ? "#1A1C28" : "#FFFFFF" },
        },
      }}
    />
  );
}

function FooterWrapper() {
  const location = useLocation();
  const hideFooterOn = [
    "/admin",
    "/dashboard",
    "/chat",
    "/login",
    "/register",
    "/checkout",
    "/search",
    "/select-service",
    "/project",
    "/labour",
  ];

  const shouldHide = hideFooterOn.some((path) => location.pathname.includes(path));

  if (shouldHide) return null;
  return <Footer />;
}

function NavbarWrapper() {
  const location = useLocation();
  const hideNavbarOn = ["/admin"];
  const shouldHide = hideNavbarOn.some((path) => location.pathname.includes(path));

  if (shouldHide) return null;
  return <Navbar />;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
        <Route path="/categories" element={<PageWrapper><AllCategoriesPage /></PageWrapper>} />
        <Route
          path="/select-service"
          element={
            <ProtectedRoute>
              <PageWrapper><ServiceSelectPage /></PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route path="/search" element={<PageWrapper><SearchPage /></PageWrapper>} />
        <Route path="/contractor/:id" element={<PageWrapper><ContractorProfilePage /></PageWrapper>} />
        <Route path="/master/:id" element={<PageWrapper><ContractorProfilePage /></PageWrapper>} />
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
        <Route path="/register/master" element={<PageWrapper><ContractorRegisterPage /></PageWrapper>} />
        <Route path="/forgot-password" element={<PageWrapper><ForgotPasswordPage /></PageWrapper>} />
        <Route path="/reset-password" element={<PageWrapper><ResetPasswordPage /></PageWrapper>} />
        <Route path="/privacy-policy" element={<PageWrapper><PrivacyPolicy /></PageWrapper>} />
        <Route path="/terms" element={<PageWrapper><TermsOfService /></PageWrapper>} />
        <Route path="/refund-policy" element={<PageWrapper><RefundPolicy /></PageWrapper>} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <PageWrapper><MyProfilePage /></PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <PageWrapper><ChatLayout /></PageWrapper>
            </ProtectedRoute>
          }
        />

        {/* Pivot Routes */}
        <Route
          path="/quick-booking/:contractorId"
          element={
            <ProtectedRoute>
              <PageWrapper><QuickBookingPage /></PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/meeting/:id"
          element={
            <ProtectedRoute>
              <PageWrapper><MeetingBookingPage /></PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/labour"
          element={
            <ProtectedRoute>
              <PageWrapper><LabourSearchPage /></PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/labour/:id"
          element={
            <ProtectedRoute>
              <PageWrapper><LabourProfilePage /></PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <PageWrapper><ProjectListPage /></PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/project/:id"
          element={
            <ProtectedRoute>
              <PageWrapper><ProjectDashboard /></PageWrapper>
            </ProtectedRoute>
          }
        />

        <Route
          path="/contractor/dashboard"
          element={
            <ProtectedRoute requiredRole={["contractor", "worker", "master"]}>
              <PageWrapper><ContractorDashboard /></PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/master/dashboard"
          element={
            <ProtectedRoute requiredRole={["contractor", "worker", "master"]}>
              <PageWrapper><ContractorDashboard /></PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/contractor/edit"
          element={
            <ProtectedRoute requiredRole={["contractor", "worker", "master"]}>
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
          path="/federation/dashboard"
          element={
            <ProtectedRoute requiredRole={["federation_admin", "admin"]}>
              <PageWrapper><FederationAdminDashboard /></PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/federation-dashboard"
          element={
            <ProtectedRoute requiredRole={["federation_admin", "admin"]}>
              <PageWrapper><FederationAdminDashboard /></PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/society/dashboard"
          element={
            <ProtectedRoute requiredRole={["society_admin", "admin"]}>
              <PageWrapper><SocietyAdminDashboard /></PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/society-dashboard"
          element={
            <ProtectedRoute requiredRole={["society_admin", "admin"]}>
              <PageWrapper><SocietyAdminDashboard /></PageWrapper>
            </ProtectedRoute>
          }
        />

        {/* 404 Fallback Route */}
        <Route
          path="*"
          element={
            <PageWrapper>
              <div className="min-h-[60vh] flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="alert-triangle" size={32} />
                  </div>
                  <h1 className="text-2xl font-bold font-display text-primary mb-2">Page Not Found</h1>
                  <p className="text-muted text-sm mb-6">This page does not exist or has been moved.</p>
                  <Link to="/" className="btn-primary py-2.5 px-6 inline-block rounded-lg font-semibold">
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
  const GOOGLE_CLIENT_ID =
    process.env.REACT_APP_GOOGLE_CLIENT_ID ||
    "1091767343100-cdkm19c3r5fn3m6ha6nfqk38g16lj5cg.apps.googleusercontent.com";

  useLenisScroll();

  return (
    <HelmetProvider>
      <BrowserRouter>
        <PageTracker />
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <ThemeProvider>
            <LanguageProvider>
              <AuthProvider>
                <NotificationProvider>
                  <LocationProvider>
                    <ThemedToaster />

                    <div className="app-shell">
                      <div className="content-layer">
                        <LocationSelectorModal />
                        <NavbarWrapper />

                        <Suspense fallback={<PageFallback />}>
                          <ErrorBoundary>
                            <AnimatedRoutes />
                          </ErrorBoundary>
                        </Suspense>

                        <FooterWrapper />
                      </div>
                    </div>
                  </LocationProvider>
                </NotificationProvider>
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </GoogleOAuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}
