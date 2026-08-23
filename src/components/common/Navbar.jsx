import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import {
  FiMenu,
  FiX,
  FiUser,
  FiBriefcase,
  FiLogOut,
  FiLayers,
  FiUsers,
  FiLock,
  FiCheckCircle,
  FiShield
} from "react-icons/fi";
import GovHeader from "./GovHeader";
import { SahKaariLogo } from "./SahKaariLogo";
import toast from "react-hot-toast";

export default function Navbar() {
  const { lang } = useLanguage();
  const { user, logout, isContractor, isAdmin, isSocietyAdmin, isFederationAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    toast.success("Logged out successfully");
    navigate("/");
  }

  const dashboardPath = isAdmin
    ? "/admin/dashboard"
    : isFederationAdmin
    ? "/federation/dashboard"
    : isSocietyAdmin
    ? "/society/dashboard"
    : isContractor
    ? "/contractor/dashboard"
    : "/customer/dashboard";

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:p-4 focus:bg-white focus:text-[#0B3C5D] focus:z-[9999]">
        Skip to main content
      </a>

      {/* Official Government of India & Ministry Strip */}
      <GovHeader />

      {/* Main Government Navigation Bar */}
      <header className="sticky top-0 w-full bg-white border-b-2 border-[#0B3C5D] z-[990] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          
          {/* Logo & National Cooperative Identity */}
          <div className="flex items-center gap-3.5">
            <Link to="/" className="flex items-center gap-3 group">
              <SahKaariLogo className="h-12 w-12 transition-transform duration-200 group-hover:scale-105" />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-[#0B3C5D] font-display leading-none">
                    सह<span className="text-[#E67E22]">कारी</span>
                  </span>
                  <span className="font-bold text-xs text-slate-400">|</span>
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-800 font-display leading-none">
                    Sah<span className="text-[#E67E22]">Kaari</span>
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-[#138808] tracking-wide mt-0.5">
                  {lang === "hi" ? "राष्ट्रीय श्रम सहकारी सेवा मंच (भारत सरकार)" : "National Labour Cooperative Marketplace (Govt. of India)"}
                </span>
              </div>
            </Link>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              to="/"
              className={	ext-xs font-bold px-3.5 py-2 rounded-md transition-all }
            >
              {lang === "hi" ? "मुख्य पृष्ठ" : "Home"}
            </Link>
            <Link
              to="/search"
              className={	ext-xs font-bold px-3.5 py-2 rounded-md transition-all }
            >
              {lang === "hi" ? "कारीगर सेवा बुक करें" : "Find Certified Artisans"}
            </Link>
            
            {/* Conditional Role Based Links */}
            {(isFederationAdmin || isAdmin) && (
              <Link
                to="/federation/dashboard"
                className={	ext-xs font-bold px-3.5 py-2 rounded-md transition-all }
              >
                {lang === "hi" ? "महासंघ पोर्टल" : "Federation Portal"}
              </Link>
            )}
            
            {(isSocietyAdmin || isAdmin) && (
              <Link
                to="/society/dashboard"
                className={	ext-xs font-bold px-3.5 py-2 rounded-md transition-all }
              >
                {lang === "hi" ? "समिति पोर्टल" : "Society Portal"}
              </Link>
            )}
          </nav>

          {/* Right Actions & Portal Login */}
          <div className="flex items-center gap-3">
            {!user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="bg-[#0B3C5D] hover:bg-[#082B42] text-white text-xs font-bold px-4 py-2.5 rounded-md shadow-sm transition-all flex items-center gap-1.5"
                >
                  <FiLock size={13} className="text-amber-300" />
                  <span>{lang === "hi" ? "पोर्टल लॉगिन" : "Official Login"}</span>
                </Link>
                <Link
                  to="/register/contractor"
                  className="hidden sm:inline-flex border border-[#138808] text-[#138808] hover:bg-[#EAF5EA] text-xs font-bold px-3.5 py-2.5 rounded-md transition-all"
                >
                  {lang === "hi" ? "कारीगर पंजीकरण" : "Worker Registration"}
                </Link>
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-[#EDF4F9] border border-[#D6E6F0] text-[#0B3C5D] px-3 py-1.5 rounded-md font-bold text-xs hover:bg-[#D6E6F0] transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-[#0B3C5D] text-white flex items-center justify-center text-[10px] font-bold">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="max-w-[110px] truncate">{user.name}</span>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 bg-[#0B3C5D] text-white rounded font-extrabold">
                    {user.role}
                  </span>
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 mt-2 w-60 rounded-md bg-white border border-[#CBD5E1] shadow-lg py-2 z-[1001]"
                    >
                      <div className="px-4 py-2.5 border-b border-slate-100 mb-1 bg-slate-50">
                        <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email || user.phone}</p>
                        <span className="inline-block mt-1 text-[10px] font-bold text-[#0B3C5D] bg-[#EDF4F9] px-2 py-0.5 rounded">
                          Role: {user.role?.replace("_", " ")?.toUpperCase()}
                        </span>
                      </div>

                      <Link
                        to={dashboardPath}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#EDF4F9] hover:text-[#0B3C5D]"
                      >
                        <FiBriefcase size={14} />
                        <span>My Dashboard</span>
                      </Link>

                      {(isFederationAdmin || isAdmin) && (
                        <Link
                          to="/federation/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#0B3C5D] hover:bg-[#EDF4F9]"
                        >
                          <FiLayers size={14} />
                          <span>Federation Admin Console</span>
                        </Link>
                      )}

                      {(isSocietyAdmin || isAdmin) && (
                        <Link
                          to="/society/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#D35400] hover:bg-[#FEF7EE]"
                        >
                          <FiUsers size={14} />
                          <span>Society Admin Console</span>
                        </Link>
                      )}

                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <FiUser size={14} />
                        <span>Profile Settings</span>
                      </Link>

                      <div className="border-t border-slate-100 my-1" />

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                      >
                        <FiLogOut size={14} />
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
              aria-label="Open mobile menu"
            >
              {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2"
            >
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-bold text-slate-800 py-2"
              >
                {lang === "hi" ? "मुख्य पृष्ठ" : "Home"}
              </Link>
              <Link
                to="/search"
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-bold text-slate-800 py-2"
              >
                {lang === "hi" ? "कारीगर सेवा बुक करें" : "Book Services"}
              </Link>
              {(isFederationAdmin || isAdmin) && (
                <Link
                  to="/federation/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-bold text-[#0B3C5D] py-2"
                >
                  {lang === "hi" ? "महासंघ प्रशासन" : "Federation Admin Portal"}
                </Link>
              )}
              {(isSocietyAdmin || isAdmin) && (
                <Link
                  to="/society/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-bold text-[#D35400] py-2"
                >
                  {lang === "hi" ? "समिति प्रशासन" : "Society Admin Portal"}
                </Link>
              )}
              {!user && (
                <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="w-full text-center bg-[#0B3C5D] text-white py-2.5 rounded-md font-bold text-sm"
                  >
                    Official Portal Login
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
