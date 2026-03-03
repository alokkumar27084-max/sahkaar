import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { authAPI, contractorAPI } from "../../services/api";
import { CATEGORIES, SORT_OPTIONS } from "../../utils/constants";
import { useGeolocation } from "../../hooks/useGeolocation";
import ContractorCard from "../../components/common/ContractorCard";
import EmptyState from "../../components/common/EmptyState";
import Icon from "../../components/common/Icon";
import { trackEvent } from "../../utils/analytics";
import { FiFilter, FiMapPin, FiSearch } from "react-icons/fi";

const RADIUS_OPTIONS = [2, 3, 5];

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
};
const cardVariant = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 150, damping: 20 } }
};

export default function SearchPage() {
  const { t, lang } = useLanguage();
  const { user, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { lat, lng, accuracy, request: getLocation, error: geoError, loading: geoLoading } = useGeolocation();

  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [autoSaveRequested, setAutoSaveRequested] = useState(false);

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
  const PAGE_SIZE = 20;

  const storedLat = user?.location_lat;
  const storedLng = user?.location_lng;
  const effectiveLat = urlLat || storedLat || null;
  const effectiveLng = urlLng || storedLng || null;
  const hasSearchLocation = effectiveLat != null && effectiveLng != null;

  const saveLocation = useCallback(async (nextLat, nextLng, nextAccuracy = null) => {
    setSavingLocation(true); setError(null);
    try {
      await authAPI.updateLocation({ lat: Number(nextLat), lng: Number(nextLng), accuracy_m: nextAccuracy !== null ? Number(nextAccuracy) : null, source: "browser_gps" });
      await refreshUser();
      const next = new URLSearchParams(searchParams);
      next.set("lat", String(nextLat)); next.set("lng", String(nextLng)); next.set("page", "1");
      setSearchParams(next);
    } catch { setError("Could not save your location."); }
    finally { setSavingLocation(false); }
  }, [refreshUser, searchParams, setSearchParams]);

  const requestAndSaveLocation = useCallback(() => {
    setAutoSaveRequested(true);
    getLocation({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }, [getLocation]);

  useEffect(() => {
    if (!autoSaveRequested || lat === null || lng === null) return;
    setAutoSaveRequested(false);
    saveLocation(lat, lng, accuracy);
  }, [autoSaveRequested, lat, lng, accuracy, saveLocation]);

  const runSearch = useCallback(async () => {
    if (!hasSearchLocation) { setContractors([]); setError("Please share your location to see nearby contractors."); return; }
    setLoading(true); setError(null);
    try {
      const params = { q: query || undefined, category: category || undefined, sort, verified: verified || undefined, featured: featured || undefined, labour_group: labour || undefined, lat: effectiveLat, lng: effectiveLng, radius_km: radiusKm, page, limit: PAGE_SIZE };
      Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);
      const res = await contractorAPI.search(params);
      const rows = res.data.contractors || [];
      setContractors((prev) => (page > 1 ? [...prev, ...rows] : rows));
      trackEvent("search", { q: query || "", category: category || "", result_count: rows.length, page, radius_km: radiusKm });
    } catch { setError(t("app.error")); }
    finally { setLoading(false); }
  }, [query, category, sort, verified, featured, labour, effectiveLat, effectiveLng, hasSearchLocation, page, radiusKm, t]);

  useEffect(() => { runSearch(); }, [runSearch]);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value !== undefined && value !== null && value !== "") { next.set(key, String(value)); } else { next.delete(key); }
    next.set("page", "1");
    setSearchParams(next);
  }

  function loadMore() {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(page + 1));
    setSearchParams(next);
  }

  return (
    <main id="main-content" className="max-w-[1400px] mx-auto px-4 md:px-6 pb-14 pt-4">
      {/* Location prompt */}
      {!hasSearchLocation && (
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-5"
        >
          <h2 className="font-display text-lg font-bold text-amber-900 dark:text-amber-200 mb-1 flex items-center gap-2">
            <FiMapPin /> Location required
          </h2>
          <p className="text-sm text-amber-800 dark:text-amber-300/80 mb-3">
            Share your current location to see contractors within 2–5 km nearest to you.
          </p>
          <button onClick={requestAndSaveLocation} disabled={geoLoading || savingLocation} className="btn-primary">
            {geoLoading || savingLocation ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Detecting...</>
            ) : "Use my current location"}
          </button>
          {geoError && <p className="text-xs text-danger mt-2">{geoError}</p>}
        </motion.section>
      )}

      {/* Search bar */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 md:p-5"
      >
        <div className="grid md:grid-cols-[1fr_auto_auto] gap-2 mb-4">
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] w-4 h-4" />
            <input
              type="search"
              defaultValue={query}
              placeholder={t("home.search_placeholder")}
              className="input-field !pl-10"
              onKeyDown={(e) => { if (e.key === "Enter") updateParam("q", e.target.value); }}
            />
          </div>
          <button onClick={() => setShowFilters((s) => !s)} className={`btn-ghost !border-[var(--color-border)] !border !h-12 gap-2 ${showFilters ? "!bg-[var(--color-primary)]/5 !text-[var(--color-primary)] !border-[var(--color-primary)]/20" : ""}`}>
            <FiFilter size={16} /> {t("search.filter")}
          </button>
          <button onClick={requestAndSaveLocation} className="btn-ghost !border-[var(--color-border)] !border !h-12" title="Use precise location">
            <FiMapPin className="w-5 h-5" />
          </button>
        </div>

        {/* Filters panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl p-5 mb-3 space-y-5">
                <div>
                  <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider block mb-2.5">{t("search.sort")}</label>
                  <div className="flex flex-wrap gap-2">
                    {SORT_OPTIONS.map((opt) => (
                      <button key={opt.value} onClick={() => updateParam("sort", opt.value)}
                        className={`pill-chip ${sort === opt.value ? "!bg-[var(--color-primary)] !text-white !border-[var(--color-primary)]" : ""}`}>
                        {t(opt.labelKey)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider block mb-2.5">Radius (km)</label>
                  <div className="flex gap-2">
                    {RADIUS_OPTIONS.map((km) => (
                      <button key={km} onClick={() => updateParam("radius_km", km)}
                        className={`pill-chip ${radiusKm === km ? "!bg-[var(--color-primary)] !text-white !border-[var(--color-primary)]" : ""}`}>
                        {km} km
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider block mb-2.5">{lang === "hi" ? "श्रेणी" : "Category"}</label>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => updateParam("category", "")}
                      className={`pill-chip ${!category ? "!bg-[var(--color-primary)] !text-white !border-[var(--color-primary)]" : ""}`}>
                      {lang === "hi" ? "सभी" : "All"}
                    </button>
                    {CATEGORIES.map((cat) => (
                      <button key={cat.id} onClick={() => updateParam("category", cat.id)}
                        className={`pill-chip ${category === cat.id ? "!bg-[var(--color-primary)] !text-white !border-[var(--color-primary)]" : ""}`}>
                        <Icon name={cat.icon} className="w-3.5 h-3.5" /> {t(cat.key)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-5 text-sm text-[var(--color-body)]">
                  {[
                    { key: "verified", checked: verified, label: t("search.verified") },
                    { key: "featured", checked: featured, label: t("search.featured") },
                    { key: "labour_group", checked: labour, label: t("search.labour_group") }
                  ].map(f => (
                    <label key={f.key} className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={f.checked}
                        onChange={(e) => updateParam(f.key, e.target.checked || "")}
                        className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]/20" />
                      {f.label}
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => updateParam("category", cat.id === category ? "" : cat.id)}
              className={`pill-chip whitespace-nowrap ${category === cat.id ? "!bg-[var(--color-accent)] !text-white !border-[var(--color-accent)]" : ""}`}>
              <Icon name={cat.icon} className="w-3.5 h-3.5" /> {t(cat.key)}
            </button>
          ))}
        </div>
      </motion.section>

      {/* Results */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-2xl text-[var(--color-heading)] font-bold">
            {loading ? t("app.loading") : `${contractors.length} ${t("search.title")}`}
          </h2>
        </div>

        {/* Skeleton loading */}
        {loading && (
          <div className="grid lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="glass-card p-5">
                <div className="flex gap-4">
                  <div className="skeleton w-[72px] h-[72px] rounded-full shrink-0" />
                  <div className="flex-1 space-y-3 pt-1">
                    <div className="skeleton h-5 w-3/4 rounded-md" />
                    <div className="skeleton h-4 w-1/2 rounded-md" />
                    <div className="flex gap-2">
                      <div className="skeleton h-6 w-20 rounded-full" />
                      <div className="skeleton h-6 w-16 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <EmptyState icon="warning" title={error}
            action={<button onClick={runSearch} className="btn-primary">{t("app.retry")}</button>} />
        )}

        {!loading && !error && contractors.length === 0 && (
          <EmptyState icon="search" title={t("search.no_results")}
            subtitle={lang === "hi" ? "Alag keyword ya category try karein" : "Try a different keyword or category"} />
        )}

        {!loading && !error && (
          <>
            <motion.div initial="hidden" animate="show" variants={stagger} className="grid lg:grid-cols-2 gap-4">
              {contractors.map((c) => (
                <motion.div variants={cardVariant} key={c.id}>
                  <ContractorCard contractor={c} />
                </motion.div>
              ))}
            </motion.div>
            {contractors.length >= page * PAGE_SIZE && (
              <div className="pt-8 flex justify-center">
                <button onClick={loadMore} className="btn-secondary btn-shimmer">
                  {lang === "hi" ? "और दिखाएं" : "Load More"}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
