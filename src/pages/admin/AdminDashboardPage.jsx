import React, { useCallback, useEffect, useMemo, useState } from "react";
import { adminAPI } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { getImageUrl } from "../../utils/imageUtils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUsers, FiUserCheck, FiShield, FiTrendingUp, FiSettings, FiStar,
  FiAlertTriangle, FiActivity, FiSearch, FiDownload, FiTrash2, FiEye,
  FiCheckCircle, FiXCircle, FiRefreshCw, FiPlus,
  FiAward, FiBarChart2, FiGrid, FiMenu,
} from "react-icons/fi";

/* ──────────── constants ──────────── */
const SIDEBAR = [
  { id: "overview", label: "Overview", icon: FiBarChart2 },
  { id: "users", label: "Users", icon: FiUsers },
  { id: "contractors", label: "Contractors", icon: FiUserCheck },
  { id: "services", label: "Services", icon: FiGrid },
  { id: "reviews", label: "Reviews", icon: FiStar },
  { id: "moderation", label: "Moderation", icon: FiAlertTriangle },
  { id: "analytics", label: "Analytics", icon: FiTrendingUp },
  { id: "activity", label: "Activity", icon: FiActivity },
  { id: "settings", label: "Settings", icon: FiSettings },
];

const emptyUserForm = { name: "", phone: "", email: "", password: "", role: "customer", business_name: "", category: "" };
const emptyContractorForm = { name: "", phone: "", email: "", password: "", business_name: "", category: "", description: "", location_text: "" };

/* ──────────── helpers ──────────── */
function normalizeListValue(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === "string") { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
}

function toCsv(rows) {
  if (!rows?.length) return "";
  const keys = Array.from(rows.reduce((s, r) => { Object.keys(r || {}).forEach(k => s.add(k)); return s; }, new Set()));
  const esc = v => { if (v == null) return ""; const s = typeof v === "object" ? JSON.stringify(v) : String(v); return `"${s.replace(/"/g, '""')}"`; };
  return [keys.join(","), ...rows.map(r => keys.map(k => esc(r[k])).join(","))].join("\n");
}

function downloadCsv(filename, rows) {
  const csv = toCsv(rows);
  if (!csv) return toast.error("No data to export");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement("a"), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
}

/* ──────────── reusable UI atoms (module-scope to prevent focus loss) ──────────── */
function BtnPrimary({ children, ...props }) { return <button className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-cyan-400 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50" {...props}>{children}</button>; }
function BtnOutline({ children, ...props }) { return <button className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/15 text-[var(--color-body)] hover:bg-white/5 transition disabled:opacity-40" {...props}>{children}</button>; }
function BtnDanger({ children, ...props }) { return <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition disabled:opacity-40" {...props}>{children}</button>; }
function AdminInput(props) { return <input className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[var(--color-body)] placeholder-[var(--color-muted)] text-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30 transition outline-none" {...props} />; }
function AdminSelect({ children, ...props }) { return <select className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[var(--color-body)] text-sm focus:border-indigo-400 outline-none" {...props}>{children}</select>; }

/* ──────────── Stat card ──────────── */
function StatCard({ label, value, icon: Icon, color = "from-indigo-500 to-cyan-400" }) {
  return (
    <motion.div whileHover={{ y: -2, scale: 1.02 }} className="glass-card rounded-2xl p-5 flex items-center gap-4 border border-white/10">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm text-[var(--color-muted)] font-medium">{label}</p>
        <p className="text-2xl font-bold text-[var(--color-heading)] font-['Space_Grotesk']">{value}</p>
      </div>
    </motion.div>
  );
}

/* ──────────── Mini bar chart ──────────── */
function MiniChart({ data, label }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="glass-card rounded-2xl p-5 border border-white/10">
      <p className="text-sm font-semibold text-[var(--color-heading)] mb-3">{label}</p>
      <div className="flex items-end gap-[2px] h-24">
        {data.slice(-30).map((d, i) => (
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

/* ──────────── Detail Modal ──────────── */
function DetailModal({ data, onClose }) {
  if (!data) return null;
  const c = data.contractor || data;
  const media = [c.photo_url, c.image_url, c.id_proof_url, ...normalizeListValue(c.portfolio_photos), ...normalizeListValue(c.portfolio_urls)].filter(Boolean);
  const unique = Array.from(new Set(media)).map(m => getImageUrl(m));

  return (
    <div className="fixed inset-0 z-[1400] bg-black/60 backdrop-blur-sm p-4 overflow-y-auto flex items-start justify-center" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl w-full mt-16 glass-card rounded-2xl border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-xl font-bold text-[var(--color-heading)] font-['Space_Grotesk']">Profile Details</h3>
          <button className="px-4 py-2 rounded-xl text-sm font-medium border border-white/10 text-[var(--color-body)] hover:bg-white/5 transition" onClick={onClose}>Close</button>
        </div>
        <div className="p-5 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-xs text-[var(--color-muted)] mb-2 uppercase tracking-wider">User</p>
              <div className="space-y-1 text-sm text-[var(--color-body)]">
                <p><strong>ID:</strong> {data.id || "-"}</p>
                <p><strong>Name:</strong> {data.name || data.user_name || "-"}</p>
                <p><strong>Role:</strong> {data.role || "contractor"}</p>
                <p><strong>Phone:</strong> {data.phone || "-"}</p>
                <p><strong>Email:</strong> {data.email || "-"}</p>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-xs text-[var(--color-muted)] mb-2 uppercase tracking-wider">Contractor</p>
              <div className="space-y-1 text-sm text-[var(--color-body)]">
                <p><strong>Business:</strong> {c.business_name || "-"}</p>
                <p><strong>Category:</strong> {c.category || "-"}</p>
                <p><strong>Rating:</strong> {c.rating || "N/A"}</p>
                <p><strong>Verified:</strong> {c.is_verified ? "✅" : "❌"}</p>
                <p><strong>Featured:</strong> {c.is_featured ? "✅" : "❌"}</p>
              </div>
            </div>
          </div>
          {unique.length > 0 && (
            <div>
              <p className="text-xs text-[var(--color-muted)] mb-2 uppercase tracking-wider">Media</p>
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

export default function AdminDashboardPage() {
  const [tab, setTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Data
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
  const [reviews, setReviews] = useState([]);
  const [reviewQuery, setReviewQuery] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [settings, setSettings] = useState({});

  // Services management state
  const [svcCategories, setSvcCategories] = useState([]);
  const [svcServices, setSvcServices] = useState([]);
  const [svcRequests, setSvcRequests] = useState([]);
  const [svcSubTab, setSvcSubTab] = useState("categories");
  const [svcCatForm, setSvcCatForm] = useState({ name: "", name_hi: "", slug: "", type: "chhota", icon: "", description: "" });
  const [svcServiceForm, setSvcServiceForm] = useState({ name: "", name_hi: "", slug: "", category_id: "", price_starts_at: "", icon: "", description: "" });

  const [userForm, setUserForm] = useState(emptyUserForm);
  const [contractorForm, setContractorForm] = useState(emptyContractorForm);
  const [selectedDetail, setSelectedDetail] = useState(null);

  const userRoleOptions = useMemo(() => ["all", "customer", "contractor", "admin"], []);

  /* ──── loaders ──── */
  const loadOverview = useCallback(async () => {
    const [s, r] = await Promise.all([adminAPI.getStats(), adminAPI.getReports(reportFilter)]);
    setStats(s.data.stats || null);
    setReports(r.data.reports || []);
  }, [reportFilter]);

  const loadUsers = useCallback(async () => {
    const res = await adminAPI.getUsers({ role: userRoleFilter, q: userQuery || undefined, page: 1, limit: 50 });
    setUsers(res.data.users || []);
  }, [userRoleFilter, userQuery]);

  const loadContractors = useCallback(async () => {
    const params = { q: contractorQuery || undefined, page: 1, limit: 50 };
    if (verifiedFilter !== "all") params.verified = verifiedFilter === "verified";
    const res = await adminAPI.getContractors(params);
    setContractors(res.data.contractors || []);
  }, [contractorQuery, verifiedFilter]);

  const loadActivity = useCallback(async () => {
    const res = await adminAPI.getActivity();
    setActivity(res.data.activity || { users: [], reviews: [], reports: [] });
  }, []);

  const loadReviews = useCallback(async () => {
    const res = await adminAPI.getReviews({ q: reviewQuery || undefined, page: 1, limit: 50 });
    setReviews(res.data.reviews || []);
  }, [reviewQuery]);

  const loadAnalytics = useCallback(async () => {
    const res = await adminAPI.getAnalytics(30);
    setAnalytics(res.data.analytics || null);
  }, []);

  const loadSettings = useCallback(async () => {
    const res = await adminAPI.getSettings();
    setSettings(res.data.settings || {});
  }, []);

  const loadSvcCategories = useCallback(async () => {
    const res = await adminAPI.getServiceCategories();
    setSvcCategories(res.data.categories || []);
  }, []);

  const loadSvcServices = useCallback(async () => {
    const res = await adminAPI.getAdminServices();
    setSvcServices(res.data.services || []);
  }, []);

  const loadSvcRequests = useCallback(async () => {
    const res = await adminAPI.getServiceRequests();
    setSvcRequests(res.data.requests || []);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadOverview(), loadUsers(), loadContractors(), loadActivity(), loadReviews(), loadAnalytics(), loadSettings(), loadSvcCategories(), loadSvcServices(), loadSvcRequests()]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, [loadOverview, loadUsers, loadContractors, loadActivity, loadReviews, loadAnalytics, loadSettings, loadSvcCategories, loadSvcServices, loadSvcRequests]);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { loadUsers().catch(() => { }); }, [loadUsers]);
  useEffect(() => { loadContractors().catch(() => { }); }, [loadContractors]);
  useEffect(() => { loadOverview().catch(() => { }); }, [loadOverview]);
  useEffect(() => { loadReviews().catch(() => { }); }, [loadReviews]);

  /* ──── actions ──── */
  async function withBusy(fn) {
    setBusy(true);
    try { await fn(); } catch (err) { toast.error(err.response?.data?.message || "Action failed"); } finally { setBusy(false); }
  }

  async function showUserDetail(userId) { await withBusy(async () => { const res = await adminAPI.getUser(userId); setSelectedDetail(res.data.user || null); }); }
  async function showContractorDetail(c) { if (c?.user_id) return showUserDetail(c.user_id); setSelectedDetail(c || null); }

  async function handleCreateUser(e) {
    e.preventDefault();
    await withBusy(async () => {
      const payload = { name: userForm.name, phone: userForm.phone || undefined, email: userForm.email || undefined, password: userForm.password, role: userForm.role };
      if (userForm.role === "contractor") payload.contractor = { business_name: userForm.business_name || userForm.name, category: userForm.category || undefined };
      await adminAPI.createUser(payload);
      setUserForm(emptyUserForm);
      toast.success("User created");
      await Promise.all([loadUsers(), loadOverview(), loadContractors()]);
    });
  }

  async function handleCreateContractor(e) {
    e.preventDefault();
    await withBusy(async () => {
      await adminAPI.createContractor({ ...contractorForm, business_name: contractorForm.business_name || contractorForm.name });
      setContractorForm(emptyContractorForm);
      toast.success("Contractor created");
      await Promise.all([loadContractors(), loadUsers(), loadOverview()]);
    });
  }

  async function handleDeleteUser(id) { if (!window.confirm("Delete this user?")) return; await withBusy(async () => { await adminAPI.deleteUser(id); toast.success("Deleted"); await loadAll(); }); }
  async function handleDeleteContractor(id) { if (!window.confirm("Delete contractor + user?")) return; await withBusy(async () => { await adminAPI.deleteContractor(id); toast.success("Deleted"); await loadAll(); }); }
  async function handleQuickRoleChange(u, role) { await withBusy(async () => { await adminAPI.updateUser(u.id, { role }); toast.success(`Role → ${role}`); await Promise.all([loadUsers(), loadContractors(), loadOverview()]); }); }
  async function handleToggleContractorFlag(c, patch) { await withBusy(async () => { await adminAPI.updateContractor(c.id, patch); toast.success("Updated"); await Promise.all([loadContractors(), loadOverview()]); }); }
  async function handleVerifyRequest(c, status) { await withBusy(async () => { await adminAPI.verifyContractor(c.id, { status }); toast.success(`Request ${status}`); await Promise.all([loadContractors(), loadOverview()]); }); }
  async function handleResolveReport(id, status) { await withBusy(async () => { await adminAPI.resolveReport(id, status); toast.success(`Report ${status}`); await Promise.all([loadOverview(), loadActivity()]); }); }
  async function handleDeleteReview(id) { if (!window.confirm("Delete this review?")) return; await withBusy(async () => { await adminAPI.deleteReview(id); toast.success("Review deleted"); await Promise.all([loadReviews(), loadOverview()]); }); }
  async function handleSaveSettings() { await withBusy(async () => { const res = await adminAPI.updateSettings(settings); setSettings(res.data.settings); toast.success("Settings saved"); }); }

  // Service management actions
  async function handleCreateSvcCategory(e) {
    e.preventDefault();
    await withBusy(async () => {
      await adminAPI.createServiceCategory(svcCatForm);
      setSvcCatForm({ name: "", name_hi: "", slug: "", type: "chhota", icon: "", description: "" });
      toast.success("Category created");
      await loadSvcCategories();
    });
  }
  async function handleDeleteSvcCategory(id) { if (!window.confirm("Delete this category and all its services?")) return; await withBusy(async () => { await adminAPI.deleteServiceCategory(id); toast.success("Deleted"); await Promise.all([loadSvcCategories(), loadSvcServices()]); }); }
  async function handleToggleSvcCategory(cat) { await withBusy(async () => { await adminAPI.updateServiceCategory(cat.id, { is_active: !cat.is_active }); toast.success("Updated"); await loadSvcCategories(); }); }
  async function handleCreateSvcService(e) {
    e.preventDefault();
    await withBusy(async () => {
      await adminAPI.createAdminService({ ...svcServiceForm, price_starts_at: parseInt(svcServiceForm.price_starts_at) || null });
      setSvcServiceForm({ name: "", name_hi: "", slug: "", category_id: "", price_starts_at: "", icon: "", description: "" });
      toast.success("Service created");
      await loadSvcServices();
    });
  }
  async function handleDeleteSvcService(id) { if (!window.confirm("Delete this service?")) return; await withBusy(async () => { await adminAPI.deleteAdminService(id); toast.success("Deleted"); await loadSvcServices(); }); }
  async function handleToggleSvcService(svc) { await withBusy(async () => { await adminAPI.updateAdminService(svc.id, { is_active: !svc.is_active }); toast.success("Updated"); await loadSvcServices(); }); }
  async function handleUpdateSvcRequest(id, status) { await withBusy(async () => { await adminAPI.updateServiceRequest(id, { status }); toast.success(`Status → ${status}`); await loadSvcRequests(); }); }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]"><LoadingSpinner size="lg" /></div>;



  return (
    <main className="min-h-screen bg-[var(--color-bg)]">
      <div className="flex">
        {/* ──── Mobile Sidebar Overlay ──── */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* ──── Sidebar ──── */}
        <aside className={`${sidebarOpen ? "translate-x-0 w-60" : "-translate-x-full w-60 md:translate-x-0 md:w-16"} fixed md:sticky top-0 left-0 z-[100] flex-shrink-0 border-r border-white/10 bg-[var(--color-surface)] h-screen overflow-y-auto transition-transform duration-300 md:transition-all`}>
          <div className="p-4 border-b border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
              T
            </div>
            {sidebarOpen && <h2 className="text-lg font-bold text-[var(--color-heading)] font-['Space_Grotesk'] truncate">Admin Panel</h2>}
          </div>
          <nav className="p-2 space-y-1 mt-2 mb-16">
            {SIDEBAR.map(item => (
              <button
                key={item.id}
                onClick={() => { setTab(item.id); if (window.innerWidth <= 768) setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === item.id
                  ? "bg-gradient-to-r from-indigo-500/15 to-cyan-400/10 text-indigo-400 border border-indigo-500/20"
                  : "text-[var(--color-muted)] hover:text-[var(--color-body)] hover:bg-white/5"
                  }`}
              >
                <item.icon size={18} className="flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            ))}
          </nav>
          <div className="absolute bottom-4 left-0 right-0 px-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full py-2 rounded-xl text-xs text-[var(--color-muted)] hover:bg-white/5 transition">
              {sidebarOpen ? "← Collapse" : "→"}
            </button>
          </div>
        </aside>

        {/* ──── Content ──── */}
        <div className="flex-1 min-w-0 p-4 md:p-8 w-full md:w-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 -ml-2 rounded-xl text-[var(--color-body)] hover:bg-white/5"
              >
                <FiMenu size={22} />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-heading)] font-['Space_Grotesk']">
                  {SIDEBAR.find(s => s.id === tab)?.label || "Admin"}
                </h1>
                <p className="hidden md:block text-sm text-[var(--color-muted)] mt-1">Full platform control and analytics</p>
              </div>
            </div>
            <BtnPrimary onClick={loadAll} disabled={busy} className="self-end sm:self-auto">
              <span className="flex items-center gap-2"><FiRefreshCw size={14} className={busy ? "animate-spin" : ""} /> <span className="hidden sm:inline">Refresh</span></span>
            </BtnPrimary>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

              {/* ═══════ OVERVIEW ═══════ */}
              {tab === "overview" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Total Users" value={stats?.total_users || 0} icon={FiUsers} color="from-indigo-500 to-indigo-600" />
                    <StatCard label="Contractors" value={stats?.total_contractors || 0} icon={FiUserCheck} color="from-cyan-500 to-teal-500" />
                    <StatCard label="Verified" value={stats?.verified_contractors || 0} icon={FiCheckCircle} color="from-emerald-500 to-green-500" />
                    <StatCard label="Pending" value={stats?.pending_contractors || 0} icon={FiAlertTriangle} color="from-amber-500 to-orange-500" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Customers" value={stats?.total_customers || 0} icon={FiUsers} color="from-violet-500 to-purple-500" />
                    <StatCard label="Admins" value={stats?.total_admins || 0} icon={FiShield} color="from-rose-500 to-pink-500" />
                    <StatCard label="Reviews Today" value={stats?.reviews_today || 0} icon={FiStar} color="from-yellow-500 to-amber-500" />
                    <StatCard label="Featured" value={stats?.active_featured || 0} icon={FiAward} color="from-blue-500 to-indigo-500" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="glass-card rounded-2xl p-5 border border-white/10">
                      <h3 className="font-semibold text-[var(--color-heading)] mb-4 flex items-center gap-2"><FiUserCheck size={16} className="text-amber-400" /> Verification Requests</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {contractors.filter(c => c.verification_status === 'pending').slice(0, 8).map(c => (
                          <div key={c.id} className="flex flex-col gap-2 p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-[var(--color-heading)]">{c.business_name || c.user_name || "Contractor"}</p>
                                <p className="text-xs text-[var(--color-muted)]">{c.phone || "No phone"}</p>
                              </div>
                              <BtnOutline onClick={() => showContractorDetail(c)}>View</BtnOutline>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleVerifyRequest(c, 'approved')} disabled={busy} className="flex-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 py-1.5 text-xs rounded-lg font-medium transition">Approve</button>
                              <BtnDanger onClick={() => handleVerifyRequest(c, 'rejected')} disabled={busy} className="flex-1 !py-1.5 rounded-lg">Reject</BtnDanger>
                            </div>
                          </div>
                        ))}
                        {!contractors.some(c => c.verification_status === 'pending') && <p className="text-sm text-[var(--color-muted)] py-4 text-center">No pending requests ✓</p>}
                      </div>
                    </div>

                    <div className="glass-card rounded-2xl p-5 border border-white/10">
                      <h3 className="font-semibold text-[var(--color-heading)] mb-4 flex items-center gap-2"><FiAlertTriangle size={16} className="text-red-400" /> Pending Reports</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {reports.filter(r => r.status === "pending").slice(0, 8).map(r => (
                          <div key={r.id} className="p-3 rounded-xl bg-white/5 border border-white/5">
                            <p className="text-sm text-[var(--color-body)]">{r.reason || "No reason"}</p>
                            <div className="flex gap-2 mt-2">
                              <BtnOutline onClick={() => handleResolveReport(r.id, "resolved")} disabled={busy}><FiCheckCircle className="inline mr-1" />Resolve</BtnOutline>
                              <BtnDanger onClick={() => handleResolveReport(r.id, "rejected")} disabled={busy}><FiXCircle className="inline mr-1" />Reject</BtnDanger>
                            </div>
                          </div>
                        ))}
                        {!reports.some(r => r.status === "pending") && <p className="text-sm text-[var(--color-muted)] py-4 text-center">No pending reports ✓</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════ USERS ═══════ */}
              {tab === "users" && (
                <div className="space-y-6">
                  <div className="glass-card rounded-2xl p-5 border border-white/10">
                    <h3 className="font-semibold text-[var(--color-heading)] mb-4 flex items-center gap-2"><FiPlus size={16} /> Create User</h3>
                    <form className="grid md:grid-cols-3 gap-3" onSubmit={handleCreateUser}>
                      <AdminInput placeholder="Name" value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} required />
                      <AdminInput placeholder="Phone" value={userForm.phone} onChange={e => setUserForm(f => ({ ...f, phone: e.target.value }))} />
                      <AdminInput placeholder="Email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} />
                      <AdminInput placeholder="Password (min 8)" type="password" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} required />
                      <AdminSelect value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))}>
                        <option value="customer">customer</option>
                        <option value="contractor">contractor</option>
                        <option value="admin">admin</option>
                      </AdminSelect>
                      {userForm.role === "contractor" && (
                        <>
                          <AdminInput placeholder="Business Name" value={userForm.business_name} onChange={e => setUserForm(f => ({ ...f, business_name: e.target.value }))} />
                          <AdminInput placeholder="Category" value={userForm.category} onChange={e => setUserForm(f => ({ ...f, category: e.target.value }))} />
                        </>
                      )}
                      <div className="md:col-span-3"><BtnPrimary type="submit" disabled={busy}>Create User</BtnPrimary></div>
                    </form>
                  </div>

                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 max-w-sm">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" size={16} />
                      <AdminInput className="!pl-10" placeholder="Search users..." value={userQuery} onChange={e => setUserQuery(e.target.value)} />
                    </div>
                    <AdminSelect value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value)}>
                      {userRoleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                    </AdminSelect>
                    <BtnOutline onClick={() => downloadCsv("users.csv", users)}><FiDownload className="inline mr-1" />Export</BtnOutline>
                  </div>

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
                        {users.map(u => (
                          <tr key={u.id} className="border-t border-white/5 hover:bg-white/[0.02] transition">
                            <td className="p-3 text-[var(--color-heading)] font-medium">{u.name || "-"}</td>
                            <td className="p-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${u.role === "admin" ? "bg-rose-500/15 text-rose-400" : u.role === "contractor" ? "bg-cyan-500/15 text-cyan-400" : "bg-violet-500/15 text-violet-400"}`}>{u.role}</span></td>
                            <td className="p-3 text-[var(--color-body)]">{u.phone || "-"}</td>
                            <td className="p-3 text-[var(--color-body)]">{u.email || "-"}</td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1.5">
                                <BtnOutline disabled={busy} onClick={() => showUserDetail(u.id)}><FiEye className="inline" /></BtnOutline>
                                {u.role !== "admin" && <BtnOutline disabled={busy} onClick={() => handleQuickRoleChange(u, "admin")}>→ Admin</BtnOutline>}
                                {u.role !== "customer" && <BtnOutline disabled={busy} onClick={() => handleQuickRoleChange(u, "customer")}>→ Customer</BtnOutline>}
                                <BtnDanger disabled={busy} onClick={() => handleDeleteUser(u.id)}><FiTrash2 className="inline" /></BtnDanger>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {users.length === 0 && <tr><td className="p-6 text-center text-[var(--color-muted)]" colSpan={5}>No users found.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ═══════ CONTRACTORS ═══════ */}
              {tab === "contractors" && (
                <div className="space-y-6">
                  <div className="glass-card rounded-2xl p-5 border border-white/10">
                    <h3 className="font-semibold text-[var(--color-heading)] mb-4 flex items-center gap-2"><FiPlus size={16} /> Add Contractor</h3>
                    <form className="grid md:grid-cols-3 gap-3" onSubmit={handleCreateContractor}>
                      <AdminInput placeholder="Name" value={contractorForm.name} onChange={e => setContractorForm(f => ({ ...f, name: e.target.value }))} required />
                      <AdminInput placeholder="Phone" value={contractorForm.phone} onChange={e => setContractorForm(f => ({ ...f, phone: e.target.value }))} />
                      <AdminInput placeholder="Email" value={contractorForm.email} onChange={e => setContractorForm(f => ({ ...f, email: e.target.value }))} />
                      <AdminInput placeholder="Password" type="password" value={contractorForm.password} onChange={e => setContractorForm(f => ({ ...f, password: e.target.value }))} required />
                      <AdminInput placeholder="Business Name" value={contractorForm.business_name} onChange={e => setContractorForm(f => ({ ...f, business_name: e.target.value }))} />
                      <AdminInput placeholder="Category" value={contractorForm.category} onChange={e => setContractorForm(f => ({ ...f, category: e.target.value }))} />
                      <AdminInput placeholder="Description" value={contractorForm.description} onChange={e => setContractorForm(f => ({ ...f, description: e.target.value }))} className="md:col-span-2" />
                      <AdminInput placeholder="Location" value={contractorForm.location_text} onChange={e => setContractorForm(f => ({ ...f, location_text: e.target.value }))} />
                      <div className="md:col-span-3"><BtnPrimary type="submit" disabled={busy}>Create Contractor</BtnPrimary></div>
                    </form>
                  </div>

                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 max-w-sm">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" size={16} />
                      <AdminInput className="!pl-10" placeholder="Search contractors..." value={contractorQuery} onChange={e => setContractorQuery(e.target.value)} />
                    </div>
                    <AdminSelect value={verifiedFilter} onChange={e => setVerifiedFilter(e.target.value)}>
                      <option value="all">All</option>
                      <option value="verified">Verified</option>
                      <option value="unverified">Unverified</option>
                    </AdminSelect>
                    <BtnOutline onClick={() => downloadCsv("contractors.csv", contractors)}><FiDownload className="inline mr-1" />Export</BtnOutline>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {contractors.map(c => (
                      <motion.div key={c.id} whileHover={{ y: -2 }} className="glass-card rounded-2xl p-5 border border-white/10">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-[var(--color-heading)]">{c.business_name || c.user_name || "Contractor"}</p>
                            <p className="text-xs text-[var(--color-muted)] mt-0.5">{c.phone || "No phone"} · {c.email || "No email"}</p>
                            <p className="text-xs text-indigo-400 mt-1">{c.category || "No category"}</p>
                          </div>
                          <div className={`text-[10px] flex flex-col items-end gap-1 font-bold`}>
                            <span className={c.is_verified ? "bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full" : "bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full"}>
                              {c.is_verified ? "✓ Verified" : "Unverified"}
                            </span>
                            {c.tier && c.tier !== 'standard' && (
                              <span className="bg-white/10 text-[var(--color-body)] px-2 py-0.5 rounded-full capitalize border border-white/10">{c.tier}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4 items-center">
                          <BtnOutline disabled={busy} onClick={() => showContractorDetail(c)}><FiEye className="inline mr-1" />View</BtnOutline>
                          {c.verification_status === 'pending' ? (
                            <>
                              <BtnOutline disabled={busy} onClick={() => handleVerifyRequest(c, 'approved')} className="!text-emerald-400 !border-emerald-400/30">Approve</BtnOutline>
                              <BtnOutline disabled={busy} onClick={() => handleVerifyRequest(c, 'rejected')} className="!text-red-400 !border-red-400/30">Reject</BtnOutline>
                            </>
                          ) : (
                            <BtnOutline disabled={busy} onClick={() => handleToggleContractorFlag(c, { is_verified: !c.is_verified })}>{c.is_verified ? "Unverify" : "Verify"}</BtnOutline>
                          )}
                          <BtnOutline disabled={busy} onClick={() => handleToggleContractorFlag(c, { is_featured: !c.is_featured })}>{c.is_featured ? "★ Unfeat." : "☆ Feature"}</BtnOutline>

                          <select className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-[var(--color-body)] outline-none"
                            value={c.tier || 'standard'}
                            onChange={(e) => handleToggleContractorFlag(c, { tier: e.target.value })} disabled={busy}>
                            <option value="standard">Standard</option>
                            <option value="silver">Silver</option>
                            <option value="gold">Gold</option>
                            <option value="platinum">Platinum</option>
                          </select>

                          <BtnDanger disabled={busy} onClick={() => handleDeleteContractor(c.id)}><FiTrash2 className="inline" /></BtnDanger>
                        </div>
                      </motion.div>
                    ))}
                    {contractors.length === 0 && <p className="text-sm text-[var(--color-muted)] col-span-2 text-center py-8">No contractors found.</p>}
                  </div>
                </div>
              )}

              {/* ═══════ REVIEWS ═══════ */}
              {tab === "reviews" && (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 max-w-sm">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" size={16} />
                      <AdminInput className="!pl-10" placeholder="Search reviews..." value={reviewQuery} onChange={e => setReviewQuery(e.target.value)} />
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
                        {reviews.map(r => (
                          <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.02] transition">
                            <td className="p-3 text-[var(--color-heading)] font-medium">{r.reviewer_name || `User #${r.user_id}`}</td>
                            <td className="p-3 text-[var(--color-body)]">{r.contractor_name || `#${r.contractor_id}`}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => <FiStar key={i} size={12} className={i < r.rating ? "text-amber-400 fill-amber-400" : "text-white/20"} />)}
                              </div>
                            </td>
                            <td className="p-3 text-[var(--color-body)] max-w-[200px] truncate">{r.comment || "-"}</td>
                            <td className="p-3 text-[var(--color-muted)] text-xs">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "-"}</td>
                            <td className="p-3"><BtnDanger disabled={busy} onClick={() => handleDeleteReview(r.id)}><FiTrash2 className="inline" /></BtnDanger></td>
                          </tr>
                        ))}
                        {reviews.length === 0 && <tr><td className="p-6 text-center text-[var(--color-muted)]" colSpan={6}>No reviews found.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ═══════ MODERATION ═══════ */}
              {tab === "moderation" && (
                <div className="space-y-5">
                  <div className="flex flex-wrap gap-2">
                    {["pending", "resolved", "rejected", "all"].map(f => (
                      <button key={f} onClick={() => setReportFilter(f)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition ${reportFilter === f ? "bg-gradient-to-r from-indigo-500 to-cyan-400 text-white shadow" : "bg-white/5 text-[var(--color-muted)] border border-white/10 hover:bg-white/10"}`}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                    <BtnOutline onClick={() => downloadCsv(`reports-${reportFilter}.csv`, reports)}><FiDownload className="inline mr-1" />Export</BtnOutline>
                  </div>

                  <div className="space-y-3">
                    {reports.map(r => (
                      <div key={r.id} className="glass-card rounded-2xl p-5 border border-white/10">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm text-[var(--color-body)]">{r.reason || "No reason"}</p>
                            <p className="text-xs text-[var(--color-muted)] mt-1">Reporter: {r.reporter_name || "Unknown"} · Contractor: {r.business_name || `#${r.contractor_id}`}</p>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${r.status === "pending" ? "bg-amber-500/15 text-amber-400" : r.status === "resolved" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>{r.status}</span>
                        </div>
                        {r.status === "pending" && (
                          <div className="flex gap-2 mt-3">
                            <BtnOutline disabled={busy} onClick={() => handleResolveReport(r.id, "resolved")}><FiCheckCircle className="inline mr-1" />Resolve</BtnOutline>
                            <BtnDanger disabled={busy} onClick={() => handleResolveReport(r.id, "rejected")}><FiXCircle className="inline mr-1" />Reject</BtnDanger>
                          </div>
                        )}
                      </div>
                    ))}
                    {reports.length === 0 && <p className="text-sm text-[var(--color-muted)] text-center py-8">No reports for this filter.</p>}
                  </div>
                </div>
              )}

              {/* ═══════ ANALYTICS ═══════ */}
              {tab === "analytics" && analytics && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-5">
                    <MiniChart data={analytics.registration_trend || []} label="📈 User Registrations (30 days)" />
                    <MiniChart data={analytics.review_trend || []} label="⭐ Reviews (30 days)" />
                  </div>

                  <div className="glass-card rounded-2xl p-5 border border-white/10">
                    <h3 className="font-semibold text-[var(--color-heading)] mb-4 flex items-center gap-2"><FiAward size={16} className="text-amber-400" /> Top Contractors by Leads</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-[700px]">
                        <thead className="text-[var(--color-muted)]">
                          <tr>
                            <th className="text-left p-2">#</th>
                            <th className="text-left p-2">Name</th>
                            <th className="text-left p-2">Category</th>
                            <th className="text-left p-2">Rating</th>
                            <th className="text-left p-2">Views</th>
                            <th className="text-left p-2">Leads</th>
                            <th className="text-left p-2">Reviews</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(analytics.top_contractors || []).map((c, i) => (
                            <tr key={c.id} className="border-t border-white/5">
                              <td className="p-2 text-[var(--color-muted)]">{i + 1}</td>
                              <td className="p-2 text-[var(--color-heading)] font-medium">{c.name || "-"}</td>
                              <td className="p-2 text-indigo-400 text-xs">{c.category || "-"}</td>
                              <td className="p-2 text-amber-400">{c.rating ? Number(c.rating).toFixed(1) : "-"}</td>
                              <td className="p-2 text-[var(--color-body)]">{c.views_count || 0}</td>
                              <td className="p-2 font-bold text-cyan-400">{c.leads_count || 0}</td>
                              <td className="p-2 text-[var(--color-body)]">{c.review_count || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════ ACTIVITY ═══════ */}
              {tab === "activity" && (
                <div className="space-y-5">
                  <BtnOutline onClick={() => downloadCsv("activity.csv", [...activity.users, ...activity.reviews, ...activity.reports])}><FiDownload className="inline mr-1" />Export All</BtnOutline>
                  <div className="grid md:grid-cols-3 gap-5">
                    <div className="glass-card rounded-2xl p-5 border border-white/10">
                      <h3 className="font-semibold text-[var(--color-heading)] mb-3 flex items-center gap-2"><FiUsers size={16} className="text-indigo-400" /> Recent Users</h3>
                      <div className="space-y-2">
                        {activity.users.map(u => (
                          <div key={u.id} className="p-3 rounded-xl bg-white/5 border border-white/5">
                            <p className="text-sm font-medium text-[var(--color-heading)]">{u.name || "Unnamed"}</p>
                            <p className="text-xs text-[var(--color-muted)]">{u.role} · {u.phone || "-"}</p>
                          </div>
                        ))}
                        {activity.users.length === 0 && <p className="text-sm text-[var(--color-muted)] text-center py-4">No recent users.</p>}
                      </div>
                    </div>
                    <div className="glass-card rounded-2xl p-5 border border-white/10">
                      <h3 className="font-semibold text-[var(--color-heading)] mb-3 flex items-center gap-2"><FiStar size={16} className="text-amber-400" /> Recent Reviews</h3>
                      <div className="space-y-2">
                        {activity.reviews.map(r => (
                          <div key={r.id} className="p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-1 mb-1">
                              {[...Array(5)].map((_, i) => <FiStar key={i} size={10} className={i < r.rating ? "text-amber-400 fill-amber-400" : "text-white/20"} />)}
                            </div>
                            <p className="text-xs text-[var(--color-muted)]">Contractor #{r.contractor_id} · {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}</p>
                          </div>
                        ))}
                        {activity.reviews.length === 0 && <p className="text-sm text-[var(--color-muted)] text-center py-4">No recent reviews.</p>}
                      </div>
                    </div>
                    <div className="glass-card rounded-2xl p-5 border border-white/10">
                      <h3 className="font-semibold text-[var(--color-heading)] mb-3 flex items-center gap-2"><FiAlertTriangle size={16} className="text-red-400" /> Recent Reports</h3>
                      <div className="space-y-2">
                        {activity.reports.map(r => (
                          <div key={r.id} className="p-3 rounded-xl bg-white/5 border border-white/5">
                            <p className="text-sm font-medium text-[var(--color-heading)]">Report #{r.id}</p>
                            <p className="text-xs text-[var(--color-muted)]">Status: {r.status} · {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}</p>
                          </div>
                        ))}
                        {activity.reports.length === 0 && <p className="text-sm text-[var(--color-muted)] text-center py-4">No recent reports.</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════ SETTINGS ═══════ */}
              {tab === "settings" && (
                <div className="max-w-2xl space-y-6">
                  <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-5">
                    <h3 className="font-semibold text-[var(--color-heading)] flex items-center gap-2"><FiSettings size={16} /> Site Configuration</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1 block">Site Name</label>
                        <AdminInput value={settings.site_name || ""} onChange={e => setSettings(s => ({ ...s, site_name: e.target.value }))} />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1 block">Support Email</label>
                          <AdminInput value={settings.support_email || ""} onChange={e => setSettings(s => ({ ...s, support_email: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1 block">Support Phone</label>
                          <AdminInput value={settings.support_phone || ""} onChange={e => setSettings(s => ({ ...s, support_phone: e.target.value }))} />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1 block">Featured Contractors Limit</label>
                          <AdminInput type="number" min={1} max={50} value={settings.featured_limit || 8} onChange={e => setSettings(s => ({ ...s, featured_limit: parseInt(e.target.value) || 8 }))} />
                        </div>
                        <div>
                          <label className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1 block">Max Portfolio Photos</label>
                          <AdminInput type="number" min={1} max={20} value={settings.max_portfolio_photos || 5} onChange={e => setSettings(s => ({ ...s, max_portfolio_photos: parseInt(e.target.value) || 5 }))} />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                        <button
                          onClick={() => setSettings(s => ({ ...s, maintenance_mode: !s.maintenance_mode }))}
                          className={`w-12 h-6 rounded-full transition-all flex items-center p-0.5 ${settings.maintenance_mode ? "bg-red-500 justify-end" : "bg-white/20 justify-start"}`}
                        >
                          <div className="w-5 h-5 rounded-full bg-white shadow" />
                        </button>
                        <div>
                          <p className="text-sm font-medium text-[var(--color-heading)]">Maintenance Mode</p>
                          <p className="text-xs text-[var(--color-muted)]">When enabled, only admins can access the site</p>
                        </div>
                      </div>
                    </div>

                    <BtnPrimary onClick={handleSaveSettings} disabled={busy}>
                      <span className="flex items-center gap-2">Save Settings</span>
                    </BtnPrimary>
                  </div>
                </div>
              )}

              {/* ═══════ SERVICES ═══════ */}
              {tab === "services" && (
                <div className="space-y-6">
                  {/* Sub-tabs */}
                  <div className="flex gap-2">
                    {["categories", "services", "requests"].map(st => (
                      <button key={st} onClick={() => setSvcSubTab(st)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition ${svcSubTab === st ? "bg-gradient-to-r from-indigo-500 to-cyan-400 text-white shadow" : "bg-white/5 text-[var(--color-muted)] border border-white/10 hover:bg-white/10"}`}>
                        {st.charAt(0).toUpperCase() + st.slice(1)}
                      </button>
                    ))}
                  </div>

                  {svcSubTab === "categories" && (
                    <>
                      <div className="glass-card rounded-2xl p-5 border border-white/10">
                        <h3 className="font-semibold text-[var(--color-heading)] mb-4 flex items-center gap-2"><FiPlus size={16} /> Add Category</h3>
                        <form className="grid md:grid-cols-3 gap-3" onSubmit={handleCreateSvcCategory}>
                          <AdminInput placeholder="Name (EN)" value={svcCatForm.name} onChange={e => setSvcCatForm(f => ({ ...f, name: e.target.value }))} required />
                          <AdminInput placeholder="Name (HI)" value={svcCatForm.name_hi} onChange={e => setSvcCatForm(f => ({ ...f, name_hi: e.target.value }))} />
                          <AdminInput placeholder="Slug" value={svcCatForm.slug} onChange={e => setSvcCatForm(f => ({ ...f, slug: e.target.value }))} required />
                          <AdminSelect value={svcCatForm.type} onChange={e => setSvcCatForm(f => ({ ...f, type: e.target.value }))}>
                            <option value="chhota">Quick Services</option>
                            <option value="bada">Macro Services</option>
                          </AdminSelect>
                          <AdminInput placeholder="Icon name" value={svcCatForm.icon} onChange={e => setSvcCatForm(f => ({ ...f, icon: e.target.value }))} />
                          <AdminInput placeholder="Description" value={svcCatForm.description} onChange={e => setSvcCatForm(f => ({ ...f, description: e.target.value }))} />
                          <div className="md:col-span-3"><BtnPrimary type="submit" disabled={busy}>Create Category</BtnPrimary></div>
                        </form>
                      </div>
                      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-white/5 text-[var(--color-muted)]">
                            <tr><th className="text-left p-3">Name</th><th className="text-left p-3">Hindi</th><th className="text-left p-3">Type</th><th className="text-left p-3">Active</th><th className="text-left p-3">Actions</th></tr>
                          </thead>
                          <tbody>
                            {svcCategories.map(c => (
                              <tr key={c.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                                <td className="p-3 text-[var(--color-heading)] font-medium">{c.name}</td>
                                <td className="p-3 text-[var(--color-body)]">{c.name_hi || "-"}</td>
                                <td className="p-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${c.type === "chhota" ? "bg-amber-500/15 text-amber-400" : "bg-cyan-500/15 text-cyan-400"}`}>{c.type === "chhota" ? "Quick" : "Big"}</span></td>
                                <td className="p-3"><span className={c.is_active ? "text-green-400" : "text-red-400"}>{c.is_active ? "✓" : "✗"}</span></td>
                                <td className="p-3"><div className="flex gap-1.5"><BtnOutline disabled={busy} onClick={() => handleToggleSvcCategory(c)}>{c.is_active ? "Disable" : "Enable"}</BtnOutline><BtnDanger disabled={busy} onClick={() => handleDeleteSvcCategory(c.id)}><FiTrash2 className="inline" /></BtnDanger></div></td>
                              </tr>
                            ))}
                            {svcCategories.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-[var(--color-muted)]">No categories yet.</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {svcSubTab === "services" && (
                    <>
                      <div className="glass-card rounded-2xl p-5 border border-white/10">
                        <h3 className="font-semibold text-[var(--color-heading)] mb-4 flex items-center gap-2"><FiPlus size={16} /> Add Service</h3>
                        <form className="grid md:grid-cols-3 gap-3" onSubmit={handleCreateSvcService}>
                          <AdminInput placeholder="Name (EN)" value={svcServiceForm.name} onChange={e => setSvcServiceForm(f => ({ ...f, name: e.target.value }))} required />
                          <AdminInput placeholder="Name (HI)" value={svcServiceForm.name_hi} onChange={e => setSvcServiceForm(f => ({ ...f, name_hi: e.target.value }))} />
                          <AdminInput placeholder="Slug" value={svcServiceForm.slug} onChange={e => setSvcServiceForm(f => ({ ...f, slug: e.target.value }))} required />
                          <AdminSelect value={svcServiceForm.category_id} onChange={e => setSvcServiceForm(f => ({ ...f, category_id: e.target.value }))} required>
                            <option value="">Select Category</option>
                            {svcCategories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type === "chhota" ? "Quick" : "Big"})</option>)}
                          </AdminSelect>
                          <AdminInput placeholder="Price ₹" type="number" value={svcServiceForm.price_starts_at} onChange={e => setSvcServiceForm(f => ({ ...f, price_starts_at: e.target.value }))} />
                          <AdminInput placeholder="Icon" value={svcServiceForm.icon} onChange={e => setSvcServiceForm(f => ({ ...f, icon: e.target.value }))} />
                          <AdminInput placeholder="Description" value={svcServiceForm.description} onChange={e => setSvcServiceForm(f => ({ ...f, description: e.target.value }))} className="md:col-span-2" />
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
                                <td className="p-3 text-indigo-400 text-xs">{s.category_name || "-"}</td>
                                <td className="p-3 text-[var(--color-body)]">{s.price_starts_at ? `₹${s.price_starts_at}` : "-"}</td>
                                <td className="p-3 text-amber-400">{Number(s.rating).toFixed(1)}</td>
                                <td className="p-3"><span className={s.is_active ? "text-green-400" : "text-red-400"}>{s.is_active ? "✓" : "✗"}</span></td>
                                <td className="p-3"><div className="flex gap-1.5"><BtnOutline disabled={busy} onClick={() => handleToggleSvcService(s)}>{s.is_active ? "Disable" : "Enable"}</BtnOutline><BtnDanger disabled={busy} onClick={() => handleDeleteSvcService(s.id)}><FiTrash2 className="inline" /></BtnDanger></div></td>
                              </tr>
                            ))}
                            {svcServices.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-[var(--color-muted)]">No services yet.</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

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
                              <td className="p-3 text-indigo-400 text-xs">{r.service_name || r.category_name || "-"}</td>
                              <td className="p-3 text-[var(--color-muted)] text-xs">{r.preferred_date || "-"}</td>
                              <td className="p-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${r.status === "pending" ? "bg-amber-500/15 text-amber-400" : r.status === "confirmed" ? "bg-blue-500/15 text-blue-400" : r.status === "completed" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>{r.status}</span></td>
                              <td className="p-3"><div className="flex gap-1.5">
                                {r.status === "pending" && <BtnOutline disabled={busy} onClick={() => handleUpdateSvcRequest(r.id, "confirmed")}>Confirm</BtnOutline>}
                                {r.status === "confirmed" && <BtnOutline disabled={busy} onClick={() => handleUpdateSvcRequest(r.id, "completed")}>Complete</BtnOutline>}
                                {r.status !== "cancelled" && r.status !== "completed" && <BtnDanger disabled={busy} onClick={() => handleUpdateSvcRequest(r.id, "cancelled")}>Cancel</BtnDanger>}
                              </div></td>
                            </tr>
                          ))}
                          {svcRequests.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-[var(--color-muted)]">No service requests yet.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <DetailModal data={selectedDetail} onClose={() => setSelectedDetail(null)} />
    </main>
  );
}
