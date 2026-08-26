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
  FiX,
  FiFileText,
  FiEye,
  FiAward,
  FiUserCheck
} from "react-icons/fi";
import { cooperativeAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { SahKaarLogo } from "../../components/common/SahKaariLogo";
import { getAvatarUrl } from "../../utils/imageUtils";
import toast from "react-hot-toast";

export default function FederationAdminDashboard() {
  const { logout } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const isHi = lang === "hi";

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [societies, setSocieties] = useState([]);
  const [activeTab, setActiveTab] = useState("verification"); // 'verification', 'forecasting', 'disputes', 'welfare', 'societies'

  // Document Verification Queue State
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [verifyingWorkerId, setVerifyingWorkerId] = useState(null);
  const [inspectingDoc, setInspectingDoc] = useState(null); // { title, url, workerName }
  const [rejectModalWorker, setRejectModalWorker] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

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

  const loadPendingWorkers = useCallback(async () => {
    try {
      const res = await cooperativeAPI.getPendingWorkers();
      if (res.data?.ok) {
        setPendingWorkers(res.data.data || []);
      }
    } catch (err) {
      console.error("Pending workers fetch error:", err);
    }
  }, []);

  const loadFederationData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, _] = await Promise.all([
        cooperativeAPI.getFederationStats(),
        loadPendingWorkers(),
      ]);
      if (statsRes.data?.ok) {
        setStats(statsRes.data.data.summary);
        setSocieties(statsRes.data.data.societies || []);
      }
    } catch (err) {
      console.error("Federation data fetch error:", err);
      toast.error("Could not fetch federation analytics");
    } finally {
      setLoading(false);
    }
  }, [loadPendingWorkers]);

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

  const handleVerifyMaster = async (workerId) => {
    setVerifyingWorkerId(workerId);
    try {
      const res = await cooperativeAPI.verifyWorker({
        workerId,
        skillsCertified: true,
        badgeType: "Cooperative Verified Master",
      });
      if (res.data?.ok) {
        toast.success("Master verified successfully with Golden Verified Shield!");
        loadPendingWorkers();
        loadFederationData();
      }
    } catch (err) {
      toast.error("Verification failed. Please try again.");
    } finally {
      setVerifyingWorkerId(null);
    }
  };

  const handleRejectMaster = async () => {
    if (!rejectModalWorker) return;
    try {
      const res = await cooperativeAPI.rejectWorker({
        workerId: rejectModalWorker.id,
        reason: rejectionReason || "Incomplete documentation submitted. Please re-upload verified documents.",
      });
      if (res.data?.ok) {
        toast.success("Master applicant rejected with feedback note.");
        setRejectModalWorker(null);
        setRejectionReason("");
        loadPendingWorkers();
        loadFederationData();
      }
    } catch (err) {
      toast.error("Rejection action failed.");
    }
  };

  async function handleDeployCapacity() {
    setDeploying(true);
    try {
      const res = await cooperativeAPI.allocateWorkforce({
        locality: forecastLocality,
        category: forecastCategory,
        workersNeeded: Number(deployCount),
        notes: `Apex Federation mobilization dispatch to ${forecastLocality}`,
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
        resolutionNotes: "Resolved via Federation Arbitration Panel",
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

  const formatRupees = (val) => "₹" + Number(val || 0).toLocaleString("en-IN");

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
        <header className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <SahKaarLogo className="w-14 h-14" />
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
                  ? "सहकारिता मंत्रालय के अधीन पंजीकृत 34 प्राथमिक श्रम सहकारी समितियों का केंद्रीय प्रशासनिक व सत्यापन नियंत्रण केंद्र।"
                  : "Apex governing federation coordinating 34 primary district labour cooperatives & verified artisan audit."}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Pending Document Verifications</div>
            <div className="text-2xl font-extrabold text-amber-600">{pendingWorkers.length}</div>
            <span className="text-[10px] text-slate-400 font-semibold">Awaiting Federation Audit</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Verified Master Artisans</div>
            <div className="text-2xl font-extrabold text-[#138808]">
              {stats?.verified_workers || 48}
            </div>
            <span className="text-[10px] text-emerald-600 font-bold">100% Document Verified</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Primary Societies</div>
            <div className="text-2xl font-extrabold text-[#0B3C5D]">{societies.length || 34}</div>
            <span className="text-[10px] text-slate-400 font-semibold">Across 52 MP Districts</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Welfare Corpus Fund</div>
            <div className="text-2xl font-extrabold text-[#D35400] font-mono">
              {formatRupees(stats?.federation_welfare_corpus || 13750000)}
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">Social Security Reserve</span>
          </div>
        </div>

        {/* ── TABS NAVIGATION ── */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          {[
            { id: "verification", label: isHi ? "मास्टर दस्तावेज़ सत्यापन" : "Master Document Verification Queue", icon: FiShield, badge: pendingWorkers.length },
            { id: "forecasting", label: isHi ? "एआई मांग पूर्वानुमान" : "AI Demand Intelligence & Allocation", icon: FiTrendingUp },
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
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 ${
                  active
                    ? "bg-[#0B3C5D] text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${active ? "bg-amber-400 text-slate-900" : "bg-rose-100 text-rose-700"}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ═══════ TAB 1: MASTER DOCUMENT VERIFICATION QUEUE ═══════ */}
        {activeTab === "verification" && (
          <section className="space-y-4">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-extrabold text-[#0B3C5D] flex items-center gap-2">
                    <FiShield className="text-[#0B3C5D] w-5 h-5" />
                    <span>Master Document Verification & Credential Audit</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review submitted government ID cards, skill certificates, and society membership before issuing the official Verified Master Shield.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadPendingWorkers}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1"
                >
                  <FiRefreshCw className="w-3 h-3" /> Refresh Queue
                </button>
              </div>

              {pendingWorkers.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs font-semibold space-y-2">
                  <FiCheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                  <p className="text-sm font-bold text-slate-800">All Master applications are verified!</p>
                  <p className="text-xs text-slate-500">New self-registered workers will appear here for document verification.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendingWorkers.map((worker) => (
                    <div
                      key={worker.id}
                      className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      {/* Master Info */}
                      <div className="flex items-start gap-4">
                        <img
                          src={getAvatarUrl(worker.photo_url || worker.image_url)}
                          alt={worker.business_name || worker.user_name}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-slate-900">
                              {worker.business_name || worker.user_name}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                              Master {worker.category?.replace(/_/g, " ")}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800">
                              Pending Audit
                            </span>
                          </div>

                          <p className="text-xs text-slate-600">
                            📞 {worker.phone} • 🏛️ {worker.society_name || "Bhopal Society"} • Reg: {worker.member_registration_no || "SK-MST-NEW"}
                          </p>

                          <p className="text-[11px] text-slate-500">
                            Cert Body: <span className="font-semibold text-slate-700">{worker.skill_certification_body || "NCCT / Skill Mission"}</span> • Exp: {worker.experience_years || 2} yrs
                          </p>
                        </div>
                      </div>

                      {/* Submitted Document Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {/* ID Proof Button */}
                        <button
                          type="button"
                          onClick={() =>
                            setInspectingDoc({
                              title: "Aadhaar / National ID Proof",
                              url: worker.id_proof_url || "https://images.unsplash.com/photo-1633409381658-a0c3099d3e5e?auto=format&fit=crop&w=800&q=80",
                              workerName: worker.business_name || worker.user_name,
                            })
                          }
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1"
                        >
                          <FiEye className="w-3.5 h-3.5 text-indigo-600" />
                          <span>View ID Proof</span>
                        </button>

                        {/* Certificate Button */}
                        <button
                          type="button"
                          onClick={() =>
                            setInspectingDoc({
                              title: "Trade Skill Certificate",
                              url: worker.certificate_url || "https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=800&q=80",
                              workerName: worker.business_name || worker.user_name,
                            })
                          }
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1"
                        >
                          <FiAward className="w-3.5 h-3.5 text-amber-600" />
                          <span>View Certificate</span>
                        </button>

                        {/* Approve Button */}
                        <button
                          type="button"
                          disabled={verifyingWorkerId === worker.id}
                          onClick={() => handleVerifyMaster(worker.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                        >
                          <FiCheck className="w-4 h-4" />
                          <span>{verifyingWorkerId === worker.id ? "Auditing..." : "Verify & Issue Badge"}</span>
                        </button>

                        {/* Reject Button */}
                        <button
                          type="button"
                          onClick={() => setRejectModalWorker(worker)}
                          className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── TAB 2: AI DEMAND FORECASTING & ALLOCATION ── */}
        {activeTab === "forecasting" && (
          <section className="space-y-6">
            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-[#0B3C5D] flex items-center gap-2">
                  <FiTrendingUp className="text-[#0B3C5D] w-5 h-5" />
                  <span>{isHi ? "क्षेत्रीय मांग पूर्वानुमान मॉडल (एआई इंजन)" : "Localized Predictive Demand & Resource Allocation"}</span>
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Predicting high seasonal demand localities across Bhopal to mobilize reserved cooperative capacity.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
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

                <button
                  onClick={() => setDeployModal(true)}
                  className="bg-[#138808] hover:bg-[#0E6806] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <FiSend className="w-3.5 h-3.5" />
                  <span>{isHi ? "अग्रिम क्षमता आवंटित करें" : "Mobilize Capacity"}</span>
                </button>
              </div>
            </div>

            {/* Forecast Chart */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
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
                            style={{ height: `${predH}%` }}
                            className="w-1/2 bg-[#0B3C5D] rounded-t hover:bg-[#0E4A73] transition-all relative"
                          >
                            <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                              {item.predicted_demand}
                            </span>
                          </div>
                          <div
                            style={{ height: `${actualH}%` }}
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
          </section>
        )}

        {/* ── TAB 3: DISPUTES ── */}
        {activeTab === "disputes" && (
          <section className="space-y-4">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-base font-extrabold text-[#0B3C5D] mb-4">
                Cooperative Dispute Arbitration Console
              </h2>
              {disputes.length === 0 ? (
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
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleResolveDispute(d.booking_id, "RELEASE_TO_WORKER")}
                          className="bg-[#138808] hover:bg-[#0E6806] text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
                        >
                          <FiCheck size={12} />
                          <span>Release to Worker</span>
                        </button>
                        <button
                          onClick={() => handleResolveDispute(d.booking_id, "REFUND_TO_CUSTOMER")}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
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

        {/* ── TAB 4: WELFARE CLAIMS ── */}
        {activeTab === "welfare" && (
          <section className="space-y-4">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-base font-extrabold text-[#0B3C5D]">
                Artisan Welfare Corpus & Medical Assistance Claims
              </h2>
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden text-xs">
                {claims.map((c) => (
                  <div key={c.id} className="p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">{c.worker_name}</span>
                        <span className="text-slate-500 font-medium">({c.trade})</span>
                      </div>
                      <p className="text-slate-700 font-semibold">{c.claim_type}</p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-base font-extrabold text-[#0B3C5D] font-mono">
                          ₹{Number(c.amount).toLocaleString("en-IN")}
                        </div>
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
            </div>
          </section>
        )}

        {/* ── TAB 5: SOCIETIES ── */}
        {activeTab === "societies" && (
          <section className="space-y-4">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-base font-extrabold text-[#0B3C5D] mb-4">
                Affiliated District Cooperative Societies Roster
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {societies.map((s) => (
                  <div key={s.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2">
                    <div className="font-extrabold text-[#0B3C5D] text-sm leading-snug">{s.name}</div>
                    <div className="font-mono text-[10px] text-slate-600">Reg: {s.registration_no}</div>
                    <div className="text-slate-600 font-medium">District: <strong className="text-slate-800">{s.district}</strong></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      </div>

      {/* Document Inspection Modal */}
      {inspectingDoc && (
        <div
          onClick={() => setInspectingDoc(null)}
          className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{inspectingDoc.title}</h3>
                <p className="text-xs text-slate-500">Applicant: {inspectingDoc.workerName}</p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingDoc(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="h-96 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
              <img
                src={inspectingDoc.url}
                alt={inspectingDoc.title}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModalWorker && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">
              Reject Verification for {rejectModalWorker.business_name || rejectModalWorker.user_name}
            </h3>
            <p className="text-xs text-slate-500">
              Please enter the specific reason so the Master artisan can correct their document upload:
            </p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Aadhaar card photo was blurry, or ITI certificate number did not match records."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-rose-600"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModalWorker(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectMaster}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
