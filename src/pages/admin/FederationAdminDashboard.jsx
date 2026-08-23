import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiCheckCircle,
  FiFilter,
  FiHeart,
  FiLayers,
  FiLogOut,
  FiMapPin,
  FiRefreshCw,
  FiTrendingUp,
  FiUsers,
  FiAlertTriangle,
  FiSend,
  FiShield,
  FiCheck,
  FiX
} from "react-icons/fi";
import { cooperativeAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { SahKaariLogo } from "../../components/common/SahKaariLogo";
import toast from "react-hot-toast";

export default function FederationAdminDashboard() {
  const { logout } = useAuth();
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
  const [forecastLoading, setForecastLoading] = useState(false);
  const [deployModal, setDeployModal] = useState(false);
  const [deployCount, setDeployCount] = useState(15);
  const [deploying, setDeploying] = useState(false);

  // Disputes State
  const [disputes, setDisputes] = useState([]);
  const [disputesLoading, setDisputesLoading] = useState(false);

  // Welfare Claims State
  const [claims, setClaims] = useState([]);
  const [claimsLoading, setClaimsLoading] = useState(false);

  const localitiesList = ["MP Nagar", "Arera Colony", "Kolar Road", "TT Nagar", "Hoshangabad Road"];
  const categoriesList = [
    { id: "electrical", label: "Electrician" },
    { id: "plumbing", label: "Plumber" },
    { id: "carpentry", label: "Carpenter" },
    { id: "painting", label: "Painter" },
    { id: "domestic_help", label: "Domestic Help" },
    { id: "caregiving", label: "Caregiver" },
    { id: "cleaning", label: "Deep Cleaning" },
    { id: "appliance_repair", label: "Appliance Tech" },
    { id: "masonry", label: "Masonry" },
  ];

  const loadFederationData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cooperativeAPI.getFederationStats();
      if (res.data?.ok) {
        setStats(res.data.data.summary);
        setSocieties(res.data.data.societies || []);
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

  const loadDisputes = useCallback(async () => {
    setDisputesLoading(true);
    try {
      const res = await cooperativeAPI.getDisputes();
      if (res.data?.ok) {
        setDisputes(res.data.data);
      }
    } catch (err) {
      console.error("Disputes error:", err);
    } finally {
      setDisputesLoading(false);
    }
  }, []);

  const loadWelfareClaims = useCallback(async () => {
    setClaimsLoading(true);
    try {
      const res = await cooperativeAPI.getWelfareClaims();
      if (res.data?.ok) {
        setClaims(res.data.data);
      }
    } catch (err) {
      console.error("Claims error:", err);
    } finally {
      setClaimsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFederationData();
    loadForecast(forecastLocality, forecastCategory);
    loadDisputes();
    loadWelfareClaims();
  }, [loadFederationData, loadForecast, forecastLocality, forecastCategory, loadDisputes, loadWelfareClaims]);

  async function handleDeployCapacity() {
    setDeploying(true);
    try {
      const res = await cooperativeAPI.allocateWorkforce({
        locality: forecastLocality,
        category: forecastCategory,
        workersNeeded: Number(deployCount),
        notes: Apex Federation mobilization dispatch to 
      });
      if (res.data?.ok) {
        toast.success(res.data.message);
        setDeployModal(false);
        loadForecast(forecastLocality, forecastCategory);
      }
    } catch (err) {
      toast.error("Capacity mobilization failed");
    } finally {
      setDeploying(false);
    }
  }

  async function handleResolveDispute(bookingId, decision) {
    try {
      const res = await cooperativeAPI.resolveDispute({
        bookingId,
        decision,
        resolutionNotes: "Resolved via Federation Arbitration Panel"
      });
      if (res.data?.ok) {
        toast.success(res.data.message);
        loadDisputes();
      }
    } catch (err) {
      toast.error("Dispute settlement failed");
    }
  }

  async function handleApproveClaim(claimId, amount) {
    try {
      const res = await cooperativeAPI.approveClaim({ claimId, approvedAmount: amount });
      if (res.data?.ok) {
        toast.success(res.data.message);
        loadWelfareClaims();
      }
    } catch (err) {
      toast.error("Claim approval failed");
    }
  }

  const formatRupees = (val) => ₹;

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#F4F6F9]">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-xs font-bold text-[#0B3C5D] animate-pulse">
          {isHi ? "राज्य सहकारी महासंघ पोर्टल लोड हो रहा है..." : "Loading State Federation Governance Portal..."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] py-8 text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">

        {/* ── FEDERATION HEADER ── */}
        <header className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <SahKaariLogo className="w-14 h-14" />
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#0B3C5D] text-white text-[10px] font-extrabold px-2 py-0.5 rounded tracking-wide uppercase">
                  {isHi ? "शीर्ष राज्य महासंघ" : "Apex State Federation"}
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  REG-MP-FED-2018-091
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B3C5D] mt-1">
                {isHi
                  ? "मध्य प्रदेश राज्य श्रम एवं निर्माण सहकारी महासंघ"
                  : "Madhya Pradesh State Labour & Construction Cooperative Federation"}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                {isHi
                  ? "सहकारिता मंत्रालय के अधीन पंजीकृत 34 प्राथमिक श्रम सहकारी समितियों का केंद्रीय प्रशासनिक व एआई नियंत्रण केंद्र।"
                  : "Apex governing federation coordinating 34 primary district labour cooperatives & 4,800+ certified artisans."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                loadFederationData();
                loadForecast(forecastLocality, forecastCategory);
                toast.success("Analytics refreshed");
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-[#EDF4F9] text-[#0B3C5D] rounded-lg border border-[#D6E6F0] hover:bg-[#D6E6F0] transition-colors"
            >
              <FiRefreshCw className="w-3.5 h-3.5" />
              <span>{isHi ? "ताज़ा करें" : "Refresh"}</span>
            </button>
            <button
              onClick={async () => {
                await logout();
                navigate("/");
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-rose-50 text-rose-700 rounded-lg border border-rose-200 hover:bg-rose-100 transition-colors"
            >
              <FiLogOut className="w-3.5 h-3.5" />
              <span>{isHi ? "लॉगआउट" : "Logout"}</span>
            </button>
          </div>
        </header>

        {/* ── APEX FEDERATION STATS CARDS ── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-extrabold text-slate-500 uppercase">
              {isHi ? "संबद्ध प्राथमिक समितियाँ" : "Affiliated Societies"}
            </div>
            <div className="text-2xl font-extrabold text-[#0B3C5D] mt-1">
              {stats?.total_societies || 34}
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
              <FiCheckCircle size={12} /> 100% Verified
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-extrabold text-slate-500 uppercase">
              {isHi ? "प्रमाणित कारीगर सदस्य" : "Certified Artisans"}
            </div>
            <div className="text-2xl font-extrabold text-[#0B3C5D] mt-1">
              {stats?.verified_workers || 4850}
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-1">
              Covered under PM Suraksha Bima
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-extrabold text-slate-500 uppercase">
              {isHi ? "राज्य कल्याण कोष कॉर्पस" : "State Welfare Corpus"}
            </div>
            <div className="text-2xl font-extrabold text-[#D35400] mt-1 font-mono">
              {formatRupees(stats?.federation_welfare_corpus || 13750000)}
            </div>
            <div className="text-[11px] text-[#D35400] font-semibold mt-1">
              + ₹25 from every booking
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-extrabold text-slate-500 uppercase">
              {isHi ? "कुल सेवा बुकिंग्स" : "Completed Bookings"}
            </div>
            <div className="text-2xl font-extrabold text-[#0B3C5D] mt-1">
              {stats?.total_bookings || 1420}
            </div>
            <div className="text-[11px] text-blue-700 font-semibold mt-1">
              {stats?.emergency_bookings || 84} Emergency Dispatches
            </div>
          </div>
        </section>

        {/* ── TABS NAVIGATION ── */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          {[
            { id: "forecasting", label: isHi ? "एआई मांग पूर्वानुमान व क्षमता आवंटन" : "AI Demand Intelligence & Allocation", icon: FiTrendingUp },
            { id: "disputes", label: isHi ? "विवाद निवारण एवं मध्यस्थता" : "Dispute Arbitration Console", icon: FiAlertTriangle, badge: disputes.length },
            { id: "welfare", label: isHi ? "कल्याण कोष व क्लेम स्वीकृति" : "Welfare Corpus & Claims", icon: FiHeart, badge: claims.filter(c => c.status === 'PENDING_APPROVAL').length },
            { id: "societies", label: isHi ? "प्राथमिक सहकारी समितियाँ" : "Primary Societies Registry", icon: FiLayers },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={px-4 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 transition-all shrink-0 }
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={px-1.5 py-0.2 rounded-full text-[10px] font-bold }>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── TAB 1: AI DEMAND FORECASTING & ALLOCATION ── */}
        {activeTab === "forecasting" && (
          <section className="space-y-6">
            
            {/* Filter & Action Toolbar */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-[#0B3C5D] flex items-center gap-2">
                  <FiTrendingUp className="text-[#0B3C5D] w-5 h-5" />
                  <span>{isHi ? "क्षेत्रीय मांग पूर्वानुमान मॉडल (एआई इंजन)" : "Localized Predictive Demand & Resource Allocation"}</span>
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  {isHi
                    ? "ऐतिहासिक बुकिंग डेटा व मौसमी मांग के आधार पर आगामी 10 दिनों का अग्रिम श्रम अनुमान।"
                    : "Ensemble statistical moving average & seasonal regression engine predicting trade demand by ward."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Locality Selector */}
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  <FiMapPin className="text-[#0B3C5D] w-4 h-4" />
                  <select
                    value={forecastLocality}
                    onChange={(e) => setForecastLocality(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    {localitiesList.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                {/* Trade Category Selector */}
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  <FiFilter className="text-amber-600 w-4 h-4" />
                  <select
                    value={forecastCategory}
                    onChange={(e) => setForecastCategory(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Action: Deploy Workforce */}
                <button
                  onClick={() => setDeployModal(true)}
                  className="bg-[#138808] hover:bg-[#0E6806] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <FiSend className="w-3.5 h-3.5" />
                  <span>{isHi ? "अग्रिम क्षमता आवंटित करें" : "Mobilize Capacity"}</span>
                </button>
              </div>
            </div>

            {/* Visual Forecast Chart */}
            <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div className="text-xs font-bold text-slate-900">
                  10-Day Horizon: <span className="text-[#0B3C5D] font-extrabold">{forecastLocality}</span> ({forecastCategory.toUpperCase()})
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#0B3C5D]">
                    <span className="w-3 h-3 rounded bg-[#0B3C5D]"></span>
                    <span>AI Predicted Demand</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-[#138808]">
                    <span className="w-3 h-3 rounded bg-[#138808]"></span>
                    <span>Reserved Co-op Capacity</span>
                  </div>
                </div>
              </div>

              {forecastLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="h-64 flex items-end gap-3 pt-6 px-2">
                  {forecastSeries.map((item, idx) => {
                    const maxVal = 50;
                    const predH = Math.min(100, Math.round((item.predicted_demand / maxVal) * 100));
                    const actualH = Math.min(100, Math.round(((item.actual_demand || Math.round(item.predicted_demand * 0.85)) / maxVal) * 100));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <div className="w-full flex items-end justify-center gap-1 h-full">
                          <div
                            style={{ height: ${predH}% }}
                            className="w-1/2 bg-[#0B3C5D] rounded-t hover:bg-[#0E4A73] transition-all relative"
                          >
                            <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                              {item.predicted_demand}
                            </span>
                          </div>
                          <div
                            style={{ height: ${actualH}% }}
                            className="w-1/2 bg-[#138808] rounded-t hover:bg-[#0E6806] transition-all relative"
                          >
                            <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                              {item.actual_demand || Math.round(item.predicted_demand * 0.85)}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 font-mono">
                          {item.date?.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal: Mobilize Capacity */}
            {deployModal && (
              <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                <div className="bg-white rounded-xl max-w-md w-full p-6 border border-slate-200 shadow-xl space-y-4">
                  <h3 className="font-extrabold text-[#0B3C5D] text-base">
                    Mobilize Cooperative Capacity: {forecastLocality}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Broadcast priority allocation notices to certified <strong className="text-[#0B3C5D]">{forecastCategory}</strong> artisans affiliated with nearby Primary Societies.
                  </p>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                      Artisans to Mobilize
                    </label>
                    <input
                      type="number"
                      value={deployCount}
                      onChange={(e) => setDeployCount(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setDeployModal(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeployCapacity}
                      disabled={deploying}
                      className="px-4 py-2 text-xs font-bold text-white bg-[#138808] hover:bg-[#0E6806] rounded-lg shadow-xs"
                    >
                      {deploying ? "Mobilizing..." : "Confirm & Broadcast"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── TAB 2: DISPUTE & GRIEVANCE ARBITRATION ── */}
        {activeTab === "disputes" && (
          <section className="space-y-4">
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-base font-extrabold text-[#0B3C5D] mb-1">
                Cooperative Grievance & Escrow Settlement Panel
              </h2>
              <p className="text-xs text-slate-600 mb-4">
                Apex federation dispute arbitrations with legal escrow lock resolution.
              </p>

              {disputesLoading ? (
                <LoadingSpinner />
              ) : disputes.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No active disputes. All bookings settled in accordance with Cooperative Service Charters.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                  {disputes.map((d) => (
                    <div key={d.booking_id} className="p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{d.customer_name}</span>
                          <span className="text-slate-400">vs</span>
                          <span className="font-bold text-[#0B3C5D]">{d.worker_name}</span>
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded">
                            {d.service_category?.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{d.reason || "Customer service clarification dispute pending arbitration."}</p>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Escrow Amount: <strong className="text-slate-800">₹{d.amount}</strong> | Society: {d.society_name}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleResolveDispute(d.booking_id, "RELEASE_TO_WORKER")}
                          className="bg-[#138808] hover:bg-[#0E6806] text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs"
                        >
                          <FiCheck size={12} />
                          <span>Release to Worker</span>
                        </button>
                        <button
                          onClick={() => handleResolveDispute(d.booking_id, "REFUND_TO_CUSTOMER")}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs"
                        >
                          <FiX size={12} />
                          <span>Refund Customer</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── TAB 3: WELFARE CORPUS & CLAIMS ── */}
        {activeTab === "welfare" && (
          <section className="space-y-4">
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-extrabold text-[#0B3C5D]">
                    Artisan Welfare Corpus & Medical Assistance Claims
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Disbursements funded by the ₹25 per-booking contribution pool and Pradhan Mantri Suraksha Bima.
                  </p>
                </div>
                <div className="text-right font-mono">
                  <div className="text-[10px] uppercase text-slate-500 font-bold">Total Corpus Balance</div>
                  <div className="text-xl font-extrabold text-[#D35400]">
                    {formatRupees(stats?.federation_welfare_corpus || 13750000)}
                  </div>
                </div>
              </div>

              {claimsLoading ? (
                <LoadingSpinner />
              ) : (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden text-xs">
                  {claims.map((c) => (
                    <div key={c.id} className="p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">{c.worker_name}</span>
                          <span className="text-slate-500 font-medium">({c.trade})</span>
                          <span className={	ext-[10px] font-extrabold px-2 py-0.5 rounded }>
                            {c.status}
                          </span>
                        </div>
                        <p className="text-slate-700 font-semibold">{c.claim_type}</p>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Claim ID: {c.id} | Policy Ref: {c.insurance_ref} | Society: {c.society_name}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <div className="text-base font-extrabold text-[#0B3C5D] font-mono">
                            ₹{Number(c.amount).toLocaleString("en-IN")}
                          </div>
                          <div className="text-[10px] text-slate-500">Requested Amount</div>
                        </div>

                        {c.status === "PENDING_APPROVAL" && (
                          <button
                            onClick={() => handleApproveClaim(c.id, c.amount)}
                            className="bg-[#138808] hover:bg-[#0E6806] text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-xs flex items-center gap-1.5"
                          >
                            <FiCheck size={14} />
                            <span>Approve & Disburse</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── TAB 4: PRIMARY SOCIETIES REGISTRY ── */}
        {activeTab === "societies" && (
          <section className="space-y-4">
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-base font-extrabold text-[#0B3C5D] mb-4">
                Affiliated District Cooperative Societies Roster
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {societies.map((s) => (
                  <div key={s.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2">
                    <div className="font-extrabold text-[#0B3C5D] text-sm leading-snug">{s.name}</div>
                    <div className="font-mono text-[10px] text-slate-600">Reg: {s.registration_no}</div>
                    <div className="text-slate-600 font-medium">District: <strong className="text-slate-800">{s.district}</strong></div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between font-bold">
                      <span className="text-slate-600">Welfare Balance</span>
                      <span className="font-mono text-[#D35400]">₹{Number(s.welfare_pool_balance).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Registered Workers</span>
                      <span className="font-bold text-slate-800">{s.worker_count || 12}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
