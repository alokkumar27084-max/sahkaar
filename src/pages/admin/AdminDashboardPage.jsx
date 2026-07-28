import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUsers, FiUserCheck, FiTrendingUp, FiSettings, FiStar,
  FiAlertTriangle, FiActivity, FiRefreshCw, FiBarChart2, FiMenu, FiLogOut,
} from "react-icons/fi";

// Panels
import OverviewPanel from "./panels/OverviewPanel";
import UsersPanel from "./panels/UsersPanel";
import ContractorsPanel from "./panels/ContractorsPanel";
import ReviewsPanel from "./panels/ReviewsPanel";
import ModerationPanel from "./panels/ModerationPanel";
import AnalyticsPanel from "./panels/AnalyticsPanel";
import SettingsPanel from "./panels/SettingsPanel";
import { DetailModal, EditContractorModal, EditUserModal } from "./panels/AdminShared";

/* ──────────── Sidebar config ──────────── */
const SIDEBAR = [
  { id: "overview", label: "Overview", icon: FiBarChart2 },
  { id: "users", label: "Users", icon: FiUsers },
  { id: "contractors", label: "Contractors", icon: FiUserCheck },
  { id: "reviews", label: "Reviews", icon: FiStar },
  { id: "moderation", label: "Moderation", icon: FiAlertTriangle },
  { id: "analytics", label: "Analytics", icon: FiTrendingUp },
  { id: "activity", label: "Activity", icon: FiActivity },
  { id: "settings", label: "Settings", icon: FiSettings },
];

export default function AdminDashboardPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
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
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [userTotalPages, setUserTotalPages] = useState(1);

  const [contractors, setContractors] = useState([]);
  const [contractorQuery, setContractorQuery] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [contractorPage, setContractorPage] = useState(1);
  const [contractorTotal, setContractorTotal] = useState(0);
  const [contractorTotalPages, setContractorTotalPages] = useState(1);

  const [activity, setActivity] = useState({ users: [], reviews: [], reports: [] });
  const [reviews, setReviews] = useState([]);
  const [reviewQuery, setReviewQuery] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [settings, setSettings] = useState({});

  // Modals state
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [editingContractor, setEditingContractor] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  // ── Specific Loaders ─────────────────────────────────────────
  const loadOverview = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([adminAPI.getStats(), adminAPI.getReports(reportFilter)]);
      setStats(s.data.stats || null);
      setReports(r.data.reports || []);
    } catch (err) {
      console.error("Error loading overview:", err);
    }
  }, [reportFilter]);

  const loadUsers = useCallback(async (p = userPage, q = userQuery, r = userRoleFilter) => {
    try {
      const res = await adminAPI.getUsers({ role: r, q: q || undefined, page: p, limit: 50 });
      setUsers(res.data.users || []);
      const total = res.data.pagination?.total || (res.data.users || []).length;
      setUserTotal(total);
      setUserTotalPages(Math.max(1, Math.ceil(total / 50)));
    } catch (err) {
      console.error("Error loading users:", err);
    }
  }, [userPage, userQuery, userRoleFilter]);

  const loadContractors = useCallback(async (p = contractorPage, q = contractorQuery, v = verifiedFilter) => {
    try {
      const params = { q: q || undefined, page: p, limit: 50 };
      if (v !== "all") params.verified = v === "verified";
      const res = await adminAPI.getContractors(params);
      setContractors(res.data.contractors || []);
      const total = res.data.pagination?.total || (res.data.contractors || []).length;
      setContractorTotal(total);
      setContractorTotalPages(Math.max(1, Math.ceil(total / 50)));
    } catch (err) {
      console.error("Error loading contractors:", err);
    }
  }, [contractorPage, contractorQuery, verifiedFilter]);

  const loadActivity = useCallback(async () => {
    try {
      const res = await adminAPI.getActivity();
      setActivity(res.data.activity || { users: [], reviews: [], reports: [] });
    } catch (err) {
      console.error("Error loading activity:", err);
    }
  }, []);

  const loadReviews = useCallback(async () => {
    try {
      const res = await adminAPI.getReviews({ q: reviewQuery || undefined, page: 1, limit: 50 });
      setReviews(res.data.reviews || []);
    } catch (err) {
      console.error("Error loading reviews:", err);
    }
  }, [reviewQuery]);

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await adminAPI.getAnalytics(30);
      setAnalytics(res.data.analytics || null);
    } catch (err) {
      console.error("Error loading analytics:", err);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const res = await adminAPI.getSettings();
      setSettings(res.data.settings || {});
    } catch (err) {
      console.error("Error loading settings:", err);
    }
  }, []);

  // Initial master loader
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.allSettled([
        loadOverview(),
        loadUsers(1, "", "all"),
        loadContractors(1, "", "all"),
        loadActivity(),
        loadReviews(),
        loadAnalytics(),
        loadSettings(),
      ]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, [loadOverview, loadUsers, loadContractors, loadActivity, loadReviews, loadAnalytics, loadSettings]);

  // Load once on mount
  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter effect handlers with debouncing for search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadContractors(contractorPage, contractorQuery, verifiedFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [contractorQuery, verifiedFilter, contractorPage, loadContractors]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(userPage, userQuery, userRoleFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [userQuery, userRoleFilter, userPage, loadUsers]);

  useEffect(() => {
    loadOverview();
  }, [reportFilter, loadOverview]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadReviews();
    }, 300);
    return () => clearTimeout(timer);
  }, [reviewQuery, loadReviews]);

  // ── Actions ─────────────────────────────────────────────
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
    if (c?.user_id) return showUserDetail(c.user_id);
    setSelectedDetail(c || null);
  }

  async function handleCreateUser(form) {
    await withBusy(async () => {
      const payload = { name: form.name, phone: form.phone || undefined, email: form.email || undefined, password: form.password, role: form.role };
      if (form.role === "contractor") payload.contractor = { business_name: form.business_name || form.name, category: form.category || undefined };
      await adminAPI.createUser(payload);
      toast.success("User created");
      await Promise.all([loadUsers(userPage, userQuery, userRoleFilter), loadOverview(), loadContractors(contractorPage, contractorQuery, verifiedFilter)]);
    });
  }

  async function handleCreateContractor(form) {
    await withBusy(async () => {
      await adminAPI.createContractor({ ...form, business_name: form.business_name || form.name });
      toast.success("Contractor created");
      await Promise.all([loadContractors(contractorPage, contractorQuery, verifiedFilter), loadUsers(userPage, userQuery, userRoleFilter), loadOverview()]);
    });
  }

  async function handleUpdateContractor(id, patch) {
    await withBusy(async () => {
      await adminAPI.updateContractor(id, patch);
      toast.success("Contractor updated successfully");
      await Promise.all([loadContractors(contractorPage, contractorQuery, verifiedFilter), loadOverview()]);
    });
  }

  async function handleUpdateUser(id, patch) {
    await withBusy(async () => {
      await adminAPI.updateUser(id, patch);
      toast.success("User profile updated");
      await Promise.all([loadUsers(userPage, userQuery, userRoleFilter), loadContractors(contractorPage, contractorQuery, verifiedFilter), loadOverview()]);
    });
  }

  async function handleDeleteUser(id) {
    if (!window.confirm("Delete this user account?")) return;
    await withBusy(async () => {
      await adminAPI.deleteUser(id);
      toast.success("User deleted");
      await Promise.all([loadUsers(userPage, userQuery, userRoleFilter), loadOverview()]);
    });
  }

  async function handleDeleteContractor(id) {
    if (!window.confirm("Delete contractor and associated user account?")) return;
    await withBusy(async () => {
      await adminAPI.deleteContractor(id);
      toast.success("Contractor deleted");
      await Promise.all([loadContractors(contractorPage, contractorQuery, verifiedFilter), loadUsers(userPage, userQuery, userRoleFilter), loadOverview()]);
    });
  }

  async function handleQuickRoleChange(u, role) {
    await withBusy(async () => {
      await adminAPI.updateUser(u.id, { role });
      toast.success(`Role updated to ${role}`);
      await Promise.all([loadUsers(userPage, userQuery, userRoleFilter), loadContractors(contractorPage, contractorQuery, verifiedFilter), loadOverview()]);
    });
  }

  async function handleToggleContractorFlag(c, patch) {
    await withBusy(async () => {
      await adminAPI.updateContractor(c.id, patch);
      toast.success("Contractor flags updated");
      await Promise.all([loadContractors(contractorPage, contractorQuery, verifiedFilter), loadOverview()]);
    });
  }

  async function handleVerifyRequest(c, status) {
    await withBusy(async () => {
      await adminAPI.verifyContractor(c.id, { status });
      toast.success(`Verification ${status}`);
      await Promise.all([loadContractors(contractorPage, contractorQuery, verifiedFilter), loadOverview()]);
    });
  }

  async function handleResolveReport(id, status) {
    await withBusy(async () => {
      await adminAPI.resolveReport(id, status);
      toast.success(`Report ${status}`);
      await Promise.all([loadOverview(), loadActivity()]);
    });
  }

  async function handleAddSubscription(contractorId, planType) {
    await withBusy(async () => {
      await adminAPI.addManualSubscription(contractorId, planType);
      toast.success("Manual subscription granted");
      await loadContractors(contractorPage, contractorQuery, verifiedFilter);
    });
  }

  async function handleCancelSubscription(contractorId) {
    if (!window.confirm("Cancel this contractor's subscription?")) return;
    await withBusy(async () => {
      await adminAPI.cancelSubscription(contractorId);
      toast.success("Subscription cancelled");
      await loadContractors(contractorPage, contractorQuery, verifiedFilter);
    });
  }

  async function handleDeleteReview(id) {
    if (!window.confirm("Delete this review?")) return;
    await withBusy(async () => {
      await adminAPI.deleteReview(id);
      toast.success("Review deleted");
      await Promise.all([loadReviews(), loadOverview()]);
    });
  }

  async function handleSaveSettings() {
    await withBusy(async () => {
      const res = await adminAPI.updateSettings(settings);
      setSettings(res.data.settings);
      toast.success("Site settings saved successfully");
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const currentLabel = SIDEBAR.find((s) => s.id === tab)?.label || "Admin";

  return (
    <main className="min-h-screen bg-bg transition-colors duration-200">
      <div className="flex">
        {/* ── Mobile sidebar overlay ── */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* ── Sidebar ── */}
        <aside className={`${sidebarOpen ? "translate-x-0 w-60" : "-translate-x-full w-60 md:translate-x-0 md:w-16"} fixed md:sticky top-0 left-0 z-[100] flex-shrink-0 border-r border-border bg-surface h-screen overflow-y-auto transition-transform duration-300 md:transition-all`}>
          <div className="p-4 border-b border-border flex items-center gap-3 bg-bg-elevated">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0">T</div>
            {sidebarOpen && <h2 className="text-base font-bold text-heading truncate">Admin Controls</h2>}
          </div>
          <nav className="p-2 space-y-1 mt-2 mb-16">
            {SIDEBAR.map((item) => (
              <button
                key={item.id}
                onClick={() => { setTab(item.id); if (window.innerWidth <= 768) setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === item.id ? "bg-primary/10 text-primary border border-primary/20" : "text-muted hover:text-heading hover:bg-bg-elevated border border-transparent"}`}
              >
                <item.icon size={18} className="flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            ))}
          </nav>
          <div className="absolute bottom-4 left-0 right-0 px-3 space-y-2">
            <button
              onClick={async () => { await logout(); navigate('/login'); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-500/10 transition border border-transparent hover:border-red-500/20"
              title="Logout"
            >
              <FiLogOut size={18} className="flex-shrink-0" />
              {sidebarOpen && <span className="truncate">Logout</span>}
            </button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full py-2 rounded-lg text-xs font-semibold text-muted hover:bg-bg-elevated transition border border-transparent hover:border-border">
              {sidebarOpen ? "← Collapse" : "→"}
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0 p-4 md:p-8 w-full md:w-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 rounded-lg text-heading hover:bg-bg-elevated border border-border">
                <FiMenu size={20} />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-heading">{currentLabel}</h1>
                <p className="hidden md:block text-xs text-muted mt-1 font-medium">Full platform control and management dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={loadAll} 
                disabled={busy} 
                className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
              >
                <FiRefreshCw size={14} className={busy ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Refresh Data</span>
              </button>
              <button
                onClick={async () => { await logout(); navigate('/login'); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-red-500 border border-red-500/20 hover:bg-red-500/10 transition md:hidden"
                title="Logout"
              >
                <FiLogOut size={14} />
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

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
                  onEditUser={(u) => setEditingUser(u)}
                  userQuery={userQuery} setUserQuery={(q) => { setUserQuery(q); setUserPage(1); }}
                  userRoleFilter={userRoleFilter} setUserRoleFilter={(r) => { setUserRoleFilter(r); setUserPage(1); }}
                  page={userPage} totalPages={userTotalPages} totalItems={userTotal} limit={50}
                  onPageChange={setUserPage}
                />
              )}

              {tab === "contractors" && (
                <ContractorsPanel
                  contractors={contractors} busy={busy}
                  onCreateContractor={handleCreateContractor} onDeleteContractor={handleDeleteContractor}
                  onToggleFlag={handleToggleContractorFlag} onVerify={handleVerifyRequest}
                  onView={showContractorDetail}
                  onEdit={(c) => setEditingContractor(c)}
                  contractorQuery={contractorQuery} setContractorQuery={(q) => { setContractorQuery(q); setContractorPage(1); }}
                  verifiedFilter={verifiedFilter} setVerifiedFilter={(v) => { setVerifiedFilter(v); setContractorPage(1); }}
                  onAddSubscription={handleAddSubscription}
                  onCancelSubscription={handleCancelSubscription}
                  page={contractorPage} totalPages={contractorTotalPages} totalItems={contractorTotal} limit={50}
                  onPageChange={setContractorPage}
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
      <EditContractorModal contractor={editingContractor} onClose={() => setEditingContractor(null)} onSave={handleUpdateContractor} busy={busy} />
      <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleUpdateUser} busy={busy} />
    </main>
  );
}
