import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiSliders, FiStar, FiCheckCircle, FiX, FiGrid, FiMap, FiNavigation, FiZap, FiClipboard, FiRepeat } from "react-icons/fi";
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
import { toast } from "react-hot-toast";

const RADIUS_OPTIONS = [2, 3, 5, 10, 15, 25];
const PAGE_SIZE = 20;

function useIsMobileSearchLayout() {
  const getIsMobile = () => typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches;
  const [isMobile, setIsMobile] = useState(getIsMobile);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia("(max-width: 1023px)");
    const handleChange = () => setIsMobile(media.matches);
    handleChange();
    media.addEventListener?.("change", handleChange);
    return () => media.removeEventListener?.("change", handleChange);
  }, []);

  return isMobile;
}

export default function SearchPage() {
  const { t } = useLanguage();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { lat, lng, address, accuracy, error: geoError, request: getLocation, loading: geoLoading, clearError: clearGeoError } = useGeolocation();
  
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
  const isMobile = useIsMobileSearchLayout();
  const effectiveViewMode = isMobile && viewMode === "split" ? "list" : viewMode;

  // Search Params
  const mode = searchParams.get("mode") || ""; // 'quick', 'project', or ''
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
  // Redirect to service selection only if mode is missing AND there is no search query or category domain already selected
  useEffect(() => {
    if (!mode && !query && !category) {
      navigate(`/select-service?${searchParams.toString()}`, { replace: true });
    } else if (!mode && (query || category)) {
      // Default to project mode when arriving with a query or category but no mode
      const next = new URLSearchParams(searchParams);
      next.set("mode", "project");
      setSearchParams(next, { replace: true });
    }
  }, [mode, query, category, searchParams, navigate, setSearchParams]);

  // Mode-specific configuration
  const modeConfig = useMemo(() => {
    if (mode === "quick") return {
      label: "Quick Handyman Mode",
      icon: <FiZap size={16} />,
      prosLabel: "Quick Pros",
      bannerBg: "bg-gradient-to-r from-indigo-500/15 to-violet-500/15",
      bannerBorder: "border-indigo-500/30",
      bannerText: "text-indigo-300",
      bannerAccent: "text-indigo-400",
      switchTo: "project",
      switchLabel: "Switch to Project Mode",
    };
    if (mode === "project") return {
      label: "Project Contractor Mode",
      icon: <FiClipboard size={16} />,
      prosLabel: "Project Contractors",
      bannerBg: "bg-gradient-to-r from-cyan-500/15 to-teal-500/15",
      bannerBorder: "border-cyan-500/30",
      bannerText: "text-cyan-300",
      bannerAccent: "text-cyan-400",
      switchTo: "quick",
      switchLabel: "Switch to Quick Mode",
    };
    return null;
  }, [mode]);

  const savedLoc = useMemo(() => readSavedLocation(), []);
  // Priority: URL Params > Last Session Selection > User Profile Default
  const effectiveLat = urlLat || savedLoc?.lat || user?.location_lat || null;
  const effectiveLng = urlLng || savedLoc?.lng || user?.location_lng || null;
  const hasSearchLocation = effectiveLat != null && effectiveLng != null;

  const [qInput, setQInput] = useState(query);
  useEffect(() => setQInput(query), [query]);

  // GPS Manual Detection
  const handleDetectLocation = useCallback(() => {
    toast.loading("Detecting your location...", { id: "geo-toast" });
    getLocation();
    setAutoSaveRequested(true);
  }, [getLocation]);

  useEffect(() => {
    if (geoError) {
      toast.error(geoError, { id: "geo-toast" });
      clearGeoError();
    }
  }, [geoError, clearGeoError]);

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
      if (source === "browser_gps") {
        toast.success(`Location set: ${selection.address || "Current Location"}`, { id: "geo-toast" });
      } else {
        toast.success(`Area changed: ${selection.address}`, { id: "geo-toast" });
      }
    } catch (err) {
      console.error("Location save error", err);
      toast.error("Failed to update search location.", { id: "geo-toast" });
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
        limit: PAGE_SIZE,
        mode: mode || undefined,
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
  }, [query, category, sort, verified, featured, rating, effectiveLat, effectiveLng, hasSearchLocation, page, radiusKm, mode]);

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
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-heading)]">
      <SEOHead title={seoTitle} description="Find the best verified contractors in your area." />
      
      {/* ═══════ SEARCH HEADER — Sticky ═══════ */}
      <header className="fixed top-[76px] left-0 right-0 z-[100] min-h-20 bg-[var(--color-bg)]/90 backdrop-blur-3xl border-b border-[var(--color-border)] flex items-center py-3 md:py-4 px-4 md:px-6">
        <div className="flex-1 flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4 max-w-[1600px] mx-auto w-full">
          
          {/* Row 1 / Left block: Back Button & Service Search Input */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button 
              onClick={() => navigate("/")} 
              className="w-11 h-11 shrink-0 rounded-xl bg-[var(--color-surface)] flex items-center justify-center hover:bg-[var(--color-surface)]/80 transition-colors"
              title="Go Back"
            >
              <FiX size={20} />
            </button>

            {/* Query Search */}
            <div className="flex-1 flex items-center gap-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl h-12 px-4 shadow-inner min-w-0">
              <FiSearch className="text-[var(--color-muted)] shrink-0" size={16} />
              <input 
                type="text" 
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && updateParam("q", qInput)}
                placeholder="What do you need?" 
                className="bg-transparent border-none outline-none text-sm w-full min-w-0 text-[var(--color-heading)] placeholder:text-[var(--color-muted)]"
              />
              {qInput && (
                <button 
                  onClick={() => { setQInput(""); updateParam("q", ""); }}
                  className="text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Row 2 / Right block: Location Autocomplete, GPS Locate, View Toggle & Filters */}
          <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
            
            {/* Location Autocomplete Search */}
            <div className="flex-1 md:flex-initial flex items-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl h-12 px-4 shadow-inner min-w-[200px] md:min-w-[260px] relative">
              <LocationSearchInput 
                value={manualLocationInput} 
                onChange={setManualLocationInput} 
                onSelect={(sel) => persistSearchLocation(sel, "manual")}
                placeholder="Search location or area..."
                className="!bg-transparent !border-none !h-full !text-xs !font-bold text-[var(--color-heading)] placeholder:text-[var(--color-muted)] w-full focus:outline-none !pl-0"
              />
            </div>

            {/* Geolocation Button */}
            <button
              onClick={handleDetectLocation}
              disabled={geoLoading}
              title="Detect my current location"
              className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center border transition-all ${
                geoLoading 
                  ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-400 animate-pulse" 
                  : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-body)] hover:bg-[var(--color-surface)]/80 hover:border-[var(--color-muted)]/30 active:scale-95"
              }`}
            >
              <FiNavigation 
                size={18} 
                className={`${geoLoading ? "animate-spin text-indigo-400" : "hover:text-indigo-400 transition-colors"}`} 
              />
            </button>

            {/* View Toggles */}
            <div className="hidden lg:flex items-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-1 gap-1">
              <button 
                onClick={() => setViewMode("split")}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${viewMode === "split" ? "bg-indigo-500 text-white shadow-lg" : "text-[var(--color-muted)] hover:text-[var(--color-body)]"}`}
              >
                <FiGrid size={14} /> Split
              </button>
              <button 
                onClick={() => setViewMode("map")}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${viewMode === "map" ? "bg-indigo-500 text-white shadow-lg" : "text-[var(--color-muted)] hover:text-[var(--color-body)]"}`}
              >
                <FiMap size={14} /> Map
              </button>
            </div>

            {/* Filters Button */}
            <button onClick={() => setShowFilters(true)} className="h-12 px-4 rounded-2xl bg-indigo-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">
              <FiSliders size={18} />
              <span className="hidden sm:inline text-xs font-bold uppercase tracking-widest">Filters</span>
            </button>
          </div>
          
        </div>
      </header>

      {/* ═══════ MODE INDICATOR BANNER ═══════ */}
      {modeConfig && (
        <div className={`fixed top-[calc(76px+5rem)] md:top-[calc(76px+5rem)] left-0 right-0 z-[99] ${modeConfig.bannerBg} border-b ${modeConfig.bannerBorder} backdrop-blur-xl`}>
          <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className={modeConfig.bannerAccent}>{modeConfig.icon}</span>
              <span className={`text-xs font-black uppercase tracking-widest ${modeConfig.bannerText}`}>{modeConfig.label}</span>
            </div>
            <Link
              to={`/search?mode=${modeConfig.switchTo}${urlLat ? `&lat=${urlLat}` : ""}${urlLng ? `&lng=${urlLng}` : ""}`}
              className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${modeConfig.bannerAccent} hover:underline transition-colors`}
            >
              <FiRepeat size={12} />
              {modeConfig.switchLabel}
            </Link>
          </div>
        </div>
      )}

      {/* ═══════ MAIN CONTENT ═══════ */}
      <main className={`${modeConfig ? "pt-[260px] md:pt-[196px]" : "pt-[220px] md:pt-[156px]"} flex h-[100dvh] overflow-hidden bg-[var(--color-bg)]`}>
        
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
              ...(mode === "quick" ? [{ id: "available", label: "Available Now", active: searchParams.get("available") === "true", icon: <FiZap/> }] : []),
              ...(mode === "project" ? [{ id: "labour_group", label: "Agencies & Teams", active: searchParams.get("labour_group") === "true", icon: <FiClipboard/> }] : []),
            ].map(f => (
              <button 
                key={f.id}
                onClick={() => {
                  if (f.id === "verified") updateParam("verified", !verified);
                  if (f.id === "featured") updateParam("featured", !featured);
                  if (f.id === "near") updateParam("radius_km", radiusKm === 5 ? 25 : 5);
                  if (f.id === "available") updateParam("available", searchParams.get("available") !== "true");
                  if (f.id === "labour_group") updateParam("labour_group", searchParams.get("labour_group") !== "true");
                }}
                className={`flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-full border text-[11px] font-black uppercase tracking-wider transition-all shrink-0 ${f.active ? "bg-indigo-500 border-indigo-500 text-white" : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-muted)]/50"}`}
              >
                {f.icon} {f.label}
              </button>
            ))}
          </div>

          {/* Results Summary */}
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[var(--color-heading)]">
                {loading ? "Finding..." : `${contractors.length} ${modeConfig?.prosLabel || "Pros"} nearby`}
              </h1>
              <p className="text-xs text-[var(--color-muted)] font-medium mt-1">
                {savingLocation ? "Saving search area..." : `Showing best matches in ${searchLocationLabel || "your area"}`}
              </p>
              {error && <p className="text-xs text-rose-400 font-semibold mt-2">{error}</p>}
            </div>
            <div className="flex items-center gap-2">
               <select 
                value={sort} 
                onChange={(e) => updateParam("sort", e.target.value)}
                className="bg-transparent text-[10px] font-black uppercase tracking-widest text-indigo-400 outline-none cursor-pointer"
               >
                 {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-[var(--color-bg)]">{t(o.labelKey)}</option>)}
               </select>
            </div>
          </div>

          {/* Listing Grid */}
          <div className="space-y-4">
            {loading && page === 1 ? (
              [1,2,3,4].map(i => (
                <div key={i} className="h-40 w-full rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse" />
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
                <div className="w-20 h-20 rounded-full bg-[var(--color-surface)] flex items-center justify-center mx-auto mb-6">
                  <FiSearch className="text-[var(--color-muted)]" size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2 text-[var(--color-heading)]">No results found</h3>
                <p className="text-[var(--color-muted)] text-sm max-w-xs mx-auto mb-8">Try expanding your radius or checking a different category.</p>
                <button onClick={() => updateParam("radius_km", 25)} className="min-h-[44px] px-6 py-3 rounded-xl bg-indigo-500 text-white font-bold text-xs uppercase tracking-widest">Expand to 25km</button>
              </div>
            )}

            {contractors.length >= page * PAGE_SIZE && (
              <button onClick={loadMore} className="w-full min-h-[44px] py-4 rounded-2xl border border-dashed border-[var(--color-border)] text-[var(--color-muted)] font-bold text-xs uppercase tracking-widest hover:border-indigo-500/50 hover:text-indigo-400 transition-all mt-6">
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
                  className="pointer-events-auto flex lg:hidden items-center gap-3 min-h-[44px] px-8 py-4 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-heading)] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl backdrop-blur-2xl"
                >
                  <FiGrid className="text-indigo-400" /> Show List
                </button>
             </div>
           </div>
        </section>

        {/* Global Mobile View Toggle — Visible when in List mode on phone */}
        {isMobile && effectiveViewMode === "list" && (
          <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] left-0 right-0 z-[150] pointer-events-none flex justify-center">
            <button 
              onClick={() => setViewMode("map")}
              className="pointer-events-auto flex items-center gap-3 min-h-[44px] px-8 py-4 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-heading)] text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-5"
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
              className="fixed top-0 right-0 bottom-0 z-[10001] w-full max-w-md bg-[var(--color-bg-elevated)] border-l border-[var(--color-border)] shadow-2xl flex flex-col"
            >
              {/* Filter Header — Fixed */}
              <div className="flex items-center justify-between p-8 border-b border-[var(--color-border)]">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-[var(--color-heading)]">Refine Search</h2>
                <button onClick={() => setShowFilters(false)} className="w-11 h-11 rounded-full bg-[var(--color-surface)] flex items-center justify-center hover:bg-[var(--color-surface)]/80 transition-colors">
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
                        className={`min-h-[44px] px-4 py-3 rounded-xl border text-[11px] font-bold transition-all text-left ${!category ? "bg-indigo-500 border-indigo-500 text-white" : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-muted)]"}`}
                      >
                        All Services
                      </button>
                      {CATEGORIES.map(cat => (
                        <button 
                          key={cat.id}
                          onClick={() => updateParam("category", cat.id)}
                          className={`flex items-center gap-2 min-h-[44px] px-4 py-3 rounded-xl border text-[11px] font-bold transition-all text-left ${category === cat.id ? "bg-indigo-500 border-indigo-500 text-white" : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-muted)]/30"}`}
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
                          className={`text-left min-h-[44px] px-4 py-3 rounded-xl text-xs font-bold transition-all ${sort === opt.value ? "bg-indigo-500 text-white shadow-lg" : "bg-[var(--color-surface)] text-[var(--color-muted)] hover:border-[var(--color-muted)]/30 border border-transparent"}`}
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
                          className={`flex-1 min-w-[60px] min-h-[44px] py-3 rounded-xl border text-xs font-bold transition-all ${radiusKm === km ? "bg-indigo-500 border-indigo-500 text-white" : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-muted)]"}`}
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
                          <span className="text-sm font-bold text-[var(--color-body)]">{item.label}</span>
                          <div className={`w-12 h-6 rounded-full p-1 transition-colors ${item.checked ? "bg-indigo-500" : "bg-[var(--color-surface)]"}`}>
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
                          className={`min-h-[44px] py-3 rounded-xl border text-[10px] font-bold transition-all ${Number(searchParams.get("min_experience") || 0) === exp.val ? "bg-indigo-500 border-indigo-500 text-white" : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-muted)]"}`}
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
                           className="w-1/2 min-h-[44px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-xs text-[var(--color-heading)] outline-none focus:border-indigo-500 transition-colors"
                           onChange={(e) => updateParam("min_price", e.target.value)}
                         />
                         <input 
                           type="number" 
                           placeholder="Max ₹"
                           className="w-1/2 min-h-[44px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-xs text-[var(--color-heading)] outline-none focus:border-indigo-500 transition-colors"
                           onChange={(e) => updateParam("max_price", e.target.value)}
                         />
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter Footer — Fixed */}
              <div className="p-8 border-t border-[var(--color-border)] space-y-4 bg-[var(--color-bg-elevated)]">
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
                  className="w-full min-h-[44px] py-4 text-[var(--color-muted)] font-bold text-[10px] uppercase tracking-widest hover:text-[var(--color-heading)] transition-colors"
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
