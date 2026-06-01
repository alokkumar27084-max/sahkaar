import React from "react";
import { FiUsers, FiStar, FiAlertTriangle } from "react-icons/fi";
import { BtnOutline, MiniChart, downloadCsv, } from "./AdminShared";
import { FiDownload, FiAward } from "react-icons/fi";

export default function AnalyticsPanel({ analytics, activity }) {
  return (
    <div className="space-y-6">
      {analytics && (
        <>
          <div className="grid md:grid-cols-2 gap-5">
            <MiniChart data={analytics.registration_trend || []} label="📈 User Registrations (30 days)" />
            <MiniChart data={analytics.review_trend || []} label="⭐ Reviews (30 days)" />
          </div>

          <div className="card p-5 border border-border bg-surface">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-heading flex items-center gap-2 uppercase tracking-wider">
                <FiAward size={16} className="text-amber-500" /> Top Contractors by Leads
              </h3>
              <BtnOutline onClick={() => downloadCsv("top-contractors.csv", analytics.top_contractors || [])} className="flex items-center gap-1.5 font-bold">
                <FiDownload size={13} /> Export Leads List
              </BtnOutline>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px] border-collapse">
                <thead className="text-xs text-muted uppercase tracking-wider font-bold">
                  <tr className="border-b border-border">
                    <th className="text-left p-2.5">#</th>
                    <th className="text-left p-2.5">Name</th>
                    <th className="text-left p-2.5">Category</th>
                    <th className="text-left p-2.5">Rating</th>
                    <th className="text-left p-2.5">Views</th>
                    <th className="text-left p-2.5">Leads</th>
                    <th className="text-left p-2.5">Reviews</th>
                  </tr>
                </thead>
                <tbody>
                  {(analytics.top_contractors || []).map((c, i) => (
                    <tr key={c.id} className="border-b border-border hover:bg-bg-elevated/40 transition">
                      <td className="p-2.5 text-muted font-bold">{i + 1}</td>
                      <td className="p-2.5 text-heading font-semibold">{c.name || "—"}</td>
                      <td className="p-2.5 text-primary text-xs font-bold">{c.category || "—"}</td>
                      <td className="p-2.5 text-amber-500 font-bold">{c.rating ? Number(c.rating).toFixed(1) : "—"}</td>
                      <td className="p-2.5 text-body">{c.views_count || 0}</td>
                      <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400">{c.leads_count || 0}</td>
                      <td className="p-2.5 text-body">{c.review_count || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Activity feed */}
      {activity && (
        <div className="grid md:grid-cols-3 gap-5">
          <div className="card p-5 border border-border bg-surface">
            <h3 className="font-bold text-heading text-sm mb-4 flex items-center gap-2 uppercase tracking-wider">
              <FiUsers size={16} className="text-primary" /> Recent Registrations
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {activity.users.map((u) => (
                <div key={u.id} className="p-3.5 rounded-xl bg-bg-elevated border border-border">
                  <p className="text-sm font-bold text-heading">{u.name || "Unnamed"}</p>
                  <p className="text-xs text-muted mt-0.5 capitalize font-medium">{u.role} · {u.phone || "—"}</p>
                </div>
              ))}
              {activity.users.length === 0 && <p className="text-xs text-muted text-center py-8 font-medium">No recent registrations.</p>}
            </div>
          </div>

          <div className="card p-5 border border-border bg-surface">
            <h3 className="font-bold text-heading text-sm mb-4 flex items-center gap-2 uppercase tracking-wider">
              <FiStar size={16} className="text-amber-500" /> Recent User Reviews
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {activity.reviews.map((r) => (
                <div key={r.id} className="p-3.5 rounded-xl bg-bg-elevated border border-border">
                  <div className="flex items-center gap-0.5 mb-1.5">
                    {[...Array(5)].map((_, i) => <FiStar key={i} size={10} className={i < r.rating ? "text-amber-500 fill-amber-500" : "text-border"} />)}
                  </div>
                  <p className="text-xs text-muted font-medium">Contractor #{r.contractor_id} · {r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN") : ""}</p>
                </div>
              ))}
              {activity.reviews.length === 0 && <p className="text-xs text-muted text-center py-8 font-medium">No recent reviews.</p>}
            </div>
          </div>

          <div className="card p-5 border border-border bg-surface">
            <h3 className="font-bold text-heading text-sm mb-4 flex items-center gap-2 uppercase tracking-wider">
              <FiAlertTriangle size={16} className="text-rose-500" /> Recent User Reports
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {activity.reports.map((r) => (
                <div key={r.id} className="p-3.5 rounded-xl bg-bg-elevated border border-border">
                  <p className="text-sm font-bold text-heading">Report #{r.id}</p>
                  <p className="text-xs text-muted mt-0.5 capitalize font-medium">Status: {r.status} · {r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN") : ""}</p>
                </div>
              ))}
              {activity.reports.length === 0 && <p className="text-xs text-muted text-center py-8 font-medium">No recent reports.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
