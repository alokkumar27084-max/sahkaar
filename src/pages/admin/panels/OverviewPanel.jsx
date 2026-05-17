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
        <StatCard label="Total Users" value={stats?.total_users || 0} icon={FiUsers} color="from-indigo-500 to-indigo-600" />
        <StatCard label="Contractors" value={stats?.total_contractors || 0} icon={FiUserCheck} color="from-cyan-500 to-teal-500" />
        <StatCard label="Verified" value={stats?.verified_contractors || 0} icon={FiCheckCircle} color="from-emerald-500 to-green-500" />
        <StatCard label="Pending" value={stats?.pending_contractors || 0} icon={FiAlertTriangle} color="from-amber-500 to-orange-500" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Customers" value={stats?.total_customers || 0} icon={FiUsers} color="from-violet-500 to-purple-500" />
        <StatCard label="Admins" value={stats?.total_admins || 0} icon={FiUsers} color="from-rose-500 to-pink-500" />
        <StatCard label="Reviews Today" value={stats?.reviews_today || 0} icon={FiStar} color="from-yellow-500 to-amber-500" />
        <StatCard label="Featured" value={stats?.active_featured || 0} icon={FiAward} color="from-blue-500 to-indigo-500" />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Pending verifications */}
        <div className="glass-card rounded-2xl p-5 border border-white/10">
          <h3 className="font-semibold text-[var(--color-heading)] mb-4 flex items-center gap-2">
            <FiUserCheck size={16} className="text-amber-400" /> Pending Verifications
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {contractors.filter((c) => c.verification_status === "pending").slice(0, 8).map((c) => (
              <div key={c.id} className="flex flex-col gap-2 p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-heading)]">{c.business_name || c.user_name || "Contractor"}</p>
                    <p className="text-xs text-[var(--color-muted)]">{c.phone || "No phone"} · {c.category || "—"}</p>
                  </div>
                  <BtnOutline onClick={() => onViewContractor(c)}>View</BtnOutline>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onVerify(c, "approved")} disabled={busy} className="flex-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 py-1.5 text-xs rounded-lg font-medium transition">
                    ✓ Approve
                  </button>
                  <BtnDanger onClick={() => onVerify(c, "rejected")} disabled={busy} className="flex-1 !py-1.5 rounded-lg">
                    ✗ Reject
                  </BtnDanger>
                </div>
              </div>
            ))}
            {!contractors.some((c) => c.verification_status === "pending") && (
              <p className="text-sm text-[var(--color-muted)] py-4 text-center">No pending verifications ✓</p>
            )}
          </div>
        </div>

        {/* Pending reports */}
        <div className="glass-card rounded-2xl p-5 border border-white/10">
          <h3 className="font-semibold text-[var(--color-heading)] mb-4 flex items-center gap-2">
            <FiAlertTriangle size={16} className="text-red-400" /> Pending Reports
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {reports.filter((r) => r.status === "pending").slice(0, 8).map((r) => (
              <div key={r.id} className="p-3 rounded-xl bg-white/5 border border-white/5">
                <p className="text-sm text-[var(--color-body)]">{r.reason || "No reason given"}</p>
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  Reporter: {r.reporter_name || "Unknown"} · Contractor: {r.business_name || `#${r.contractor_id}`}
                </p>
                <div className="flex gap-2 mt-2">
                  <BtnOutline onClick={() => onResolve(r.id, "resolved")} disabled={busy}>
                    <FiCheckCircle className="inline mr-1" /> Resolve
                  </BtnOutline>
                  <BtnDanger onClick={() => onResolve(r.id, "rejected")} disabled={busy}>Reject</BtnDanger>
                </div>
              </div>
            ))}
            {!reports.some((r) => r.status === "pending") && (
              <p className="text-sm text-[var(--color-muted)] py-4 text-center">No pending reports ✓</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
