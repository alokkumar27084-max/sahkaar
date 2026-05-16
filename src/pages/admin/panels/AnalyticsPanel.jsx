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

          <div className="glass-card rounded-2xl p-5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--color-heading)] flex items-center gap-2">
                <FiAward size={16} className="text-amber-400" /> Top Contractors by Leads
              </h3>
              <BtnOutline onClick={() => downloadCsv("top-contractors.csv", analytics.top_contractors || [])}>
                <FiDownload className="inline mr-1" />Export
              </BtnOutline>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="text-[var(--color-muted)]">
                  <tr>
                    <th className="text-left p-2">#</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-left p-2">Rating</th>
                    <th className="text-left p-2">Views</th>
                    <th className="text-left p-2">Leads</th>
                    <th className="text-left p-2">Reviews</th>
                  </tr>
                </thead>
                <tbody>
                  {(analytics.top_contractors || []).map((c, i) => (
                    <tr key={c.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                      <td className="p-2 text-[var(--color-muted)]">{i + 1}</td>
                      <td className="p-2 text-[var(--color-heading)] font-medium">{c.name || "—"}</td>
                      <td className="p-2 text-indigo-400 text-xs">{c.category || "—"}</td>
                      <td className="p-2 text-amber-400">{c.rating ? Number(c.rating).toFixed(1) : "—"}</td>
                      <td className="p-2 text-[var(--color-body)]">{c.views_count || 0}</td>
                      <td className="p-2 font-bold text-cyan-400">{c.leads_count || 0}</td>
                      <td className="p-2 text-[var(--color-body)]">{c.review_count || 0}</td>
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
          <div className="glass-card rounded-2xl p-5 border border-white/10">
            <h3 className="font-semibold text-[var(--color-heading)] mb-3 flex items-center gap-2"><FiUsers size={16} className="text-indigo-400" /> Recent Users</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activity.users.map((u) => (
                <div key={u.id} className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-sm font-medium text-[var(--color-heading)]">{u.name || "Unnamed"}</p>
                  <p className="text-xs text-[var(--color-muted)]">{u.role} · {u.phone || "—"}</p>
                </div>
              ))}
              {activity.users.length === 0 && <p className="text-sm text-[var(--color-muted)] text-center py-4">No recent users.</p>}
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5 border border-white/10">
            <h3 className="font-semibold text-[var(--color-heading)] mb-3 flex items-center gap-2"><FiStar size={16} className="text-amber-400" /> Recent Reviews</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activity.reviews.map((r) => (
                <div key={r.id} className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => <FiStar key={i} size={10} className={i < r.rating ? "text-amber-400 fill-amber-400" : "text-white/20"} />)}
                  </div>
                  <p className="text-xs text-[var(--color-muted)]">Contractor #{r.contractor_id} · {r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN") : ""}</p>
                </div>
              ))}
              {activity.reviews.length === 0 && <p className="text-sm text-[var(--color-muted)] text-center py-4">No recent reviews.</p>}
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5 border border-white/10">
            <h3 className="font-semibold text-[var(--color-heading)] mb-3 flex items-center gap-2"><FiAlertTriangle size={16} className="text-red-400" /> Recent Reports</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activity.reports.map((r) => (
                <div key={r.id} className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-sm font-medium text-[var(--color-heading)]">Report #{r.id}</p>
                  <p className="text-xs text-[var(--color-muted)]">Status: {r.status} · {r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN") : ""}</p>
                </div>
              ))}
              {activity.reports.length === 0 && <p className="text-sm text-[var(--color-muted)] text-center py-4">No recent reports.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
