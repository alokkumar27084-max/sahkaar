import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiFilter, FiMapPin, FiSearch } from "react-icons/fi";
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
    <main id="main-content" className="max-w-[1400px] mx-auto px-4 md:px-6 pb-14 pt-4">
      {!hasSearchLocation && (
        <motion.section initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-5">
          <h2 className="font-display text-lg font-bold text-amber-900 dark:text-amber-200 mb-1 flex items-center gap-2"><FiMapPin /> Location required</h2>
          <p className="text-sm text-amber-800 dark:text-amber-300/80 mb-3">Share your current location or search your locality to see contractors within 2-5 km nearest to you.</p>
          <div className="mb-3">
            <LocationSearchInput value={manualLocationInput} onChange={setManualLocationInput} onSelect={handleManualLocationSelect} placeholder="Search area, colony, or landmark" disabled={savingLocation} />
          </div>
          <button onClick={() => { setAutoSaveRequested(true); getLocation({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }); }} disabled={geoLoading || savingLocation} className="btn-primary">
            {geoLoading || savingLocation ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Detecting...</> : "Use my current location"}
          </button>
          {geoError && <p className="text-xs text-danger mt-2">{geoError}</p>}
        </motion.section>
      )}

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 md:p-5">
        <div className="grid md:grid-cols-[1fr_auto_auto] gap-2 mb-4">
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] w-4 h-4" />
            <input type="search" defaultValue={query} placeholder={t("home.search_placeholder")} className="input-field !pl-10" onKeyDown={(e) => { if (e.key === "Enter") updateParam("q", e.target.value); }} />
          </div>
          <button onClick={() => setShowFilters((s) => !s)} className={`btn-ghost !border-[var(--color-border)] !border !h-12 gap-2 ${showFilters ? "!bg-[var(--color-primary)]/5 !text-[var(--color-primary)] !border-[var(--color-primary)]/20" : ""}`}><FiFilter size={16} /> {t("search.filter")}</button>
          <button onClick={() => { setAutoSaveRequested(true); getLocation({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }); }} className="btn-ghost !border-[var(--color-border)] !border !h-12" title="Use precise location"><FiMapPin className="w-5 h-5" /></button>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto] mb-4">
          <LocationSearchInput value={manualLocationInput} onChange={setManualLocationInput} onSelect={handleManualLocationSelect} placeholder="Search another locality or landmark" disabled={savingLocation} />
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-body)]"><span className="font-semibold text-[var(--color-heading)]">Current search area:</span> {searchLocationLabel || "Using your saved coordinates"}</div>
        </div>
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
              <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl p-5 mb-3 space-y-5">
                <div>
                  <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider block mb-2.5">{t("search.sort")}</label>
                  <div className="flex flex-wrap gap-2">
                    {SORT_OPTIONS.map((opt) => (
                      <button key={opt.value} onClick={() => updateParam("sort", opt.value)} className={`pill-chip ${sort === opt.value ? "!bg-[var(--color-primary)] !text-white !border-[var(--color-primary)]" : ""}`}>{t(opt.labelKey)}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider block mb-2.5">Radius (km)</label>
                  <div className="flex gap-2">
                    {RADIUS_OPTIONS.map((km) => (
                      <button key={km} onClick={() => updateParam("radius_km", km)} className={`pill-chip ${radiusKm === km ? "!bg-[var(--color-primary)] !text-white !border-[var(--color-primary)]" : ""}`}>{km} km</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider block mb-2.5">{lang === "hi" ? "श्रेणी" : "Category"}</label>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => updateParam("category", "")} className={`pill-chip ${!category ? "!bg-[var(--color-primary)] !text-white !border-[var(--color-primary)]" : ""}`}>{lang === "hi" ? "सभी" : "All"}</button>
                    {CATEGORIES.map((cat) => (
                      <button key={cat.id} onClick={() => updateParam("category", cat.id)} className={`pill-chip ${category === cat.id ? "!bg-[var(--color-primary)] !text-white !border-[var(--color-primary)]" : ""}`}><Icon name={cat.icon} className="w-3.5 h-3.5" /> {t(cat.key)}</button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-5 text-sm text-[var(--color-body)]">
                  {[
                    { key: "verified", checked: verified, label: t("search.verified") },
                    { key: "featured", checked: featured, label: t("search.featured") },
                    { key: "labour_group", checked: labour, label: t("search.labour_group") }
                  ].map((item) => (
                    <label key={item.key} className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={item.checked} onChange={(e) => updateParam(item.key, e.target.checked || "")} className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]/20" />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => updateParam("category", cat.id === category ? "" : cat.id)} className={`pill-chip whitespace-nowrap ${category === cat.id ? "!bg-[var(--color-accent)] !text-white !border-[var(--color-accent)]" : ""}`}><Icon name={cat.icon} className="w-3.5 h-3.5" /> {t(cat.key)}</button>
          ))}
        </div>
      </motion.section>

      <section className="mt-6">
        {hasSearchLocation && <div className="mb-5"><ContractorMapPanel center={{ lat: Number(effectiveLat), lng: Number(effectiveLng) }} currentLocationLabel={searchLocationLabel} contractors={contractors} /></div>}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-2xl text-[var(--color-heading)] font-bold">{loading ? t("app.loading") : `${contractors.length} ${t("search.title")}`}</h2>
        </div>
        {loading && (
          <div className="grid lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="glass-card p-5">
                <div className="flex gap-4">
                  <div className="skeleton w-[72px] h-[72px] rounded-full shrink-0" />
                  <div className="flex-1 space-y-3 pt-1">
                    <div className="skeleton h-5 w-3/4 rounded-md" />
                    <div className="skeleton h-4 w-1/2 rounded-md" />
                    <div className="flex gap-2"><div className="skeleton h-6 w-20 rounded-full" /><div className="skeleton h-6 w-16 rounded-full" /></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {error && !loading && <EmptyState icon="warning" title={error} action={<button onClick={runSearch} className="btn-primary">{t("app.retry")}</button>} />}
        {!loading && !error && contractors.length === 0 && <EmptyState icon="search" title={t("search.no_results")} subtitle={lang === "hi" ? "Alag keyword ya category try karein" : "Try a different keyword or category"} />}
        {!loading && !error && (
          <>
            <motion.div initial="hidden" animate="show" variants={stagger} className="grid lg:grid-cols-2 gap-4">
              {contractors.map((contractor) => (
                <motion.div variants={cardVariant} key={contractor.id}>
                  <ContractorCard contractor={contractor} showCompare isCompared={compareList.some((item) => item.id === contractor.id)} onCompare={handleCompare} />
                </motion.div>
              ))}
            </motion.div>
            {contractors.length >= page * PAGE_SIZE && <div className="pt-8 flex justify-center"><button onClick={loadMore} className="btn-secondary btn-shimmer">{lang === "hi" ? "और दिखाएँ" : "Load More"}</button></div>}
          </>
        )}
      </section>

      <CompareDrawer contractors={compareList} onRemove={(id) => setCompareList((prev) => prev.filter((item) => item.id !== id))} onClear={() => setCompareList([])} />
    </main>
  );
}
