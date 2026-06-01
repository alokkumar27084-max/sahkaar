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
  FiNavigation,
  FiZap,
  FiClipboard,
  FiRepeat,
  FiChevronLeft
} from "react-icons/fi";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { contractorAPI, authAPI } from "../../services/api";
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
  
  const isMobile = useIsMobileSearchLayout();
  const effectiveViewMode = isMobile && viewMode === "split" ? "list" : viewMode;

  const mode = searchParams.get("mode") || ""; 
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

  useEffect(() => {
    if (!mode && !query && !category) {
      navigate(`/select-service?${searchParams.toString()}`, { replace: true });
    } else if (!mode && (query || category)) {
      const next = new URLSearchParams(searchParams);
      next.set("mode", "project");
      setSearchParams(next, { replace: true });
    }
  }, [mode, query, category, searchParams, navigate, setSearchParams]);

  const modeConfig = useMemo(() => {
    if (mode === "quick") return {
      label: "Quick Handyman Mode",
      icon: <FiZap size={15} />,
      prosLabel: "Quick Pros",
      bannerBg: "bg-indigo-50 dark:bg-indigo-950/20",
      bannerBorder: "border-indigo-100 dark:border-indigo-950",
      bannerText: "text-indigo-600 dark:text-indigo-400",
      bannerAccent: "text-indigo-600 dark:text-indigo-400",
      switchTo: "project",
      switchLabel: "Switch to Project Mode",
    };
    if (mode === "project") return {
      label: "Project Contractor Mode",
      icon: <FiClipboard size={15} />,
      prosLabel: "Project Contractors",
      bannerBg: "bg-teal-50 dark:bg-teal-950/20",
      bannerBorder: "border-teal-100 dark:border-teal-950",
      bannerText: "text-teal-600 dark:text-teal-400",
      bannerAccent: "text-teal-600 dark:text-teal-400",
      switchTo: "quick",
      switchLabel: "Switch to Quick Mode",
    };
    return null;
  }, [mode]);

  const savedLoc = useMemo(() => readSavedLocation(), []);
  const effectiveLat = urlLat || savedLoc?.lat || user?.location_lat || null;
  const effectiveLng = urlLng || savedLoc?.lng || user?.location_lng || null;
  const hasSearchLocation = effectiveLat != null && effectiveLng != null;

  const [qInput, setQInput] = useState(query);
  useEffect(() => setQInput(query), [query]);

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
    
    if (lat && lng && !urlLat && !urlLng) {
      const next = new URLSearchParams(searchParams);
      next.set("lat", String(lat));
      next.set("lng", String(lng));
      setSearchParams(next);
    }
  }, [address, lat, lng, urlLat, urlLng, searchParams, setSearchParams]);

  useEffect(() => {
    if (!hasSearchLocation && !geoLoading) {
      getLocation();
    }
  }, [hasSearchLocation, geoLoading, getLocation]);

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
      <header className="fixed top-16 left-0 right-0 z-[100] h-16 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center px-4 md:px-6">
        <div className="flex-1 flex items-center gap-3.5 max-w-[1600px] mx-auto w-full h-full">
          
          {/* Back button */}
          <button 
            onClick={() => navigate("/")} 
            className="w-10 h-10 shrink-0 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-heading)] hover:bg-[var(--color-border)] transition-all"
            title="Go Back"
          >
            <FiChevronLeft size={20} />
          </button>

          {/* Search Query Input */}
          <div className="flex-1 flex items-center gap-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl h-11 px-4 min-w-0">
            <FiSearch className="text-[var(--color-muted)] shrink-0" size={16} />
            <input 
              type="text" 
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && updateParam("q", qInput)}
              placeholder="What services do you need?" 
              className="bg-transparent border-none outline-none text-sm w-full min-w-0 text-[var(--color-heading)] placeholder:text-[var(--color-muted)] focus:ring-0"
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

          {/* Location Autocomplete */}
          <div className="hidden md:flex flex-1 max-w-xs items-center bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl h-11 px-4 relative">
            <LocationSearchInput 
              value={manualLocationInput} 
              onChange={setManualLocationInput} 
              onSelect={(sel) => persistSearchLocation(sel, "manual")}
              placeholder="Delhi NCR, India..."
              className="!bg-transparent !border-none !h-full !text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted)] w-full focus:outline-none focus:ring-0 !pl-0"
            />
          </div>

          {/* GPS Button */}
          <button
            onClick={handleDetectLocation}
            disabled={geoLoading}
            title="Detect location"
            className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center border transition-all ${
              geoLoading 
                ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-850 text-indigo-600 dark:text-indigo-400 animate-pulse" 
                : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-body)] hover:bg-[var(--color-bg-elevated)] active:scale-95"
            }`}
          >
            <FiNavigation 
              size={15} 
              className={`${geoLoading ? "animate-spin text-indigo-400" : "hover:text-indigo-500 transition-colors"}`} 
            />
          </button>

          {/* View Toggles */}
          <div className="hidden lg:flex items-center bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl p-1 gap-1 h-11">
            <button 
              onClick={() => setViewMode("split")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${viewMode === "split" ? "bg-[var(--color-primary)] text-white shadow-sm" : "text-[var(--color-muted)] hover:text-[var(--color-heading)]"}`}
            >
              <FiGrid size={14} /> Split
            </button>
            <button 
              onClick={() => setViewMode("map")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${viewMode === "map" ? "bg-[var(--color-primary)] text-white shadow-sm" : "text-[var(--color-muted)] hover:text-[var(--color-heading)]"}`}
            >
              <FiMap size={14} /> Map
            </button>
          </div>

          {/* Filters Toggle Button */}
          <button onClick={() => setShowFilters(true)} className="h-11 px-4 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all">
            <FiSliders size={15} />
            <span className="text-xs font-bold uppercase tracking-wider">Filters</span>
          </button>
          
        </div>
      </header>

      {/* ═══════ MODE INDICATOR BANNER ═══════ */}
      {modeConfig && (
        <div className={`fixed top-32 left-0 right-0 z-[99] h-9 bg-[var(--color-bg-elevated)] border-b border-[var(--color-border)] flex items-center px-4 md:px-6`}>
          <div className="max-w-[1600px] mx-auto w-full flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className={modeConfig.bannerAccent}>{modeConfig.icon}</span>
              <span className="font-bold text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                {modeConfig.label}
              </span>
            </div>
            <Link
              to={`/search?mode=${modeConfig.switchTo}${urlLat ? `&lat=${urlLat}` : ""}${urlLng ? `&lng=${urlLng}` : ""}`}
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] hover:underline transition-colors"
            >
              <FiRepeat size={11} />
              <span>{modeConfig.switchLabel}</span>
            </Link>
          </div>
        </div>
      )}

      {/* ═══════ MAIN CONTENT ═══════ */}
      <main className={`${modeConfig ? "pt-[164px]" : "pt-[128px]"} flex h-[100dvh] overflow-hidden bg-[var(--color-bg)]`}>
        
        {/* LEFT PANEL — LISTING */}
        <section 
          className={`flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 pb-24 lg:pb-12 transition-all duration-500 ${effectiveViewMode === "map" ? "hidden lg:block lg:max-w-md" : ""}`}
          data-lenis-prevent
        >
          
          {/* Quick Filter Strip */}
          <div className="flex items-center gap-2 my-5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: "verified", label: "Verified", active: verified, icon: <FiCheckCircle size={14}/> },
              { id: "featured", label: "Top Choice", active: featured, icon: <FiStar size={14}/> },
              { id: "near", label: "Nearby", active: radiusKm <= 5, icon: <FiNavigation size={14}/> },
              ...(mode === "quick" ? [{ id: "available", label: "Available Now", active: searchParams.get("available") === "true", icon: <FiZap size={14}/> }] : []),
              ...(mode === "project" ? [{ id: "labour_group", label: "Agencies & Teams", active: searchParams.get("labour_group") === "true", icon: <FiClipboard size={14}/> }] : []),
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
                className={`flex items-center gap-2 h-9 px-3.5 rounded-full border text-xs font-bold transition-all shrink-0 ${f.active ? "bg-[var(--color-primary)] border-transparent text-white" : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-heading)]"}`}
              >
                {f.icon} {f.label}
              </button>
            ))}
          </div>

          {/* Results Summary */}
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[var(--color-heading)]">
                {loading ? "Finding Pros..." : `${contractors.length} ${modeConfig?.prosLabel || "Professionals"} nearby`}
              </h1>
              <p className="text-xs text-[var(--color-muted)] font-medium mt-0.5">
                {savingLocation ? "Saving area..." : `Showing results in ${searchLocationLabel || "your area"}`}
              </p>
              {error && <p className="text-xs text-red-500 font-semibold mt-2">{error}</p>}
            </div>
            <div className="flex items-center gap-2">
               <select 
                value={sort} 
                onChange={(e) => updateParam("sort", e.target.value)}
                className="bg-transparent text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] outline-none cursor-pointer"
               >
                 {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-[var(--color-surface)] text-[var(--color-body)]">{t(o.labelKey)}</option>)}
               </select>
            </div>
          </div>

          {/* Listing Grid */}
          <div className="space-y-4">
            {loading && page === 1 ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="h-44 w-full rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse" />
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
              <div className="py-20 text-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8">
                <div className="w-16 h-16 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center mx-auto mb-5">
                  <FiSearch className="text-[var(--color-muted)]" size={26} />
                </div>
                <h3 className="text-lg font-bold mb-1.5 text-[var(--color-heading)]">No professionals found</h3>
                <p className="text-[var(--color-muted)] text-sm max-w-xs mx-auto mb-6">Try expanding your search area or adjusting your filters.</p>
                <button onClick={() => updateParam("radius_km", 25)} className="h-10 px-6 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm">
                  Expand to 25 km
                </button>
              </div>
            )}

            {contractors.length >= page * PAGE_SIZE && (
              <button onClick={loadMore} className="w-full h-12 rounded-xl border border-dashed border-[var(--color-border)] text-[var(--color-muted)] font-bold text-xs uppercase tracking-wider hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all mt-6">
                {loading ? "Loading more..." : "Load More Professionals"}
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
           
           {/* Map Floating UI for mobile */}
           <div className="absolute bottom-10 left-6 right-6 pointer-events-none lg:bottom-6 lg:left-6">
             <div className="flex justify-center lg:justify-start">
                <button 
                  onClick={() => setViewMode(effectiveViewMode === "map" ? "list" : "map")}
                  className="pointer-events-auto flex lg:hidden items-center gap-2.5 h-11 px-6 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-heading)] text-xs font-bold shadow-xl backdrop-blur-md"
                >
                  <FiGrid className="text-[var(--color-primary)]" /> Show List
                </button>
             </div>
           </div>
        </section>

        {/* Global Mobile View Toggle */}
        {isMobile && effectiveViewMode === "list" && (
          <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] left-0 right-0 z-[150] pointer-events-none flex justify-center">
            <button 
              onClick={() => setViewMode("map")}
              className="pointer-events-auto flex items-center gap-2.5 h-11 px-6 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-heading)] text-xs font-bold shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-5"
            >
              <FiMap className="text-[var(--color-primary)]" /> View Map
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
              className="fixed inset-0 z-[10000] bg-black/40"
            />
            <motion.aside 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 z-[10001] w-full max-w-md bg-[var(--color-surface)] border-l border-[var(--color-border)] shadow-2xl flex flex-col"
            >
              {/* Filter Header */}
              <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
                <h2 className="text-xl font-bold text-[var(--color-heading)]">Filters</h2>
                <button onClick={() => setShowFilters(false)} className="w-9 h-9 rounded-xl bg-[var(--color-bg-elevated)] flex items-center justify-center hover:bg-[var(--color-border)] transition-colors">
                  <FiX size={18} />
                </button>
              </div>

              {/* Filter Content */}
              <div 
                className="flex-1 overflow-y-auto p-6 custom-scrollbar scroll-smooth"
                data-lenis-prevent
              >
                <div className="space-y-8 pb-10">
                  
                  {/* Categories */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3 block">Service Category</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => updateParam("category", "")}
                        className={`h-10 px-3 rounded-xl border text-xs font-semibold transition-all text-left ${!category ? "bg-[var(--color-primary)] border-transparent text-white" : "bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-body)] hover:border-[var(--color-heading)]"}`}
                      >
                        All Services
                      </button>
                      {CATEGORIES.map(cat => (
                        <button 
                          key={cat.id}
                          onClick={() => updateParam("category", cat.id)}
                          className={`flex items-center gap-2 h-10 px-3 rounded-xl border text-xs font-semibold transition-all text-left min-w-0 ${category === cat.id ? "bg-[var(--color-primary)] border-transparent text-white" : "bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-body)] hover:border-[var(--color-heading)]"}`}
                        >
                          <Icon name={cat.icon} className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{t(cat.key)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sort Order */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3 block">Sort By</label>
                    <div className="flex flex-col gap-2">
                      {SORT_OPTIONS.map((opt) => (
                        <button 
                          key={opt.value} 
                          onClick={() => updateParam("sort", opt.value)}
                          className={`text-left h-10 px-4 rounded-xl text-xs font-semibold transition-all ${sort === opt.value ? "bg-[var(--color-primary)] text-white shadow-sm" : "bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-body)] hover:border-[var(--color-heading)]"}`}
                        >
                          {t(opt.labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Radius */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3 block">Search Radius</label>
                    <div className="flex flex-wrap gap-2">
                      {RADIUS_OPTIONS.map(km => (
                        <button 
                          key={km}
                          onClick={() => updateParam("radius_km", km)}
                          className={`flex-1 min-w-[60px] h-10 rounded-xl border text-xs font-semibold transition-all ${radiusKm === km ? "bg-[var(--color-primary)] border-transparent text-white" : "bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-body)] hover:border-[var(--color-heading)]"}`}
                        >
                          {km} km
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Trust & Preferences */}
                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] block">Preferences</label>
                    
                    <div className="space-y-4">
                      {[
                        { key: "verified", checked: verified, label: "Verified Professionals Only" },
                        { key: "featured", checked: featured, label: "Top-Rated Choices" },
                        { key: "labour_group", checked: searchParams.get("labour_group") === "true", label: "Agencies & Teams" },
                        { key: "available", checked: searchParams.get("available") === "true", label: "Available Now" },
                        { key: "min_rating", checked: rating >= 4, label: "High Rated (4+ Stars)" }
                      ].map((item) => (
                        <label key={item.key} className="flex items-center justify-between cursor-pointer py-1">
                          <span className="text-sm font-semibold text-[var(--color-body)]">{item.label}</span>
                          <div className={`w-11 h-6 rounded-full p-1 transition-colors ${item.checked ? "bg-[var(--color-primary)]" : "bg-[var(--color-bg-elevated)] border border-[var(--color-border)]"}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${item.checked ? "translate-x-5" : "translate-x-0"}`} />
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
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3 block">Minimum Experience</label>
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
                          className={`h-10 rounded-xl border text-[11px] font-semibold transition-all ${Number(searchParams.get("min_experience") || 0) === exp.val ? "bg-[var(--color-primary)] border-transparent text-white" : "bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-body)] hover:border-[var(--color-heading)]"}`}
                        >
                          {exp.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3 block">Budget Range (Daily Rate)</label>
                    
                    {/* Visual Price Distribution Histogram */}
                    <div className="flex items-end gap-[3px] h-12 mb-3 px-1">
                      {[10, 16, 28, 42, 58, 70, 85, 92, 75, 52, 38, 26, 18, 10, 6, 3].map((count, i) => {
                        const bucketPrice = (i * 120) + 150; // starts at 150, goes up by 120 each bar
                        const minP = Number(searchParams.get("min_price") || "0");
                        const maxP = Number(searchParams.get("max_price") || "2000");
                        const isActive = bucketPrice >= minP && bucketPrice <= maxP;
                        return (
                          <div 
                            key={i} 
                            onClick={() => updateParam("max_price", bucketPrice)}
                            className="flex-1 group relative cursor-pointer"
                          >
                            <div 
                              className={`w-full rounded-t-sm transition-all duration-300 ${
                                isActive ? "bg-[var(--color-primary)]" : "bg-[var(--color-muted)]/30"
                              }`}
                              style={{ height: `${(count / 92) * 100}%` }}
                            />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[9px] font-bold px-1.5 py-0.5 rounded shadow z-10 whitespace-nowrap text-[var(--color-heading)]">
                              ₹{bucketPrice} ({count} pros)
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex gap-2.5">
                      <input 
                        type="number" 
                        placeholder="Min ₹"
                        value={searchParams.get("min_price") || ""}
                        className="w-1/2 h-11 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-3.5 text-sm text-[var(--color-heading)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                        onChange={(e) => updateParam("min_price", e.target.value)}
                      />
                      <input 
                        type="number" 
                        placeholder="Max ₹"
                        value={searchParams.get("max_price") || ""}
                        className="w-1/2 h-11 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-3.5 text-sm text-[var(--color-heading)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                        onChange={(e) => updateParam("max_price", e.target.value)}
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* Filter Footer */}
              <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)] flex flex-col gap-2.5">
                <button 
                  onClick={() => setShowFilters(false)}
                  className="w-full h-11 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
                >
                  Apply Filters
                </button>
                
                <button 
                  onClick={() => {
                    setSearchParams(new URLSearchParams({ lat: String(effectiveLat), lng: String(effectiveLng), mode }));
                    setShowFilters(false);
                  }}
                  className="w-full h-11 text-[var(--color-muted)] hover:text-[var(--color-heading)] font-bold text-xs uppercase tracking-wider transition-colors"
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
