import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { useLocationContext } from "../../context/LocationContext";
import { CATEGORIES, CATEGORY_GROUPS } from "../../utils/constants";
import {
  FiSearch,
  FiMapPin,
  FiShield,
  FiCheckCircle,
  FiArrowRight
} from "react-icons/fi";
import SEOHead from "../../components/common/SEOHead";

export default function AllCategoriesPage() {
  const { lang } = useLanguage();
  const { location: userLoc, openLocationModal } = useLocationContext();
  const navigate = useNavigate();
  const isHi = lang === "hi";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");

  const filteredCategories = useMemo(() => {
    return CATEGORIES.filter((cat) => {
      if (selectedGroup !== "all" && cat.group !== selectedGroup) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = cat.name.toLowerCase().includes(q);
      const matchHindi = (cat.hindiName || "").toLowerCase().includes(q);
      const matchServices = (cat.services || []).some((s) => s.toLowerCase().includes(q));
      return matchName || matchHindi || matchServices;
    });
  }, [searchQuery, selectedGroup]);

  const handleCategoryClick = (categoryId) => {
    const params = new URLSearchParams({ category: categoryId });
    if (userLoc.lat && userLoc.lng) {
      params.set("lat", userLoc.lat);
      params.set("lng", userLoc.lng);
      params.set("radius_km", userLoc.radius_km || 10);
    }
    navigate(`/search?${params.toString()}`);
  };

  return (
    <main className="bg-slate-50 min-h-screen pb-20 text-slate-900 select-none">
      <SEOHead
        title="सभी सेवाएं व कारीगर — All Services | SahKaar"
        description="Book verified Master Electricians, Plumbers, Carpenters, Painters & Home Services directly from Cooperative Federations."
      />

      {/* ═══════ TOP SEARCH & LOCATION BAR ═══════ */}
      <section className="bg-white border-b border-slate-200/80 sticky top-18 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1 max-w-xl">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isHi ? "सेवा खोजें... (उदा: नल, बिजली, बढ़ई, पेंटर, सफाई)" : "Search service... (e.g. Electrician, Plumber, Painter)"}
              className="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-100 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-indigo-600 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            )}
          </div>

          {/* Active Area Location Button */}
          <button
            type="button"
            onClick={openLocationModal}
            className="flex items-center justify-between sm:justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-xs font-bold text-slate-800 transition-all cursor-pointer shrink-0 group"
          >
            <div className="flex items-center gap-2">
              <FiMapPin className="text-indigo-600 w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="truncate max-w-[160px]">{userLoc.shortName || userLoc.name}</span>
            </div>
            <span className="text-[10px] text-indigo-600 font-extrabold bg-white px-2 py-0.5 rounded-md border border-indigo-100">
              Change ▾
            </span>
          </button>

        </div>

        {/* Category Filter Pills */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {CATEGORY_GROUPS.map((group) => {
            const isSelected = selectedGroup === group.id;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setSelectedGroup(group.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-slate-950 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <span>{group.emoji}</span>
                <span>{group.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ═══════ VISUAL-FIRST SERVICE MARKETPLACE GRID ═══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Header Title */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
              <span>{isHi ? "सभी मास्टर सेवाएं" : "All Services & Masters"}</span>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                100% Verified
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isHi ? "अपनी जरूरत की सेवा चुनें और सीधे नजदीकी मास्टर कारीगर से जुड़ें" : "Tap any service to view verified masters near you"}
            </p>
          </div>
        </div>

        {filteredCategories.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center max-w-sm mx-auto my-8 border border-slate-200 shadow-xs space-y-3">
            <div className="text-4xl">🔍</div>
            <h3 className="text-base font-bold text-slate-900">No Services Found</h3>
            <p className="text-xs text-slate-500">
              Try searching with another word or clear the filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedGroup("all");
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
            >
              Show All
            </button>
          </div>
        ) : (
          /* High-Visual Touch Grid: 2 cols on mobile, 3 on tablet, 4 on desktop */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {filteredCategories.map((cat, idx) => (
              <motion.div
                key={cat.id}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCategoryClick(cat.id)}
                className="group bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 hover:border-indigo-500 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between cursor-pointer"
              >
                {/* Visual Image / Photo */}
                <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  
                  {/* Big Emoji Floating Icon */}
                  <div className="absolute top-2.5 left-2.5 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/95 backdrop-blur-md shadow-md flex items-center justify-center text-xl sm:text-2xl border border-slate-100">
                    {cat.emoji}
                  </div>

                  {/* Price Tag */}
                  <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-slate-950/85 backdrop-blur-md text-white text-[10px] sm:text-xs font-extrabold shadow-sm">
                    {cat.basePrice}
                  </div>
                </div>

                {/* Card Title & Trade Name */}
                <div className="p-3 sm:p-4 space-y-1">
                  <h3 className="text-xs sm:text-sm font-black text-slate-950 group-hover:text-indigo-600 transition-colors leading-tight line-clamp-1">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] sm:text-xs font-bold text-slate-500 line-clamp-1">
                    {cat.hindiName}
                  </p>
                </div>

                {/* Bottom One-Tap Action */}
                <div className="px-3 pb-3 sm:px-4 sm:pb-4 pt-0 flex items-center justify-between text-[11px] font-extrabold text-indigo-600 group-hover:text-indigo-700">
                  <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
                    <FiCheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Verified</span>
                  </span>

                  <span className="flex items-center gap-0.5">
                    <span>Book</span>
                    <FiArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>

              </motion.div>
            ))}
          </div>
        )}

      </section>

      {/* ═══════ TRUST ASSURANCE BANNER (CLEAN & SIMPLE) ═══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl shrink-0">
              🛡️
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">100% Cooperative Verified Masters</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Every worker is document-audited by the State Labour Cooperative Federation. Zero middleman commission.
              </p>
            </div>
          </div>

          <Link
            to="/search"
            className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-indigo-600 text-white text-xs font-extrabold transition-colors shrink-0"
          >
            Explore All Masters
          </Link>
        </div>
      </section>

    </main>
  );
}
