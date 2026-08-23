import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiAward,
  FiBarChart2,
  FiCalendar,
  FiCheckCircle,
  FiDollarSign,
  FiFileText,
  FiFilter,
  FiGlobe,
  FiHeart,
  FiLayers,
  FiLogOut,
  FiMapPin,
  FiRefreshCw,
  FiShield,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import { cooperativeAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { SahKaariLogo } from "../../components/common/SahKaariLogo";
import toast from "react-hot-toast";

export default function FederationAdminDashboard() {
  const { user, logout } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const isHi = lang === "hi";

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [societies, setSocieties] = useState([]);
  const [activeTab, setActiveTab] = useState("forecasting");

  // Forecasting Filter State
  const [forecastLocality, setForecastLocality] = useState("MP Nagar");
  const [forecastCategory, setForecastCategory] = useState("electrical");
  const [forecastSeries, setForecastSeries] = useState([]);
  const [forecastOverview, setForecastOverview] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  const localitiesList = ["MP Nagar", "Arera Colony", "Kolar Road", "TT Nagar", "Hoshangabad Road"];
  const categoriesList = ["electrical", "plumbing", "construction", "painting", "carpentry", "cleaning"];

  const loadFederationData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cooperativeAPI.getFederationStats();
      if (res.data?.ok) {
        setStats(res.data.data.summary);
        setSocieties(res.data.data.societies || []);
        setForecastOverview(res.data.data.forecastingOverview);
      }
    } catch (err) {
      console.error("Federation data fetch error:", err);
      toast.error("Could not fetch federation analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadForecast = useCallback(async (loc, cat) => {
    setForecastLoading(true);
    try {
      const res = await cooperativeAPI.getDemandForecast({ locality: loc, category: cat, days: 10 });
      if (res.data?.ok) {
        setForecastSeries(res.data.data.series || []);
      }
    } catch (err) {
      console.error("Forecast fetch error:", err);
    } finally {
      setForecastLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFederationData();
  }, [loadFederationData]);

  useEffect(() => {
    loadForecast(forecastLocality, forecastCategory);
  }, [forecastLocality, forecastCategory, loadForecast]);

  const maxDemand = Math.max(...forecastSeries.map((s) => Math.max(s.predicted_demand || 0, s.actual_demand || 0)), 80);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg)]">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm font-semibold text-[var(--color-muted)]">
          {isHi ? "महासंघ विश्लेषण लोड हो रहा है..." : "Loading Cooperative Federation Command Center..."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-heading)] flex flex-col">
      {/* Top Federation Header */}
      <header className="bg-gradient-to-r from-teal-950 via-teal-900 to-slate-900 text-white px-6 py-4 shadow-md border-b border-teal-800/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <SahKaariLogo className="h-10 w-10 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  {isHi ? "राज्य महासंघ पोर्टल" : "State Federation Admin Portal"}
                </span>
                <span className="text-xs text-teal-300 font-medium">FED-MP-2018-0941</span>
              </div>
              <h1 className="text-lg md:text-xl font-extrabold tracking-tight mt-0.5">
                Madhya Pradesh State Labour & Construction Cooperative Federation
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                loadFederationData();
                loadForecast(forecastLocality, forecastCategory);
                toast.success("Federation data refreshed");
              }}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <FiRefreshCw className="w-3.5 h-3.5" />
              <span>{isHi ? "रिफ्रेश" : "Sync Data"}</span>
            </button>
            <button
              onClick={async () => {
                await logout();
                navigate("/");
              }}
              className="px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-red-500/30"
            >
              <FiLogOut className="w-3.5 h-3.5" />
              <span>{isHi ? "लॉगआउट" : "Logout"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        
        {/* KPI Cards Row */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5 border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">
                {isHi ? "संबद्ध समितियाँ" : "Affiliated Societies"}
              </span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-primary flex items-center justify-center font-bold">
                <FiLayers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[var(--color-heading)]">
              {stats?.total_societies || societies.length || 3}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">
              100% Active Primary Societies
            </div>
          </div>

          <div className="card p-5 border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">
                {isHi ? "सत्यापित सहकारी कारीगर" : "Verified Workers"}
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <FiUsers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[var(--color-heading)]">
              {stats?.verified_workers || 586}
            </div>
            <div className="text-[11px] text-teal-700 font-semibold mt-1">
              {isHi ? "कौशल मिशन एवं पुलिस सत्यापित" : "Skill & ID Certified Roster"}
            </div>
          </div>

          <div className="card p-5 border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">
                {isHi ? "कल्याण कोष संचय" : "Welfare Corpus Balance"}
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <FiHeart className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[var(--color-heading)]">
              ₹{Number(stats?.federation_welfare_corpus || 4850000).toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-amber-700 font-semibold mt-1">
              +₹25 per completed job
            </div>
          </div>

          <div className="card p-5 border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">
                {isHi ? "कुल पूर्ण बुकिंग्स" : "Total Co-op Bookings"}
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <FiActivity className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[var(--color-heading)]">
              {stats?.total_bookings || 1420}
            </div>
            <div className="text-[11px] text-blue-700 font-semibold mt-1">
              {stats?.emergency_bookings || 84} {isHi ? "आपातकालीन सेवाएं" : "Emergency Dispatches"}
            </div>
          </div>
        </section>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-3 border-b border-[var(--color-border)] pb-2 overflow-x-auto">
          {[
            { id: "forecasting", label: isHi ? "एआई मांग पूर्वानुमान" : "AI Demand Forecasting", icon: FiTrendingUp },
            { id: "societies", label: isHi ? "सहकारी समितियाँ रोस्टर" : "Primary Societies Roster", icon: FiLayers },
            { id: "welfare", label: isHi ? "कल्याण कोष एवं बीमा" : "Welfare & Social Security Pool", icon: FiHeart },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shrink-0 ${
                  active
                    ? "bg-primary text-white shadow-sm"
                    : "text-[var(--color-muted)] hover:bg-[var(--color-bg-elevated)]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── TAB 1: AI DEMAND FORECASTING CHART & INSIGHTS ── */}
        {activeTab === "forecasting" && (
          <section className="space-y-6">
            
            {/* Filter Toolbar */}
            <div className="card p-5 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-heading)] flex items-center gap-2">
                  <FiTrendingUp className="text-primary w-5 h-5" />
                  <span>{isHi ? "क्षेत्रीय मांग पूर्वानुमान मॉडल" : "Localized Predictive Demand Intelligence"}</span>
                </h2>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  {isHi
                    ? "ऐतिहासिक बुकिंग डेटा व मौसमी मांग के आधार पर आगामी 3 से 7 दिनों का अग्रिम श्रम अनुमान।"
                    : "Ensemble statistical moving average & seasonal regression engine predicting worker demand by ward."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Locality Selector */}
                <div className="flex items-center gap-1.5 bg-[var(--color-bg-elevated)] px-3 py-1.5 rounded-xl border border-[var(--color-border)]">
                  <FiMapPin className="text-primary w-4 h-4" />
                  <select
                    value={forecastLocality}
                    onChange={(e) => setForecastLocality(e.target.value)}
                    className="bg-transparent text-xs font-bold text-[var(--color-heading)] outline-none cursor-pointer"
                  >
                    {localitiesList.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Trade Category Selector */}
                <div className="flex items-center gap-1.5 bg-[var(--color-bg-elevated)] px-3 py-1.5 rounded-xl border border-[var(--color-border)]">
                  <FiFilter className="text-amber-500 w-4 h-4" />
                  <select
                    value={forecastCategory}
                    onChange={(e) => setForecastCategory(e.target.value)}
                    className="bg-transparent text-xs font-bold text-[var(--color-heading)] outline-none cursor-pointer capitalize"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/60 flex items-center gap-1.5">
                  <FiCheckCircle className="w-3.5 h-3.5" />
                  <span>Accuracy: 93.4%</span>
                </div>
              </div>
            </div>

            {/* Visual Interactive Bar / Line Chart */}
            <div className="card p-6 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-2xl shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-[var(--color-heading)]">
                    {forecastLocality} — {forecastCategory.toUpperCase()} {isHi ? "कारीगर मांग चार्ट" : "Worker Demand Timeline"}
                  </h3>
                  <div className="flex items-center gap-4 text-xs mt-1">
                    <span className="flex items-center gap-1.5 font-medium text-[var(--color-body)]">
                      <span className="w-3 h-3 rounded-sm bg-primary inline-block" />
                      {isHi ? "पूर्वानुमानित मांग (Predicted)" : "Predicted Demand"}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-[var(--color-body)]">
                      <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" />
                      {isHi ? "वास्तविक मांग (Actual Bookings)" : "Actual Bookings"}
                    </span>
                  </div>
                </div>

                <span className="text-xs text-[var(--color-muted)] font-mono">
                  {forecastSeries.length} Data Points
                </span>
              </div>

              {forecastLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <LoadingSpinner size="md" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Visual Timeline Bars */}
                  <div className="h-64 flex items-end gap-2 sm:gap-4 pt-8 pb-2 border-b border-[var(--color-border)] px-2">
                    {forecastSeries.map((item, idx) => {
                      const predHeight = Math.min(100, Math.round((item.predicted_demand / maxDemand) * 100));
                      const actHeight = Math.min(100, Math.round(((item.actual_demand || 0) / maxDemand) * 100));
                      const isFuture = !item.actual_demand;

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                          
                          {/* Tooltip on Hover */}
                          <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded shadow-lg pointer-events-none z-20 whitespace-nowrap">
                            Predicted: {item.predicted_demand} | Actual: {item.actual_demand || "Forecast"}
                          </div>

                          {/* Dual Bars */}
                          <div className="w-full flex items-end justify-center gap-1 h-full">
                            {/* Predicted Bar */}
                            <div
                              className="w-1/2 rounded-t-md bg-primary/90 transition-all duration-500 relative flex items-start justify-center group-hover:bg-primary"
                              style={{ height: `${predHeight}%` }}
                            >
                              <span className="text-[9px] text-white font-bold mt-1 opacity-0 group-hover:opacity-100">
                                {item.predicted_demand}
                              </span>
                            </div>

                            {/* Actual Bar (if past date) */}
                            <div
                              className={`w-1/2 rounded-t-md transition-all duration-500 relative flex items-start justify-center ${
                                isFuture ? "bg-dashed bg-slate-200 border-t-2 border-slate-300" : "bg-amber-400 group-hover:bg-amber-500"
                              }`}
                              style={{ height: `${isFuture ? 4 : actHeight}%` }}
                            >
                              {!isFuture && (
                                <span className="text-[9px] text-slate-950 font-bold mt-1 opacity-0 group-hover:opacity-100">
                                  {item.actual_demand}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Date Label */}
                          <span className="text-[10px] font-semibold text-[var(--color-muted)] mt-2 rotate-[-35deg] sm:rotate-0 truncate w-full text-center">
                            {item.forecast_date ? item.forecast_date.slice(5) : `Day ${idx + 1}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary Metric Cards below chart */}
                  <div className="grid sm:grid-cols-3 gap-4 pt-2">
                    <div className="p-3.5 rounded-xl bg-teal-50/80 border border-teal-200/70 text-xs">
                      <div className="font-bold text-teal-950">Recommended Worker Pre-Allocation</div>
                      <div className="text-teal-800 text-[11px] mt-0.5">
                        Dispatch +15 electricians to {forecastLocality} for upcoming weekend surge.
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-xs">
                      <div className="font-bold text-amber-950">Peak Time Slot Analysis</div>
                      <div className="text-amber-800 text-[11px] mt-0.5">
                        09:00 AM - 01:00 PM represents 68% of localized service requests.
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/70 text-xs">
                      <div className="font-bold text-blue-950">Dispute Rate & Quality Guard</div>
                      <div className="text-blue-800 text-[11px] mt-0.5">
                        99.2% satisfactory job completion under primary society supervision.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── TAB 2: PRIMARY SOCIETIES ROSTER ── */}
        {activeTab === "societies" && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-heading)]">
                  {isHi ? "संबद्ध प्राथमिक सहकारी समितियाँ" : "Affiliated Primary Cooperative Societies"}
                </h2>
                <p className="text-xs text-[var(--color-muted)]">
                  District-level primary cooperative bodies managing worker onboarding, certification, and local dispute arbitration.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {societies.map((soc) => (
                <div
                  key={soc.id}
                  className="card p-5 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-2xl shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider">
                        {soc.district || "Bhopal"}
                      </span>
                      <span className="text-xs font-mono text-[var(--color-muted)]">{soc.registration_no}</span>
                    </div>

                    <h3 className="font-bold text-base text-[var(--color-heading)] leading-snug">
                      {soc.name}
                    </h3>
                    <p className="text-xs text-[var(--color-muted)] mt-1">
                      {soc.office_address || "District Sahakar Bhavan"}
                    </p>

                    <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--color-muted)]">Active Workers:</span>
                        <span className="font-bold text-[var(--color-heading)]">{soc.worker_count || 184}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--color-muted)]">Verified Rate:</span>
                        <span className="font-bold text-emerald-600">98.4%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--color-muted)]">Welfare Pool:</span>
                        <span className="font-bold text-amber-700">
                          ₹{Number(soc.welfare_pool_balance || 450000).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                      <FiCheckCircle className="w-3 h-3" /> Fully Compliant
                    </span>
                    <Link
                      to={`/society-dashboard?id=${soc.id}`}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      {isHi ? "समिति डैशबोर्ड देखें →" : "View Society →"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── TAB 3: WELFARE & SOCIAL SECURITY POOL ── */}
        {activeTab === "welfare" && (
          <section className="space-y-6">
            <div className="card p-6 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-2xl shadow-xs">
              <h2 className="text-lg font-bold text-[var(--color-heading)] flex items-center gap-2 mb-2">
                <FiHeart className="text-amber-500 w-5 h-5" />
                <span>{isHi ? "सहकारी कामगार सामाजिक सुरक्षा निधि" : "Cooperative Worker Social Security & Welfare Trust"}</span>
              </h2>
              <p className="text-xs text-[var(--color-muted)] max-w-3xl leading-relaxed mb-6">
                Under the Cooperative Marketplace model, every completed booking automatically credits a dedicated welfare allocation directly to the artisan's social security pool, enabling group health insurance, emergency accidental disability cover, and child scholarship programs.
              </p>

              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs">
                  <div className="text-teal-800 font-bold uppercase tracking-wider text-[10px]">Total Federation Corpus</div>
                  <div className="text-2xl font-extrabold text-teal-950 mt-1">₹48,50,000</div>
                  <div className="text-[11px] text-teal-700 mt-1">Held in State Apex Cooperative Bank</div>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                  <div className="text-amber-800 font-bold uppercase tracking-wider text-[10px]">Active Covered Workers</div>
                  <div className="text-2xl font-extrabold text-amber-950 mt-1">586 Artisans</div>
                  <div className="text-[11px] text-amber-700 mt-1">100% Insured under PM Suraksha Bima</div>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                  <div className="text-blue-800 font-bold uppercase tracking-wider text-[10px]">Claims Disbursed (2026)</div>
                  <div className="text-2xl font-extrabold text-blue-950 mt-1">₹3,40,000</div>
                  <div className="text-[11px] text-blue-700 mt-1">Medical & Tool grant assistance</div>
                </div>
              </div>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
