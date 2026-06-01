import React from "react";
import {
  FiUsers, FiUserCheck, FiCheckCircle, FiAlertTriangle, FiStar, FiAward,
} from "react-icons/fi";
import { StatCard } from "./AdminShared";
import { BtnOutline, BtnDanger } from "./AdminShared";

export default function OverviewPanel({ stats, contractors, reports, busy, onVerify, onResolve, onViewContractor }) {
  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats?.total_users || 0} icon={FiUsers} color="bg-primary/10 text-primary border border-primary/20" />
        <StatCard label="Contractors" value={stats?.total_contractors || 0} icon={FiUserCheck} color="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20" />
        <StatCard label="Verified" value={stats?.verified_contractors || 0} icon={FiCheckCircle} color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" />
        <StatCard label="Pending" value={stats?.pending_contractors || 0} icon={FiAlertTriangle} color="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Customers" value={stats?.total_customers || 0} icon={FiUsers} color="bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20" />
        <StatCard label="Admins" value={stats?.total_admins || 0} icon={FiUsers} color="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20" />
        <StatCard label="Reviews Today" value={stats?.reviews_today || 0} icon={FiStar} color="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" />
        <StatCard label="Featured" value={stats?.active_featured || 0} icon={FiAward} color="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20" />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Pending verifications */}
        <div className="card p-5 border border-border bg-surface">
          <h3 className="font-bold text-heading mb-4 flex items-center gap-2">
            <FiUserCheck size={16} className="text-amber-500" /> Pending Verifications
          </h3>
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {contractors.filter((c) => c.verification_status === "pending").slice(0, 8).map((c) => (
              <div key={c.id} className="flex flex-col gap-2 p-3.5 rounded-xl bg-bg-elevated border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-heading">{c.business_name || c.user_name || "Contractor"}</p>
                    <p className="text-xs text-muted mt-0.5">{c.phone || "No phone"} · {c.category || "—"}</p>
                  </div>
                  <BtnOutline onClick={() => onViewContractor(c)}>View Details</BtnOutline>
                </div>
                <div className="flex gap-2 mt-1">
                  <button 
                    onClick={() => onVerify(c, "approved")} 
                    disabled={busy} 
                    className="flex-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white py-1.5 text-xs rounded-lg font-bold transition disabled:opacity-40"
                  >
                    ✓ Approve
                  </button>
                  <BtnDanger onClick={() => onVerify(c, "rejected")} disabled={busy} className="flex-1 !py-1.5 rounded-lg">
                    ✗ Reject
                  </BtnDanger>
                </div>
              </div>
            ))}
            {!contractors.some((c) => c.verification_status === "pending") && (
              <p className="text-sm text-muted py-8 text-center font-medium">No pending verifications ✓</p>
            )}
          </div>
        </div>

        {/* Pending reports */}
        <div className="card p-5 border border-border bg-surface">
          <h3 className="font-bold text-heading mb-4 flex items-center gap-2">
            <FiAlertTriangle size={16} className="text-rose-500" /> Pending Reports
          </h3>
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {reports.filter((r) => r.status === "pending").slice(0, 8).map((r) => (
              <div key={r.id} className="p-3.5 rounded-xl bg-bg-elevated border border-border">
                <p className="text-sm text-body font-medium leading-relaxed">{r.reason || "No reason given"}</p>
                <p className="text-xs text-muted mt-1.5">
                  Reporter: {r.reporter_name || "Unknown"} · Contractor: {r.business_name || `#${r.contractor_id}`}
                </p>
                <div className="flex gap-2 mt-3">
                  <BtnOutline onClick={() => onResolve(r.id, "resolved")} disabled={busy} className="flex items-center gap-1">
                    <FiCheckCircle size={12} /> Resolve Report
                  </BtnOutline>
                  <BtnDanger onClick={() => onResolve(r.id, "rejected")} disabled={busy}>Reject Report</BtnDanger>
                </div>
              </div>
            ))}
            {!reports.some((r) => r.status === "pending") && (
              <p className="text-sm text-muted py-8 text-center font-medium">No pending reports ✓</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
