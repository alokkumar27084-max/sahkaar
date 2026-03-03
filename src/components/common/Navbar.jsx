import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { FiChevronRight, FiHome, FiLogIn, FiMenu, FiSearch, FiSettings, FiUser, FiX, FiMoon, FiSun } from "react-icons/fi";
import { ThekedaarLogo } from "./ThekedaarLogo";
import toast from "react-hot-toast";

export default function Navbar() {
  const { t, lang, setLang } = useLanguage();
  const { user, logout, isContractor, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [panelState, setPanelState] = useState("closed");
  const [hideNav, setHideNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const panelVisible = panelState !== "closed";

  useEffect(() => {
    setPanelState("closed");
  }, [location.pathname]);

  useEffect(() => {
    let lastY = window.scrollY || 0;
    const onScroll = () => {
      const y = window.scrollY || 0;
      setScrolled(y > 20);
      setHideNav(y > lastY && y > 100 && !panelVisible);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [panelVisible]);

  useEffect(() => {
    document.body.style.overflow = panelVisible ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [panelVisible]);

  const navLinks = useMemo(() => [
    { href: "/#home", label: "Home" },
    { href: "/#services", label: "Services" },
    { href: "/#about", label: "About" },
    { href: "/#contact", label: "Contact" },
  ], []);

  async function handleLogout() {
    await logout();
    toast.success("Logged out");
    navigate("/");
  }

  function openPanel() { setPanelState("open"); }
  function closePanel() {
    if (panelState !== "open") return;
    setPanelState("closing");
    window.setTimeout(() => setPanelState("closed"), 280);
  }
  function togglePanel() {
    if (panelState === "open") closePanel();
    if (panelState === "closed") openPanel();
  }

  const dashboardPath = isAdmin ? "/admin/dashboard" : isContractor ? "/contractor/dashboard" : "/";
  const showDashboardLink = isAdmin || isContractor;

  /* Reusable theme toggle button */
  const ThemeToggleBtn = ({ size = 18, className = "" }) => (
    <button
      onClick={toggleTheme}
      className={`relative w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-border)] transition-all ${className}`}
      aria-label="Toggle theme"
    >
      <motion.div
        key={isDark ? "sun" : "moon"}
        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.3 }}
      >
        {isDark ? <FiSun size={size} /> : <FiMoon size={size} />}
      </motion.div>
    </button>
  );

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <header className={`sticky top-0 z-50 px-3 md:px-5 py-2 navbar-shell ${hideNav ? "nav-hidden" : ""}`}>
        <nav className={`glass-nav mx-auto max-w-[1400px] px-4 md:px-6 py-3 ${scrolled ? "shadow-glass-lg" : ""}`}>
          <div className="flex items-center justify-between gap-4">
            {/* Logo + Brand */}
            <Link to="/" className="flex items-center gap-3 min-w-[56px] group">
              <ThekedaarLogo className="h-10 w-10 md:h-11 md:w-11 transition-transform group-hover:scale-105" />
              <span className="hidden sm:block font-display text-xl font-bold text-[var(--color-heading)] tracking-tight">
                Thekedaar
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((item) => (
                <a key={item.href} href={item.href} className="nav-link text-[15px]">
                  {item.label}
                </a>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  {/* After login: only theme toggle + hamburger, no dashboard button */}
                  <ThemeToggleBtn />
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-ghost text-sm">{t("nav.login")}</Link>
                  <Link to="/register/contractor" className="btn-primary text-sm btn-shimmer">
                    {t("nav.register")}
                  </Link>
                  <ThemeToggleBtn />
                </>
              )}
            </div>

            {/* Mobile: only hamburger (dark mode moved to side panel) */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                className="w-10 h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-body)] flex items-center justify-center"
                onClick={togglePanel}
                aria-label="Toggle menu"
              >
                {panelVisible ? <FiX size={18} /> : <FiMenu size={18} />}
              </button>
            </div>

            {/* Desktop hamburger for logged-in users */}
            {user && (
              <button
                className="hidden md:flex w-10 h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-body)] items-center justify-center"
                onClick={togglePanel}
                aria-label="Toggle menu"
              >
                {panelVisible ? <FiX size={18} /> : <FiMenu size={18} />}
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* Overlay */}
      <AnimatePresence>
        {panelVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="panel-overlay"
            onClick={closePanel}
          />
        )}
      </AnimatePresence>

      {/* Side Panel */}
      <AnimatePresence>
        {panelVisible && (
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="side-panel"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="font-display text-xs uppercase tracking-[0.15em] text-[var(--color-muted)] font-bold">Menu</p>
              <button className="panel-action !w-auto !px-3 !py-2 !min-h-0" onClick={closePanel} aria-label="Close">
                <FiX size={16} />
              </button>
            </div>

            <p className="panel-section-title">Discover</p>
            <a href="/#home" className="panel-link" onClick={closePanel}>
              <FiHome size={16} /> Home <FiChevronRight className="ml-auto opacity-40" />
            </a>
            <Link to="/search" className="panel-link" onClick={closePanel}>
              <FiSearch size={16} /> {t("nav.search") || "Search"} <FiChevronRight className="ml-auto opacity-40" />
            </Link>
            {showDashboardLink && (
              <Link to={dashboardPath} className="panel-link" onClick={closePanel}>
                <FiUser size={16} /> {t("nav.dashboard") || "Dashboard"} <FiChevronRight className="ml-auto opacity-40" />
              </Link>
            )}

            <p className="panel-section-title">Appearance</p>
            <button onClick={toggleTheme} className="panel-link w-full">
              {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
              {isDark ? "Light Mode" : "Dark Mode"}
              <span className="ml-auto text-xs text-[var(--color-muted)]">{isDark ? "☀️" : "🌙"}</span>
            </button>

            <p className="panel-section-title">Language</p>
            <div className="flex items-center rounded-full bg-[var(--color-border)] p-1 w-fit">
              {["en", "hi"].map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`lang-pill ${lang === l ? "bg-[var(--color-primary)] text-white shadow-sm" : "text-[var(--color-muted)]"}`}
                >
                  {l === "en" ? "EN" : "HI"}
                </button>
              ))}
            </div>

            <p className="panel-section-title">Account</p>
            {user ? (
              <button onClick={() => { closePanel(); handleLogout(); }} className="panel-action">
                <FiLogIn size={16} /> {t("nav.logout")}
              </button>
            ) : (
              <>
                <Link to="/login" className="panel-link" onClick={closePanel}>
                  <FiLogIn size={16} /> {t("nav.login")}
                </Link>
                <Link to="/register/contractor" className="panel-link" onClick={closePanel}>
                  <FiSettings size={16} /> {t("nav.register")}
                </Link>
              </>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
