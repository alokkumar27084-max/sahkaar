import React from "react";
import { FiSearch, FiDownload, FiTrash2, FiStar } from "react-icons/fi";
import { BtnDanger, BtnOutline, AdminInput, downloadCsv } from "./AdminShared";

export default function ReviewsPanel({ reviews, busy, onDelete, reviewQuery, setReviewQuery }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={15} />
          <AdminInput className="!pl-10" placeholder="Search reviews by comment, reviewer..." value={reviewQuery} onChange={(e) => setReviewQuery(e.target.value)} />
        </div>
        <BtnOutline onClick={() => downloadCsv("reviews.csv", reviews)} className="flex items-center gap-1.5 font-bold">
          <FiDownload size={13} /> Export CSV
        </BtnOutline>
      </div>

      <div className="card border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px] border-collapse">
            <thead className="bg-bg-elevated border-b border-border text-xs text-muted uppercase tracking-wider font-bold">
              <tr>
                <th className="text-left p-3.5 pl-5">Reviewer</th>
                <th className="text-left p-3.5">Contractor</th>
                <th className="text-left p-3.5">Rating</th>
                <th className="text-left p-3.5">Comment</th>
                <th className="text-left p-3.5">Date</th>
                <th className="text-left p-3.5 pr-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id} className="border-b border-border hover:bg-bg-elevated/40 transition">
                  <td className="p-3.5 pl-5 text-heading font-semibold">{r.reviewer_name || `User #${r.user_id}`}</td>
                  <td className="p-3.5 text-body font-medium">{r.contractor_name || `#${r.contractor_id}`}</td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <FiStar key={i} size={12} className={i < r.rating ? "text-amber-500 fill-amber-500" : "text-border"} />
                      ))}
                      <span className="text-xs text-muted font-bold ml-1.5">{r.rating}</span>
                    </div>
                  </td>
                  <td className="p-3.5 text-body max-w-[220px] truncate" title={r.comment}>{r.comment || "—"}</td>
                  <td className="p-3.5 text-muted text-xs font-medium">{r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN") : "—"}</td>
                  <td className="p-3.5 pr-5">
                    <BtnDanger disabled={busy} onClick={() => onDelete(r.id)} className="!py-1" title="Delete review">
                      <FiTrash2 size={13} />
                    </BtnDanger>
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr>
                  <td className="p-12 text-center text-muted font-medium" colSpan={6}>
                    No client reviews found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
