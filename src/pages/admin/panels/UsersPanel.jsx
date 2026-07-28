import React from "react";
import { FiSearch, FiDownload, FiEye, FiTrash2, FiEdit2 } from "react-icons/fi";
import { BtnPrimary, BtnOutline, BtnDanger, AdminInput, AdminSelect, downloadCsv, Pagination } from "./AdminShared";

const emptyUserForm = { name: "", phone: "", email: "", password: "", role: "customer", business_name: "", category: "" };

export default function UsersPanel({
  users,
  busy,
  onCreateUser,
  onDeleteUser,
  onRoleChange,
  onViewUser,
  onEditUser,
  userQuery,
  setUserQuery,
  userRoleFilter,
  setUserRoleFilter,
  page,
  totalPages,
  totalItems,
  limit = 50,
  onPageChange,
}) {
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
      <div className="card p-5 border border-border bg-surface">
        <h3 className="text-sm font-bold text-heading mb-4 uppercase tracking-wider">Create New User Profile</h3>
        <form className="grid md:grid-cols-3 gap-3" onSubmit={handleCreate}>
          <AdminInput placeholder="Name" value={form.name} onChange={up("name")} required />
          <AdminInput placeholder="Phone (e.g. +919876543210)" value={form.phone} onChange={up("phone")} />
          <AdminInput placeholder="Email Address" value={form.email} onChange={up("email")} />
          <AdminInput placeholder="Password (min 8 chars)" type="password" value={form.password} onChange={up("password")} required />
          <AdminSelect value={form.role} onChange={up("role")}>
            <option value="customer">Customer Role</option>
            <option value="contractor">Contractor Role</option>
            <option value="admin">System Admin</option>
          </AdminSelect>
          {form.role === "contractor" && (
            <>
              <AdminInput placeholder="Business Name" value={form.business_name} onChange={up("business_name")} />
              <AdminInput placeholder="Category" value={form.category} onChange={up("category")} />
            </>
          )}
          <div className="md:col-span-3 pt-2">
            <BtnPrimary type="submit" disabled={busy}>Add New User Account</BtnPrimary>
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1 max-w-xl">
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={15} />
            <AdminInput className="!pl-10" placeholder="Search users by name, phone, email..." value={userQuery} onChange={(e) => setUserQuery(e.target.value)} />
          </div>
          <AdminSelect value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)} className="capitalize">
            {["all", "customer", "contractor", "admin"].map((r) => <option key={r} value={r}>{r} Role</option>)}
          </AdminSelect>
        </div>
        <BtnOutline onClick={() => downloadCsv("users.csv", users)} className="flex items-center gap-1.5 font-bold">
          <FiDownload size={13} /> Export to CSV
        </BtnOutline>
      </div>

      {/* Table */}
      <div className="card border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px] border-collapse">
            <thead className="bg-bg-elevated border-b border-border text-xs text-muted uppercase tracking-wider font-bold">
              <tr>
                <th className="text-left p-3.5 pl-5">Name</th>
                <th className="text-left p-3.5">Role</th>
                <th className="text-left p-3.5">Phone</th>
                <th className="text-left p-3.5">Email</th>
                <th className="text-left p-3.5 pr-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border hover:bg-bg-elevated/40 transition">
                  <td className="p-3.5 pl-5 text-heading font-semibold">{u.name || "—"}</td>
                  <td className="p-3.5">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border capitalize whitespace-nowrap ${
                      u.role === "admin" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" : 
                      u.role === "contractor" ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20" : 
                      "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20"
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3.5 text-body">{u.phone || "—"}</td>
                  <td className="p-3.5 text-body max-w-[180px] truncate">{u.email || "—"}</td>
                  <td className="p-3.5 pr-5">
                    <div className="flex flex-wrap gap-1.5">
                      <BtnOutline disabled={busy} onClick={() => onViewUser(u.id)} className="!py-1" title="View details">
                        <FiEye size={13} />
                      </BtnOutline>
                      <BtnOutline disabled={busy} onClick={() => onEditUser(u)} className="!py-1 !text-primary" title="Edit user account">
                        <FiEdit2 size={13} />
                      </BtnOutline>
                      {u.role !== "admin" && (
                        <BtnOutline disabled={busy} onClick={() => onRoleChange(u, "admin")} className="!py-1">
                          → Admin
                        </BtnOutline>
                      )}
                      {u.role !== "customer" && (
                        <BtnOutline disabled={busy} onClick={() => onRoleChange(u, "customer")} className="!py-1">
                          → Customer
                        </BtnOutline>
                      )}
                      <BtnDanger disabled={busy} onClick={() => onDeleteUser(u.id)} className="!py-1" title="Delete account">
                        <FiTrash2 size={13} />
                      </BtnDanger>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td className="p-12 text-center text-muted font-medium" colSpan={5}>
                    No matching users found in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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

