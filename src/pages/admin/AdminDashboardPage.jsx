import React, { useCallback, useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { adminAPI } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";

export default function AdminDashboardPage() {
  const { lang, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [reports, setReports] = useState([]);
  const [verifyingId, setVerifyingId] = useState(null);
  const [resolvingId, setResolvingId] = useState(null);
  const [reportFilter, setReportFilter] = useState("pending");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p, r] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getPendingContractors(),
        adminAPI.getReports(reportFilter),
      ]);
      setStats(s.data.stats || null);
      setPending(p.data.contractors || []);
      setReports(r.data.reports || []);
    } catch (err) {
      toast.error(err.response?.data?.message || t("app.error"));
    } finally {
      setLoading(false);
    }
  }, [t, reportFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function verifyContractor(id) {
    setVerifyingId(id);
    try {
      await adminAPI.verifyContractor(id);
      toast.success(lang === "hi" ? "कॉन्ट्रैक्टर वेरिफाई हुआ" : "Contractor verified");
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || t("app.error"));
    } finally {
      setVerifyingId(null);
    }
  }

  async function resolveReport(id, status) {
    setResolvingId(id);
    try {
      await adminAPI.resolveReport(id, status);
      toast.success(
        status === "resolved"
          ? (lang === "hi" ? "रिपोर्ट resolved" : "Report resolved")
          : (lang === "hi" ? "रिपोर्ट rejected" : "Report rejected")
      );
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || t("app.error"));
    } finally {
      setResolvingId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:px-6">
      <section className="glass-card p-5 md:p-7">
        <h1 className="font-['Space_Grotesk'] text-3xl text-slate-100 font-semibold mb-4">
          {lang === "hi" ? "एडमिन पैनल" : "Admin Panel"}
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            ["Users", stats?.total_users || 0],
            ["Contractors", stats?.total_contractors || 0],
            ["Verified", stats?.verified_contractors || 0],
            ["Reviews Today", stats?.reviews_today || 0],
            ["Featured", stats?.active_featured || 0],
          ].map(([k, v]) => (
            <div key={k} className="card text-center">
              <p className="text-xs text-slate-300">{k}</p>
              <p className="text-2xl text-cyan-200 font-bold mt-1">{v}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card">
            <h2 className="text-sm font-semibold text-slate-100 mb-3">
              {lang === "hi" ? "पेंडिंग कॉन्ट्रैक्टर्स" : "Pending Contractors"}
            </h2>
            {pending.length === 0 ? (
              <p className="text-xs text-slate-300">{lang === "hi" ? "कोई पेंडिंग प्रोफ़ाइल नहीं" : "No pending profiles."}</p>
            ) : (
              <div className="space-y-2">
                {pending.map((c) => (
                  <div key={c.id} className="rounded-xl border border-white/10 p-2.5 bg-slate-950/30">
                    <p className="text-sm text-slate-100 font-medium">{c.business_name || c.user_name || "Contractor"}</p>
                    <p className="text-xs text-slate-300">{c.phone || "No phone"}</p>
                    <button
                      onClick={() => verifyContractor(c.id)}
                      disabled={verifyingId === c.id}
                      className="btn-secondary !py-1.5 !px-3 text-xs mt-2"
                    >
                      {verifyingId === c.id ? (lang === "hi" ? "वेरिफाई..." : "Verifying...") : (lang === "hi" ? "वेरिफाई करें" : "Verify")}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-sm font-semibold text-slate-100 mb-3">
              {lang === "hi" ? "रिपोर्ट क्यू" : "Reports Queue"}
            </h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {["pending", "resolved", "rejected", "all"].map((f) => (
                <button
                  key={f}
                  onClick={() => setReportFilter(f)}
                  className={`pill-chip ${reportFilter === f ? "!bg-cyan-200 !text-slate-950 !border-cyan-200" : ""}`}
                >
                  {f}
                </button>
              ))}
            </div>
            {reports.length === 0 ? (
              <p className="text-xs text-slate-300">{lang === "hi" ? "कोई पेंडिंग रिपोर्ट नहीं" : "No pending reports."}</p>
            ) : (
              <div className="space-y-2">
                {reports.map((r) => (
                  <div key={r.id} className="rounded-xl border border-white/10 p-2.5 bg-slate-950/30">
                    <p className="text-sm text-slate-100">{r.reason || "No reason provided"}</p>
                    <p className="text-xs text-slate-300 mt-1">
                      {lang === "hi" ? "रिपोर्टर" : "Reporter"}: {r.reporter_name || "Unknown"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Status: <span className="capitalize">{r.status}</span>
                    </p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => resolveReport(r.id, "resolved")}
                        disabled={resolvingId === r.id || reportFilter !== "pending"}
                        className="btn-secondary !py-1 !px-2 text-xs"
                      >
                        {lang === "hi" ? "Resolve" : "Resolve"}
                      </button>
                      <button
                        onClick={() => resolveReport(r.id, "rejected")}
                        disabled={resolvingId === r.id || reportFilter !== "pending"}
                        className="btn-secondary !py-1 !px-2 text-xs text-rose-200 border-rose-300/40"
                      >
                        {lang === "hi" ? "Reject" : "Reject"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
