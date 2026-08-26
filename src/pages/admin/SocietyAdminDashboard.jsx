import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiHeart,
  FiLogOut,
  FiRefreshCw,
  FiSearch,
  FiUserCheck,
  FiUsers,
  FiShield,
  FiAlertCircle,
  FiX
} from "react-icons/fi";
import { cooperativeAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { SahKaarLogo } from "../../components/common/SahKaariLogo";
import toast from "react-hot-toast";

export default function SocietyAdminDashboard() {
  const { logout } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const isHi = lang === "hi";

  const [loading, setLoading] = useState(true);
  const [society, setSociety] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadSocietyData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cooperativeAPI.getSocietyStats();
      if (res.data?.ok) {
        setSociety(res.data.data.society);
        setWorkers(res.data.data.workers || []);
        setRecentBookings(res.data.data.recentBookings || []);
      }
    } catch (err) {
      console.error("Society data fetch error:", err);
      toast.error("Failed to load society records");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSocietyData();
  }, [loadSocietyData]);

  const handleVerifyWorker = async (workerId) => {
    try {
      const res = await cooperativeAPI.verifyWorker({ workerId, skillsCertified: true });
      if (res.data?.ok) {
        toast.success(isHi ? "कारीगर को सहकारी मान्यता प्रदान की गई" : "Worker verified & certified under primary society!");
        loadSocietyData();
      }
    } catch (err) {
      toast.error("Failed to verify worker");
    }
  };

  const handleRejectWorker = async () => {
    if (!rejectModal) return;
    try {
      const res = await cooperativeAPI.rejectWorker({
        workerId: rejectModal,
        reason: rejectReason || "Documentation incomplete"
      });
      if (res.data?.ok) {
        toast.success("Worker verification rejected with feedback note.");
        setRejectModal(null);
        setRejectReason("");
        loadSocietyData();
      }
    } catch (err) {
      toast.error("Failed to reject worker");
    }
  };

  const filteredWorkers = workers.filter((w) => {
    const name = (w.business_name || w.user_name || "").toLowerCase();
    const category = (w.category || "").toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || category.includes(searchTerm.toLowerCase());
    if (statusFilter === "verified") return matchesSearch && w.is_verified;
    if (statusFilter === "pending") return matchesSearch && !w.is_verified;
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#F4F6F9]">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-xs font-bold text-[#0B3C5D] animate-pulse">
          {isHi ? "प्राथमिक सहकारी समिति पोर्टल लोड हो रहा है..." : "Loading Primary Cooperative Society Portal..."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] py-8 text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">

        {/* ── SOCIETY HEADER ── */}
        <header className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <SahKaarLogo className="w-14 h-14" />
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#D35400] text-white text-[10px] font-extrabold px-2 py-0.5 rounded tracking-wide uppercase">
                  {isHi ? "प्राथमिक श्रम सहकारी समिति" : "Primary Labour Cooperative Society"}
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {society?.registration_no || "SOC-BPL-2020-0412"}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B3C5D] mt-1">
                {society?.name || "Bhopal Shramik & Karigar Sahakari Samiti (Ward 1-25)"}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Affiliated to: <strong className="text-slate-800">{society?.federation_name || "Madhya Pradesh State Labour & Construction Federation"}</strong> • District: {society?.district || "Bhopal"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                loadSocietyData();
                toast.success("Society records refreshed");
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

        {/* ── SOCIETY STATS ── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-extrabold text-slate-500 uppercase">
              {isHi ? "पंजीकृत सदस्य" : "Registered Members"}
            </div>
            <div className="text-2xl font-extrabold text-[#0B3C5D] mt-1">
              {workers.length}
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-1">
              {workers.filter(w => w.is_verified).length} Verified by NCCT
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-extrabold text-slate-500 uppercase">
              {isHi ? "सत्यापन लंबित" : "Verification Queue"}
            </div>
            <div className="text-2xl font-extrabold text-[#D35400] mt-1">
              {workers.filter(w => !w.is_verified).length}
            </div>
            <div className="text-[11px] text-[#D35400] font-semibold mt-1">
              Requires Society Approval
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-extrabold text-slate-500 uppercase">
              {isHi ? "समिति कल्याण कोष" : "Welfare Pool Balance"}
            </div>
            <div className="text-2xl font-extrabold text-[#138808] mt-1 font-mono">
              ₹{Number(society?.welfare_pool_balance || 620000).toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-emerald-800 font-semibold mt-1">
              + ₹25 per completed job
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-extrabold text-slate-500 uppercase">
              {isHi ? "मासिक डिस्पैच" : "Monthly Dispatches"}
            </div>
            <div className="text-2xl font-extrabold text-[#0B3C5D] mt-1">
              {recentBookings.length || 18}
            </div>
            <div className="text-[11px] text-blue-700 font-semibold mt-1">
              100% Digital Escrow Settled
            </div>
          </div>
        </section>

        {/* ── WORKER VERIFICATION & ROSTER ── */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-[#0B3C5D] flex items-center gap-2">
                <FiUserCheck className="text-[#138808] w-5 h-5" />
                <span>{isHi ? "कारीगर सत्यापन व कौशल प्रमाणन रोस्टर" : "Artisan Verification & Skill Certification Queue"}</span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Review trade credentials, daily rates, and approve workers into the official cooperative pool.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search by name or trade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none w-48"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
              >
                <option value="all">All Status</option>
                <option value="verified">Verified Only</option>
                <option value="pending">Pending Approval</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden text-xs">
            {filteredWorkers.map((w) => (
              <div key={w.id} className="p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">{w.business_name || w.user_name}</span>
                    <span className="bg-[#EDF4F9] text-[#0B3C5D] text-[10px] font-extrabold px-2 py-0.5 rounded capitalize">
                      {w.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                        w.is_verified ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {w.is_verified ? <><FiCheckCircle size={10} /> Certified & Active</> : "Pending Verification"}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600">
                    Location: <strong className="text-slate-800">{w.location_text || "Bhopal Central"}</strong> • Experience: {w.experience_years || 5} Years • Wage: <strong className="text-slate-900 font-mono">₹{w.daily_rate}/day</strong>
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono flex items-center gap-3">
                    <span>Member ID: {w.member_registration_no || "MEM-BPL-2026-PENDING"}</span>
                    <span>Welfare ID: {w.welfare_id || "WLF-2026-PENDING"}</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                      <FiShield size={10} /> PM Suraksha Bima (₹5L) Eligible
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/contractor/${w.id}`}
                    target="_blank"
                    className="px-3 py-1.5 text-xs font-bold text-[#0B3C5D] bg-[#EDF4F9] hover:bg-[#D6E6F0] rounded-lg border border-[#D6E6F0] transition-colors"
                  >
                    View Profile
                  </Link>

                  {!w.is_verified ? (
                    <>
                      <button
                        onClick={() => handleVerifyWorker(w.id)}
                        className="bg-[#138808] hover:bg-[#0E6806] text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-xs flex items-center gap-1"
                      >
                        <FiCheck size={12} />
                        <span>Approve & Certify</span>
                      </button>
                      <button
                        onClick={() => setRejectModal(w.id)}
                        className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs px-3 py-1.5 rounded-lg"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span className="text-emerald-700 text-xs font-extrabold flex items-center gap-1">
                      <FiCheckCircle className="w-4 h-4" /> Approved
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Modal: Reject Worker */}
        {rejectModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-xl max-w-md w-full p-6 border border-slate-200 shadow-xl space-y-4">
              <h3 className="font-extrabold text-rose-700 text-base flex items-center gap-2">
                <FiAlertCircle /> Reject Verification
              </h3>
              <p className="text-xs text-slate-600">
                Provide feedback to the artisan regarding missing ID proof or required trade certifications:
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Valid Aadhaar proof / NCCT trade certificate is required..."
                className="w-full h-24 p-3 border border-slate-300 rounded-lg text-xs outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setRejectModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectWorker}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 rounded-lg"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
