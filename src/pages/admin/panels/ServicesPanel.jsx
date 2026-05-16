import React from "react";
import { FiPlus, FiTrash2, FiDownload } from "react-icons/fi";
import { BtnPrimary, BtnOutline, BtnDanger, AdminInput, AdminSelect, downloadCsv } from "./AdminShared";

export default function ServicesPanel({
  svcCategories, svcServices, svcRequests,
  svcSubTab, setSvcSubTab,
  svcCatForm, setSvcCatForm,
  svcServiceForm, setSvcServiceForm,
  busy,
  onCreateCategory, onDeleteCategory, onToggleCategory,
  onCreateService, onDeleteService, onToggleService,
  onUpdateRequest,
}) {
  const SUB_TABS = ["categories", "services", "requests"];
  const STATUS_COLORS = { pending: "bg-amber-500/15 text-amber-400", confirmed: "bg-blue-500/15 text-blue-400", completed: "bg-emerald-500/15 text-emerald-400", cancelled: "bg-red-500/15 text-red-400" };

  return (
    <div className="space-y-6">
      {/* Sub-tab switcher */}
      <div className="flex gap-2">
        {SUB_TABS.map((st) => (
          <button
            key={st}
            onClick={() => setSvcSubTab(st)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize ${svcSubTab === st ? "bg-gradient-to-r from-indigo-500 to-cyan-400 text-white shadow" : "bg-white/5 text-[var(--color-muted)] border border-white/10 hover:bg-white/10"}`}
          >
            {st} {st === "requests" && svcRequests.filter(r => r.status === "pending").length > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {svcRequests.filter(r => r.status === "pending").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Categories ── */}
      {svcSubTab === "categories" && (
        <>
          <div className="glass-card rounded-2xl p-5 border border-white/10">
            <h3 className="font-semibold text-[var(--color-heading)] mb-4 flex items-center gap-2"><FiPlus size={16} /> Add Category</h3>
            <form className="grid md:grid-cols-3 gap-3" onSubmit={onCreateCategory}>
              <AdminInput placeholder="Name (EN)" value={svcCatForm.name} onChange={e => setSvcCatForm(f => ({ ...f, name: e.target.value }))} required />
              <AdminInput placeholder="Name (HI)" value={svcCatForm.name_hi} onChange={e => setSvcCatForm(f => ({ ...f, name_hi: e.target.value }))} />
              <AdminInput placeholder="Slug (unique)" value={svcCatForm.slug} onChange={e => setSvcCatForm(f => ({ ...f, slug: e.target.value }))} required />
              <AdminInput placeholder="Icon name" value={svcCatForm.icon} onChange={e => setSvcCatForm(f => ({ ...f, icon: e.target.value }))} />
              <AdminInput placeholder="Description" value={svcCatForm.description} onChange={e => setSvcCatForm(f => ({ ...f, description: e.target.value }))} className="md:col-span-2" />
              <div className="md:col-span-3"><BtnPrimary type="submit" disabled={busy}>Create Category</BtnPrimary></div>
            </form>
          </div>
          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <p className="text-sm font-semibold text-[var(--color-heading)]">{svcCategories.length} categories</p>
              <BtnOutline onClick={() => downloadCsv("categories.csv", svcCategories)}><FiDownload className="inline mr-1" />Export</BtnOutline>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-[var(--color-muted)]">
                <tr><th className="text-left p-3">Name</th><th className="text-left p-3">Hindi</th><th className="text-left p-3">Active</th><th className="text-left p-3">Actions</th></tr>
              </thead>
              <tbody>
                {svcCategories.map(c => (
                  <tr key={c.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="p-3 text-[var(--color-heading)] font-medium">{c.name}</td>
                    <td className="p-3 text-[var(--color-body)]">{c.name_hi || "—"}</td>
                    <td className="p-3"><span className={c.is_active ? "text-green-400" : "text-red-400"}>{c.is_active ? "✓" : "✗"}</span></td>
                    <td className="p-3"><div className="flex gap-1.5">
                      <BtnOutline disabled={busy} onClick={() => onToggleCategory(c)}>{c.is_active ? "Disable" : "Enable"}</BtnOutline>
                      <BtnDanger disabled={busy} onClick={() => onDeleteCategory(c.id)}><FiTrash2 className="inline" /></BtnDanger>
                    </div></td>
                  </tr>
                ))}
                {svcCategories.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-[var(--color-muted)]">No categories yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Services ── */}
      {svcSubTab === "services" && (
        <>
          <div className="glass-card rounded-2xl p-5 border border-white/10">
            <h3 className="font-semibold text-[var(--color-heading)] mb-4 flex items-center gap-2"><FiPlus size={16} /> Add Service</h3>
            <form className="grid md:grid-cols-3 gap-3" onSubmit={onCreateService}>
              <AdminInput placeholder="Name (EN)" value={svcServiceForm.name} onChange={e => setSvcServiceForm(f => ({ ...f, name: e.target.value }))} required />
              <AdminInput placeholder="Name (HI)" value={svcServiceForm.name_hi} onChange={e => setSvcServiceForm(f => ({ ...f, name_hi: e.target.value }))} />
              <AdminInput placeholder="Slug (unique)" value={svcServiceForm.slug} onChange={e => setSvcServiceForm(f => ({ ...f, slug: e.target.value }))} required />
              <AdminSelect value={svcServiceForm.category_id} onChange={e => setSvcServiceForm(f => ({ ...f, category_id: e.target.value }))} required>
                <option value="">Select Category</option>
                {svcCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </AdminSelect>
              <AdminInput placeholder="Starting price ₹" type="number" value={svcServiceForm.price_starts_at} onChange={e => setSvcServiceForm(f => ({ ...f, price_starts_at: e.target.value }))} />
              <AdminInput placeholder="Icon name" value={svcServiceForm.icon} onChange={e => setSvcServiceForm(f => ({ ...f, icon: e.target.value }))} />
              <AdminInput placeholder="Description" value={svcServiceForm.description} onChange={e => setSvcServiceForm(f => ({ ...f, description: e.target.value }))} className="md:col-span-3" />
              <div className="md:col-span-3"><BtnPrimary type="submit" disabled={busy}>Create Service</BtnPrimary></div>
            </form>
          </div>
          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-[var(--color-muted)]">
                <tr><th className="text-left p-3">Name</th><th className="text-left p-3">Category</th><th className="text-left p-3">Price</th><th className="text-left p-3">Rating</th><th className="text-left p-3">Active</th><th className="text-left p-3">Actions</th></tr>
              </thead>
              <tbody>
                {svcServices.map(s => (
                  <tr key={s.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="p-3 text-[var(--color-heading)] font-medium">{s.name}</td>
                    <td className="p-3 text-indigo-400 text-xs">{s.category_name || "—"}</td>
                    <td className="p-3 text-[var(--color-body)]">{s.price_starts_at ? `₹${s.price_starts_at}` : "—"}</td>
                    <td className="p-3 text-amber-400">★ {Number(s.rating || 0).toFixed(1)}</td>
                    <td className="p-3"><span className={s.is_active ? "text-green-400" : "text-red-400"}>{s.is_active ? "✓" : "✗"}</span></td>
                    <td className="p-3"><div className="flex gap-1.5">
                      <BtnOutline disabled={busy} onClick={() => onToggleService(s)}>{s.is_active ? "Disable" : "Enable"}</BtnOutline>
                      <BtnDanger disabled={busy} onClick={() => onDeleteService(s.id)}><FiTrash2 className="inline" /></BtnDanger>
                    </div></td>
                  </tr>
                ))}
                {svcServices.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-[var(--color-muted)]">No services yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Requests ── */}
      {svcSubTab === "requests" && (
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-[var(--color-muted)]">
              <tr><th className="text-left p-3">Customer</th><th className="text-left p-3">Phone</th><th className="text-left p-3">Service</th><th className="text-left p-3">Date</th><th className="text-left p-3">Status</th><th className="text-left p-3">Actions</th></tr>
            </thead>
            <tbody>
              {svcRequests.map(r => (
                <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                  <td className="p-3 text-[var(--color-heading)] font-medium">{r.customer_name}</td>
                  <td className="p-3 text-[var(--color-body)]">{r.customer_phone}</td>
                  <td className="p-3 text-indigo-400 text-xs">{r.service_name || r.category_name || "—"}</td>
                  <td className="p-3 text-[var(--color-muted)] text-xs">{r.preferred_date || "—"}</td>
                  <td className="p-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[r.status] || "bg-white/10 text-white/60"}`}>{r.status}</span></td>
                  <td className="p-3"><div className="flex gap-1.5">
                    {r.status === "pending" && <BtnOutline disabled={busy} onClick={() => onUpdateRequest(r.id, "confirmed")}>Confirm</BtnOutline>}
                    {r.status === "confirmed" && <BtnOutline disabled={busy} onClick={() => onUpdateRequest(r.id, "completed")}>Complete</BtnOutline>}
                    {!["cancelled", "completed"].includes(r.status) && <BtnDanger disabled={busy} onClick={() => onUpdateRequest(r.id, "cancelled")}>Cancel</BtnDanger>}
                  </div></td>
                </tr>
              ))}
              {svcRequests.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-[var(--color-muted)]">No service requests yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
