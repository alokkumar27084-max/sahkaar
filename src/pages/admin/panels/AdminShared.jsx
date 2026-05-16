// Shared UI atoms and utilities used across all Admin panels
import React from "react";
import { motion } from "framer-motion";
import { getImageUrl } from "../../../utils/imageUtils";

/* ──────────── Buttons ──────────── */
export function BtnPrimary({ children, ...props }) {
  return (
    <button
      className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-cyan-400 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
      {...props}
    >
      {children}
    </button>
  );
}
export function BtnOutline({ children, className = "", ...props }) {
  return (
    <button
      className={`px-3 py-1.5 rounded-lg text-xs font-medium border border-white/15 text-[var(--color-body)] hover:bg-white/5 transition disabled:opacity-40 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export function BtnDanger({ children, className = "", ...props }) {
  return (
    <button
      className={`px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition disabled:opacity-40 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/* ──────────── Form atoms ──────────── */
export function AdminInput({ className = "", ...props }) {
  return (
    <input
      className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[var(--color-body)] placeholder-[var(--color-muted)] text-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30 transition outline-none ${className}`}
      {...props}
    />
  );
}
export function AdminSelect({ children, className = "", ...props }) {
  return (
    <select
      className={`px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[var(--color-body)] text-sm focus:border-indigo-400 outline-none ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

/* ──────────── Stat Card ──────────── */
export function StatCard({ label, value, icon: Icon, color = "from-indigo-500 to-cyan-400", sub }) {
  return (
    <motion.div whileHover={{ y: -2, scale: 1.02 }} className="glass-card rounded-2xl p-5 flex items-center gap-4 border border-white/10">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm text-[var(--color-muted)] font-medium">{label}</p>
        <p className="text-2xl font-bold text-[var(--color-heading)] font-['Space_Grotesk']">{value}</p>
        {sub && <p className="text-xs text-[var(--color-muted)] mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

/* ──────────── Mini Bar Chart ──────────── */
export function MiniChart({ data, label }) {
  const max = Math.max(...(data || []).map((d) => d.count), 1);
  return (
    <div className="glass-card rounded-2xl p-5 border border-white/10">
      <p className="text-sm font-semibold text-[var(--color-heading)] mb-3">{label}</p>
      <div className="flex items-end gap-[2px] h-24">
        {(data || []).slice(-30).map((d, i) => (
          <div key={i} className="flex-1 group relative">
            <div
              className="w-full bg-gradient-to-t from-indigo-500 to-cyan-400 rounded-t-sm transition-all hover:opacity-80"
              style={{ height: `${Math.max((d.count / max) * 100, 4)}%` }}
            />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-[var(--color-surface)] text-[var(--color-body)] text-[10px] px-2 py-1 rounded shadow z-10 whitespace-nowrap">
              {d.count} · {new Date(d.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────── Detail Modal (contractor profile viewer) ──────────── */
export function DetailModal({ data, onClose }) {
  if (!data) return null;
  const c = data.contractor || data;
  const normalizeList = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; }
  };
  const media = [
    c.photo_url, c.image_url,
    ...normalizeList(c.portfolio_photos),
    ...normalizeList(c.portfolio_urls),
  ].filter(Boolean);
  const unique = Array.from(new Set(media)).map((m) => getImageUrl(m));
  const idProof = c.id_proof_url ? getImageUrl(c.id_proof_url) : null;

  return (
    <div
      className="fixed inset-0 z-[1400] bg-black/60 backdrop-blur-sm p-4 overflow-y-auto flex items-start justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full mt-16 glass-card rounded-2xl border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h3 className="text-xl font-bold text-[var(--color-heading)] font-['Space_Grotesk']">
              {c.business_name || data.name || "Profile Details"}
            </h3>
            <p className="text-sm text-[var(--color-muted)] mt-0.5">{data.phone} · {data.email}</p>
          </div>
          <button
            className="px-4 py-2 rounded-xl text-sm font-medium border border-white/10 text-[var(--color-body)] hover:bg-white/5 transition"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Identity */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-1 text-sm text-[var(--color-body)]">
              <p className="text-xs text-[var(--color-muted)] mb-2 uppercase tracking-wider font-bold">Identity</p>
              <p><strong>Name:</strong> {data.name || data.user_name || "—"}</p>
              <p><strong>Role:</strong> {data.role || "contractor"}</p>
              <p><strong>Phone:</strong> {data.phone || "—"}</p>
              <p><strong>Email:</strong> {data.email || "—"}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-1 text-sm text-[var(--color-body)]">
              <p className="text-xs text-[var(--color-muted)] mb-2 uppercase tracking-wider font-bold">Business</p>
              <p><strong>Business:</strong> {c.business_name || "—"}</p>
              <p><strong>Category:</strong> {c.category || "—"}</p>
              <p><strong>Location:</strong> {c.location_text || "—"}</p>
              <p><strong>Rating:</strong> {c.rating ? `★ ${Number(c.rating).toFixed(1)}` : "N/A"}</p>
              <p><strong>Experience:</strong> {c.experience_years ? `${c.experience_years} yrs` : "—"}</p>
              <p><strong>Team Size:</strong> {c.team_size || 1}</p>
              <div className="flex gap-2 mt-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${c.is_verified ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                  {c.is_verified ? "✓ Verified" : "Unverified"}
                </span>
                {c.tier && c.tier !== "standard" && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[var(--color-body)] border border-white/10 capitalize font-bold">{c.tier}</span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {c.description && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-xs text-[var(--color-muted)] mb-2 uppercase tracking-wider font-bold">Bio</p>
              <p className="text-sm text-[var(--color-body)] leading-relaxed">{c.description}</p>
            </div>
          )}

          {/* ID Proof */}
          {idProof && (
            <div>
              <p className="text-xs text-[var(--color-muted)] mb-2 uppercase tracking-wider font-bold">ID Proof</p>
              <a href={idProof} target="_blank" rel="noreferrer" className="inline-block rounded-xl overflow-hidden border border-amber-500/30 hover:border-amber-400 transition">
                <img src={idProof} alt="ID Proof" className="h-32 object-contain bg-white/5" />
              </a>
            </div>
          )}

          {/* Portfolio */}
          {unique.length > 0 && (
            <div>
              <p className="text-xs text-[var(--color-muted)] mb-2 uppercase tracking-wider font-bold">Portfolio ({unique.length} photos)</p>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {unique.map((m, i) => (
                  <a key={i} href={m} target="_blank" rel="noreferrer" className="rounded-xl overflow-hidden border border-white/10 group">
                    <img src={m} alt="" className="w-full h-24 object-cover group-hover:scale-105 transition-transform" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ──────────── CSV utilities ──────────── */
function toCsv(rows) {
  if (!rows?.length) return "";
  const keys = Array.from(rows.reduce((s, r) => { Object.keys(r || {}).forEach((k) => s.add(k)); return s; }, new Set()));
  const esc = (v) => { if (v == null) return ""; const s = typeof v === "object" ? JSON.stringify(v) : String(v); return `"${s.replace(/"/g, '""')}"`; };
  return [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
}

export function downloadCsv(filename, rows) {
  const csv = toCsv(rows);
  if (!csv) return;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement("a"), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
}
