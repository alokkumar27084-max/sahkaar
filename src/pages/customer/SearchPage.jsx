import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiMapPin, FiSearch, FiSliders, FiStar, FiCheckCircle, FiX, FiGrid, FiMap, FiNavigation } from "react-icons/fi";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { authAPI, contractorAPI } from "../../services/api";
import { CATEGORIES, SORT_OPTIONS } from "../../utils/constants";
import { useGeolocation } from "../../hooks/useGeolocation";
import ContractorCard from "../../components/common/ContractorCard";
import CompareDrawer from "../../components/common/CompareDrawer";
import Icon from "../../components/common/Icon";
import LocationSearchInput from "../../components/common/LocationSearchInput";
import ContractorMapPanel from "../../components/common/ContractorMapPanel";
import { trackEvent } from "../../utils/analytics";
import { readSavedLocation, saveLocationSnapshot } from "../../utils/locationStorage";
import SEOHead from "../../components/common/SEOHead";

const RADIUS_OPTIONS = [2, 3, 5, 10, 15, 25];
const PAGE_SIZE = 20;

export default function SearchPage() {
  const { t } = useLanguage();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { lat, lng, address, accuracy, request: getLocation, loading: geoLoading } = useGeolocation();
  
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [autoSaveRequested, setAutoSaveRequested] = useState(false);
  const [compareList, setCompareList] = useState([]);
  const [manualLocationInput, setManualLocationInput] = useState(() => readSavedLocation()?.address || "");
  const [searchLocationLabel, setSearchLocationLabel] = useState(() => readSavedLocation()?.address || "");
  const [viewMode, setViewMode] = useState("split"); // 'split', 'list', 'map'
  const [hoveredContractorId, setHoveredContractorId] = useState(null);
  
  // Adaptive View Handling for Mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const effectiveViewMode = isMobile && viewMode === "split" ? "list" : viewMode;

  // Search Params
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "distance";
  const verified = searchParams.get("verified") === "true";
  const featured = searchParams.get("featured") === "true";
  const rating = Number(searchParams.get("min_rating") || "0");
  const radiusKm = Number(searchParams.get("radius_km") || "5");
  const urlLat = searchParams.get("lat");
  const urlLng = searchParams.get("lng");
  const page = Number(searchParams.get("page") || "1");

  const savedLoc = useMemo(() => readSavedLocation(), []);
  // Priority: URL Params > Last Session Selection > User Profile Default
  const effectiveLat = urlLat || savedLoc?.lat || user?.location_lat || null;
  const effectiveLng = urlLng || savedLoc?.lng || user?.location_lng || null;
  const hasSearchLocation = effectiveLat != null && effectiveLng != null;

  const [qInput, setQInput] = useState(query);
  useEffect(() => setQInput(query), [query]);

  // Persist Location
  const persistSearchLocation = useCallback(async (selection, source = "browser_gps", nextAccuracy = null) => {
    if (!selection?.lat || !selection?.lng) return;
    setSavingLocation(true);
    try {
      await authAPI.updateLocation({
        lat: Number(selection.lat),
        lng: Number(selection.lng),
        accuracy_m: nextAccuracy !== null ? Number(nextAccuracy) : null,
        source,
      });
      await refreshUser();
      const next = new URLSearchParams(searchParams);
      next.set("lat", String(selection.lat));
      next.set("lng", String(selection.lng));
      next.set("page", "1");
      setSearchParams(next);
      setSearchLocationLabel(selection.address || "");
      setManualLocationInput(selection.address || "");
      saveLocationSnapshot(selection);
    } catch (err) {
      console.error("Location save error", err);
    } finally {
      setSavingLocation(false);
    }
  }, [refreshUser, searchParams, setSearchParams]);

  useEffect(() => {
    if (!autoSaveRequested || lat === null || lng === null) return;
    setAutoSaveRequested(false);
    persistSearchLocation({ lat, lng, address }, "browser_gps", accuracy);
  }, [autoSaveRequested, lat, lng, address, accuracy, persistSearchLocation]);

  useEffect(() => {
    if (!address) return;
    setSearchLocationLabel(address);
    setManualLocationInput(address);
    saveLocationSnapshot({ address, lat, lng });
    
    // Auto-update search params if we just got a browser location and didn't have one
    if (lat && lng && !urlLat && !urlLng) {
      const next = new URLSearchParams(searchParams);
      next.set("lat", String(lat));
      next.set("lng", String(lng));
      setSearchParams(next);
    }
  }, [address, lat, lng, urlLat, urlLng, searchParams, setSearchParams]);

  // Automatic Location Request if missing
  useEffect(() => {
    if (!hasSearchLocation && !geoLoading) {
      getLocation();
    }
  }, [hasSearchLocation, geoLoading, getLocation]);

  // Data Fetching
  const runSearch = useCallback(async () => {
    if (!hasSearchLocation) {
      setContractors([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = {
        q: query || undefined,
        category: category || undefined,
        sort,
        verified: verified || undefined,
        featured: featured || undefined,
        min_rating: rating > 0 ? rating : undefined,
        lat: effectiveLat,
        lng: effectiveLng,
        radius_km: radiusKm,
        page,
        limit: PAGE_SIZE
      };
      const res = await contractorAPI.search(params);
      const rows = res.data.contractors || [];
      setContractors((prev) => (page > 1 ? [...prev, ...rows] : rows));
      trackEvent("search", { q: query, category, result_count: rows.length });
    } catch (err) {
      setError("Failed to load contractors. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [query, category, sort, verified, featured, rating, effectiveLat, effectiveLng, hasSearchLocation, page, radiusKm]);

  useEffect(() => { runSearch(); }, [runSearch]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value !== undefined && value !== null && value !== "" && value !== 0) next.set(key, String(value));
    else next.delete(key);
    next.set("page", "1");
    setSearchParams(next);
  };

  const loadMore = () => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(page + 1));
    setSearchParams(next);
  };

  const handleCompare = (contractor, shouldAdd) => {
    if (shouldAdd) {
      if (compareList.length >= 3) return;
      setCompareList(prev => [...prev, contractor]);
    } else {
      setCompareList(prev => prev.filter(item => item.id !== contractor.id));
    }
  };

  useEffect(() => {
    if (showFilters) {
      document.body.style.overflow = "hidden";
      document.body.classList.add("external-panel-open");
    } else {
      document.body.style.overflow = "";
      document.body.classList.remove("external-panel-open");
    }
    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove("external-panel-open");
    };
  }, [showFilters]);

  const seoTitle = category ? `${CATEGORIES.find(c => c.id === category)?.label || category} Near You` : "Search Top Contractors";

  return (
    <div className="min-h-screen bg-[#090B19] text-white">
      <SEOHead title={seoTitle} description="Find the best verified contractors in your area." />
      
      {/* ═══════ SEARCH HEADER — Sticky ═══════ */}
      <header className="fixed top-[76px] left-0 right-0 z-[100] h-20 bg-[#090B19]/90 backdrop-blur-3xl border-b border-white/[0.05] flex items-center px-4 md:px-6">
        <div className="flex-1 flex items-center gap-6 max-w-[1600px] mx-auto">
          {/* Logo shorthand / Back */}
          <button onClick={() => navigate("/")} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <FiX size={20} />
          </button>

          {/* Search Inputs */}
          <div className="flex-1 flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl h-12 px-4 shadow-inner min-w-0">
            <FiSearch className="text-slate-500 shrink-0" />
            <input 
              type="text" 
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && updateParam("q", qInput)}
              placeholder="What do you need?" 
              className="bg-transparent border-none outline-none text-sm w-full min-w-0"
            />
            <div className="w-px h-6 bg-white/10 mx-2 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2 min-w-[120px] md:min-w-[200px]">
              <FiMapPin className="text-indigo-400 shrink-0" size={14} />
              <LocationSearchInput 
                value={manualLocationInput} 
                onChange={setManualLocationInput} 
                onSelect={(sel) => persistSearchLocation(sel, "manual")}
                placeholder="Change area..."
                className="!bg-transparent !border-none !p-0 !h-auto !text-[11px] !font-bold"
              />
            </div>
          </div>

          {/* View Toggles */}
          <div className="hidden lg:flex items-center bg-white/[0.03] border border-white/[0.08] rounded-xl p-1 gap-1">
            <button 
              onClick={() => setViewMode("split")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${viewMode === "split" ? "bg-indigo-500 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
            >
              <FiGrid size={14} /> Split
            </button>
            <button 
              onClick={() => setViewMode("map")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${viewMode === "map" ? "bg-indigo-500 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
            >
              <FiMap size={14} /> Map
            </button>
          </div>

          <button onClick={() => setShowFilters(true)} className="h-12 w-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 lg:w-auto lg:px-6 lg:gap-2 active:scale-95 transition-all">
            <FiSliders size={18} />
            <span className="hidden lg:inline text-xs font-bold uppercase tracking-widest">Filters</span>
          </button>
        </div>
      </header>

      {/* ═══════ MAIN CONTENT ═══════ */}
      <main className="pt-[156px] flex h-screen overflow-hidden bg-[#090B19]">
        
        {/* LEFT PANEL — LISTING */}
        <section 
          className={`flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 pb-24 lg:pb-12 transition-all duration-500 ${effectiveViewMode === "map" ? "hidden lg:block lg:max-w-md" : ""}`}
          data-lenis-prevent
        >
          
          {/* Quick Filter Strip */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
            {[
              { id: "verified", label: "Verified", active: verified, icon: <FiCheckCircle/> },
              { id: "featured", label: "Top Choice", active: featured, icon: <FiStar/> },
              { id: "near", label: "Nearby", active: radiusKm <= 5, icon: <FiNavigation/> },
            ].map(f => (
              <button 
                key={f.id}
                onClick={() => {
                  if (f.id === "verified") updateParam("verified", !verified);
                  if (f.id === "featured") updateParam("featured", !featured);
                  if (f.id === "near") updateParam("radius_km", radiusKm === 5 ? 25 : 5);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[11px] font-black uppercase tracking-wider transition-all shrink-0 ${f.active ? "bg-indigo-500 border-indigo-500 text-white" : "bg-white/[0.03] border-white/10 text-slate-400 hover:border-white/30"}`}
              >
                {f.icon} {f.label}
              </button>
            ))}
          </div>

          {/* Results Summary */}
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight">{loading ? "Finding..." : `${contractors.length} Pros nearby`}</h1>
              <p className="text-xs text-slate-500 font-medium mt-1">Showing best matches in {searchLocationLabel || "your area"}</p>
            </div>
            <div className="flex items-center gap-2">
               <select 
                value={sort} 
                onChange={(e) => updateParam("sort", e.target.value)}
                className="bg-transparent text-[10px] font-black uppercase tracking-widest text-indigo-400 outline-none cursor-pointer"
               >
                 {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-[#090B19]">{t(o.labelKey)}</option>)}
               </select>
            </div>
          </div>

          {/* Listing Grid */}
          <div className="space-y-4">
            {loading && page === 1 ? (
              [1,2,3,4].map(i => (
                <div key={i} className="h-40 w-full rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse" />
              ))
            ) : contractors.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {contractors.map((c) => (
                  <div key={c.id} onMouseEnter={() => setHoveredContractorId(c.id)} onMouseLeave={() => setHoveredContractorId(null)}>
                    <ContractorCard 
                      contractor={c} 
                      showCompare 
                      isCompared={compareList.some(item => item.id === c.id)} 
                      onCompare={handleCompare} 
                    />
                  </div>
                ))}
              </div>
            ) : !loading && (
              <div className="py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                  <FiSearch className="text-slate-600" size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">No results found</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8">Try expanding your radius or checking a different category.</p>
                <button onClick={() => updateParam("radius_km", 25)} className="px-6 py-3 rounded-xl bg-indigo-500 text-white font-bold text-xs uppercase tracking-widest">Expand to 25km</button>
              </div>
            )}

            {contractors.length >= page * PAGE_SIZE && (
              <button onClick={loadMore} className="w-full py-4 rounded-2xl border border-dashed border-white/10 text-slate-500 font-bold text-xs uppercase tracking-widest hover:border-indigo-500/50 hover:text-indigo-400 transition-all mt-6">
                {loading ? "Loading..." : "Load More Pros"}
              </button>
            )}
          </div>
        </section>

        {/* RIGHT PANEL — MAP */}
        <section className={`transition-all duration-500 relative ${effectiveViewMode === "list" ? "w-0 overflow-hidden" : effectiveViewMode === "map" ? "flex-1" : "flex-1 hidden lg:block"}`}>
           <ContractorMapPanel 
              center={{ lat: Number(effectiveLat), lng: Number(effectiveLng) }} 
              currentLocationLabel={searchLocationLabel} 
              contractors={contractors} 
              highlightedId={hoveredContractorId}
           />
           
           {/* Map Floating UI — Center on mobile */}
           <div className="absolute bottom-10 left-6 right-6 pointer-events-none lg:bottom-6 lg:left-6">
             <div className="flex justify-center lg:justify-start">
                <button 
                  onClick={() => setViewMode(effectiveViewMode === "map" ? "list" : "map")}
                  className="pointer-events-auto flex lg:hidden items-center gap-3 px-8 py-4 rounded-full bg-[#0D1021] border border-white/10 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl backdrop-blur-2xl"
                >
                  <FiGrid className="text-indigo-400" /> Show List
                </button>
             </div>
           </div>
        </section>

        {/* Global Mobile View Toggle — Visible when in List mode on phone */}
        {isMobile && effectiveViewMode === "list" && (
          <div className="fixed bottom-10 left-0 right-0 z-[150] pointer-events-none flex justify-center">
            <button 
              onClick={() => setViewMode("map")}
              className="pointer-events-auto flex items-center gap-3 px-8 py-4 rounded-full bg-[#0D1021] border border-white/10 text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-5"
            >
              <FiMap className="text-indigo-400" /> View Map
            </button>
          </div>
        )}
      </main>

      {/* ═══════ FILTER OVERLAY — SLIDE OUT ═══════ */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
              className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm"
            />
            <motion.aside 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 z-[10001] w-full max-w-md bg-[#0D1021] border-l border-white/10 shadow-2xl flex flex-col"
            >
              {/* Filter Header — Fixed */}
              <div className="flex items-center justify-between p-8 border-b border-white/5">
                <h2 className="text-2xl font-black uppercase tracking-tighter">Refine Search</h2>
                <button onClick={() => setShowFilters(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <FiX size={20} />
                </button>
              </div>

              {/* Filter Content — Scrollable (Hidden Scrollbar) */}
              <div 
                className="flex-1 overflow-y-auto p-8 no-scrollbar scroll-smooth"
                data-lenis-prevent
              >
                <div className="space-y-12 pb-12">
                  {/* Categories */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-6 block">Service Category</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => updateParam("category", "")}
                        className={`px-4 py-3 rounded-xl border text-[11px] font-bold transition-all text-left ${!category ? "bg-indigo-500 border-indigo-500 text-white" : "bg-white/5 border-white/5 text-slate-400"}`}
                      >
                        All Services
                      </button>
                      {CATEGORIES.map(cat => (
                        <button 
                          key={cat.id}
                          onClick={() => updateParam("category", cat.id)}
                          className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-[11px] font-bold transition-all text-left ${category === cat.id ? "bg-indigo-500 border-indigo-500 text-white" : "bg-white/5 border-white/5 text-slate-400 hover:border-white/10"}`}
                        >
                          <Icon name={cat.icon} className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{t(cat.key)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sort Order */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-6 block">Sort By</label>
                    <div className="flex flex-col gap-2">
                      {SORT_OPTIONS.map((opt) => (
                        <button 
                          key={opt.value} 
                          onClick={() => updateParam("sort", opt.value)}
                          className={`text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${sort === opt.value ? "bg-indigo-500 text-white shadow-lg" : "bg-white/5 text-slate-400 hover:border-white/10 border border-transparent"}`}
                        >
                          {t(opt.labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Proximity */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-6 block">Search Radius</label>
                    <div className="flex flex-wrap gap-2">
                      {RADIUS_OPTIONS.map(km => (
                        <button 
                          key={km}
                          onClick={() => updateParam("radius_km", km)}
                          className={`flex-1 min-w-[60px] py-3 rounded-xl border text-xs font-bold transition-all ${radiusKm === km ? "bg-indigo-500 border-indigo-500 text-white" : "bg-white/5 border-white/5 text-slate-400"}`}
                        >
                          {km}km
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Trust & Preferences */}
                  <div className="space-y-6">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 block">Trust & Preferences</label>
                    
                    <div className="space-y-4">
                      {[
                        { key: "verified", checked: verified, label: "Verified Only" },
                        { key: "featured", checked: featured, label: "Top Choices" },
                        { key: "labour_group", checked: searchParams.get("labour_group") === "true", label: "Agencies & Teams" },
                        { key: "available", checked: searchParams.get("available") === "true", label: "Available Now" },
                        { key: "min_rating", checked: rating >= 4, label: "Top Rated (4+ Stars)" }
                      ].map((item) => (
                        <label key={item.key} className="flex items-center justify-between group cursor-pointer">
                          <span className="text-sm font-bold text-slate-300">{item.label}</span>
                          <div className={`w-12 h-6 rounded-full p-1 transition-colors ${item.checked ? "bg-indigo-500" : "bg-white/10"}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${item.checked ? "translate-x-6" : "translate-x-0"}`} />
                          </div>
                          <input 
                            type="checkbox" 
                            checked={item.checked} 
                            onChange={(e) => updateParam(item.key, item.key === "min_rating" ? (e.target.checked ? 4 : 0) : e.target.checked)} 
                            className="hidden" 
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Experience */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-6 block">Minimum Experience</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Any", val: 0 },
                        { label: "3+ yrs", val: 3 },
                        { label: "5+ yrs", val: 5 },
                        { label: "10+ yrs", val: 10 },
                        { label: "15+ yrs", val: 15 },
                        { label: "20+ yrs", val: 20 },
                      ].map(exp => (
                        <button 
                          key={exp.val}
                          onClick={() => updateParam("min_experience", exp.val)}
                          className={`py-3 rounded-xl border text-[10px] font-bold transition-all ${Number(searchParams.get("min_experience") || 0) === exp.val ? "bg-indigo-500 border-indigo-500 text-white" : "bg-white/5 border-white/5 text-slate-400"}`}
                        >
                          {exp.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-6 block">Budget Range (Daily Rate)</label>
                    <div className="space-y-4">
                       <div className="flex gap-2">
                         <input 
                           type="number" 
                           placeholder="Min ₹"
                           className="w-1/2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-indigo-500 transition-colors"
                           onChange={(e) => updateParam("min_price", e.target.value)}
                         />
                         <input 
                           type="number" 
                           placeholder="Max ₹"
                           className="w-1/2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-indigo-500 transition-colors"
                           onChange={(e) => updateParam("max_price", e.target.value)}
                         />
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter Footer — Fixed */}
              <div className="p-8 border-t border-white/5 space-y-4 bg-[#0D1021]">
                <button 
                  onClick={() => setShowFilters(false)}
                  className="w-full py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
                >
                  Apply Filters
                </button>
                
                <button 
                  onClick={() => {
                    setSearchParams(new URLSearchParams({ lat: String(effectiveLat), lng: String(effectiveLng) }));
                    setShowFilters(false);
                  }}
                  className="w-full py-4 text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:text-white transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <CompareDrawer 
        contractors={compareList} 
        onRemove={(id) => setCompareList(prev => prev.filter(item => item.id !== id))} 
        onClear={() => setCompareList([])} 
      />
    </div>
  );
}
