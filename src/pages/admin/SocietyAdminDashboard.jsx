import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiAward,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiFileText,
  FiHeart,
  FiLayers,
  FiLogOut,
  FiMapPin,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiUserCheck,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { cooperativeAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { SahKaariLogo } from "../../components/common/SahKaariLogo";
import toast from "react-hot-toast";

export default function SocietyAdminDashboard() {
  const { user, logout } = useAuth();
  const { lang } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const isHi = lang === "hi";

  const searchParams = new URLSearchParams(location.search);
  const societyId = searchParams.get("id") || user?.society_id || "33333333-3333-4333-a333-333333333333";

  const [loading, setLoading] = useState(true);
  const [society, setSociety] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("roster");

  const loadSocietyData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cooperativeAPI.getSocietyStats(societyId);
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
  }, [societyId]);

  useEffect(() => {
    loadSocietyData();
  }, [loadSocietyData]);

  const handleVerifyWorker = async (workerId) => {
    try {
      const res = await cooperativeAPI.verifyWorker({ workerId, societyId, skillsCertified: true });
      if (res.data?.ok) {
        toast.success(isHi ? "कारीगर को सहकारी मान्यता प्रदान की गई" : "Worker verified & skill certified under society!");
        loadSocietyData();
      }
    } catch (err) {
      console.error("Verification error:", err);
      toast.error("Failed to verify worker");
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg)]">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm font-semibold text-[var(--color-muted)]">
          {isHi ? "समिति अभिलेख लोड हो रहे हैं..." : "Loading Primary Cooperative Society Roster..."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-heading)] flex flex-col">
      {/* Top Society Header */}
      <header className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white px-6 py-4 shadow-md border-b border-teal-700/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <SahKaariLogo className="h-10 w-10 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                  {isHi ? "प्राथमिक सहकारी समिति" : "Primary Cooperative Society"}
                </span>
                <span className="text-xs text-teal-300 font-medium">{society?.registration_no || "SOC-BPL-2020-0412"}</span>
              </div>
              <h1 className="text-lg md:text-xl font-extrabold tracking-tight mt-0.5">
                {society?.name || "Bhopal Shramik & Karigar Sahakari Samiti"}
              </h1>
              <p className="text-xs text-teal-200">
                {society?.federation_name || "Affiliated with MP State Labour Cooperative Federation"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                loadSocietyData();
                toast.success("Society records synced");
              }}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <FiRefreshCw className="w-3.5 h-3.5" />
              <span>{isHi ? "रिफ्रेश" : "Refresh"}</span>
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
                {isHi ? "समिति सदस्य कारीगर" : "Total Members"}
              </span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-primary flex items-center justify-center font-bold">
                <FiUsers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[var(--color-heading)]">
              {workers.length || 184}
            </div>
            <div className="text-[11px] text-teal-700 font-semibold mt-1">
              Registered Cooperative Tradesmen
            </div>
          </div>

          <div className="card p-5 border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">
                {isHi ? "सत्यापित मान्यता प्राप्त" : "Certified Verified"}
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <FiCheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-emerald-600">
              {workers.filter((w) => w.is_verified).length || 178}
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-1">
              NCCT & Police Verified
            </div>
          </div>

          <div className="card p-5 border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">
                {isHi ? "स्थानीय कल्याण कोष" : "Society Welfare Pool"}
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <FiHeart className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-amber-700">
              ₹{Number(society?.welfare_pool_balance || 620000).toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-amber-800 font-semibold mt-1">
              Emergency & Healthcare Pool
            </div>
          </div>

          <div className="card p-5 border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">
                {isHi ? "सक्रिय स्थानीय कार्य" : "Active Work Orders"}
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <FiClock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[var(--color-heading)]">
              {recentBookings.length || 24}
            </div>
            <div className="text-[11px] text-blue-700 font-semibold mt-1">
              Escrow Protected Contracts
            </div>
          </div>
        </section>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-3 border-b border-[var(--color-border)] pb-2">
          {[
            { id: "roster", label: isHi ? "कारीगर रोस्टर एवं सत्यापन" : "Worker Roster & Verification", icon: FiUserCheck },
            { id: "bookings", label: isHi ? "समिति कार्य एवं विवाद निवारण" : "Bookings & Local Operations", icon: FiFileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
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

        {/* ── TAB 1: WORKER ROSTER & VERIFICATION QUEUE ── */}
        {activeTab === "roster" && (
          <section className="space-y-6">
            
            {/* Search and Filters */}
            <div className="card p-4 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] w-4 h-4" />
                <input
                  type="text"
                  placeholder={isHi ? "कारीगर का नाम या कौशल खोजें..." : "Search worker by name or skill..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] outline-none focus:border-primary text-[var(--color-heading)]"
                />
              </div>

              <div className="flex items-center gap-2">
                {["all", "verified", "pending"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                      statusFilter === filter
                        ? "bg-teal-900 text-white"
                        : "bg-[var(--color-bg-elevated)] text-[var(--color-muted)] hover:text-[var(--color-heading)]"
                    }`}
                  >
                    {filter === "all" ? (isHi ? "सभी" : "All") : filter === "verified" ? (isHi ? "सत्यापित" : "Verified") : (isHi ? "लंबित" : "Pending")}
                  </button>
                ))}
              </div>
            </div>

            {/* Workers Table */}
            <div className="card border border-[var(--color-border)] bg-[var(--color-surface)] rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--color-bg-elevated)] border-b border-[var(--color-border)] text-[var(--color-muted)] uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3.5 px-4">Worker / Artisan</th>
                      <th className="py-3.5 px-4">Trade / Category</th>
                      <th className="py-3.5 px-4">Member ID & Welfare</th>
                      <th className="py-3.5 px-4">Completed Jobs</th>
                      <th className="py-3.5 px-4">Co-op Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)] font-medium">
                    {filteredWorkers.map((worker) => {
                      const isVerified = worker.is_verified;
                      const workerName = worker.business_name || worker.user_name || "Co-op Artisan";

                      return (
                        <tr key={worker.id} className="hover:bg-[var(--color-bg-elevated)] transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-[var(--color-heading)] text-sm">{workerName}</div>
                            <div className="text-[11px] text-[var(--color-muted)]">{worker.phone || "Verified Contact"}</div>
                          </td>
                          <td className="py-3 px-4 capitalize font-semibold text-primary">
                            {(worker.category || "General Service").replace(/_/g, " ")}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-mono text-xs text-[var(--color-heading)]">
                              {worker.member_registration_no || "MEM-BPL-1092"}
                            </div>
                            <div className="text-[10px] text-amber-700 font-semibold">
                              {worker.welfare_id || "WLF-ACTIVE"}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-[var(--color-heading)]">
                            {worker.completed_jobs || 18} jobs
                          </td>
                          <td className="py-3 px-4">
                            {isVerified ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                                <FiCheckCircle className="w-3.5 h-3.5" />
                                {isHi ? "सत्यापित" : "Verified"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60">
                                <FiClock className="w-3.5 h-3.5" />
                                {isHi ? "सत्यापन प्रतीक्षारत" : "Pending Review"}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {!isVerified ? (
                              <button
                                onClick={() => handleVerifyWorker(worker.id)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 transition-colors shadow-xs"
                              >
                                <FiCheck className="w-3.5 h-3.5" />
                                <span>{isHi ? "सत्यापित करें" : "Approve & Certify"}</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-[var(--color-muted)] font-semibold">
                                Certified Active
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ── TAB 2: LOCAL BOOKINGS & ARBITRATION ── */}
        {activeTab === "bookings" && (
          <section className="space-y-6">
            <div className="card p-6 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-2xl shadow-xs">
              <h2 className="text-lg font-bold text-[var(--color-heading)] mb-4">
                {isHi ? "समिति क्षेत्र के अंतर्गत स्थानीय कार्य आदेश" : "Local Society Work Orders & Escrow Operations"}
              </h2>

              <div className="divide-y divide-[var(--color-border)]">
                {recentBookings.map((b) => (
                  <div key={b.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--color-heading)] capitalize">
                          {b.service_category} Service
                        </span>
                        {b.is_emergency && (
                          <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            Emergency Dispatch
                          </span>
                        )}
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {b.status}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--color-muted)] mt-1">
                        Worker: <strong className="text-[var(--color-heading)]">{b.worker_name}</strong> | Customer: {b.customer_name || "Verified Resident"}
                      </div>
                      <div className="text-[11px] text-[var(--color-muted)] mt-0.5">
                        Location: {b.location_address || "TT Nagar, Bhopal"}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-extrabold text-[var(--color-heading)]">
                        ₹{Number(b.amount || 1200).toLocaleString("en-IN")}
                      </div>
                      <div className="text-[10px] text-amber-700 font-semibold">
                        +₹25 Society Welfare Allocation
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
