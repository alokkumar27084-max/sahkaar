import React, { Suspense, lazy, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AnimatePresence } from "framer-motion";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import ProtectedRoute from "./components/common/ProtectedRoute";
import LoadingSpinner from "./components/common/LoadingSpinner";
import Icon from "./components/common/Icon";
import LocationPromptModal from "./components/common/LocationPromptModal";
import SplashScreen from "./components/common/SplashScreen";
import PageWrapper from "./components/common/PageWrapper";
import ErrorBoundary from "./components/common/ErrorBoundary";
import CustomCursor from "./components/common/CustomCursor";
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

// New pages for Platform Pivot
const QuickBookingPage = lazy(() => import("./pages/customer/QuickBookingPage"));
const MeetingBookingPage = lazy(() => import("./pages/customer/MeetingBookingPage"));
const LabourSearchPage = lazy(() => import("./pages/customer/LabourSearchPage"));
const LabourProfilePage = lazy(() => import("./pages/customer/LabourProfilePage"));
const ServiceSelectPage = lazy(() => import("./pages/customer/ServiceSelectPage"));
const ProjectDashboard = lazy(() => import("./pages/project/ProjectDashboard"));
const ProjectListPage = lazy(() => import("./pages/project/ProjectListPage"));

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

/* ── Initialize Lenis Smooth Scroll — smooth but NOT slow ── */
function useLenisScroll() {
  useEffect(() => {
    if (!window.Lenis || !window.gsap) return;

    const lenis = new window.Lenis({
      lerp: 0.12,         // Higher = faster response (was 0.08, now 0.12)
      duration: 1.0,      // Shorter scroll duration
      smoothWheel: true,
      wheelMultiplier: 1.2, // Slightly amplified wheel
    });

    // Sync with GSAP ScrollTrigger
    lenis.on('scroll', window.ScrollTrigger?.update);

    window.gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    window.gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;

    return () => {
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);
}

/* ── Toaster theme-aware wrapper ── */
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
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#E8EAF2'}`,
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
    "/dashboard",
    "/chat",
    "/login",
    "/register",
    "/checkout",
    "/search",
    "/select-service",
    "/project",
    "/labour"
  ];

  const shouldHide = hideFooterOn.some(path => location.pathname.includes(path));

  if (shouldHide) return null;
  return <Footer />;
}

function NavbarWrapper() {
  const location = useLocation();

  const hideNavbarOn = [
    // "/search", // User wants navbar back
    // "/chat"
  ];

  const shouldHide = hideNavbarOn.some(path => location.pathname.includes(path));

  if (shouldHide) return null;
  return <Navbar />;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
        <Route
          path="/select-service"
          element={
            <ProtectedRoute>
              <PageWrapper><ServiceSelectPage /></PageWrapper>
            </ProtectedRoute>
          }
        />
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
                <div className="glass-card p-10 md:p-14 max-w-lg text-center">
                  <div className="mb-5 flex justify-center text-indigo-400">
                    <Icon name="compass" className="w-14 h-14" />
                  </div>
                  <h2 className="font-display text-3xl text-[var(--color-heading)] font-bold mb-2">Page Not Found</h2>
                  <p className="text-[var(--color-muted)] mb-6">This page does not exist or was moved.</p>
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

  // Initialize Lenis — smooth but fast
  useLenisScroll();

  useEffect(() => {
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
    <HelmetProvider>
      <BrowserRouter>
        <PageTracker />
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <ThemeProvider>
            <LanguageProvider>
              <AuthProvider>
                <ThemedToaster />

                <AnimatePresence>
                  {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
                </AnimatePresence>

                <div className="app-shell">
                  <CustomCursor />
                  <div className="luxury-noise" />
                  <div className="content-layer">
                    <LocationPromptModal />
                    <NavbarWrapper />

                    <Suspense fallback={<PageFallback />}>
                      <ErrorBoundary>
                        <AnimatedRoutes />
                      </ErrorBoundary>
                    </Suspense>

                    {/* Conditionally show footer only on landing/info pages */}
                    {!showSplash && <FooterWrapper />}
                  </div>
                </div>
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </GoogleOAuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}
