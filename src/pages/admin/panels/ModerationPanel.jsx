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
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition border capitalize ${
              reportFilter === f 
                ? "bg-primary border-primary text-white" 
                : "bg-surface border-border text-muted hover:bg-bg-elevated"
            }`}
          >
            {f} Reports
          </button>
        ))}
        <BtnOutline onClick={() => downloadCsv(`reports-${reportFilter}.csv`, visible)} className="flex items-center gap-1.5 font-bold">
          <FiDownload size={13} /> Export CSV
        </BtnOutline>
      </div>

      <div className="space-y-3">
        {visible.map((r) => (
          <div key={r.id} className="card p-5 border border-border bg-surface">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm text-body font-medium leading-relaxed">{r.reason || "No reason provided"}</p>
                <p className="text-xs text-muted">
                  Reporter: {r.reporter_name || "Unknown"} · Contractor: {r.business_name || `#${r.contractor_id}`}
                </p>
                <p className="text-[11px] text-muted font-medium">{r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN") : ""}</p>
              </div>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border capitalize shrink-0 ${
                r.status === "pending" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" : 
                r.status === "resolved" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : 
                "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
              }`}>
                {r.status}
              </span>
            </div>
            {r.status === "pending" && (
              <div className="flex gap-2 mt-4 pt-3.5 border-t border-border">
                <BtnOutline disabled={busy} onClick={() => onResolve(r.id, "resolved")} className="flex items-center gap-1.5 font-bold">
                  <FiCheckCircle size={13} /> Mark Resolved
                </BtnOutline>
                <BtnDanger disabled={busy} onClick={() => onResolve(r.id, "rejected")} className="flex items-center gap-1.5 font-bold">
                  <FiXCircle size={13} /> Reject Report
                </BtnDanger>
              </div>
            )}
          </div>
        ))}
        {visible.length === 0 && (
          <p className="text-sm text-muted text-center py-12 font-medium">No reports found matching this status.</p>
        )}
      </div>
    </div>
  );
}
