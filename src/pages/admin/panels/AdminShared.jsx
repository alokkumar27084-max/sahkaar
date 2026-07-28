// Shared UI atoms and utilities used across all Admin panels
import React from "react";
import { motion } from "framer-motion";
import { getImageUrl } from "../../../utils/imageUtils";

/* ──────────── Buttons ──────────── */
export function BtnPrimary({ children, ...props }) {
  return (
    <button
      className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
      {...props}
    >
      {children}
    </button>
  );
}

export function BtnOutline({ children, className = "", ...props }) {
  return (
    <button
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-heading bg-surface hover:bg-bg-elevated transition disabled:opacity-40 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function BtnDanger({ children, className = "", ...props }) {
  return (
    <button
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition disabled:opacity-40 ${className}`}
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
      className={`w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-body placeholder-muted text-sm focus:border-primary transition outline-none ${className}`}
      {...props}
    />
  );
}

export function AdminSelect({ children, className = "", ...props }) {
  return (
    <select
      className={`px-4 py-2.5 rounded-lg bg-surface border border-border text-body text-sm focus:border-primary outline-none transition ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

/* ──────────── Stat Card ──────────── */
export function StatCard({ label, value, icon: Icon, color = "bg-primary/10 text-primary", sub }) {
  return (
    <motion.div whileHover={{ y: -1 }} className="card p-5 flex items-center gap-4 border border-border bg-surface transition-all">
      <div className={`w-12 h-12 rounded-lg ${color.includes("bg-gradient") ? "bg-primary/10 text-primary" : color} flex items-center justify-center shadow-sm flex-shrink-0`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs font-bold text-muted uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-heading mt-0.5">{value}</p>
        {sub && <p className="text-[11px] text-muted font-medium mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

/* ──────────── Mini Bar Chart ──────────── */
export function MiniChart({ data, label }) {
  const max = Math.max(...(data || []).map((d) => d.count), 1);
  return (
    <div className="card p-5 border border-border bg-surface">
      <p className="text-sm font-bold text-heading mb-4">{label}</p>
      <div className="flex items-end gap-[3px] h-24">
        {(data || []).slice(-30).map((d, i) => (
          <div key={i} className="flex-1 group relative">
            <div
              className="w-full bg-primary/80 rounded-t-sm transition-all hover:bg-primary"
              style={{ height: `${Math.max((d.count / max) * 100, 4)}%` }}
            />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-surface text-body border border-border text-[10px] px-2 py-1 rounded shadow-lg z-10 whitespace-nowrap">
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
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full mt-16 bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border bg-bg-elevated">
          <div>
            <h3 className="text-lg font-bold text-heading">
              {c.business_name || data.name || "Profile Details"}
            </h3>
            <p className="text-xs text-muted mt-0.5">{data.phone} · {data.email}</p>
          </div>
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-body hover:bg-bg-elevated transition"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Identity */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-bg-elevated rounded-xl p-4 border border-border space-y-1.5 text-sm text-body">
              <p className="text-xs text-muted mb-2.5 uppercase tracking-wider font-bold">Identity</p>
              <p><strong className="text-heading font-medium">Name:</strong> {data.name || data.user_name || "—"}</p>
              <p><strong className="text-heading font-medium">Role:</strong> {data.role || "contractor"}</p>
              <p><strong className="text-heading font-medium">Phone:</strong> {data.phone || "—"}</p>
              <p><strong className="text-heading font-medium">Email:</strong> {data.email || "—"}</p>
            </div>
            <div className="bg-bg-elevated rounded-xl p-4 border border-border space-y-1.5 text-sm text-body">
              <p className="text-xs text-muted mb-2.5 uppercase tracking-wider font-bold">Business Info</p>
              <p><strong className="text-heading font-medium">Business:</strong> {c.business_name || "—"}</p>
              <p><strong className="text-heading font-medium">Category:</strong> {c.category || "—"}</p>
              <p><strong className="text-heading font-medium">Location:</strong> {c.location_text || "—"}</p>
              <p><strong className="text-heading font-medium">Rating:</strong> {c.rating ? `★ ${Number(c.rating).toFixed(1)}` : "N/A"}</p>
              <p><strong className="text-heading font-medium">Experience:</strong> {c.experience_years ? `${c.experience_years} yrs` : "—"}</p>
              <p><strong className="text-heading font-medium">Team Size:</strong> {c.team_size || 1}</p>
              <div className="flex gap-2 mt-2.5">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${c.is_verified ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"}`}>
                  {c.is_verified ? "✓ Verified" : "Unverified"}
                </span>
                {c.tier && c.tier !== "standard" && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 capitalize font-bold">{c.tier}</span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {c.description && (
            <div className="bg-bg-elevated rounded-xl p-4 border border-border">
              <p className="text-xs text-muted mb-2 uppercase tracking-wider font-bold">Bio</p>
              <p className="text-sm text-body leading-relaxed">{c.description}</p>
            </div>
          )}

          {/* ID Proof */}
          {idProof && (
            <div>
              <p className="text-xs text-muted mb-2 uppercase tracking-wider font-bold">ID Proof Document</p>
              <a href={idProof} target="_blank" rel="noreferrer" className="inline-block rounded-xl overflow-hidden border border-border hover:border-primary/50 transition">
                <img src={idProof} alt="ID Proof" className="h-32 object-contain bg-bg-elevated" />
              </a>
            </div>
          )}

          {/* Portfolio */}
          {unique.length > 0 && (
            <div>
              <p className="text-xs text-muted mb-2.5 uppercase tracking-wider font-bold">Portfolio Gallery ({unique.length} items)</p>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {unique.map((m, i) => (
                  <a key={i} href={m} target="_blank" rel="noreferrer" className="rounded-xl overflow-hidden border border-border group bg-bg-elevated">
                    <img src={m} alt="" className="w-full h-20 object-cover group-hover:scale-105 transition-transform duration-300" />
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

/* ──────────── Pagination Bar ──────────── */
export function Pagination({ page, totalPages, totalItems, limit, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalItems || page * limit);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
      <p className="text-xs text-muted font-medium">
        Showing <span className="font-bold text-heading">{start}</span> - <span className="font-bold text-heading">{end}</span> {totalItems ? `of ${totalItems}` : ""}
      </p>
      <div className="flex items-center gap-2">
        <BtnOutline
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </BtnOutline>
        <span className="text-xs font-bold text-heading px-2">
          Page {page} of {totalPages}
        </span>
        <BtnOutline
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </BtnOutline>
      </div>
    </div>
  );
}

/* ──────────── Edit Contractor Modal ──────────── */
export function EditContractorModal({ contractor, onClose, onSave, busy }) {
  const [form, setForm] = React.useState({
    business_name: contractor?.business_name || contractor?.user_name || "",
    name: contractor?.user_name || contractor?.name || "",
    phone: contractor?.phone || "",
    email: contractor?.email || "",
    category: contractor?.category || "",
    daily_rate: contractor?.daily_rate || "",
    experience_years: contractor?.experience_years || 0,
    team_size: contractor?.team_size || 1,
    location_text: contractor?.location_text || "",
    description: contractor?.description || "",
    tier: contractor?.tier || "standard",
    is_verified: contractor?.is_verified ?? false,
    is_featured: contractor?.is_featured ?? false,
    is_available: contractor?.is_available ?? true,
  });

  if (!contractor) return null;

  const handleFieldChange = (field, val) => setForm(f => ({ ...f, [field]: val }));

  async function handleSubmit(e) {
    e.preventDefault();
    await onSave(contractor.id, form);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[1400] bg-black/60 backdrop-blur-sm p-4 overflow-y-auto flex items-center justify-center" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border bg-bg-elevated">
          <h3 className="text-base font-bold text-heading">Edit Contractor Profile #{contractor.id}</h3>
          <button onClick={onClose} className="text-muted hover:text-heading font-bold text-sm">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Business Name</label>
              <AdminInput value={form.business_name} onChange={e => handleFieldChange("business_name", e.target.value)} required />
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Owner / User Name</label>
              <AdminInput value={form.name} onChange={e => handleFieldChange("name", e.target.value)} required />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Phone</label>
              <AdminInput value={form.phone} onChange={e => handleFieldChange("phone", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Email</label>
              <AdminInput value={form.email} onChange={e => handleFieldChange("email", e.target.value)} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Category</label>
              <AdminInput value={form.category} onChange={e => handleFieldChange("category", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Daily Rate (₹)</label>
              <AdminInput type="number" value={form.daily_rate} onChange={e => handleFieldChange("daily_rate", e.target.value)} />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Experience (Yrs)</label>
              <AdminInput type="number" value={form.experience_years} onChange={e => handleFieldChange("experience_years", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Team Size</label>
              <AdminInput type="number" value={form.team_size} onChange={e => handleFieldChange("team_size", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Tier</label>
              <AdminSelect value={form.tier} onChange={e => handleFieldChange("tier", e.target.value)}>
                <option value="standard">Standard</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
              </AdminSelect>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Location</label>
            <AdminInput value={form.location_text} onChange={e => handleFieldChange("location_text", e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Bio / Description</label>
            <textarea
              className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-body placeholder-muted text-sm focus:border-primary transition outline-none h-24 resize-none"
              value={form.description}
              onChange={e => handleFieldChange("description", e.target.value)}
            />
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <label className="flex items-center gap-2 p-3 bg-bg-elevated rounded-xl border border-border cursor-pointer">
              <input type="checkbox" checked={form.is_verified} onChange={e => handleFieldChange("is_verified", e.target.checked)} className="rounded text-primary focus:ring-0" />
              <span className="text-xs font-bold text-heading">Verified</span>
            </label>
            <label className="flex items-center gap-2 p-3 bg-bg-elevated rounded-xl border border-border cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={e => handleFieldChange("is_featured", e.target.checked)} className="rounded text-primary focus:ring-0" />
              <span className="text-xs font-bold text-heading">Featured</span>
            </label>
            <label className="flex items-center gap-2 p-3 bg-bg-elevated rounded-xl border border-border cursor-pointer">
              <input type="checkbox" checked={form.is_available} onChange={e => handleFieldChange("is_available", e.target.checked)} className="rounded text-primary focus:ring-0" />
              <span className="text-xs font-bold text-heading">Available</span>
            </label>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-2">
            <BtnOutline type="button" onClick={onClose}>Cancel</BtnOutline>
            <BtnPrimary type="submit" disabled={busy}>Save Changes</BtnPrimary>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ──────────── Edit User Modal ──────────── */
export function EditUserModal({ user, onClose, onSave, busy }) {
  const [form, setForm] = React.useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    role: user?.role || "customer",
    password: "",
  });

  if (!user) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      name: form.name,
      phone: form.phone || undefined,
      email: form.email || undefined,
      role: form.role,
    };
    if (form.password) payload.password = form.password;
    await onSave(user.id, payload);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[1400] bg-black/60 backdrop-blur-sm p-4 overflow-y-auto flex items-center justify-center" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border bg-bg-elevated">
          <h3 className="text-base font-bold text-heading">Edit User #{user.id}</h3>
          <button onClick={onClose} className="text-muted hover:text-heading font-bold text-sm">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Full Name</label>
            <AdminInput value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Phone Number</label>
            <AdminInput value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Email Address</label>
            <AdminInput value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">System Role</label>
            <AdminSelect value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="customer">Customer</option>
              <option value="contractor">Contractor</option>
              <option value="admin">System Admin</option>
            </AdminSelect>
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Reset Password (leave blank to keep current)</label>
            <AdminInput type="password" placeholder="New password (min 8 chars)" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-2">
            <BtnOutline type="button" onClick={onClose}>Cancel</BtnOutline>
            <BtnPrimary type="submit" disabled={busy}>Save User Account</BtnPrimary>
          </div>
        </form>
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

