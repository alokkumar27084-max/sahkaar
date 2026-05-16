import React from "react";
import { FiSearch, FiDownload, FiEye, FiTrash2 } from "react-icons/fi";
import { BtnPrimary, BtnOutline, BtnDanger, AdminInput, AdminSelect, downloadCsv } from "./AdminShared";

const emptyUserForm = { name: "", phone: "", email: "", password: "", role: "customer", business_name: "", category: "" };

export default function UsersPanel({ users, busy, onCreateUser, onDeleteUser, onRoleChange, onViewUser, userQuery, setUserQuery, userRoleFilter, setUserRoleFilter }) {
  const [form, setForm] = React.useState(emptyUserForm);
  const up = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleCreate(e) {
    e.preventDefault();
    await onCreateUser(form);
    setForm(emptyUserForm);
  }

  return (
    <div className="space-y-6">
      {/* Create user form */}
      <div className="glass-card rounded-2xl p-5 border border-white/10">
        <h3 className="font-semibold text-[var(--color-heading)] mb-4 flex items-center gap-2">Create User</h3>
        <form className="grid md:grid-cols-3 gap-3" onSubmit={handleCreate}>
          <AdminInput placeholder="Name" value={form.name} onChange={up("name")} required />
          <AdminInput placeholder="Phone" value={form.phone} onChange={up("phone")} />
          <AdminInput placeholder="Email" value={form.email} onChange={up("email")} />
          <AdminInput placeholder="Password (min 8)" type="password" value={form.password} onChange={up("password")} required />
          <AdminSelect value={form.role} onChange={up("role")}>
            <option value="customer">Customer</option>
            <option value="contractor">Contractor</option>
            <option value="admin">Admin</option>
          </AdminSelect>
          {form.role === "contractor" && (
            <>
              <AdminInput placeholder="Business Name" value={form.business_name} onChange={up("business_name")} />
              <AdminInput placeholder="Category" value={form.category} onChange={up("category")} />
            </>
          )}
          <div className="md:col-span-3">
            <BtnPrimary type="submit" disabled={busy}>Create User</BtnPrimary>
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" size={16} />
          <AdminInput className="!pl-10" placeholder="Search users..." value={userQuery} onChange={(e) => setUserQuery(e.target.value)} />
        </div>
        <AdminSelect value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)}>
          {["all", "customer", "contractor", "admin"].map((r) => <option key={r} value={r}>{r}</option>)}
        </AdminSelect>
        <BtnOutline onClick={() => downloadCsv("users.csv", users)}><FiDownload className="inline mr-1" />Export</BtnOutline>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-white/5 text-[var(--color-muted)]">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Phone</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-white/5 hover:bg-white/[0.02] transition">
                <td className="p-3 text-[var(--color-heading)] font-medium">{u.name || "—"}</td>
                <td className="p-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${u.role === "admin" ? "bg-rose-500/15 text-rose-400" : u.role === "contractor" ? "bg-cyan-500/15 text-cyan-400" : "bg-violet-500/15 text-violet-400"}`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-3 text-[var(--color-body)]">{u.phone || "—"}</td>
                <td className="p-3 text-[var(--color-body)] max-w-[180px] truncate">{u.email || "—"}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1.5">
                    <BtnOutline disabled={busy} onClick={() => onViewUser(u.id)}><FiEye className="inline" /></BtnOutline>
                    {u.role !== "admin" && <BtnOutline disabled={busy} onClick={() => onRoleChange(u, "admin")}>→ Admin</BtnOutline>}
                    {u.role !== "customer" && <BtnOutline disabled={busy} onClick={() => onRoleChange(u, "customer")}>→ Customer</BtnOutline>}
                    <BtnDanger disabled={busy} onClick={() => onDeleteUser(u.id)}><FiTrash2 className="inline" /></BtnDanger>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td className="p-6 text-center text-[var(--color-muted)]" colSpan={5}>No users found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
