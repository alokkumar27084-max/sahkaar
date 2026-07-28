import React from "react";
import { motion } from "framer-motion";
import { FiSearch, FiDownload, FiEye, FiTrash2, FiEdit2 } from "react-icons/fi";
import { BtnPrimary, BtnOutline, BtnDanger, AdminInput, AdminSelect, downloadCsv, Pagination } from "./AdminShared";
import { getImageUrl } from "../../../utils/imageUtils";

const TIERS = ["standard", "silver", "gold", "platinum"];
const TIER_COLORS = { 
  standard: "bg-bg-elevated text-muted border-border", 
  silver: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20", 
  gold: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", 
  platinum: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20" 
};

const emptyForm = { name: "", phone: "", email: "", password: "", business_name: "", category: "", description: "", location_text: "" };

export default function ContractorsPanel({
  contractors,
  busy,
  onCreateContractor,
  onDeleteContractor,
  onToggleFlag,
  onVerify,
  onView,
  onEdit,
  contractorQuery,
  setContractorQuery,
  verifiedFilter,
  setVerifiedFilter,
  onAddSubscription,
  onCancelSubscription,
  page,
  totalPages,
  totalItems,
  limit = 50,
  onPageChange,
}) {
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
      <div className="card p-5 border border-border bg-surface">
        <h3 className="text-sm font-bold text-heading mb-4 uppercase tracking-wider">Register Professional Contractor</h3>
        <form className="grid md:grid-cols-3 gap-3" onSubmit={handleCreate}>
          <AdminInput placeholder="Name" value={form.name} onChange={up("name")} required />
          <AdminInput placeholder="Phone" value={form.phone} onChange={up("phone")} />
          <AdminInput placeholder="Email" value={form.email} onChange={up("email")} />
          <AdminInput placeholder="Password (min 8 chars)" type="password" value={form.password} onChange={up("password")} required />
          <AdminInput placeholder="Business Name" value={form.business_name} onChange={up("business_name")} />
          <AdminInput placeholder="Category" value={form.category} onChange={up("category")} />
          <AdminInput placeholder="Description" value={form.description} onChange={up("description")} className="md:col-span-2" />
          <AdminInput placeholder="Location" value={form.location_text} onChange={up("location_text")} />
          <div className="md:col-span-3 pt-2">
            <BtnPrimary type="submit" disabled={busy}>Add Contractor Profile</BtnPrimary>
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1 max-w-xl">
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={15} />
            <AdminInput className="!pl-10" placeholder="Search contractors by name, phone, business..." value={contractorQuery} onChange={(e) => setContractorQuery(e.target.value)} />
          </div>
          <AdminSelect value={verifiedFilter} onChange={(e) => setVerifiedFilter(e.target.value)}>
            <option value="all">All Verification Statuses</option>
            <option value="verified">Verified Status</option>
            <option value="unverified">Unverified Status</option>
          </AdminSelect>
        </div>
        <BtnOutline onClick={() => downloadCsv("contractors.csv", contractors)} className="flex items-center gap-1.5 font-bold">
          <FiDownload size={13} /> Export CSV
        </BtnOutline>
      </div>

      {/* Cards grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {contractors.map((c) => {
          const avatar = getImageUrl(c.photo_url || c.image_url);
          return (
            <motion.div key={c.id} whileHover={{ y: -1 }} className="card p-5 border border-border bg-surface transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {avatar ? (
                      <img src={avatar} alt="" className="w-12 h-12 rounded-xl object-cover border border-border shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-lg shrink-0">
                        {(c.business_name || c.user_name || "C").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-heading text-base truncate">{c.business_name || c.user_name || "Contractor"}</p>
                      <p className="text-xs text-muted mt-0.5 truncate">{c.phone || "No phone"} · {c.email || "No email"}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs font-semibold text-primary">{c.category || "No category"}</span>
                        {c.daily_rate && <span className="text-[11px] font-bold text-heading">· ₹{c.daily_rate}/day</span>}
                        {c.location_text && <span className="text-[11px] text-muted truncate">· {c.location_text}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${c.is_verified ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"}`}>
                      {c.is_verified ? "✓ Verified" : "Unverified"}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${c.is_available !== false ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"}`}>
                      {c.is_available !== false ? "Available" : "Unavailable"}
                    </span>
                    {c.tier && c.tier !== "standard" && (
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full capitalize font-bold border ${TIER_COLORS[c.tier] || TIER_COLORS.standard}`}>{c.tier}</span>
                    )}
                  </div>
                </div>

                {/* Active Subscription status */}
                <div className="mt-3 text-xs bg-bg-elevated/40 border border-border/60 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Subscription Status</p>
                    {c.active_subscription ? (
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 capitalize">
                        {c.active_subscription.plan_type.replace("_", " ")} Active
                      </p>
                    ) : (
                      <p className="font-semibold text-muted mt-0.5">Free tier active</p>
                    )}
                    {c.active_subscription?.expires_at && (
                      <p className="text-[9px] text-muted mt-0.5">Expires: {new Date(c.active_subscription.expires_at).toLocaleDateString()}</p>
                    )}
                  </div>

                  <div>
                    {c.active_subscription ? (
                      <button
                        disabled={busy}
                        onClick={() => onCancelSubscription(c.id)}
                        className="px-2.5 py-1 text-[10px] font-bold text-rose-500 hover:text-white border border-rose-500/20 hover:bg-rose-500 rounded-lg transition disabled:opacity-40"
                      >
                        Cancel Sub
                      </button>
                    ) : (
                      <select
                        disabled={busy}
                        onChange={(e) => {
                          if (e.target.value) {
                            onAddSubscription(c.id, e.target.value);
                            e.target.value = "";
                          }
                        }}
                        className="px-2 py-1 bg-bg border border-border text-[10px] text-heading font-semibold rounded-lg outline-none focus:border-primary cursor-pointer"
                        defaultValue=""
                      >
                        <option value="" disabled>Grant Manual Plan</option>
                        <option value="verified_badge">Verified Badge (₹499)</option>
                        <option value="priority_listing">Priority Listing (₹399)</option>
                        <option value="premium">Premium Suite (₹2499)</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-center pt-3 border-t border-border mt-3">
                <BtnOutline disabled={busy} onClick={() => onView(c)} className="flex items-center gap-1">
                  <FiEye size={12} /> View Details
                </BtnOutline>
                <BtnOutline disabled={busy} onClick={() => onEdit(c)} className="flex items-center gap-1 !text-primary">
                  <FiEdit2 size={12} /> Edit Profile
                </BtnOutline>

                {c.verification_status === "pending" ? (
                  <>
                    <button 
                      onClick={() => onVerify(c, "approved")} 
                      disabled={busy} 
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition disabled:opacity-40"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => onVerify(c, "rejected")} 
                      disabled={busy} 
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition disabled:opacity-40"
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <BtnOutline disabled={busy} onClick={() => onToggleFlag(c, { is_verified: !c.is_verified })}>
                    {c.is_verified ? "Unverify" : "Verify Pro"}
                  </BtnOutline>
                )}

                <BtnOutline disabled={busy} onClick={() => onToggleFlag(c, { is_featured: !c.is_featured })}>
                  {c.is_featured ? "★ Unfeature" : "☆ Feature Pro"}
                </BtnOutline>

                <select
                  className="px-2 py-1.5 rounded-lg bg-bg border border-border text-xs text-heading font-semibold outline-none focus:border-primary transition"
                  value={c.tier || "standard"}
                  onChange={(e) => onToggleFlag(c, { tier: e.target.value })}
                  disabled={busy}
                >
                  {TIERS.map((t) => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)} Tier</option>)}
                </select>

                <BtnDanger disabled={busy} onClick={() => onDeleteContractor(c.id)}>
                  <FiTrash2 size={13} />
                </BtnDanger>
              </div>
            </motion.div>
          );
        })}
        {contractors.length === 0 && <p className="text-sm text-muted col-span-2 text-center py-12 font-medium">No contractors found.</p>}
      </div>

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        limit={limit}
        onPageChange={onPageChange}
      />
    </div>
  );
}

