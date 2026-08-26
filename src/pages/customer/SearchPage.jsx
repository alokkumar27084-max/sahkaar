import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiSliders,
  FiStar,
  FiCheckCircle,
  FiX,
  FiGrid,
  FiMap,
  FiMapPin,
  FiNavigation,
  FiZap,
  FiShield,
  FiAward,
  FiFilter,
  FiRefreshCw
} from "react-icons/fi";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useLocationContext } from "../../context/LocationContext";
import { CATEGORIES, SORT_OPTIONS } from "../../utils/constants";
import { contractorAPI } from "../../services/api";
import ContractorCard from "../../components/common/ContractorCard";
import CompareDrawer from "../../components/common/CompareDrawer";
import ContractorMapPanel from "../../components/common/ContractorMapPanel";
import SEOHead from "../../components/common/SEOHead";
import toast from "react-hot-toast";

const RADIUS_OPTIONS = [3, 5, 10, 15, 25, 50];

export default function SearchPage() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const {
    location: userLoc,
    openLocationModal,
    detectGPSLocation,
    detectingGPS,
  } = useLocationContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isHi = lang === "hi";

  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [compareList, setCompareList] = useState([]);
  const [viewMode, setViewMode] = useState("split"); // 'split', 'list', 'map'

  // URL search query state
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "recommended";
  const verifiedOnly = searchParams.get("verified") === "true";
  const radiusKm = Number(searchParams.get("radius_km") || userLoc.radius_km || "15");
  const currentLat = Number(searchParams.get("lat") || userLoc.lat || 23.2599);
  const currentLng = Number(searchParams.get("lng") || userLoc.lng || 77.4126);

  const [searchInput, setSearchInput] = useState(query);

  const fetchMasters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        q: query || undefined,
        category: category && category !== "all" ? category : undefined,
        verified: verifiedOnly ? true : undefined,
        lat: currentLat || undefined,
        lng: currentLng || undefined,
        radius_km: radiusKm,
        sort: sort === "recommended" ? "rating" : sort,
      };

      const res = await contractorAPI.search(params);
      if (res.data?.ok) {
        setContractors(res.data.contractors || []);
      } else {
        setContractors([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Could not load Masters. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [query, category, sort, verifiedOnly, radiusKm, currentLat, currentLng]);

  useEffect(() => {
    fetchMasters();
  }, [fetchMasters]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value === undefined || value === null || value === "" || value === false) {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
    setSearchParams(next);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParam("q", searchInput.trim());
  };

  const handleUseMyLocation = () => {
    detectGPSLocation();
  };

  const handleCompareToggle = (contractor) => {
    setCompareList((prev) => {
      const exists = prev.some((c) => c.id === contractor.id);
      if (exists) return prev.filter((c) => c.id !== contractor.id);
      if (prev.length >= 3) {
        toast.error("You can compare up to 3 Masters at a time");
        return prev;
      }
      return [...prev, contractor];
    });
  };

  return (
    <main className="bg-slate-50 min-h-screen pb-16">
      <SEOHead
        title="खोजें और बुक करें — Verified Cooperative Masters | SahKaar"
        description="Search nearest verified Master Electricians, Plumbers, Carpenters and Painters. Filter by rating, distance, and official Cooperative verification."
      />

      {/* ═══════ TOP SEARCH & FILTER BAR ═══════ */}
      <section className="sticky top-18 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-3">
          
          {/* Main Search Row */}
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={isHi ? "मास्टर का नाम, सेवा (जैसे प्लंबर, इलेक्ट्रीशियन) खोजें..." : "Search by trade, service name or master..."}
                className="w-full h-11 pl-10 pr-24 rounded-xl bg-slate-100 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-3.5 rounded-lg bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-sm"
              >
                {isHi ? "खोजें" : "Search"}
              </button>
            </form>

            {/* GPS Location Button */}
            <button
              type="button"
              onClick={handleUseMyLocation}
              className="h-11 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              title="Use Current GPS Location"
            >
              <FiNavigation className={`w-3.5 h-3.5 text-indigo-600 ${detectingGPS ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{detectingGPS ? "Locating..." : isHi ? "मेरा स्थान" : "Near Me"}</span>
            </button>

            {/* Filters Toggle Button */}
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className={`h-11 px-3.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 ${
                showFilters || verifiedOnly || category
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <FiFilter className="w-3.5 h-3.5" />
              <span>{isHi ? "फिल्टर" : "Filters"}</span>
            </button>
          </div>

          {/* Category Chips Scroll Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => updateParam("category", "")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                !category
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {isHi ? "सभी मास्टर" : "All Trades"}
            </button>

            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => updateParam("category", cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  category === cat.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span>{cat.emoji || "🔧"}</span>
                <span>Master {isHi ? cat.hindiName.split("/")[0] : cat.name.split("/")[0]}</span>
              </button>
            ))}
          </div>

          {/* Collapsible Filter Bar */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700"
              >
                {/* Sort Option */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-bold">{isHi ? "क्रमबद्ध करें:" : "Sort By:"}</span>
                  <select
                    value={sort}
                    onChange={(e) => updateParam("sort", e.target.value)}
                    className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Radius Slider */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-bold">{isHi ? "दूरी दायरा:" : "Radius:"}</span>
                  <div className="flex items-center gap-1">
                    {RADIUS_OPTIONS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => updateParam("radius_km", r)}
                        className={`px-2 py-1 rounded-md text-[11px] font-bold ${
                          radiusKm === r
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {r} km
                      </button>
                    ))}
                  </div>
                </div>

                {/* Verified Only Toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => updateParam("verified", e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-800">
                    <FiShield className="w-3.5 h-3.5 text-emerald-600" />
                    {isHi ? "केवल सत्यापित मास्टर" : "Verified Masters Only"}
                  </span>
                </label>

                {/* Clear Filters */}
                {(query || category || verifiedOnly || sort !== "recommended") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setSearchParams(new URLSearchParams());
                    }}
                    className="text-xs text-rose-600 font-bold hover:underline ml-auto"
                  >
                    {isHi ? "सभी फ़िल्टर हटाएं" : "Reset Filters"}
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ═══════ RESULTS & LISTINGS ═══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        
        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
                {category ? `Master ${category.replace(/_/g, " ")} Artisans` : isHi ? "सभी सत्यापित मास्टर" : "Verified Cooperative Masters"}
              </h1>
              <button
                type="button"
                onClick={openLocationModal}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-extrabold transition-all cursor-pointer shadow-2xs group"
                title="Change search location or use GPS"
              >
                <FiMapPin className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
                <span>{userLoc.name}</span>
                <span className="text-[10px] text-indigo-500 font-bold">({radiusKm} km) ▾</span>
              </button>
            </div>
            <p className="text-xs text-slate-500">
              {contractors.length} {contractors.length === 1 ? "Master" : "Masters"} found with real-time cooperative distance ranking
            </p>
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm text-xs font-bold text-slate-700 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === "list" ? "bg-slate-900 text-white" : "hover:bg-slate-100"
              }`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`px-3 py-1 rounded-lg transition-colors hidden lg:inline-block ${
                viewMode === "split" ? "bg-slate-900 text-white" : "hover:bg-slate-100"
              }`}
            >
              Split Map
            </button>
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={`px-3 py-1 rounded-lg transition-colors ${
                viewMode === "map" ? "bg-slate-900 text-white" : "hover:bg-slate-100"
              }`}
            >
              Map
            </button>
          </div>
        </div>

        {/* Content Layout */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-white border border-slate-200 p-6 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3 max-w-md mx-auto my-12">
            <p className="text-sm font-bold text-rose-600">{error}</p>
            <button
              type="button"
              onClick={fetchMasters}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
            >
              Try Again
            </button>
          </div>
        ) : contractors.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3 max-w-md mx-auto my-12 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl mx-auto">
              🔍
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Masters Found Nearby</h3>
            <p className="text-xs text-slate-500">
              Try increasing your radius slider or clearing the category filter to see available cooperative artisans in other areas.
            </p>
            <button
              type="button"
              onClick={() => updateParam("radius_km", 25)}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-sm hover:bg-indigo-700 transition-colors"
            >
              Expand Radius to 25 km
            </button>
          </div>
        ) : viewMode === "map" ? (
          <div className="h-[70vh] rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
            <ContractorMapPanel
              center={{ lat: currentLat, lng: currentLng }}
              currentLocationLabel={userLoc.name}
              contractors={contractors}
              selectedId={null}
              onSelectContractor={(c) => navigate(`/contractor/${c.id}`)}
            />
          </div>
        ) : viewMode === "split" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              {contractors.map((worker) => (
                <ContractorCard
                  key={worker.id}
                  contractor={worker}
                  showCompare={true}
                  isCompared={compareList.some((c) => c.id === worker.id)}
                  onCompare={handleCompareToggle}
                />
              ))}
            </div>

            <div className="lg:col-span-5 hidden lg:block sticky top-36 h-[calc(100vh-10rem)] rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
              <ContractorMapPanel
                center={{ lat: currentLat, lng: currentLng }}
                currentLocationLabel={userLoc.name}
                contractors={contractors}
                selectedId={null}
                onSelectContractor={(c) => navigate(`/contractor/${c.id}`)}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contractors.map((worker) => (
              <ContractorCard
                key={worker.id}
                contractor={worker}
                showCompare={true}
                isCompared={compareList.some((c) => c.id === worker.id)}
                onCompare={handleCompareToggle}
              />
            ))}
          </div>
        )}
      </section>

      {/* Compare Drawer */}
      {compareList.length > 0 && (
        <CompareDrawer
          contractors={compareList}
          onRemove={(id) => setCompareList((prev) => prev.filter((c) => c.id !== id))}
          onClear={() => setCompareList([])}
        />
      )}
    </main>
  );
}
