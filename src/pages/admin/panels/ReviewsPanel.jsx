import React from "react";
import { FiSearch, FiDownload, FiTrash2, FiStar } from "react-icons/fi";
import { BtnDanger, BtnOutline, AdminInput, downloadCsv } from "./AdminShared";

export default function ReviewsPanel({ reviews, busy, onDelete, reviewQuery, setReviewQuery }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" size={16} />
          <AdminInput className="!pl-10" placeholder="Search reviews..." value={reviewQuery} onChange={(e) => setReviewQuery(e.target.value)} />
        </div>
        <BtnOutline onClick={() => downloadCsv("reviews.csv", reviews)}><FiDownload className="inline mr-1" />Export</BtnOutline>
      </div>

      <div className="glass-card rounded-2xl border border-white/10 overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-white/5 text-[var(--color-muted)]">
            <tr>
              <th className="text-left p-3">Reviewer</th>
              <th className="text-left p-3">Contractor</th>
              <th className="text-left p-3">Rating</th>
              <th className="text-left p-3">Comment</th>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.02] transition">
                <td className="p-3 text-[var(--color-heading)] font-medium">{r.reviewer_name || `User #${r.user_id}`}</td>
                <td className="p-3 text-[var(--color-body)]">{r.contractor_name || `#${r.contractor_id}`}</td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <FiStar key={i} size={12} className={i < r.rating ? "text-amber-400 fill-amber-400" : "text-white/20"} />
                    ))}
                    <span className="text-xs text-[var(--color-muted)] ml-1">{r.rating}</span>
                  </div>
                </td>
                <td className="p-3 text-[var(--color-body)] max-w-[200px] truncate">{r.comment || "—"}</td>
                <td className="p-3 text-[var(--color-muted)] text-xs">{r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN") : "—"}</td>
                <td className="p-3">
                  <BtnDanger disabled={busy} onClick={() => onDelete(r.id)}><FiTrash2 className="inline" /></BtnDanger>
                </td>
              </tr>
            ))}
            {reviews.length === 0 && <tr><td className="p-6 text-center text-[var(--color-muted)]" colSpan={6}>No reviews found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
