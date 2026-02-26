import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { FiChevronRight, FiHome, FiLogIn, FiMenu, FiSearch, FiSettings, FiUser, FiX } from "react-icons/fi";
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

  async function handleLogout() {
    await logout();
    toast.success(lang === "hi" ? "लॉगआउट हो गए" : "Logged out");
    navigate("/");
  }

  const panelPrimaryLinks = [
    { to: "/", label: t("nav.home") || "Home", icon: <FiHome size={16} /> },
    { to: "/search", label: t("nav.search") || "Search", icon: <FiSearch size={16} /> },
  ];

  if (user) {
    panelPrimaryLinks.push({
      to: isAdmin ? "/admin/dashboard" : isContractor ? "/contractor/dashboard" : "/",
      label: isAdmin ? (lang === "hi" ? "एडमिन" : "Admin") : isContractor ? t("nav.dashboard") : t("nav.profile"),
      icon: <FiUser size={16} />,
    });
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

  return (
    <>
      <header className={`sticky top-3 z-50 px-3 md:px-5 navbar-shell ${hideNav ? "nav-hidden" : ""}`}>
        <nav className="glass-nav max-w-6xl mx-auto rounded-2xl px-4 py-3 fade-rise">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="brand-logo text-slate-100">
            The<span className="text-cyan-200">kedaar</span>
          </Link>

          <button
            className="btn-secondary !px-3 !py-2"
            onClick={togglePanel}
            aria-label="Toggle menu"
          >
            {panelVisible ? <FiX size={18} /> : <FiMenu size={18} />}
          </button>
        </div>
        </nav>
      </header>

      {panelVisible && <div className={`panel-overlay ${panelState === "closing" ? "closing" : ""}`} onClick={closePanel} />}

      {panelVisible && (
        <aside className={`side-panel ${panelState === "closing" ? "closing" : ""}`}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm uppercase tracking-[0.14em] text-slate-300/90">Navigation</p>
            <button className="btn-secondary !px-3 !py-2" onClick={closePanel} aria-label="Close panel">
              <FiX size={18} />
            </button>
          </div>

          <div className="surface-panel rounded-2xl p-4 mb-1 panel-item" style={{ animationDelay: "40ms" }}>
            <p className="text-xs text-slate-300/85 mb-1">{lang === "hi" ? "लॉगिन स्टेटस" : "Account"}</p>
            <p className="text-sm font-semibold text-slate-100">
              {user ? (user.name || t("nav.profile")) : (lang === "hi" ? "गेस्ट यूज़र" : "Guest user")}
            </p>
          </div>

          <p className="panel-section-title">{lang === "hi" ? "डिस्कवर" : "Discover"}</p>
          <div className="flex flex-col gap-2">
            {panelPrimaryLinks.map((item, index) => (
              <Link
                key={item.to}
                to={item.to}
                className="panel-link hover-lift panel-item"
                style={{ animationDelay: `${80 + index * 60}ms` }}
                onClick={closePanel}
              >
                {item.icon}
                {item.label}
                <FiChevronRight className="ml-auto opacity-70" />
              </Link>
            ))}
          </div>

          <p className="panel-section-title">{lang === "hi" ? "प्रेफरेंसेस" : "Preferences"}</p>
          <div className="flex items-center rounded-full bg-white/5 border border-white/10 p-1 mt-1 mb-1 w-fit panel-item" style={{ animationDelay: "220ms" }}>
            {["en", "hi"].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`lang-pill ${lang === l ? "bg-cyan-200 text-slate-950" : "text-slate-300 hover:text-white"}`}
              >
                {l === "en" ? "EN" : "हि"}
              </button>
            ))}
          </div>

          <p className="panel-section-title">{lang === "hi" ? "खाता" : "Account Actions"}</p>
          <div className="mt-auto flex flex-col gap-2 pb-2">
            {user ? (
              <button
                onClick={() => {
                  closePanel();
                  handleLogout();
                }}
                className="btn-primary justify-start panel-item"
                style={{ animationDelay: "280ms" }}
              >
                {t("nav.logout")}
              </button>
            ) : (
              <>
                <Link to="/login" className="btn-secondary justify-start hover-lift panel-item" style={{ animationDelay: "260ms" }} onClick={closePanel}>
                  <FiLogIn size={16} />
                  {t("nav.login")}
                </Link>
                <Link to="/register/contractor" className="btn-primary justify-start hover-lift panel-item" style={{ animationDelay: "320ms" }} onClick={closePanel}>
                  <FiSettings size={16} />
                  {t("nav.register")}
                </Link>
              </>
            )}
          </div>
        </aside>
      )}
    </>
  );
}
