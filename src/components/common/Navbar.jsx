import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { FiChevronRight, FiHome, FiLogIn, FiMenu, FiSearch, FiUser, FiX, FiMoon, FiSun, FiMap, FiBriefcase, FiMessageCircle, FiStar } from "react-icons/fi";
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
      const isExternalOpen = document.body.classList.contains("external-panel-open");
      setScrolled(y > 20);
      setHideNav((y > lastY && y > 100 && !panelVisible) || isExternalOpen);
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

    // MutationObserver to watch for external panels (like Search filters)
    const observer = new MutationObserver(() => {
      const isExternalOpen = document.body.classList.contains("external-panel-open");
      if (isExternalOpen) setHideNav(true);
      else if (!panelVisible && window.scrollY < 100) setHideNav(false);
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    return () => {
      document.body.style.overflow = "";
      if (window.lenis) window.lenis.start();
      observer.disconnect();
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
    { href: "/macro-services", label: "Thekedaar Services" },
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

      <header className={`fixed top-0 inset-x-0 z-50 px-4 md:px-8 py-5 transition-all duration-700 ${hideNav ? "-translate-y-full" : "translate-y-0"}`}>
        <nav className={`mx-auto max-w-[1400px] px-6 py-2.5 rounded-[22px] border transition-all duration-700 ${scrolled ? "bg-[var(--color-bg)]/60 backdrop-blur-2xl border-white/10 shadow-2xl" : "bg-transparent border-transparent"}`}>
          <div className="flex items-center justify-between lg:grid lg:grid-cols-3 lg:items-center">
            
            {/* Logo — Left */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-3 group">
                <ThekedaarLogo className="h-9 w-9 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" />
                <span className={`hidden sm:block font-display text-[15px] tracking-[0.2em] font-black uppercase leading-none transition-all duration-500 ${scrolled ? "text-[var(--color-heading)]" : "text-white opacity-90"}`}>
                  THEKEDAAR
                </span>
              </Link>
            </div>

            {/* Nav Pill — Center (Hidden on Mobile) */}
            <div className="hidden lg:flex justify-center">
              <div className={`flex items-center gap-1 p-1 rounded-full border transition-all duration-500 ${scrolled ? "bg-[var(--color-surface)]/50 backdrop-blur-md border-[var(--color-border)] shadow-sm" : "bg-white/5 border-white/5"}`}>
                {navLinks.map((item) => {
                  const isActive = location.hash === item.href.substring(1) || (location.pathname === item.href && !location.hash);
                  return (
                    <a 
                      key={item.href} 
                      href={item.href} 
                      className={`relative px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${isActive ? "text-white" : scrolled ? "text-[var(--color-muted)] hover:text-[var(--color-heading)]" : "text-white/40 hover:text-white"}`}
                    >
                      {isActive && (
                        <motion.div 
                          layoutId="nav-pill-bg"
                          className="absolute inset-0 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/20"
                          transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                        />
                      )}
                      <span className="relative z-10">{item.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Actions — Right */}
            <div className="flex items-center justify-end gap-3 md:gap-5">
              <div className="hidden md:flex items-center gap-6">
                {!user && (
                  <Link to="/login" className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${scrolled ? "text-[var(--color-muted)] hover:text-[var(--color-heading)]" : "text-white/50 hover:text-white"}`}>
                    Sign In
                  </Link>
                )}
                <ThemeToggleBtn className={`!bg-transparent !border-none !w-auto !h-auto transition-all ${scrolled ? "text-[var(--color-heading)] opacity-80 hover:opacity-100" : "text-white opacity-50 hover:opacity-100"}`} />
              </div>

              {user ? (
                <Link to={dashboardPath} className={`h-10 px-6 rounded-full border transition-all text-[11px] font-black uppercase tracking-[0.15em] flex items-center justify-center ${scrolled ? "bg-[var(--color-primary)] text-white border-transparent" : "bg-white/5 border-white/10 text-white hover:bg-white/10"}`}>
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/register/contractor"
                  ref={ctaRef}
                  onMouseMove={handleCtaMove}
                  onMouseLeave={handleCtaLeave}
                  className="hidden md:flex h-10 px-8 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/30 items-center justify-center hover:shadow-indigo-500/50 transition-all active:scale-95 btn-shimmer"
                >
                  Join as Partner
                </Link>
              )}

              {/* Mobile Menu Trigger */}
              <button
                className={`w-10 h-10 rounded-xl border transition-all flex items-center justify-center hover:scale-105 active:scale-95 lg:hidden ${scrolled ? "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-heading)]" : "bg-white/5 border-white/10 text-white"}`}
                onClick={togglePanel}
                aria-label="Toggle menu"
              >
                {panelVisible ? <FiX size={18} /> : <FiMenu size={18} />}
              </button>
            </div>

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
            className="side-panel overflow-y-auto overscroll-contain"
            data-lenis-prevent
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
            <Link to="/macro-services" className="panel-link" onClick={closePanel}>
              <FiBriefcase size={15} /> Macro Services <FiChevronRight className="ml-auto opacity-30" />
            </Link>
            <a href="/#about" className="panel-link" onClick={closePanel}>
              <FiStar size={15} /> About <FiChevronRight className="ml-auto opacity-30" />
            </a>
            <Link to="/search" className="panel-link" onClick={closePanel}>
              <FiSearch size={15} /> {t("nav.search") || "Search"} <FiChevronRight className="ml-auto opacity-30" />
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
