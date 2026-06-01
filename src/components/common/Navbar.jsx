import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  FiChevronRight,
  FiHome,
  FiLogIn,
  FiLogOut,
  FiMenu,
  FiUser,
  FiX,
  FiMoon,
  FiSun,
  FiBriefcase,
  FiMessageCircle,
  FiStar,
  FiGlobe
} from "react-icons/fi";
import { ThekedaarLogo } from "./ThekedaarLogo";
import toast from "react-hot-toast";

export default function Navbar() {
  const { t, lang, setLang } = useLanguage();
  const { user, logout, isContractor, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close mobile drawer and dropdown on path change
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  // Click outside listener for user menu dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle body scroll locking when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      if (window.lenis) window.lenis.stop();
    } else {
      document.body.style.overflow = "";
      if (window.lenis) window.lenis.start();
    }
    return () => {
      document.body.style.overflow = "";
      if (window.lenis) window.lenis.start();
    };
  }, [mobileOpen]);

  async function handleLogout() {
    await logout();
    toast.success("Logged out");
    navigate("/");
  }

  const dashboardPath = isAdmin
    ? "/admin/dashboard"
    : isContractor
    ? "/contractor/dashboard"
    : "/customer/dashboard";

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="fixed top-0 left-0 right-0 h-16 bg-[var(--color-surface)] border-b border-[var(--color-border)] z-[1000] flex items-center px-4 md:px-8">
        <div className="w-full max-w-[var(--max-width)] mx-auto flex items-center justify-between h-full">
          
          {/* Logo — Left */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2.5 group">
              <ThekedaarLogo className="h-8 w-8 transition-transform duration-300 group-hover:scale-105" />
              <span className="font-bold text-base tracking-wider text-[var(--color-heading)] uppercase font-display leading-none">
                THEKEDAAR
              </span>
            </Link>
          </div>

          {/* Links — Center (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className={`text-sm font-semibold tracking-wide transition-colors ${
                location.pathname === "/"
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-body)] hover:text-[var(--color-heading)]"
              }`}
            >
              Home
            </Link>
            <Link
              to="/select-service"
              className={`text-sm font-semibold tracking-wide transition-colors ${
                location.pathname === "/select-service"
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-body)] hover:text-[var(--color-heading)]"
              }`}
            >
              Services
            </Link>
            <a
              href="/#about"
              className="text-sm font-semibold tracking-wide text-[var(--color-body)] hover:text-[var(--color-heading)] transition-colors"
            >
              About
            </a>
          </div>

          {/* Actions — Right */}
          <div className="flex items-center gap-3">
            
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              {/* Language Toggle */}
              <button
                onClick={() => setLang(lang === "en" ? "hi" : "en")}
                className="text-xs font-bold px-2.5 py-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--color-bg-elevated)] transition-all flex items-center gap-1.5"
                aria-label="Toggle language"
              >
                <FiGlobe size={14} />
                <span>{lang === "en" ? "EN" : "HI"}</span>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
              </button>

              {/* Auth button or Dropdown */}
              {!user ? (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-semibold text-[var(--color-body)] hover:text-[var(--color-heading)] transition-colors px-1"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register/contractor"
                    className="border border-[var(--color-heading)] text-[var(--color-heading)] hover:bg-[var(--color-bg-elevated)] rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                  >
                    List your business
                  </Link>
                </>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-bold flex items-center justify-center border border-indigo-200 dark:border-indigo-800 hover:shadow-sm transition-all focus:outline-none"
                  >
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 mt-2 w-56 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg py-2 z-[1001]"
                      >
                        <div className="px-4 py-2 border-b border-[var(--color-border)] mb-1">
                          <p className="text-sm font-bold text-[var(--color-heading)] truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-[var(--color-muted)] truncate">
                            {user.email || user.phone}
                          </p>
                        </div>

                        <Link
                          to={dashboardPath}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-body)] hover:text-[var(--color-heading)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                        >
                          <FiBriefcase size={14} />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          to="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-body)] hover:text-[var(--color-heading)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                        >
                          <FiUser size={14} />
                          <span>Profile</span>
                        </Link>
                        <Link
                          to="/chat"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-body)] hover:text-[var(--color-heading)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                        >
                          <FiMessageCircle size={14} />
                          <span>Messages</span>
                        </Link>

                        <div className="border-t border-[var(--color-border)] my-1" />

                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            handleLogout();
                          }}
                          className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                        >
                          <FiLogOut size={14} />
                          <span>Logout</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--color-bg-elevated)] transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>

          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/40 z-[998] md:hidden"
            />
            {/* Side Panel */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-[var(--color-surface)] border-l border-[var(--color-border)] z-[999] p-6 flex flex-col gap-6 md:hidden shadow-2xl overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ThekedaarLogo className="h-8 w-8" />
                  <span className="font-bold text-sm tracking-wider text-[var(--color-heading)] uppercase font-display">
                    THEKEDAAR
                  </span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* User Info if logged in */}
              {user && (
                <div className="flex items-center gap-3 p-3 bg-[var(--color-bg-elevated)] rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[var(--color-heading)] truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-[var(--color-muted)] truncate">
                      {user.email || user.phone}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-3">
                  Discover
                </p>
                <Link
                  to="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium text-[var(--color-body)] hover:text-[var(--color-heading)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                >
                  <FiHome size={16} />
                  <span>Home</span>
                </Link>
                <Link
                  to="/select-service"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium text-[var(--color-body)] hover:text-[var(--color-heading)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                >
                  <FiBriefcase size={16} />
                  <span>Services</span>
                </Link>
                <a
                  href="/#about"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium text-[var(--color-body)] hover:text-[var(--color-heading)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                >
                  <FiStar size={16} />
                  <span>About</span>
                </a>
              </div>

              {user && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-3">
                    Your Space
                  </p>
                  <Link
                    to={dashboardPath}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium text-[var(--color-body)] hover:text-[var(--color-heading)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                  >
                    <FiBriefcase size={16} />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium text-[var(--color-body)] hover:text-[var(--color-heading)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                  >
                    <FiUser size={16} />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    to="/chat"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium text-[var(--color-body)] hover:text-[var(--color-heading)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                  >
                    <FiMessageCircle size={16} />
                    <span>Messages</span>
                  </Link>
                </div>
              )}

              <div className="flex flex-col gap-2 mt-auto">
                <div className="flex items-center justify-between py-2 border-t border-[var(--color-border)]">
                  <span className="text-sm font-semibold text-[var(--color-body)]">Theme</span>
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                  >
                    {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
                  </button>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)]">
                  <span className="text-sm font-semibold text-[var(--color-body)]">Language</span>
                  <button
                    onClick={() => setLang(lang === "en" ? "hi" : "en")}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[var(--color-bg-elevated)] text-[var(--color-heading)] hover:bg-[var(--color-border)] transition-all"
                  >
                    {lang === "en" ? "English" : "हिंदी"}
                  </button>
                </div>

                {!user ? (
                  <div className="flex flex-col gap-2 mt-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="w-full h-11 flex items-center justify-center rounded-xl bg-[var(--color-bg-elevated)] hover:bg-[var(--color-border)] text-sm font-semibold text-[var(--color-heading)] transition-colors"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register/contractor"
                      onClick={() => setMobileOpen(false)}
                      className="w-full h-11 flex items-center justify-center rounded-xl bg-[var(--color-heading)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      List your business
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleLogout();
                    }}
                    className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-rose-200 dark:border-rose-950/40 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/10 text-sm font-semibold transition-colors mt-2"
                  >
                    <FiLogOut size={16} />
                    <span>Logout</span>
                  </button>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
