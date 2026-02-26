import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { contractorAPI } from "../../services/api";
import { CATEGORIES, SORT_OPTIONS } from "../../utils/constants";
import { useGeolocation } from "../../hooks/useGeolocation";
import ContractorCard from "../../components/common/ContractorCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import Icon from "../../components/common/Icon";
import { trackEvent } from "../../utils/analytics";

export default function SearchPage() {
  const { t, lang } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const { lat, lng, request: getLocation } = useGeolocation();

  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "rating";
  const verified = searchParams.get("verified") === "true";
  const featured = searchParams.get("featured") === "true";
  const labour = searchParams.get("labour_group") === "true";
  const urlLat = searchParams.get("lat");
  const urlLng = searchParams.get("lng");
  const page = Number(searchParams.get("page") || "1");
  const PAGE_SIZE = 20;

  const runSearch = useCallback(async () => {
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
        lat: urlLat || lat || undefined,
        lng: urlLng || lng || undefined,
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
      });
    } catch {
      setError(t("app.error"));
    } finally {
      setLoading(false);
    }
  }, [query, category, sort, verified, featured, labour, urlLat, urlLng, lat, lng, page, t]);

  useEffect(() => {
    runSearch();
  }, [runSearch]);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
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
    <div className="max-w-6xl mx-auto px-4 pb-10 pt-3 md:px-6">
      <section className="glass-card p-4 md:p-5">
        <div className="flex flex-wrap md:flex-nowrap gap-2 mb-4">
          <input
            type="search"
            defaultValue={query}
            placeholder={t("home.search_placeholder")}
            className="input-field flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateParam("q", e.target.value);
              }
            }}
          />
          <button onClick={() => setShowFilters((s) => !s)} className="btn-secondary !px-4 !py-3">
            {t("search.filter")}
          </button>
          <button onClick={getLocation} className="btn-secondary !px-4 !py-3" title="Use location">
            <Icon name="location" className="w-5 h-5" />
          </button>
        </div>

        {showFilters && (
          <div className="surface-panel rounded-2xl p-4 mb-3 animate-fade-in">
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-300 block mb-2">{t("search.sort")}</label>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateParam("sort", opt.value)}
                    className={`pill-chip ${sort === opt.value ? "!bg-cyan-200 !text-slate-950 !border-cyan-200" : ""}`}
                  >
                    {t(opt.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                {lang === "hi" ? "श्रेणी" : "Category"}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateParam("category", "")}
                  className={`pill-chip ${!category ? "!bg-cyan-200 !text-slate-950 !border-cyan-200" : ""}`}
                >
                  {lang === "hi" ? "सभी" : "All"}
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => updateParam("category", cat.id)}
                    className={`pill-chip ${category === cat.id ? "!bg-cyan-200 !text-slate-950 !border-cyan-200" : ""}`}
                  >
                    <Icon name={cat.icon} className="w-4 h-4 inline-block mr-1.5 align-[-2px]" /> {t(cat.key)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-slate-200">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verified}
                  onChange={(e) => updateParam("verified", e.target.checked || "")}
                  className="accent-cyan-200"
                />
                {t("search.verified")}
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => updateParam("featured", e.target.checked || "")}
                  className="accent-cyan-200"
                />
                {t("search.featured")}
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={labour}
                  onChange={(e) => updateParam("labour_group", e.target.checked || "")}
                  className="accent-cyan-200"
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
              className={`pill-chip whitespace-nowrap ${category === cat.id ? "!bg-cyan-200 !text-slate-950 !border-cyan-200" : ""}`}
            >
              <Icon name={cat.icon} className="w-4 h-4 inline-block mr-1.5 align-[-2px]" /> {t(cat.key)}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-['Space_Grotesk'] text-xl md:text-2xl text-slate-100 font-semibold">
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
            subtitle={lang === "hi" ? "कीवर्ड या श्रेणी बदलें" : "Try a different keyword or category"}
          />
        )}

        {!loading && !error && (
          <>
            <div className="grid lg:grid-cols-2 gap-3 md:gap-4">
              {contractors.map((c) => (
                <ContractorCard key={c.id} contractor={c} />
              ))}
            </div>
            {contractors.length >= page * PAGE_SIZE && (
              <div className="pt-5 flex justify-center">
                <button onClick={loadMore} className="btn-secondary">
                  {lang === "hi" ? "और दिखाएं" : "Load More"}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
