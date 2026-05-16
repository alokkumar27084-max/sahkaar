import React from "react";
import { motion } from "framer-motion";
import { FiSearch, FiDownload, FiEye, FiTrash2 } from "react-icons/fi";
import { BtnPrimary, BtnOutline, BtnDanger, AdminInput, AdminSelect, downloadCsv } from "./AdminShared";

const TIERS = ["standard", "silver", "gold", "platinum"];
const TIER_COLORS = { standard: "bg-white/10 text-white/60", silver: "bg-slate-400/15 text-slate-300", gold: "bg-amber-400/15 text-amber-300", platinum: "bg-cyan-400/15 text-cyan-300" };

const emptyForm = { name: "", phone: "", email: "", password: "", business_name: "", category: "", description: "", location_text: "" };

export default function ContractorsPanel({ contractors, busy, onCreateContractor, onDeleteContractor, onToggleFlag, onVerify, onView, contractorQuery, setContractorQuery, verifiedFilter, setVerifiedFilter }) {
  const [form, setForm] = React.useState(emptyForm);
  const up = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleCreate(e) {
    e.preventDefault();
    await onCreateContractor(form);
    setForm(emptyForm);
  }

  return (
    <div className="space-y-6">
      {/* Create contractor form */}
      <div className="glass-card rounded-2xl p-5 border border-white/10">
        <h3 className="font-semibold text-[var(--color-heading)] mb-4">Add Contractor</h3>
        <form className="grid md:grid-cols-3 gap-3" onSubmit={handleCreate}>
          <AdminInput placeholder="Name" value={form.name} onChange={up("name")} required />
          <AdminInput placeholder="Phone" value={form.phone} onChange={up("phone")} />
          <AdminInput placeholder="Email" value={form.email} onChange={up("email")} />
          <AdminInput placeholder="Password (min 8)" type="password" value={form.password} onChange={up("password")} required />
          <AdminInput placeholder="Business Name" value={form.business_name} onChange={up("business_name")} />
          <AdminInput placeholder="Category" value={form.category} onChange={up("category")} />
          <AdminInput placeholder="Description" value={form.description} onChange={up("description")} className="md:col-span-2" />
          <AdminInput placeholder="Location" value={form.location_text} onChange={up("location_text")} />
          <div className="md:col-span-3"><BtnPrimary type="submit" disabled={busy}>Create Contractor</BtnPrimary></div>
        </form>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" size={16} />
          <AdminInput className="!pl-10" placeholder="Search contractors..." value={contractorQuery} onChange={(e) => setContractorQuery(e.target.value)} />
        </div>
        <AdminSelect value={verifiedFilter} onChange={(e) => setVerifiedFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </AdminSelect>
        <BtnOutline onClick={() => downloadCsv("contractors.csv", contractors)}><FiDownload className="inline mr-1" />Export</BtnOutline>
      </div>

      {/* Cards grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {contractors.map((c) => (
          <motion.div key={c.id} whileHover={{ y: -2 }} className="glass-card rounded-2xl p-5 border border-white/10">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[var(--color-heading)] truncate">{c.business_name || c.user_name || "Contractor"}</p>
                <p className="text-xs text-[var(--color-muted)] mt-0.5 truncate">{c.phone || "No phone"} · {c.email || "No email"}</p>
                <p className="text-xs text-indigo-400 mt-1">{c.category || "No category"}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${c.is_verified ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                  {c.is_verified ? "✓ Verified" : "Unverified"}
                </span>
                {c.tier && c.tier !== "standard" && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-bold border border-white/10 ${TIER_COLORS[c.tier] || TIER_COLORS.standard}`}>{c.tier}</span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <BtnOutline disabled={busy} onClick={() => onView(c)}><FiEye className="inline mr-1" />View</BtnOutline>
              {c.verification_status === "pending" ? (
                <>
                  <BtnOutline disabled={busy} onClick={() => onVerify(c, "approved")} className="!text-emerald-400 !border-emerald-400/30">Approve</BtnOutline>
                  <BtnOutline disabled={busy} onClick={() => onVerify(c, "rejected")} className="!text-red-400 !border-red-400/30">Reject</BtnOutline>
                </>
              ) : (
                <BtnOutline disabled={busy} onClick={() => onToggleFlag(c, { is_verified: !c.is_verified })}>
                  {c.is_verified ? "Unverify" : "Verify"}
                </BtnOutline>
              )}
              <BtnOutline disabled={busy} onClick={() => onToggleFlag(c, { is_featured: !c.is_featured })}>
                {c.is_featured ? "★ Unfeat." : "☆ Feature"}
              </BtnOutline>
              <select
                className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-[var(--color-body)] outline-none"
                value={c.tier || "standard"}
                onChange={(e) => onToggleFlag(c, { tier: e.target.value })}
                disabled={busy}
              >
                {TIERS.map((t) => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
              <BtnDanger disabled={busy} onClick={() => onDeleteContractor(c.id)}><FiTrash2 className="inline" /></BtnDanger>
            </div>
          </motion.div>
        ))}
        {contractors.length === 0 && <p className="text-sm text-[var(--color-muted)] col-span-2 text-center py-8">No contractors found.</p>}
      </div>
    </div>
  );
}
