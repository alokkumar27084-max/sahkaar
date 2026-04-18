import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { FiChevronRight, FiHome, FiLogIn, FiMenu, FiSearch, FiUser, FiX, FiMoon, FiSun, FiMap, FiBriefcase, FiMessageCircle } from "react-icons/fi";
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
    if (panelVisible) {
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
  }, [panelVisible]);

  /* ── Magnetic CTA button ── */
  const ctaRef = useRef(null);
  const handleCtaMove = useCallback((e) => {
    if (!ctaRef.current || !window.gsap) return;
    const rect = ctaRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.3;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.3;
    window.gsap.to(ctaRef.current, { x, y, duration: 0.2, ease: "power2.out" });
  }, []);
  const handleCtaLeave = useCallback(() => {
    if (!ctaRef.current || !window.gsap) return;
    window.gsap.to(ctaRef.current, { x: 0, y: 0, duration: 0.4, ease: "elastic.out(1, 0.5)" });
  }, []);

  const navLinks = useMemo(() => [
    { href: "/#home", label: "Home" },
    { href: "/quick-services", label: "Quick Services" },
    { href: "/macro-services", label: "Macro Services" },
    { href: "/directory", label: "Directory" },
    { href: "/#about", label: "About" },
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

  const dashboardPath = isAdmin ? "/admin/dashboard" : isContractor ? "/contractor/dashboard" : "/customer/dashboard";

  /* Reusable theme toggle button */
  const ThemeToggleBtn = ({ size = 17, className = "" }) => (
    <button
      onClick={toggleTheme}
      className={`relative w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-muted)] transition-all ${className}`}
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
        <nav className={`glass-nav mx-auto max-w-[1400px] px-4 md:px-6 py-2.5 ${scrolled ? "shadow-glass-lg" : ""}`}>
          <div className="flex items-center justify-between gap-4">
            {/* Logo + Brand */}
            <Link to="/" className="flex items-center gap-2.5 min-w-[56px] group">
              <ThekedaarLogo className="h-9 w-9 md:h-10 md:w-10 transition-transform group-hover:scale-105" />
              <span className="hidden sm:block font-display text-lg text-[var(--color-heading)] tracking-[-0.03em] font-extrabold uppercase">
                THEKEDAAR
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-7">
              {navLinks.map((item) => (
                <a key={item.href} href={item.href} className="nav-link text-[14px]">
                  {item.label}
                </a>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  <ThemeToggleBtn />
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-ghost text-sm px-4 py-2">{t("nav.login")}</Link>
                  <Link
                    to="/register/contractor"
                    ref={ctaRef}
                    onMouseMove={handleCtaMove}
                    onMouseLeave={handleCtaLeave}
                    className="btn-primary text-sm btn-shimmer px-5 py-2.5"
                  >
                    {t("nav.register")}
                  </Link>
                  <ThemeToggleBtn />
                </>
              )}
            </div>

            {/* Hamburger — always visible for menu access */}
            <button
              className={`w-9 h-9 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-body)] flex items-center justify-center transition-colors hover:border-[var(--color-primary)]/30 ${!user ? 'md:hidden' : ''}`}
              onClick={togglePanel}
              aria-label="Toggle menu"
            >
              {panelVisible ? <FiX size={17} /> : <FiMenu size={17} />}
            </button>
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
            transition={{ duration: 0.25 }}
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
            {/* Panel Header */}
            <div className="flex items-center justify-between mb-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-white flex items-center justify-center text-sm font-bold">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--color-heading)] leading-tight">{user?.name}</p>
                    <p className="text-[10px] text-[var(--color-muted)] font-medium">{user?.email || user?.phone}</p>
                  </div>
                </div>
              ) : (
                <p className="font-display text-xs uppercase tracking-[0.15em] text-[var(--color-muted)] font-bold">Menu</p>
              )}
              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--color-border)] transition-colors" onClick={closePanel} aria-label="Close">
                <FiX size={16} />
              </button>
            </div>

            {/* Navigation */}
            <p className="panel-section-title">Discover</p>
            <a href="/#home" className="panel-link" onClick={closePanel}>
              <FiHome size={15} /> Home <FiChevronRight className="ml-auto opacity-30" />
            </a>
            <Link to="/search" className="panel-link" onClick={closePanel}>
              <FiSearch size={15} /> {t("nav.search") || "Search"} <FiChevronRight className="ml-auto opacity-30" />
            </Link>
            <Link to="/directory" className="panel-link" onClick={closePanel}>
              <FiMap size={15} /> Local Directory <FiChevronRight className="ml-auto opacity-30" />
            </Link>

            {/* Dashboard — available to ALL logged-in users */}
            {user && (
              <>
                <p className="panel-section-title">Your Space</p>
                <Link to={dashboardPath} className="panel-link" onClick={closePanel}>
                  <FiBriefcase size={15} /> {t("nav.dashboard") || "Dashboard"} <FiChevronRight className="ml-auto opacity-30" />
                </Link>
                <Link to="/profile" className="panel-link" onClick={closePanel}>
                  <FiUser size={15} /> My Profile <FiChevronRight className="ml-auto opacity-30" />
                </Link>
                <Link to="/chat" className="panel-link" onClick={closePanel}>
                  <FiMessageCircle size={15} /> Messages <FiChevronRight className="ml-auto opacity-30" />
                </Link>
              </>
            )}

            {/* Appearance */}
            <p className="panel-section-title">Appearance</p>
            <button onClick={toggleTheme} className="panel-link w-full">
              {isDark ? <FiSun size={15} /> : <FiMoon size={15} />}
              {isDark ? "Light Mode" : "Dark Mode"}
              <span className="ml-auto text-[11px] text-[var(--color-muted)]">{isDark ? "☀️" : "🌙"}</span>
            </button>

            {/* Language */}
            <p className="panel-section-title">Language</p>
            <div className="flex items-center rounded-xl bg-[var(--color-border)] p-1 w-fit">
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

            {/* Account */}
            <p className="panel-section-title">Account</p>
            {user ? (
              <button onClick={() => { closePanel(); handleLogout(); }} className="panel-action text-rose-500 border-rose-500/20 hover:bg-rose-500/5 hover:border-rose-500/30 hover:text-rose-500">
                <FiLogIn size={15} /> {t("nav.logout")}
              </button>
            ) : (
              <>
                <Link to="/login" className="panel-link" onClick={closePanel}>
                  <FiLogIn size={15} /> {t("nav.login")}
                </Link>
                <Link to="/register/contractor" className="panel-link" onClick={closePanel}>
                  <FiUser size={15} /> {t("nav.register")}
                </Link>
              </>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
