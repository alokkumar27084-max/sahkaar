import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { authAPI, contractorAPI } from "../../services/api";
import { CATEGORIES, SORT_OPTIONS } from "../../utils/constants";
import { useGeolocation } from "../../hooks/useGeolocation";
import ContractorCard from "../../components/common/ContractorCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import Icon from "../../components/common/Icon";
import { trackEvent } from "../../utils/analytics";

const RADIUS_OPTIONS = [2, 3, 5];

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
  const hasSearchLocation = effectiveLat !== null && effectiveLat !== undefined && effectiveLng !== null && effectiveLng !== undefined;

  const saveLocation = useCallback(
    async (nextLat, nextLng, nextAccuracy = null) => {
      setSavingLocation(true);
      setError(null);
      try {
        await authAPI.updateLocation({
          lat: Number(nextLat),
          lng: Number(nextLng),
          accuracy_m: nextAccuracy !== null ? Number(nextAccuracy) : null,
          source: "browser_gps",
        });
        await refreshUser();

        const next = new URLSearchParams(searchParams);
        next.set("lat", String(nextLat));
        next.set("lng", String(nextLng));
        next.set("page", "1");
        setSearchParams(next);
      } catch {
        setError("Could not save your location. Please try again.");
      } finally {
        setSavingLocation(false);
      }
    },
    [refreshUser, searchParams, setSearchParams]
  );

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
    if (!hasSearchLocation) {
      setContractors([]);
      setError("Please share your precise location to view nearby contractors.");
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
        limit: PAGE_SIZE,
      };
      Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);

      const res = await contractorAPI.search(params);
      const rows = res.data.contractors || [];
      setContractors((prev) => (page > 1 ? [...prev, ...rows] : rows));
      trackEvent("search", {
        q: query || "",
        category: category || "",
        result_count: rows.length,
        page,
        radius_km: radiusKm,
      });
    } catch {
      setError(t("app.error"));
    } finally {
      setLoading(false);
    }
  }, [query, category, sort, verified, featured, labour, effectiveLat, effectiveLng, hasSearchLocation, page, radiusKm, t]);

  useEffect(() => {
    runSearch();
  }, [runSearch]);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value !== undefined && value !== null && value !== "") {
      next.set(key, String(value));
    } else {
      next.delete(key);
    }
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
      {!hasSearchLocation && (
        <section className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-['Poppins'] text-lg font-semibold text-amber-900 mb-1">Location required</h2>
          <p className="text-sm text-amber-800 mb-3">
            Share your current location to see contractors within 2-5 km nearest to you.
          </p>
          <button onClick={requestAndSaveLocation} disabled={geoLoading || savingLocation} className="btn-primary">
            {geoLoading || savingLocation ? "Capturing location..." : "Use my current location"}
          </button>
          {geoError && <p className="text-xs text-rose-700 mt-2">{geoError}</p>}
        </section>
      )}

      <section className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm">
        <div className="grid md:grid-cols-[1fr_auto_auto] gap-2 mb-4">
          <input
            type="search"
            defaultValue={query}
            placeholder={t("home.search_placeholder")}
            className="input-field"
            onKeyDown={(e) => {
              if (e.key === "Enter") updateParam("q", e.target.value);
            }}
          />
          <button onClick={() => setShowFilters((s) => !s)} className="btn-outline-cyan !h-12">
            {t("search.filter")}
          </button>
          <button onClick={requestAndSaveLocation} className="btn-outline-cyan !h-12" title="Use precise location">
            <Icon name="location" className="w-5 h-5" />
          </button>
        </div>

        {showFilters && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-3 fade-rise">
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-700 block mb-2">{t("search.sort")}</label>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateParam("sort", opt.value)}
                    className={`pill-chip ${sort === opt.value ? "!bg-[#1E3A8A] !text-white !border-[#1E3A8A]" : ""}`}
                  >
                    {t(opt.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-700 block mb-2">Radius (km)</label>
              <div className="flex gap-2">
                {RADIUS_OPTIONS.map((km) => (
                  <button
                    key={km}
                    onClick={() => updateParam("radius_km", km)}
                    className={`pill-chip ${radiusKm === km ? "!bg-[#1E3A8A] !text-white !border-[#1E3A8A]" : ""}`}
                  >
                    {km} km
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-700 block mb-2">{lang === "hi" ? "श्रेणी" : "Category"}</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateParam("category", "")}
                  className={`pill-chip ${!category ? "!bg-[#1E3A8A] !text-white !border-[#1E3A8A]" : ""}`}
                >
                  {lang === "hi" ? "सभी" : "All"}
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => updateParam("category", cat.id)}
                    className={`pill-chip ${category === cat.id ? "!bg-[#1E3A8A] !text-white !border-[#1E3A8A]" : ""}`}
                  >
                    <Icon name={cat.icon} className="w-4 h-4" /> {t(cat.key)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-slate-700">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verified}
                  onChange={(e) => updateParam("verified", e.target.checked || "")}
                  className="accent-[#1E3A8A]"
                />
                {t("search.verified")}
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => updateParam("featured", e.target.checked || "")}
                  className="accent-[#1E3A8A]"
                />
                {t("search.featured")}
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={labour}
                  onChange={(e) => updateParam("labour_group", e.target.checked || "")}
                  className="accent-[#1E3A8A]"
                />
                {t("search.labour_group")}
              </label>
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateParam("category", cat.id === category ? "" : cat.id)}
              className={`pill-chip whitespace-nowrap ${category === cat.id ? "!bg-[#06B6D4] !text-[#111827] !border-[#06B6D4]" : ""}`}
            >
              <Icon name={cat.icon} className="w-4 h-4" /> {t(cat.key)}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-['Poppins'] text-2xl text-[#111827] font-semibold">
            {loading ? t("app.loading") : `${contractors.length} ${t("search.title")}`}
          </h2>
        </div>

        {loading && (
          <div className="py-16">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {error && !loading && (
          <EmptyState
            icon="warning"
            title={error}
            action={
              <button onClick={runSearch} className="btn-primary">
                {t("app.retry")}
              </button>
            }
          />
        )}

        {!loading && !error && contractors.length === 0 && (
          <EmptyState
            icon="search"
            title={t("search.no_results")}
            subtitle={lang === "hi" ? "अलग keyword या category try करें" : "Try a different keyword or category"}
          />
        )}

        {!loading && !error && (
          <>
            <div className="grid lg:grid-cols-2 gap-4">
              {contractors.map((c) => (
                <ContractorCard key={c.id} contractor={c} />
              ))}
            </div>
            {contractors.length >= page * PAGE_SIZE && (
              <div className="pt-6 flex justify-center">
                <button onClick={loadMore} className="btn-secondary">
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
