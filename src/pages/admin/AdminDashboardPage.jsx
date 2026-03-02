import React, { useCallback, useEffect, useMemo, useState } from "react";
import { adminAPI } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { getImageUrl } from "../../utils/imageUtils";
import toast from "react-hot-toast";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "contractors", label: "Contractors" },
  { id: "moderation", label: "Moderation" },
  { id: "activity", label: "Activity" },
];

const emptyUserForm = {
  name: "",
  phone: "",
  email: "",
  password: "",
  role: "customer",
  business_name: "",
  category: "",
};

const emptyContractorForm = {
  name: "",
  phone: "",
  email: "",
  password: "",
  business_name: "",
  category: "",
  description: "",
  location_text: "",
};

function normalizeListValue(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function toCsv(rows) {
  if (!rows || !rows.length) return "";
  const allKeys = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row || {}).forEach((k) => set.add(k));
      return set;
    }, new Set())
  );

  const esc = (value) => {
    if (value === null || value === undefined) return "";
    const s = typeof value === "object" ? JSON.stringify(value) : String(value);
    return `"${s.replace(/"/g, '""')}"`;
  };

  const header = allKeys.join(",");
  const lines = rows.map((row) => allKeys.map((k) => esc(row[k])).join(","));
  return [header, ...lines].join("\n");
}

function downloadCsv(filename, rows) {
  const csv = toCsv(rows);
  if (!csv) {
    toast.error("No data to export");
    return;
  }
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function DetailModal({ data, onClose }) {
  if (!data) return null;

  const contractor = data.contractor || data;
  const media = [
    contractor.photo_url,
    contractor.image_url,
    contractor.id_proof_url,
    ...normalizeListValue(contractor.portfolio_photos),
    ...normalizeListValue(contractor.portfolio_urls),
  ].filter(Boolean);

  const uniqueMedia = Array.from(new Set(media)).map((m) => getImageUrl(m));

  return (
    <div className="fixed inset-0 z-[1400] bg-black/50 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="font-['Poppins'] text-xl font-semibold text-[#111827]">Full Profile Details</h3>
          <button className="btn-outline-cyan !min-h-[36px] !text-sm" onClick={onClose}>Close</button>
        </div>

        <div className="p-4 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-2">User Summary</p>
              <div className="space-y-1 text-sm text-slate-800">
                <p><strong>ID:</strong> {data.id || "-"}</p>
                <p><strong>Name:</strong> {data.name || data.user_name || "-"}</p>
                <p><strong>Role:</strong> {data.role || "contractor"}</p>
                <p><strong>Phone:</strong> {data.phone || "-"}</p>
                <p><strong>Email:</strong> {data.email || "-"}</p>
              </div>
            </div>
            <div className="border border-slate-200 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-2">Contractor Summary</p>
              <div className="space-y-1 text-sm text-slate-800">
                <p><strong>Contractor ID:</strong> {contractor.id || data.contractor_id || "-"}</p>
                <p><strong>Business:</strong> {contractor.business_name || "-"}</p>
                <p><strong>Category:</strong> {contractor.category || "-"}</p>
                <p><strong>Verified:</strong> {String(!!contractor.is_verified)}</p>
                <p><strong>Featured:</strong> {String(!!contractor.is_featured)}</p>
                <p><strong>Available:</strong> {String(!!contractor.is_available)}</p>
              </div>
            </div>
          </div>

          {uniqueMedia.length > 0 ? (
            <div>
              <p className="text-xs text-slate-500 mb-2">Profile / Portfolio Media</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {uniqueMedia.map((m, idx) => (
                  <a key={`${m}-${idx}`} href={m} target="_blank" rel="noreferrer" className="group border border-slate-200 rounded-xl overflow-hidden">
                    <img src={m} alt={`media-${idx}`} className="w-full h-28 object-cover group-hover:scale-105 transition-transform" />
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <p className="text-xs text-slate-500 mb-2">Raw Data</p>
            <pre className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs overflow-auto max-h-[320px] text-slate-700">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [tab, setTab] = useState("overview");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [reportFilter, setReportFilter] = useState("pending");

  const [users, setUsers] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userQuery, setUserQuery] = useState("");

  const [contractors, setContractors] = useState([]);
  const [contractorQuery, setContractorQuery] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("all");

  const [activity, setActivity] = useState({ users: [], reviews: [], reports: [] });

  const [userForm, setUserForm] = useState(emptyUserForm);
  const [contractorForm, setContractorForm] = useState(emptyContractorForm);
  const [selectedDetail, setSelectedDetail] = useState(null);

  const userRoleOptions = useMemo(() => ["all", "customer", "contractor", "admin"], []);

  const loadOverview = useCallback(async () => {
    const [s, r] = await Promise.all([adminAPI.getStats(), adminAPI.getReports(reportFilter)]);
    setStats(s.data.stats || null);
    setReports(r.data.reports || []);
  }, [reportFilter]);

  const loadUsers = useCallback(async () => {
    const res = await adminAPI.getUsers({
      role: userRoleFilter,
      q: userQuery || undefined,
      page: 1,
      limit: 50,
    });
    setUsers(res.data.users || []);
  }, [userRoleFilter, userQuery]);

  const loadContractors = useCallback(async () => {
    const params = {
      q: contractorQuery || undefined,
      page: 1,
      limit: 50,
    };
    if (verifiedFilter !== "all") params.verified = verifiedFilter === "verified";
    const res = await adminAPI.getContractors(params);
    setContractors(res.data.contractors || []);
  }, [contractorQuery, verifiedFilter]);

  const loadActivity = useCallback(async () => {
    const res = await adminAPI.getActivity();
    setActivity(res.data.activity || { users: [], reviews: [], reports: [] });
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadOverview(), loadUsers(), loadContractors(), loadActivity()]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, [loadOverview, loadUsers, loadContractors, loadActivity]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    loadUsers().catch(() => {});
  }, [loadUsers]);

  useEffect(() => {
    loadContractors().catch(() => {});
  }, [loadContractors]);

  useEffect(() => {
    loadOverview().catch(() => {});
  }, [loadOverview]);

  async function withBusy(fn) {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function showUserDetail(userId) {
    await withBusy(async () => {
      const res = await adminAPI.getUser(userId);
      setSelectedDetail(res.data.user || null);
    });
  }

  async function showContractorDetail(c) {
    if (c?.user_id) {
      await showUserDetail(c.user_id);
      return;
    }
    setSelectedDetail(c || null);
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    await withBusy(async () => {
      const payload = {
        name: userForm.name,
        phone: userForm.phone || undefined,
        email: userForm.email || undefined,
        password: userForm.password,
        role: userForm.role,
      };
      if (userForm.role === "contractor") {
        payload.contractor = {
          business_name: userForm.business_name || userForm.name,
          category: userForm.category || undefined,
        };
      }
      await adminAPI.createUser(payload);
      setUserForm(emptyUserForm);
      toast.success("User created");
      await Promise.all([loadUsers(), loadOverview(), loadContractors()]);
    });
  }

  async function handleCreateContractor(e) {
    e.preventDefault();
    await withBusy(async () => {
      await adminAPI.createContractor({
        ...contractorForm,
        business_name: contractorForm.business_name || contractorForm.name,
      });
      setContractorForm(emptyContractorForm);
      toast.success("Contractor created");
      await Promise.all([loadContractors(), loadUsers(), loadOverview()]);
    });
  }

  async function handleDeleteUser(userId) {
    if (!window.confirm("Delete this user? This action cannot be undone.")) return;
    await withBusy(async () => {
      await adminAPI.deleteUser(userId);
      toast.success("User removed");
      await Promise.all([loadUsers(), loadContractors(), loadOverview(), loadActivity()]);
    });
  }

  async function handleDeleteContractor(contractorId) {
    if (!window.confirm("Delete this contractor and linked user account?")) return;
    await withBusy(async () => {
      await adminAPI.deleteContractor(contractorId);
      toast.success("Contractor removed");
      await Promise.all([loadContractors(), loadUsers(), loadOverview(), loadActivity()]);
    });
  }

  async function handleQuickRoleChange(user, role) {
    await withBusy(async () => {
      await adminAPI.updateUser(user.id, { role });
      toast.success(`Role updated to ${role}`);
      await Promise.all([loadUsers(), loadContractors(), loadOverview()]);
    });
  }

  async function handleToggleContractorFlag(contractor, patch) {
    await withBusy(async () => {
      await adminAPI.updateContractor(contractor.id, patch);
      toast.success("Contractor updated");
      await Promise.all([loadContractors(), loadOverview()]);
    });
  }

  async function handleResolveReport(id, status) {
    await withBusy(async () => {
      await adminAPI.resolveReport(id, status);
      toast.success(`Report ${status}`);
      await Promise.all([loadOverview(), loadActivity()]);
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <main id="main-content" className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
      <section className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div>
            <h1 className="font-['Poppins'] text-3xl text-[#111827] font-semibold">Admin Control Center</h1>
            <p className="text-sm text-slate-600 mt-1">Full platform control: users, contractors, moderation, and operational data.</p>
          </div>
          <button onClick={loadAll} className="btn-outline-cyan" disabled={busy}>
            {busy ? "Working..." : "Refresh Data"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`pill-chip ${tab === item.id ? "!bg-[#1E3A8A] !border-[#1E3A8A] !text-white" : ""}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                ["Users", stats?.total_users || 0],
                ["Customers", stats?.total_customers || 0],
                ["Contractors", stats?.total_contractors || 0],
                ["Verified", stats?.verified_contractors || 0],
                ["Pending Reports", stats?.pending_reports || 0],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500">{k}</p>
                  <p className="text-2xl text-[#1E3A8A] font-bold mt-1">{v}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="font-semibold text-[#111827] mb-3">Pending Contractors</h3>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {contractors.filter((c) => !c.is_verified).slice(0, 10).map((c) => (
                    <div key={c.id} className="border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{c.business_name || c.user_name || "Contractor"}</p>
                        <p className="text-xs text-slate-500">{c.phone || "No phone"}</p>
                      </div>
                      <button
                        className="btn-secondary !min-h-[36px] !text-sm"
                        onClick={() => handleToggleContractorFlag(c, { is_verified: true })}
                        disabled={busy}
                      >
                        Verify
                      </button>
                    </div>
                  ))}
                  {!contractors.some((c) => !c.is_verified) && <p className="text-sm text-slate-500">No pending contractors.</p>}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="font-semibold text-[#111827] mb-3">Pending Reports</h3>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {reports.filter((r) => r.status === "pending").slice(0, 10).map((r) => (
                    <div key={r.id} className="border border-slate-200 rounded-lg px-3 py-2">
                      <p className="text-sm text-slate-800">{r.reason || "No reason"}</p>
                      <div className="mt-2 flex gap-2">
                        <button className="btn-secondary !min-h-[34px] !text-sm" disabled={busy} onClick={() => handleResolveReport(r.id, "resolved")}>Resolve</button>
                        <button className="btn-outline-cyan !min-h-[34px] !text-sm" disabled={busy} onClick={() => handleResolveReport(r.id, "rejected")}>Reject</button>
                      </div>
                    </div>
                  ))}
                  {!reports.some((r) => r.status === "pending") && <p className="text-sm text-slate-500">No pending reports.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "users" && (
          <div className="space-y-5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h3 className="font-semibold text-[#111827] mb-3">Create User / Customer / Admin</h3>
              <form className="grid md:grid-cols-3 gap-3" onSubmit={handleCreateUser}>
                <input className="input-field" placeholder="Name" value={userForm.name} onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))} required />
                <input className="input-field" placeholder="Phone" value={userForm.phone} onChange={(e) => setUserForm((f) => ({ ...f, phone: e.target.value }))} />
                <input className="input-field" placeholder="Email" value={userForm.email} onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))} />
                <input className="input-field" placeholder="Password (min 8)" type="password" value={userForm.password} onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))} required />
                <select className="input-field" value={userForm.role} onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))}>
                  <option value="customer">customer</option>
                  <option value="contractor">contractor</option>
                  <option value="admin">admin</option>
                </select>
                {userForm.role === "contractor" ? (
                  <>
                    <input className="input-field" placeholder="Business Name" value={userForm.business_name} onChange={(e) => setUserForm((f) => ({ ...f, business_name: e.target.value }))} />
                    <input className="input-field" placeholder="Category" value={userForm.category} onChange={(e) => setUserForm((f) => ({ ...f, category: e.target.value }))} />
                  </>
                ) : (
                  <div />
                )}
                <div className="md:col-span-3">
                  <button className="btn-primary" type="submit" disabled={busy}>Create User</button>
                </div>
              </form>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <input className="input-field max-w-sm" placeholder="Search users..." value={userQuery} onChange={(e) => setUserQuery(e.target.value)} />
              <select className="input-field max-w-[180px]" value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)}>
                {userRoleOptions.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              <button className="btn-outline-cyan" onClick={() => downloadCsv("users.csv", users)}>Export CSV</button>
            </div>

            <div className="overflow-auto border border-slate-200 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
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
                    <tr key={u.id} className="border-t border-slate-200">
                      <td className="p-3">{u.name || "-"}</td>
                      <td className="p-3">{u.role}</td>
                      <td className="p-3">{u.phone || "-"}</td>
                      <td className="p-3">{u.email || "-"}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <button className="btn-outline-cyan !min-h-[32px] !text-xs" disabled={busy} onClick={() => showUserDetail(u.id)}>View</button>
                          {u.role !== "admin" && (
                            <button className="btn-outline-cyan !min-h-[32px] !text-xs" disabled={busy} onClick={() => handleQuickRoleChange(u, "admin")}>Make Admin</button>
                          )}
                          {u.role !== "customer" && (
                            <button className="btn-outline-cyan !min-h-[32px] !text-xs" disabled={busy} onClick={() => handleQuickRoleChange(u, "customer")}>Make Customer</button>
                          )}
                          {u.role !== "contractor" && (
                            <button className="btn-outline-cyan !min-h-[32px] !text-xs" disabled={busy} onClick={() => handleQuickRoleChange(u, "contractor")}>Make Contractor</button>
                          )}
                          <button className="btn-secondary !min-h-[32px] !text-xs" disabled={busy} onClick={() => handleDeleteUser(u.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td className="p-4 text-slate-500" colSpan={5}>No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "contractors" && (
          <div className="space-y-5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h3 className="font-semibold text-[#111827] mb-3">Add Contractor Directly</h3>
              <form className="grid md:grid-cols-3 gap-3" onSubmit={handleCreateContractor}>
                <input className="input-field" placeholder="Name" value={contractorForm.name} onChange={(e) => setContractorForm((f) => ({ ...f, name: e.target.value }))} required />
                <input className="input-field" placeholder="Phone" value={contractorForm.phone} onChange={(e) => setContractorForm((f) => ({ ...f, phone: e.target.value }))} />
                <input className="input-field" placeholder="Email" value={contractorForm.email} onChange={(e) => setContractorForm((f) => ({ ...f, email: e.target.value }))} />
                <input className="input-field" placeholder="Password" type="password" value={contractorForm.password} onChange={(e) => setContractorForm((f) => ({ ...f, password: e.target.value }))} required />
                <input className="input-field" placeholder="Business Name" value={contractorForm.business_name} onChange={(e) => setContractorForm((f) => ({ ...f, business_name: e.target.value }))} />
                <input className="input-field" placeholder="Category" value={contractorForm.category} onChange={(e) => setContractorForm((f) => ({ ...f, category: e.target.value }))} />
                <input className="input-field md:col-span-2" placeholder="Description" value={contractorForm.description} onChange={(e) => setContractorForm((f) => ({ ...f, description: e.target.value }))} />
                <input className="input-field" placeholder="Location" value={contractorForm.location_text} onChange={(e) => setContractorForm((f) => ({ ...f, location_text: e.target.value }))} />
                <div className="md:col-span-3">
                  <button className="btn-primary" type="submit" disabled={busy}>Create Contractor</button>
                </div>
              </form>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <input className="input-field max-w-sm" placeholder="Search contractors..." value={contractorQuery} onChange={(e) => setContractorQuery(e.target.value)} />
              <select className="input-field max-w-[200px]" value={verifiedFilter} onChange={(e) => setVerifiedFilter(e.target.value)}>
                <option value="all">all</option>
                <option value="verified">verified</option>
                <option value="unverified">unverified</option>
              </select>
              <button className="btn-outline-cyan" onClick={() => downloadCsv("contractors.csv", contractors)}>Export CSV</button>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              {contractors.map((c) => (
                <div key={c.id} className="border border-slate-200 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[#111827]">{c.business_name || c.user_name || "Contractor"}</p>
                      <p className="text-xs text-slate-500">{c.phone || "No phone"} | {c.email || "No email"}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${c.is_verified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {c.is_verified ? "verified" : "pending"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">{c.category || "no category"}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button className="btn-outline-cyan !min-h-[32px] !text-xs" disabled={busy} onClick={() => showContractorDetail(c)}>View</button>
                    <button className="btn-outline-cyan !min-h-[32px] !text-xs" disabled={busy} onClick={() => handleToggleContractorFlag(c, { is_verified: !c.is_verified })}>
                      {c.is_verified ? "Unverify" : "Verify"}
                    </button>
                    <button className="btn-outline-cyan !min-h-[32px] !text-xs" disabled={busy} onClick={() => handleToggleContractorFlag(c, { is_featured: !c.is_featured })}>
                      {c.is_featured ? "Unfeature" : "Feature"}
                    </button>
                    <button className="btn-outline-cyan !min-h-[32px] !text-xs" disabled={busy} onClick={() => handleToggleContractorFlag(c, { is_available: !c.is_available })}>
                      {c.is_available ? "Set Busy" : "Set Available"}
                    </button>
                    <button className="btn-secondary !min-h-[32px] !text-xs" disabled={busy} onClick={() => handleDeleteContractor(c.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {contractors.length === 0 && <p className="text-sm text-slate-500">No contractors found.</p>}
            </div>
          </div>
        )}

        {tab === "moderation" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {["pending", "resolved", "rejected", "all"].map((f) => (
                <button
                  key={f}
                  className={`pill-chip ${reportFilter === f ? "!bg-[#1E3A8A] !text-white !border-[#1E3A8A]" : ""}`}
                  onClick={() => setReportFilter(f)}
                >
                  {f}
                </button>
              ))}
              <button className="btn-outline-cyan" onClick={() => downloadCsv(`reports-${reportFilter}.csv`, reports)}>Export CSV</button>
            </div>

            <div className="space-y-2">
              {reports.map((r) => (
                <div key={r.id} className="border border-slate-200 rounded-xl p-3">
                  <p className="text-sm text-slate-800">{r.reason || "No reason"}</p>
                  <p className="text-xs text-slate-500 mt-1">Reporter: {r.reporter_name || "Unknown"} | Status: {r.status}</p>
                  {r.status === "pending" && (
                    <div className="mt-2 flex gap-2">
                      <button className="btn-secondary !min-h-[34px] !text-sm" disabled={busy} onClick={() => handleResolveReport(r.id, "resolved")}>Resolve</button>
                      <button className="btn-outline-cyan !min-h-[34px] !text-sm" disabled={busy} onClick={() => handleResolveReport(r.id, "rejected")}>Reject</button>
                    </div>
                  )}
                </div>
              ))}
              {reports.length === 0 && <p className="text-sm text-slate-500">No reports found for this filter.</p>}
            </div>
          </div>
        )}

        {tab === "activity" && (
          <div className="space-y-3">
            <button className="btn-outline-cyan" onClick={() => downloadCsv("activity.csv", [...activity.users, ...activity.reviews, ...activity.reports])}>Export CSV</button>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="border border-slate-200 rounded-xl p-3">
                <h3 className="font-semibold text-[#111827] mb-2">Recent Users</h3>
                <div className="space-y-2 text-sm">
                  {activity.users.map((u) => (
                    <div key={u.id} className="border border-slate-100 rounded-lg p-2">
                      <p className="font-medium text-slate-800">{u.name || "Unnamed"}</p>
                      <p className="text-xs text-slate-500">{u.role} | {u.phone || "-"}</p>
                    </div>
                  ))}
                  {activity.users.length === 0 && <p className="text-slate-500">No recent users.</p>}
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-3">
                <h3 className="font-semibold text-[#111827] mb-2">Recent Reviews</h3>
                <div className="space-y-2 text-sm">
                  {activity.reviews.map((r) => (
                    <div key={r.id} className="border border-slate-100 rounded-lg p-2">
                      <p className="font-medium text-slate-800">Rating: {r.rating}</p>
                      <p className="text-xs text-slate-500">Contractor #{r.contractor_id} | User #{r.user_id}</p>
                    </div>
                  ))}
                  {activity.reviews.length === 0 && <p className="text-slate-500">No recent reviews.</p>}
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-3">
                <h3 className="font-semibold text-[#111827] mb-2">Recent Reports</h3>
                <div className="space-y-2 text-sm">
                  {activity.reports.map((r) => (
                    <div key={r.id} className="border border-slate-100 rounded-lg p-2">
                      <p className="font-medium text-slate-800">Report #{r.id}</p>
                      <p className="text-xs text-slate-500">Status: {r.status} | Contractor #{r.contractor_id || "-"}</p>
                    </div>
                  ))}
                  {activity.reports.length === 0 && <p className="text-slate-500">No recent reports.</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <DetailModal data={selectedDetail} onClose={() => setSelectedDetail(null)} />
    </main>
  );
}
