import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useLocationContext } from "../../context/LocationContext";
import { SahKaarLogo } from "./SahKaariLogo";
import {
  FiMenu,
  FiX,
  FiUser,
  FiBriefcase,
  FiLogOut,
  FiSearch,
  FiMapPin,
  FiShield,
  FiGrid,
  FiAward,
  FiGlobe,
  FiChevronDown,
  FiPhone,
  FiArrowRight,
  FiCheckCircle
} from "react-icons/fi";
import toast from "react-hot-toast";

export default function Navbar() {
  const { lang, setLang } = useLanguage();
  const { user, logout, isContractor, isAdmin, isSocietyAdmin, isFederationAdmin } = useAuth();
  const { location: userLoc, openLocationModal } = useLocationContext();
  const navigate = useNavigate();
  const location = useLocation();
  const isHi = lang === "hi";

  const [sideDrawerOpen, setSideDrawerOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close desktop dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (sideDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [sideDrawerOpen]);

  async function handleLogout() {
    await logout();
    setSideDrawerOpen(false);
    toast.success(isHi ? "सफलतापूर्वक लॉगआउट किया गया" : "Logged out successfully");
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
      <header className="sticky top-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 z-[990] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
          
          {/* ═══════ LEFT: BRAND & LOCATION PILL ═══════ */}
          <div className="flex items-center gap-6 shrink-0">
            <Link to="/" className="flex items-center gap-3 group select-none shrink-0">
              <SahKaarLogo className="w-11 h-11" showText={true} textClassName="text-2xl" animated={true} />
            </Link>

            {/* Desktop Location Pill (Opens Interactive Selector Modal) */}
            <button
              type="button"
              onClick={openLocationModal}
              className="hidden xl:flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-indigo-300 transition-all cursor-pointer whitespace-nowrap group"
              title="Click to change location or use GPS"
            >
              <FiMapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="truncate max-w-[140px]">{userLoc.shortName || userLoc.name}</span>
              <FiChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-700" />
            </button>
          </div>

          {/* ═══════ CENTER: DESKTOP NAVIGATION LINKS (Hidden on Mobile & Tablet) ═══════ */}
          <nav className="hidden lg:flex items-center gap-1.5 shrink-0">
            <Link
              to="/search"
              className={`text-xs font-extrabold px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                location.pathname === "/search"
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {isHi ? "मास्टर खोजें" : "Find a Master"}
            </Link>

            <Link
              to="/categories"
              className={`text-xs font-extrabold px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                location.pathname === "/categories"
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {isHi ? "सभी सेवाएं" : "All Services"}
            </Link>

            <Link
              to="/terms"
              className="text-xs font-extrabold px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all whitespace-nowrap"
            >
              {isHi ? "सुरक्षा व गारंटी" : "Guarantee & Safety"}
            </Link>
          </nav>

          {/* ═══════ RIGHT: ACTIONS & USER PROFILE (Desktop) ═══════ */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            
            {/* Language Switcher */}
            <button
              type="button"
              onClick={() => setLang(isHi ? "en" : "hi")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              <FiGlobe className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isHi ? "English" : "हिंदी"}</span>
            </button>

            {/* Register as Master CTA */}
            {!isContractor && !isAdmin && !isFederationAdmin && (
              <Link
                to="/register/contractor"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-extrabold border border-indigo-200/80 transition-all active:scale-95 whitespace-nowrap"
              >
                <FiAward className="w-4 h-4 text-indigo-600" />
                <span>{isHi ? "मास्टर बनें" : "Register as Master"}</span>
              </Link>
            )}

            {/* Auth Dropdown */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1.5 pr-3.5 rounded-full border border-slate-200 hover:border-slate-300 bg-white shadow-xs transition-all text-xs font-bold text-slate-800 whitespace-nowrap"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center font-black text-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="truncate max-w-[100px]">
                    {user.name?.split(" ")[0]}
                  </span>
                  <FiChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 text-slate-800"
                    >
                      <div className="px-3 py-2.5 border-b border-slate-100">
                        <p className="text-xs font-extrabold text-slate-900 truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-500 capitalize">{user.role || "Customer"}</p>
                      </div>

                      <div className="py-1 space-y-0.5">
                        <Link
                          to={dashboardPath}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                        >
                          <FiBriefcase className="w-4 h-4 text-slate-400" />
                          <span>{isContractor ? "Master Dashboard" : "My Bookings & Dashboard"}</span>
                        </Link>

                        <Link
                          to="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                        >
                          <FiUser className="w-4 h-4 text-slate-400" />
                          <span>My Account Profile</span>
                        </Link>
                      </div>

                      <div className="pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                        >
                          <FiLogOut className="w-4 h-4 text-rose-500" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2.5 rounded-xl text-xs font-extrabold text-slate-700 hover:bg-slate-100 transition-all whitespace-nowrap"
                >
                  {isHi ? "लॉग इन" : "Log In"}
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-indigo-600 text-white text-xs font-extrabold shadow-sm transition-all active:scale-95 whitespace-nowrap"
                >
                  {isHi ? "साइन अप" : "Sign Up"}
                </Link>
              </div>
            )}
          </div>

          {/* ═══════ MOBILE & TABLET HAMBURGER BUTTON ═══════ */}
          <div className="flex lg:hidden items-center gap-3">
            <button
              type="button"
              onClick={() => setSideDrawerOpen(true)}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center justify-center"
              aria-label="Open Navigation Menu"
            >
              <FiMenu className="w-6 h-6" />
            </button>
          </div>

        </div>
      </header>

      {/* ═══════ SLIDE-OUT SIDE NAVBAR DRAWER (Mobile & Tablet) ═══════ */}
      <AnimatePresence>
        {sideDrawerOpen && (
          <div className="fixed inset-0 z-[1000] lg:hidden">
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSideDrawerOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            {/* Slide-out Panel from Right */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl flex flex-col justify-between overflow-y-auto"
            >
              {/* Top Drawer Header */}
              <div className="p-6 space-y-6">
                
                {/* Logo & Close Button */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <SahKaarLogo className="w-9 h-9" showText={true} textClassName="text-xl" animated={true} />

                  <button
                    type="button"
                    onClick={() => setSideDrawerOpen(false)}
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                {/* User Card or Login / Register */}
                {user ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-950 text-white flex items-center justify-center font-black text-sm">
                        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-sm font-extrabold text-slate-900 truncate">{user.name}</h4>
                        <p className="text-[11px] text-slate-500 capitalize">{user.role || "Customer"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                      <Link
                        to={dashboardPath}
                        onClick={() => setSideDrawerOpen(false)}
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-center text-xs font-bold text-slate-800 shadow-xs"
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setSideDrawerOpen(false)}
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-center text-xs font-bold text-slate-800 shadow-xs"
                      >
                        Profile
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-3">
                    <div className="space-y-1">
                      <h4 className="text-xs font-extrabold text-indigo-950">Welcome to SahKaar</h4>
                      <p className="text-[11px] text-indigo-700">Book verified Master artisans directly from cooperatives.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to="/login"
                        onClick={() => setSideDrawerOpen(false)}
                        className="py-2.5 rounded-xl bg-white border border-indigo-200 text-center text-xs font-extrabold text-indigo-900 shadow-xs"
                      >
                        Log In
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setSideDrawerOpen(false)}
                        className="py-2.5 rounded-xl bg-slate-950 text-center text-xs font-extrabold text-white shadow-xs"
                      >
                        Sign Up
                      </Link>
                    </div>
                  </div>
                )}

                {/* Location Selector Button (Mobile) */}
                <button
                  type="button"
                  onClick={() => {
                    setSideDrawerOpen(false);
                    openLocationModal();
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200 text-xs font-bold text-slate-900 text-left hover:bg-indigo-100 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <FiMapPin className="text-indigo-600 w-4 h-4 shrink-0" />
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-indigo-700 font-extrabold">Selected Location</div>
                      <div className="text-xs font-extrabold text-slate-950 truncate max-w-[170px]">{userLoc.name}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-indigo-700 bg-white border border-indigo-200 font-extrabold px-2 py-1 rounded-lg shadow-2xs">
                    Change ▾
                  </span>
                </button>

                {/* Navigation Links List */}
                <div className="space-y-1">
                  <Link
                    to="/search"
                    onClick={() => setSideDrawerOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FiSearch className="text-indigo-600 w-4 h-4" />
                      <span>{isHi ? "मास्टर कारीगर खोजें" : "Find a Master"}</span>
                    </div>
                    <FiArrowRight className="text-slate-400 w-3.5 h-3.5" />
                  </Link>

                  <Link
                    to="/categories"
                    onClick={() => setSideDrawerOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FiGrid className="text-indigo-600 w-4 h-4" />
                      <span>{isHi ? "सभी गृह सेवाएं" : "All Home Services"}</span>
                    </div>
                    <FiArrowRight className="text-slate-400 w-3.5 h-3.5" />
                  </Link>

                  <Link
                    to="/terms"
                    onClick={() => setSideDrawerOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FiShield className="text-indigo-600 w-4 h-4" />
                      <span>{isHi ? "सहकारी सुरक्षा व वारंटी" : "Welfare & Guarantee"}</span>
                    </div>
                    <FiArrowRight className="text-slate-400 w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Register as Master Banner Card */}
                {!isContractor && !isAdmin && !isFederationAdmin && (
                  <Link
                    to="/register/contractor"
                    onClick={() => setSideDrawerOpen(false)}
                    className="block p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-md space-y-2 group"
                  >
                    <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
                      <FiAward className="w-4 h-4" />
                      <span>For Artisans & Pros</span>
                    </div>
                    <h4 className="text-sm font-extrabold leading-snug">
                      Join as a Verified SahKaar Master
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Zero platform commissions, direct bookings, and ₹5 Lakh government welfare cover.
                    </p>
                  </Link>
                )}

              </div>

              {/* Bottom Drawer Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
                {/* Language Switch Button */}
                <button
                  type="button"
                  onClick={() => setLang(isHi ? "en" : "hi")}
                  className="w-full py-2.5 px-4 rounded-xl bg-white border border-slate-200 text-xs font-extrabold text-slate-800 shadow-xs flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <FiGlobe className="w-4 h-4 text-indigo-600" />
                    <span>Interface Language</span>
                  </span>
                  <span className="text-indigo-600 font-bold">{isHi ? "Switch to English" : "हिंदी में बदलें"}</span>
                </button>

                {/* Logout if logged in */}
                {user && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-extrabold text-rose-700 flex items-center justify-center gap-2"
                  >
                    <FiLogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                )}

                <div className="text-[10px] text-slate-400 text-center">
                  SahKaar (सहकार) • Cooperative Services Marketplace
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
