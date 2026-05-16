import React from "react";
import { FiCheckCircle, FiXCircle, FiDownload } from "react-icons/fi";
import { BtnOutline, BtnDanger, downloadCsv } from "./AdminShared";

export default function ModerationPanel({ reports, busy, reportFilter, setReportFilter, onResolve }) {
  const filters = ["pending", "resolved", "rejected", "all"];
  const visible = reportFilter === "all" ? reports : reports.filter((r) => r.status === reportFilter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 items-center">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setReportFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${reportFilter === f ? "bg-gradient-to-r from-indigo-500 to-cyan-400 text-white shadow" : "bg-white/5 text-[var(--color-muted)] border border-white/10 hover:bg-white/10"}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <BtnOutline onClick={() => downloadCsv(`reports-${reportFilter}.csv`, visible)}>
          <FiDownload className="inline mr-1" />Export
        </BtnOutline>
      </div>

      <div className="space-y-3">
        {visible.map((r) => (
          <div key={r.id} className="glass-card rounded-2xl p-5 border border-white/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-[var(--color-body)]">{r.reason || "No reason provided"}</p>
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  Reporter: {r.reporter_name || "Unknown"} · Contractor: {r.business_name || `#${r.contractor_id}`}
                </p>
                <p className="text-xs text-[var(--color-muted)]">{r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN") : ""}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${r.status === "pending" ? "bg-amber-500/15 text-amber-400" : r.status === "resolved" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                {r.status}
              </span>
            </div>
            {r.status === "pending" && (
              <div className="flex gap-2 mt-3">
                <BtnOutline disabled={busy} onClick={() => onResolve(r.id, "resolved")}>
                  <FiCheckCircle className="inline mr-1" />Resolve
                </BtnOutline>
                <BtnDanger disabled={busy} onClick={() => onResolve(r.id, "rejected")}>
                  <FiXCircle className="inline mr-1" />Reject
                </BtnDanger>
              </div>
            )}
          </div>
        ))}
        {visible.length === 0 && <p className="text-sm text-[var(--color-muted)] text-center py-8">No reports for this filter.</p>}
      </div>
    </div>
  );
}
