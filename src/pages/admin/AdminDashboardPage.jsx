import React, { useCallback, useEffect, useMemo, useState } from "react";
import { adminAPI } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUsers, FiUserCheck, FiShield, FiTrendingUp, FiSettings, FiStar,
  FiAlertTriangle, FiActivity, FiRefreshCw, FiBarChart2, FiGrid, FiMenu,
} from "react-icons/fi";

// Panels
import OverviewPanel from "./panels/OverviewPanel";
import UsersPanel from "./panels/UsersPanel";
import ContractorsPanel from "./panels/ContractorsPanel";
import ReviewsPanel from "./panels/ReviewsPanel";
import ModerationPanel from "./panels/ModerationPanel";
import AnalyticsPanel from "./panels/AnalyticsPanel";
import ServicesPanel from "./panels/ServicesPanel";
import SettingsPanel from "./panels/SettingsPanel";
import { DetailModal, BtnPrimary } from "./panels/AdminShared";

/* ──────────── Sidebar config ──────────── */
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

const emptyCatForm = { name: "", name_hi: "", slug: "", icon: "", description: "" };
const emptySvcForm = { name: "", name_hi: "", slug: "", category_id: "", price_starts_at: "", icon: "", description: "" };

export default function AdminDashboardPage() {
  const [tab, setTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth > 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── Data state ──────────────────────────────────────────
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
  const [svcCategories, setSvcCategories] = useState([]);
  const [svcServices, setSvcServices] = useState([]);
  const [svcRequests, setSvcRequests] = useState([]);
  const [svcSubTab, setSvcSubTab] = useState("categories");
  const [svcCatForm, setSvcCatForm] = useState(emptyCatForm);
  const [svcServiceForm, setSvcServiceForm] = useState(emptySvcForm);
  const [selectedDetail, setSelectedDetail] = useState(null);

  // ── Loaders ─────────────────────────────────────────────
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
      await Promise.all([
        loadOverview(), loadUsers(), loadContractors(), loadActivity(),
        loadReviews(), loadAnalytics(), loadSettings(),
        loadSvcCategories(), loadSvcServices(), loadSvcRequests(),
      ]);
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

  // ── Actions ─────────────────────────────────────────────
  async function withBusy(fn) {
    setBusy(true);
    try { await fn(); } catch (err) { toast.error(err.response?.data?.message || "Action failed"); } finally { setBusy(false); }
  }

  async function showUserDetail(userId) { await withBusy(async () => { const res = await adminAPI.getUser(userId); setSelectedDetail(res.data.user || null); }); }
  async function showContractorDetail(c) { if (c?.user_id) return showUserDetail(c.user_id); setSelectedDetail(c || null); }

  async function handleCreateUser(form) {
    await withBusy(async () => {
      const payload = { name: form.name, phone: form.phone || undefined, email: form.email || undefined, password: form.password, role: form.role };
      if (form.role === "contractor") payload.contractor = { business_name: form.business_name || form.name, category: form.category || undefined };
      await adminAPI.createUser(payload);
      toast.success("User created");
      await Promise.all([loadUsers(), loadOverview(), loadContractors()]);
    });
  }

  async function handleCreateContractor(form) {
    await withBusy(async () => {
      await adminAPI.createContractor({ ...form, business_name: form.business_name || form.name });
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

  async function handleCreateSvcCategory(e) {
    e.preventDefault();
    await withBusy(async () => { await adminAPI.createServiceCategory(svcCatForm); setSvcCatForm(emptyCatForm); toast.success("Category created"); await loadSvcCategories(); });
  }
  async function handleDeleteSvcCategory(id) { if (!window.confirm("Delete this category and all its services?")) return; await withBusy(async () => { await adminAPI.deleteServiceCategory(id); toast.success("Deleted"); await Promise.all([loadSvcCategories(), loadSvcServices()]); }); }
  async function handleToggleSvcCategory(cat) { await withBusy(async () => { await adminAPI.updateServiceCategory(cat.id, { is_active: !cat.is_active }); toast.success("Updated"); await loadSvcCategories(); }); }
  async function handleCreateSvcService(e) {
    e.preventDefault();
    await withBusy(async () => { await adminAPI.createAdminService({ ...svcServiceForm, price_starts_at: parseInt(svcServiceForm.price_starts_at) || null }); setSvcServiceForm(emptySvcForm); toast.success("Service created"); await loadSvcServices(); });
  }
  async function handleDeleteSvcService(id) { if (!window.confirm("Delete this service?")) return; await withBusy(async () => { await adminAPI.deleteAdminService(id); toast.success("Deleted"); await loadSvcServices(); }); }
  async function handleToggleSvcService(svc) { await withBusy(async () => { await adminAPI.updateAdminService(svc.id, { is_active: !svc.is_active }); toast.success("Updated"); await loadSvcServices(); }); }
  async function handleUpdateSvcRequest(id, status) { await withBusy(async () => { await adminAPI.updateServiceRequest(id, { status }); toast.success(`Status → ${status}`); await loadSvcRequests(); }); }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]"><LoadingSpinner size="lg" /></div>;

  const currentLabel = SIDEBAR.find((s) => s.id === tab)?.label || "Admin";

  return (
    <main className="min-h-screen bg-[var(--color-bg)]">
      <div className="flex">
        {/* ── Mobile sidebar overlay ── */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* ── Sidebar ── */}
        <aside className={`${sidebarOpen ? "translate-x-0 w-60" : "-translate-x-full w-60 md:translate-x-0 md:w-16"} fixed md:sticky top-0 left-0 z-[100] flex-shrink-0 border-r border-white/10 bg-[var(--color-surface)] h-screen overflow-y-auto transition-transform duration-300 md:transition-all`}>
          <div className="p-4 border-b border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">T</div>
            {sidebarOpen && <h2 className="text-lg font-bold text-[var(--color-heading)] font-['Space_Grotesk'] truncate">Admin</h2>}
          </div>
          <nav className="p-2 space-y-1 mt-2 mb-16">
            {SIDEBAR.map((item) => (
              <button
                key={item.id}
                onClick={() => { setTab(item.id); if (window.innerWidth <= 768) setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === item.id ? "bg-gradient-to-r from-indigo-500/15 to-cyan-400/10 text-indigo-400 border border-indigo-500/20" : "text-[var(--color-muted)] hover:text-[var(--color-body)] hover:bg-white/5"}`}
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

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0 p-4 md:p-8 w-full md:w-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 rounded-xl text-[var(--color-body)] hover:bg-white/5">
                <FiMenu size={22} />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-heading)] font-['Space_Grotesk']">{currentLabel}</h1>
                <p className="hidden md:block text-sm text-[var(--color-muted)] mt-1">Full platform control and analytics</p>
              </div>
            </div>
            <BtnPrimary onClick={loadAll} disabled={busy}>
              <span className="flex items-center gap-2"><FiRefreshCw size={14} className={busy ? "animate-spin" : ""} /><span className="hidden sm:inline">Refresh</span></span>
            </BtnPrimary>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

              {tab === "overview" && (
                <OverviewPanel
                  stats={stats} contractors={contractors} reports={reports} busy={busy}
                  onVerify={handleVerifyRequest} onResolve={handleResolveReport} onViewContractor={showContractorDetail}
                />
              )}

              {tab === "users" && (
                <UsersPanel
                  users={users} busy={busy}
                  onCreateUser={handleCreateUser} onDeleteUser={handleDeleteUser}
                  onRoleChange={handleQuickRoleChange} onViewUser={showUserDetail}
                  userQuery={userQuery} setUserQuery={setUserQuery}
                  userRoleFilter={userRoleFilter} setUserRoleFilter={setUserRoleFilter}
                />
              )}

              {tab === "contractors" && (
                <ContractorsPanel
                  contractors={contractors} busy={busy}
                  onCreateContractor={handleCreateContractor} onDeleteContractor={handleDeleteContractor}
                  onToggleFlag={handleToggleContractorFlag} onVerify={handleVerifyRequest}
                  onView={showContractorDetail}
                  contractorQuery={contractorQuery} setContractorQuery={setContractorQuery}
                  verifiedFilter={verifiedFilter} setVerifiedFilter={setVerifiedFilter}
                />
              )}

              {tab === "services" && (
                <ServicesPanel
                  svcCategories={svcCategories} svcServices={svcServices} svcRequests={svcRequests}
                  svcSubTab={svcSubTab} setSvcSubTab={setSvcSubTab}
                  svcCatForm={svcCatForm} setSvcCatForm={setSvcCatForm}
                  svcServiceForm={svcServiceForm} setSvcServiceForm={setSvcServiceForm}
                  busy={busy}
                  onCreateCategory={handleCreateSvcCategory} onDeleteCategory={handleDeleteSvcCategory} onToggleCategory={handleToggleSvcCategory}
                  onCreateService={handleCreateSvcService} onDeleteService={handleDeleteSvcService} onToggleService={handleToggleSvcService}
                  onUpdateRequest={handleUpdateSvcRequest}
                />
              )}

              {tab === "reviews" && (
                <ReviewsPanel
                  reviews={reviews} busy={busy} onDelete={handleDeleteReview}
                  reviewQuery={reviewQuery} setReviewQuery={setReviewQuery}
                />
              )}

              {tab === "moderation" && (
                <ModerationPanel
                  reports={reports} busy={busy}
                  reportFilter={reportFilter} setReportFilter={setReportFilter}
                  onResolve={handleResolveReport}
                />
              )}

              {(tab === "analytics" || tab === "activity") && (
                <AnalyticsPanel analytics={analytics} activity={activity} />
              )}

              {tab === "settings" && (
                <SettingsPanel settings={settings} setSettings={setSettings} busy={busy} onSave={handleSaveSettings} />
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <DetailModal data={selectedDetail} onClose={() => setSelectedDetail(null)} />
    </main>
  );
}
