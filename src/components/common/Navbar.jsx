import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { FiChevronRight, FiHome, FiLogIn, FiMenu, FiSearch, FiSettings, FiUser, FiX } from "react-icons/fi";
import { ThekedaarLogo } from "./ThekedaarLogo";
import toast from "react-hot-toast";

export default function Navbar() {
  const { t, lang, setLang } = useLanguage();
  const { user, logout, isContractor, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [panelState, setPanelState] = useState("closed");
  const [hideNav, setHideNav] = useState(false);

  const panelVisible = panelState !== "closed";

  useEffect(() => {
    setPanelState("closed");
  }, [location.pathname]);

  useEffect(() => {
    let lastY = window.scrollY || 0;
    const onScroll = () => {
      const y = window.scrollY || 0;
      const goingDown = y > lastY;
      setHideNav(goingDown && y > 80 && !panelVisible);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [panelVisible]);

  useEffect(() => {
    document.body.style.overflow = panelVisible ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [panelVisible]);

  const navLinks = useMemo(
    () => [
      { href: "/#home", label: "Home" },
      { href: "/#services", label: "Services" },
      { href: "/#about", label: "About" },
      { href: "/#contact", label: "Contact" },
    ],
    []
  );

  async function handleLogout() {
    await logout();
    toast.success(lang === "hi" ? "Logged out" : "Logged out");
    navigate("/");
  }

  function openPanel() {
    setPanelState("open");
  }

  function closePanel() {
    if (panelState !== "open") return;
    setPanelState("closing");
    window.setTimeout(() => setPanelState("closed"), 240);
  }

  function togglePanel() {
    if (panelState === "open") closePanel();
    if (panelState === "closed") openPanel();
  }

  const dashboardPath = isAdmin ? "/admin/dashboard" : isContractor ? "/contractor/dashboard" : "/";
  const showDashboardLink = isAdmin || isContractor;

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className={`sticky top-0 z-50 px-3 md:px-5 py-2 navbar-shell ${hideNav ? "nav-hidden" : ""}`}>
        <nav className="glass-nav mx-auto max-w-[1400px] px-4 md:px-5 py-3">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center min-w-[56px]">
              <ThekedaarLogo className="h-12 w-12 md:h-14 md:w-14" />
            </Link>

            <div className="hidden lg:flex items-center gap-7 text-[15px] text-slate-700 font-medium">
              {navLinks.map((item) => (
                <a key={item.href} href={item.href} className="hover:text-[#1E3A8A] transition-colors">
                  {item.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  {showDashboardLink ? <Link to={dashboardPath} className="btn-outline-cyan">{t("nav.dashboard") || "Dashboard"}</Link> : null}
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-outline-cyan">{t("nav.login")}</Link>
                  <Link to="/register/contractor" className="btn-primary">{t("nav.register")}</Link>
                </>
              )}
            </div>

            <button
              className={`${user ? "inline-flex" : "md:hidden inline-flex"} items-center justify-center w-11 h-11 rounded-xl border border-slate-300 bg-white text-slate-700`}
              onClick={togglePanel}
              aria-label="Toggle menu"
            >
              {panelVisible ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>
        </nav>
      </header>

      {panelVisible && <div className={`panel-overlay ${panelState === "closing" ? "closing" : ""}`} onClick={closePanel} />}

      {panelVisible && (
        <aside className={`side-panel ${panelState === "closing" ? "closing" : ""}`}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Navigation</p>
            <button className="panel-action !w-auto !px-3 !py-2" onClick={closePanel} aria-label="Close panel">
              <FiX size={18} />
            </button>
          </div>

          <p className="panel-section-title">Discover</p>
          <a href="/#home" className="panel-link" onClick={closePanel}>
            <FiHome size={16} />
            Home
            <FiChevronRight className="ml-auto opacity-60" />
          </a>
          <Link to="/search" className="panel-link" onClick={closePanel}>
            <FiSearch size={16} />
            {t("nav.search") || "Search"}
            <FiChevronRight className="ml-auto opacity-60" />
          </Link>
          {showDashboardLink ? (
            <Link to={dashboardPath} className="panel-link" onClick={closePanel}>
              <FiUser size={16} />
              {t("nav.dashboard") || "Dashboard"}
              <FiChevronRight className="ml-auto opacity-60" />
            </Link>
          ) : null}

          <p className="panel-section-title">Language</p>
          <div className="flex items-center rounded-full bg-slate-100 border border-slate-200 p-1 w-fit">
            {["en", "hi"].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`lang-pill ${lang === l ? "bg-[#1E3A8A] text-white" : "text-slate-600"}`}
              >
                {l === "en" ? "EN" : "HI"}
              </button>
            ))}
          </div>

          <p className="panel-section-title">Account</p>
          {user ? (
            <button
              onClick={() => {
                closePanel();
                handleLogout();
              }}
              className="panel-action"
            >
              <FiLogIn size={16} />
              {t("nav.logout")}
            </button>
          ) : (
            <>
              <Link to="/login" className="panel-link" onClick={closePanel}>
                <FiLogIn size={16} />
                {t("nav.login")}
              </Link>
              <Link to="/register/contractor" className="panel-link" onClick={closePanel}>
                <FiSettings size={16} />
                {t("nav.register")}
              </Link>
            </>
          )}
        </aside>
      )}
    </>
  );
}

