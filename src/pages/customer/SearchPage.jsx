import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiMapPin, FiSearch, FiSliders } from "react-icons/fi";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { authAPI, contractorAPI } from "../../services/api";
import { CATEGORIES, SORT_OPTIONS } from "../../utils/constants";
import { useGeolocation } from "../../hooks/useGeolocation";
import ContractorCard from "../../components/common/ContractorCard";
import CompareDrawer from "../../components/common/CompareDrawer";
import EmptyState from "../../components/common/EmptyState";
import Icon from "../../components/common/Icon";
import LocationSearchInput from "../../components/common/LocationSearchInput";
import ContractorMapPanel from "../../components/common/ContractorMapPanel";
import { trackEvent } from "../../utils/analytics";
import { readSavedLocation, saveLocationSnapshot } from "../../utils/locationStorage";

const RADIUS_OPTIONS = [2, 3, 5];
const PAGE_SIZE = 20;
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const cardVariant = {
  hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 120, damping: 18 } }
};

export default function SearchPage() {
  const { t, lang } = useLanguage();
  const { user, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { lat, lng, address, accuracy, request: getLocation, error: geoError, loading: geoLoading } = useGeolocation();
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [autoSaveRequested, setAutoSaveRequested] = useState(false);
  const [compareList, setCompareList] = useState([]);
  const [manualLocationInput, setManualLocationInput] = useState(() => readSavedLocation()?.address || "");
  const [searchLocationLabel, setSearchLocationLabel] = useState(() => readSavedLocation()?.address || "");

  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "distance";
  const verified = searchParams.get("verified") === "true";
  const featured = searchParams.get("featured") === "true";
  const labour = searchParams.get("labour_group") === "true";
  const radiusKm = Number(searchParams.get("radius_km") || "5");
  const urlLat = searchParams.get("lat");
  const urlLng = searchParams.get("lng");
  const page = Number(searchParams.get("page") || "1");
  const effectiveLat = urlLat || user?.location_lat || null;
  const effectiveLng = urlLng || user?.location_lng || null;
  const hasSearchLocation = effectiveLat != null && effectiveLng != null;

  const persistSearchLocation = useCallback(async (selection, source = "browser_gps", nextAccuracy = null) => {
    if (!selection?.lat || !selection?.lng) return;
    setSavingLocation(true);
    setError(null);
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
    } catch {
      setError("Could not save your location.");
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
  }, [address, lat, lng]);

  const runSearch = useCallback(async () => {
    if (!hasSearchLocation) {
      setContractors([]);
      setError("Please share your location to see nearby contractors.");
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
        labour_group: labour || undefined,
        lat: effectiveLat,
        lng: effectiveLng,
        radius_km: radiusKm,
        page,
        limit: PAGE_SIZE
      };
      Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);
      const res = await contractorAPI.search(params);
      const rows = res.data.contractors || [];
      setContractors((prev) => (page > 1 ? [...prev, ...rows] : rows));
      trackEvent("search", { q: query || "", category: category || "", result_count: rows.length, page, radius_km: radiusKm });
    } catch {
      setError(t("app.error"));
    } finally {
      setLoading(false);
    }
  }, [query, category, sort, verified, featured, labour, effectiveLat, effectiveLng, hasSearchLocation, page, radiusKm, t]);

  useEffect(() => { runSearch(); }, [runSearch]);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value !== undefined && value !== null && value !== "") next.set(key, String(value));
    else next.delete(key);
    next.set("page", "1");
    setSearchParams(next);
  }

  function loadMore() {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(page + 1));
    setSearchParams(next);
  }

  function handleCompare(contractor, shouldAdd) {
    if (shouldAdd) {
      if (compareList.some((item) => item.id === contractor.id)) return;
      if (compareList.length >= 3) {
        setError(lang === "hi" ? "एक समय में अधिकतम 3 प्रोफाइल तुलना कर सकते हैं।" : "You can compare up to 3 profiles at a time.");
        return;
      }
      setCompareList((prev) => [...prev, contractor]);
      return;
    }
    setCompareList((prev) => prev.filter((item) => item.id !== contractor.id));
  }

  async function handleManualLocationSelect(selection) {
    await persistSearchLocation(selection, "manual_pin");
  }

  return (
    <main id="main-content" className="max-w-[1400px] mx-auto px-4 md:px-8 pb-20 pt-24 min-h-screen bg-[var(--color-bg)]">
      
      {!hasSearchLocation && (
        <motion.section initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-3xl border border-amber-200 dark:border-amber-500/30 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 p-8 shadow-inner shadow-amber-500/5">
          <h2 className="font-display text-2xl font-bold text-amber-900 dark:text-amber-500 mb-2 flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0"><FiMapPin /></div> Location Required
          </h2>
          <p className="text-base text-amber-800 dark:text-amber-300/80 mb-6 font-medium max-w-2xl">Share your current location or manually search your locality to see verified contractors within a 2-5 km radius.</p>
          <div className="mb-5 max-w-2xl">
            <LocationSearchInput value={manualLocationInput} onChange={setManualLocationInput} onSelect={handleManualLocationSelect} placeholder="Search area, colony, or landmark" disabled={savingLocation} />
          </div>
          <button onClick={() => { setAutoSaveRequested(true); getLocation({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }); }} disabled={geoLoading || savingLocation} className="px-6 py-3 bg-amber-500 hover:bg-amber-600 font-bold text-white rounded-xl shadow-md transition-colors flex items-center gap-2">
            {geoLoading || savingLocation ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiMapPin/>}
            {geoLoading || savingLocation ? "Detecting location..." : "Use my current location"}
          </button>
          {geoError && <p className="text-xs text-rose-500 font-bold mt-3">{geoError}</p>}
        </motion.section>
      )}

      {/* Premium Filter Bank */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 md:p-8 mb-8 z-20 relative shadow-xl shadow-black/5">
        <div className="grid lg:grid-cols-[1fr_auto_minmax(300px,350px)] gap-4 items-center">
          
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)] w-5 h-5" />
            <input type="search" defaultValue={query} placeholder={t("home.search_placeholder")} className="input-field !pl-12 !py-3.5 !text-base shadow-inner bg-[var(--color-bg)] w-full" onKeyDown={(e) => { if (e.key === "Enter") updateParam("q", e.target.value); }} />
          </div>
          
          <button onClick={() => setShowFilters((s) => !s)} className={`px-6 py-3.5 rounded-xl font-bold border transition-all flex items-center justify-center gap-2 ${showFilters ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-glow" : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-heading)] hover:border-[var(--color-primary)]"}`}>
              <FiSliders size={18} /> {t("search.filter")}
          </button>
          
          <div className="w-full relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center z-10 text-[var(--color-primary)]"><FiMapPin size={14}/></div>
              <LocationSearchInput value={manualLocationInput} onChange={setManualLocationInput} onSelect={handleManualLocationSelect} placeholder="Change location..." disabled={savingLocation} className="!pl-14" />
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
              <div className="mt-6 pt-6 border-t border-[var(--color-border)] grid md:grid-cols-3 gap-8">
                
                <div className="space-y-4">
                  <label className="text-[10px] font-black tracking-widest text-[var(--color-primary)] uppercase bg-[var(--color-primary)]/10 px-2 py-1 rounded inline-block">{t("search.sort")}</label>
                  <div className="flex flex-col gap-2">
                    {SORT_OPTIONS.map((opt) => (
                      <button key={opt.value} onClick={() => updateParam("sort", opt.value)} className={`text-left px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${sort === opt.value ? "bg-[var(--color-primary)] text-white shadow-md" : "hover:bg-[var(--color-bg)] border border-transparent hover:border-[var(--color-border)] text-[var(--color-muted)]"}`}>{t(opt.labelKey)}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black tracking-widest text-[var(--color-primary)] uppercase bg-[var(--color-primary)]/10 px-2 py-1 rounded inline-block">Proximity Radius</label>
                  <div className="flex gap-2">
                    {RADIUS_OPTIONS.map((km) => (
                      <button key={km} onClick={() => updateParam("radius_km", km)} className={`px-5 py-2.5 rounded-lg text-sm font-bold border transition-colors ${radiusKm === km ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-md" : "bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-primary)]"}`}>{km} km</button>
                    ))}
                  </div>
                  
                  <div className="pt-4">
                      <label className="text-[10px] font-black tracking-widest text-[var(--color-primary)] uppercase bg-[var(--color-primary)]/10 px-2 py-1 rounded inline-block mb-3">Attributes</label>
                      <div className="flex flex-col gap-3 text-sm font-bold text-[var(--color-heading)]">
                      {[
                          { key: "verified", checked: verified, label: "Verified Only" },
                          { key: "featured", checked: featured, label: "Featured Contractors" },
                          { key: "labour_group", checked: labour, label: "Agencies / Groups" }
                      ].map((item) => (
                          <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${item.checked ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white" : "border-[var(--color-muted)] text-transparent group-hover:border-[var(--color-primary)]"}`}>
                              ✓
                          </div>
                          <input type="checkbox" checked={item.checked} onChange={(e) => updateParam(item.key, e.target.checked || "")} className="hidden" />
                          {item.label}
                          </label>
                      ))}
                      </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black tracking-widest text-[var(--color-primary)] uppercase bg-[var(--color-primary)]/10 px-2 py-1 rounded inline-block mb-1">{lang === "hi" ? "श्रेणी" : "Specialization"}</label>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => updateParam("category", "")} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${!category ? "bg-[var(--color-heading)] text-[var(--color-bg)] border-[var(--color-heading)]" : "bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-primary)]"}`}>{lang === "hi" ? "सभी" : "All Services"}</button>
                    {CATEGORIES.map((cat) => (
                      <button key={cat.id} onClick={() => updateParam("category", cat.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${category === cat.id ? "bg-[var(--color-heading)] text-[var(--color-bg)] border-[var(--color-heading)]" : "bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-primary)]"}`}>
                          <Icon name={cat.icon} className="w-3.5 h-3.5" /> {t(cat.key)}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      <section className="mt-8">
        {hasSearchLocation && <div className="mb-8 rounded-3xl overflow-hidden glass-card p-0 shadow-lg border-2 border-[var(--color-primary)]/20"><ContractorMapPanel center={{ lat: Number(effectiveLat), lng: Number(effectiveLng) }} currentLocationLabel={searchLocationLabel} contractors={contractors} /></div>}
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-3xl text-[var(--color-heading)] font-extrabold tracking-tight">
              {loading ? (
                  <span className="w-1/4 h-8 bg-slate-200 dark:bg-slate-800 rounded animate-pulse inline-block"></span>
              ) : (
                  `${contractors.length > 0 ? "Showing" : ""} ${contractors.length} ${t("search.title")}`
              )}
          </h2>
        </div>

        {loading && (
          <div className="grid lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="glass-card p-6">
                <div className="flex gap-6">
                  <div className="skeleton w-24 h-24 rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-4 pt-1">
                    <div className="skeleton h-6 w-3/4 rounded-md" />
                    <div className="skeleton h-5 w-1/2 rounded-md" />
                    <div className="flex gap-3"><div className="skeleton h-8 w-24 rounded-full" /><div className="skeleton h-8 w-20 rounded-full" /></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && !loading && <div className="glass-card p-12"><EmptyState icon="warning" title={error} action={<button onClick={runSearch} className="btn-primary">{t("app.retry")}</button>} /></div>}
        
        {!loading && !error && contractors.length === 0 && (
            <div className="glass-card p-16 flex flex-col items-center justify-center border-dashed">
                <div className="w-20 h-20 rounded-full bg-[var(--color-bg)] flex items-center justify-center mb-6 shadow-sm border border-[var(--color-border)]">
                    <FiSearch className="text-[var(--color-primary)] w-8 h-8" />
                </div>
                <h3 className="font-display text-2xl font-bold text-[var(--color-heading)] mb-2">No contractors found</h3>
                <p className="text-[var(--color-muted)] font-medium max-w-sm text-center mb-6">Expand your radius or select a different category to see more options.</p>
                <button onClick={() => updateParam("radius_km", 10)} className="btn-secondary">Increase Radius to 10km</button>
            </div>
        )}
        
        {!loading && !error && contractors.length > 0 && (
          <>
            <motion.div initial="hidden" animate="show" variants={stagger} className="grid lg:grid-cols-2 gap-6">
              {contractors.map((contractor) => (
                <motion.div variants={cardVariant} key={contractor.id}>
                  <ContractorCard contractor={contractor} showCompare isCompared={compareList.some((item) => item.id === contractor.id)} onCompare={handleCompare} />
                </motion.div>
              ))}
            </motion.div>
            {contractors.length >= page * PAGE_SIZE && <div className="pt-12 pb-6 flex justify-center"><button onClick={loadMore} className="btn-primary shadow-glow px-8 py-3 font-bold">{lang === "hi" ? "और दिखाएँ" : "Load More Contractors"}</button></div>}
          </>
        )}
      </section>

      <CompareDrawer contractors={compareList} onRemove={(id) => setCompareList((prev) => prev.filter((item) => item.id !== id))} onClear={() => setCompareList([])} />
    </main>
  );
}
