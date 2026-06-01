import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiGrid,
  FiCheckSquare,
  FiShoppingBag,
  FiUsers,
  FiDollarSign,
  FiPieChart,
  FiCalendar,
  FiArrowLeft,
  FiPlus,
  FiTrash,
  FiLock,
  FiUnlock,
  FiX
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { projectAPI } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function ProjectDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Domain Data States
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [manpower, setManpower] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);

  // Form Modals States
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [showAddManpower, setShowAddManpower] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);

  // Form Fields States
  const [milestoneForm, setMilestoneForm] = useState({ title: "", description: "", amount: "", due_date: "" });
  const [materialForm, setMaterialForm] = useState({ name: "", category: "Cement", quantity: "", unit: "Bags", unit_price: "", vendor_name: "", purchase_date: "", notes: "" });
  const [manpowerForm, setManpowerForm] = useState({ worker_name: "", role: "Mason", daily_rate: "", days_worked: "", phone: "", notes: "" });
  const [expenseForm, setExpenseForm] = useState({ category: "Rent", description: "", amount: "", date: "" });

  const isContractor = user?.role === "contractor";

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const res = await projectAPI.getProject(id);
      if (res.data?.ok) {
        setProject(res.data.project);
        setMilestones(res.data.milestones || []);
        setMaterials(res.data.materials || []);
        setManpower(res.data.manpower || []);
        setExpenses(res.data.expenses || []);
        setSummary(res.data.summary || null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load project details.");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  // Actions: Milestones
  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    try {
      const res = await projectAPI.addMilestone(id, milestoneForm);
      if (res.data?.ok) {
        toast.success("Milestone added successfully.");
        setShowAddMilestone(false);
        setMilestoneForm({ title: "", description: "", amount: "", due_date: "" });
        fetchProjectDetails();
      }
    } catch (err) {
      toast.error("Failed to add milestone.");
    }
  };

  const handleMilestoneAction = async (milestoneId, action, milestoneObj = null) => {
    try {
      let nextStatus = milestoneObj?.status;
      let nextPayment = milestoneObj?.payment_status;

      if (action === "complete") {
        nextStatus = "COMPLETED";
      } else if (action === "pay") {
        toast.success("Funds held in escrow successfully.");
        nextPayment = "IN_ESCROW";
      } else if (action === "release") {
        toast.success("Funds released to contractor.");
        nextPayment = "RELEASED";
      }

      const res = await projectAPI.updateMilestone(id, milestoneId, {
        status: nextStatus,
        payment_status: nextPayment,
        completed_at: action === "complete" ? new Date().toISOString() : undefined
      });

      if (res.data?.ok) {
        fetchProjectDetails();
      }
    } catch (err) {
      toast.error("Failed to update milestone.");
    }
  };

  const handleDeleteMilestone = async (mid) => {
    if (!window.confirm("Are you sure you want to delete this milestone?")) return;
    try {
      const res = await projectAPI.deleteMilestone(id, mid);
      if (res.data?.ok) {
        toast.success("Milestone removed.");
        fetchProjectDetails();
      }
    } catch (err) {
      toast.error("Failed to delete milestone.");
    }
  };

  // Actions: Materials
  const handleCreateMaterial = async (e) => {
    e.preventDefault();
    try {
      const res = await projectAPI.addMaterial(id, {
        ...materialForm,
        quantity: parseFloat(materialForm.quantity),
        unit_price: parseFloat(materialForm.unit_price)
      });
      if (res.data?.ok) {
        toast.success("Material logged successfully.");
        setShowAddMaterial(false);
        setMaterialForm({ name: "", category: "Cement", quantity: "", unit: "Bags", unit_price: "", vendor_name: "", purchase_date: "", notes: "" });
        fetchProjectDetails();
      }
    } catch (err) {
      toast.error("Failed to log material.");
    }
  };

  const handleDeleteMaterial = async (mid) => {
    try {
      const res = await projectAPI.deleteMaterial(id, mid);
      if (res.data?.ok) {
        toast.success("Material log removed.");
        fetchProjectDetails();
      }
    } catch (err) {
      toast.error("Failed to delete material.");
    }
  };

  // Actions: Manpower
  const handleCreateManpower = async (e) => {
    e.preventDefault();
    try {
      const res = await projectAPI.addManpower(id, {
        ...manpowerForm,
        daily_rate: parseFloat(manpowerForm.daily_rate),
        days_worked: parseFloat(manpowerForm.days_worked || 0)
      });
      if (res.data?.ok) {
        toast.success("Worker logged.");
        setShowAddManpower(false);
        setManpowerForm({ worker_name: "", role: "Mason", daily_rate: "", days_worked: "", phone: "", notes: "" });
        fetchProjectDetails();
      }
    } catch (err) {
      toast.error("Failed to log worker.");
    }
  };

  const handleUpdateManpowerDays = async (wid, currentDays, dailyRate, action) => {
    try {
      const nextDays = action === "add" ? currentDays + 1 : Math.max(0, currentDays - 1);
      const nextPaid = nextDays * dailyRate;
      await projectAPI.updateManpower(id, wid, {
        days_worked: nextDays,
        total_paid: nextPaid
      });
      fetchProjectDetails();
    } catch (err) {
      toast.error("Failed to update manpower attendance.");
    }
  };

  const handleDeleteManpower = async (wid) => {
    try {
      const res = await projectAPI.deleteManpower(id, wid);
      if (res.data?.ok) {
        toast.success("Worker removed from logs.");
        fetchProjectDetails();
      }
    } catch (err) {
      toast.error("Failed to delete worker.");
    }
  };

  // Actions: Expenses
  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      const res = await projectAPI.addExpense(id, {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount)
      });
      if (res.data?.ok) {
        toast.success("Expense logged.");
        setShowAddExpense(false);
        setExpenseForm({ category: "Rent", description: "", amount: "", date: "" });
        fetchProjectDetails();
      }
    } catch (err) {
      toast.error("Failed to log expense.");
    }
  };

  const handleDeleteExpense = async (eid) => {
    try {
      const res = await projectAPI.deleteExpense(id, eid);
      if (res.data?.ok) {
        toast.success("Expense log removed.");
        fetchProjectDetails();
      }
    } catch (err) {
      toast.error("Failed to delete expense.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Calculate stats
  const completedMilestones = milestones.filter(m => m.status === "COMPLETED").length;
  const progressPercent = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0;

  return (
    <main className="min-h-screen bg-[var(--color-bg)] pt-24 pb-16 px-4 md:px-6 transition-colors duration-300">
      <div className="max-w-[1000px] mx-auto space-y-6">
        
        {/* Header Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors"
          >
            <FiArrowLeft size={14} /> Back to Planners
          </button>
          
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-[var(--radius-pill)] border ${
              project.status === "IN_PROGRESS" ? "bg-[var(--color-primary-muted)] border-[var(--color-primary)]/20 text-[var(--color-primary)]" : "bg-[var(--color-border)] border-[var(--color-border)] text-[var(--color-muted)]"
            }`}>
              {project.status}
            </span>
            {project.escrow_opted && (
              <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2.5 py-1 rounded-[var(--radius-pill)] flex items-center gap-1">
                <FiLock size={10} /> Escrow Protected
              </span>
            )}
          </div>
        </div>

        {/* Project Title Banner */}
        <div className="card bg-[var(--color-surface)] border border-[var(--color-border)] p-6 md:p-8 rounded-[var(--radius-lg)] shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)] block">Workspace</span>
              <h2 className="font-display text-xl font-bold tracking-tight text-[var(--color-heading)]">
                {project.title}
              </h2>
              <p className="text-xs text-[var(--color-muted)] font-semibold uppercase tracking-wider">
                Contractor: {isContractor ? "You" : "Thekedaar"} &bull; Client: {isContractor ? "Customer" : "You"}
              </p>
            </div>
            
            {/* Progress Panel */}
            <div className="flex items-center gap-4 shrink-0 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] p-3.5 rounded-[var(--radius-md)]">
              <div className="w-12 h-12 rounded-full border-2 border-[var(--color-primary)]/20 flex items-center justify-center font-display text-xs font-bold text-[var(--color-primary)] bg-[var(--color-surface)]">
                {progressPercent}%
              </div>
              <div className="space-y-0.5">
                <span className="block text-[8px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Progress</span>
                <span className="text-xs font-bold text-[var(--color-heading)] leading-none">{completedMilestones} of {milestones.length} Milestones</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex gap-1.5 border-b border-[var(--color-divider)] pb-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: "overview", label: "Overview", icon: FiGrid },
            { id: "milestones", label: "Milestones", icon: FiCheckSquare },
            { id: "materials", label: "Materials", icon: FiShoppingBag },
            { id: "manpower", label: "Attendance", icon: FiUsers },
            { id: "expenses", label: "Expenses", icon: FiDollarSign },
            { id: "payments", label: "Ledger", icon: FiPieChart },
            { id: "timeline", label: "Timeline", icon: FiCalendar },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                  active
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-muted)] text-[var(--color-primary)]"
                    : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                <Icon size={12} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Panel */}
        <div className="min-h-[350px]">
          <AnimatePresence mode="wait">
            
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <motion.div
                key="tab-overview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <div className="md:col-span-2 space-y-6">
                  <div className="card p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-3">
                    <h3 className="font-display text-sm font-bold text-[var(--color-heading)] uppercase tracking-wider">Project Scope</h3>
                    <p className="text-sm text-[var(--color-body)] leading-relaxed font-semibold">
                      {project.description || "No description provided. Log materials, manpower crew, and milestones to manage development."}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="card p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-center shadow-sm">
                      <span className="block text-[8px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Start Date</span>
                      <span className="text-xs font-bold text-[var(--color-heading)]">{project.start_date ? new Date(project.start_date).toLocaleDateString("en-IN") : "Planning"}</span>
                    </div>
                    <div className="card p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-center shadow-sm">
                      <span className="block text-[8px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Target End Date</span>
                      <span className="text-xs font-bold text-[var(--color-heading)]">{project.expected_end_date ? new Date(project.expected_end_date).toLocaleDateString("en-IN") : "Planning"}</span>
                    </div>
                  </div>
                </div>

                {/* Financial overview sidebar */}
                <div className="card p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-6 flex flex-col justify-between">
                  <h3 className="font-display text-sm font-bold text-[var(--color-heading)] uppercase tracking-wider">Financial Overview</h3>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] border border-[var(--color-border)]">
                      <span className="block text-[8px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-0.5">Estimated Budget</span>
                      <span className="text-lg font-bold text-[var(--color-primary)]">₹{Number(project.estimated_budget || 0).toLocaleString("en-IN")}</span>
                    </div>
                    
                    <div className="p-3 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] border border-[var(--color-border)]">
                      <span className="block text-[8px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-0.5">Logged Spending</span>
                      <span className="text-lg font-bold text-[var(--color-heading)]">₹{Number(summary?.total_cost || 0).toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <span className="text-[9px] text-[var(--color-muted)] font-semibold uppercase tracking-wider pt-2 border-t border-[var(--color-divider)]">
                    Auto-synchronized with logged entries
                  </span>
                </div>
              </motion.div>
            )}

            {/* Milestones Tab */}
            {activeTab === "milestones" && (
              <motion.div
                key="tab-milestones"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center gap-4">
                  <div>
                    <h3 className="font-display text-base font-bold text-[var(--color-heading)]">Milestones Planners</h3>
                    <p className="text-xs text-[var(--color-muted)] font-semibold">Track milestone payouts and confirm completed segments.</p>
                  </div>
                  {isContractor && (
                    <button
                      onClick={() => setShowAddMilestone(true)}
                      className="btn-primary flex items-center gap-1 py-2 px-3.5 text-xs font-semibold rounded-[var(--radius-sm)]"
                    >
                      <FiPlus /> Add Milestone
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {milestones.length === 0 ? (
                    <div className="text-center py-12 card bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-sm">
                      <p className="text-sm font-semibold text-[var(--color-muted)]">No milestones defined yet.</p>
                    </div>
                  ) : (
                    milestones.map((m, idx) => (
                      <div key={m.id} className="card p-5 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary-muted)] px-2 py-0.5 rounded-[var(--radius-sm)]">M-{idx+1}</span>
                            <h4 className="font-display text-sm font-bold text-[var(--color-heading)]">{m.title}</h4>
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[var(--radius-pill)] border ${
                              m.status === "COMPLETED" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                            }`}>
                              {m.status}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--color-muted)] leading-relaxed font-semibold max-w-xl">{m.description}</p>
                          <div className="flex gap-4 text-[9px] font-bold text-[var(--color-muted)] uppercase tracking-wider pt-1.5 border-t border-[var(--color-divider)]">
                            <span>Due Date: {m.due_date ? new Date(m.due_date).toLocaleDateString("en-IN") : "TBD"}</span>
                            <span className="text-[var(--color-primary)]">Payout: ₹{Number(m.amount || 0).toLocaleString("en-IN")}</span>
                          </div>
                        </div>

                        {/* Payment & Action controllers */}
                        <div className="flex items-center gap-2 shrink-0 self-stretch md:self-auto justify-end border-t border-[var(--color-divider)] pt-3 md:pt-0 md:border-0">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-[var(--radius-pill)] border flex items-center gap-1 ${
                            m.payment_status === "RELEASED" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : 
                            m.payment_status === "IN_ESCROW" ? "bg-[var(--color-primary-muted)] border-[var(--color-primary)]/20 text-[var(--color-primary)]" : "bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-muted)]"
                          }`}>
                            {m.payment_status === "RELEASED" && <FiUnlock size={10} />}
                            {m.payment_status === "IN_ESCROW" && <FiLock size={10} />}
                            {m.payment_status}
                          </span>

                          {isContractor && m.status === "PENDING" && (
                            <button
                              onClick={() => handleMilestoneAction(m.id, "complete")}
                              className="btn-primary py-2 px-3.5 text-[10px] font-bold rounded-[var(--radius-sm)]"
                            >
                              Mark Done
                            </button>
                          )}

                          {!isContractor && project.escrow_opted && m.payment_status === "UNPAID" && (
                            <button
                              onClick={() => handleMilestoneAction(m.id, "pay", m)}
                              className="btn-primary py-2 px-3.5 text-[10px] font-bold rounded-[var(--radius-sm)]"
                            >
                              Escrow Fund
                            </button>
                          )}

                          {!isContractor && project.escrow_opted && m.payment_status === "IN_ESCROW" && m.status === "COMPLETED" && (
                            <button
                              onClick={() => handleMilestoneAction(m.id, "release", m)}
                              className="btn-primary py-2 px-3.5 text-[10px] font-bold rounded-[var(--radius-sm)]"
                            >
                              Release Payout
                            </button>
                          )}

                          {isContractor && m.payment_status === "UNPAID" && (
                            <button
                              onClick={() => handleDeleteMilestone(m.id)}
                              className="w-8 h-8 rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-rose-500 flex items-center justify-center transition-colors"
                            >
                              <FiTrash size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* Materials Tab */}
            {activeTab === "materials" && (
              <motion.div
                key="tab-materials"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center gap-4">
                  <div>
                    <h3 className="font-display text-base font-bold text-[var(--color-heading)]">Material Procurements</h3>
                    <p className="text-xs text-[var(--color-muted)] font-semibold">Maintain raw materials ledger and billing logs.</p>
                  </div>
                  {isContractor && (
                    <button
                      onClick={() => setShowAddMaterial(true)}
                      className="btn-primary flex items-center gap-1 py-2 px-3.5 text-xs font-semibold rounded-[var(--radius-sm)]"
                    >
                      <FiPlus /> Log Material
                    </button>
                  )}
                </div>

                <div className="card border border-[var(--color-border)] bg-[var(--color-surface)] rounded-[var(--radius-lg)] overflow-hidden shadow-sm">
                  {materials.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm font-semibold text-[var(--color-muted)]">No materials logged yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[var(--color-bg-elevated)] border-b border-[var(--color-border)] text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                            <th className="px-4 py-3">Material Info</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3 text-center">Quantity</th>
                            <th className="px-4 py-3 text-right">Unit Rate</th>
                            <th className="px-4 py-3 text-right">Total Price</th>
                            {isContractor && <th className="px-4 py-3 text-center"></th>}
                          </tr>
                        </thead>
                        <tbody className="font-semibold text-[var(--color-body)]">
                          {materials.map((m) => (
                            <tr key={m.id} className="border-b border-[var(--color-divider)] last:border-b-0 hover:bg-[var(--color-surface-hover)] transition-colors">
                              <td className="px-4 py-3 text-sm">
                                <span className="block font-bold text-[var(--color-heading)]">{m.name}</span>
                                <span className="block text-[9px] text-[var(--color-muted)] font-semibold mt-0.5">Dealer: {m.vendor_name || "N/A"}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded text-[9px] text-[var(--color-muted)] font-bold uppercase">
                                  {m.category}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center font-bold">{m.quantity} {m.unit}</td>
                              <td className="px-4 py-3 text-right">₹{m.unit_price}</td>
                              <td className="px-4 py-3 text-right text-[var(--color-primary)] font-bold">₹{Number(m.total_price || 0).toLocaleString("en-IN")}</td>
                              {isContractor && (
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => handleDeleteMaterial(m.id)}
                                    className="w-7 h-7 rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-rose-500 flex items-center justify-center transition-colors mx-auto"
                                  >
                                    <FiTrash size={12} />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Manpower Tab */}
            {activeTab === "manpower" && (
              <motion.div
                key="tab-manpower"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center gap-4">
                  <div>
                    <h3 className="font-display text-base font-bold text-[var(--color-heading)]">Attendance & Labour Crew</h3>
                    <p className="text-xs text-[var(--color-muted)] font-semibold">Track attendance workdays and daily wages balance.</p>
                  </div>
                  {isContractor && (
                    <button
                      onClick={() => setShowAddManpower(true)}
                      className="btn-primary flex items-center gap-1 py-2 px-3.5 text-xs font-semibold rounded-[var(--radius-sm)]"
                    >
                      <FiPlus /> Log Worker
                    </button>
                  )}
                </div>

                <div className="card border border-[var(--color-border)] bg-[var(--color-surface)] rounded-[var(--radius-lg)] overflow-hidden shadow-sm">
                  {manpower.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm font-semibold text-[var(--color-muted)]">No crew workers logged yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[var(--color-bg-elevated)] border-b border-[var(--color-border)] text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                            <th className="px-4 py-3">Worker Info</th>
                            <th className="px-4 py-3">Skill / Role</th>
                            <th className="px-4 py-3 text-center">Daily Wage</th>
                            <th className="px-4 py-3 text-center">Workdays</th>
                            <th className="px-4 py-3 text-right">Total Earnings</th>
                            {isContractor && <th className="px-4 py-3 text-center">Actions</th>}
                          </tr>
                        </thead>
                        <tbody className="font-semibold text-[var(--color-body)]">
                          {manpower.map((w) => (
                            <tr key={w.id} className="border-b border-[var(--color-divider)] last:border-b-0 hover:bg-[var(--color-surface-hover)] transition-colors">
                              <td className="px-4 py-3 text-sm">
                                <span className="block font-bold text-[var(--color-heading)]">{w.worker_name}</span>
                                <span className="block text-[9px] text-[var(--color-muted)] font-semibold mt-0.5">{w.phone || "No contact info"}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded text-[9px] text-[var(--color-muted)] font-bold uppercase">
                                  {w.role}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center font-bold">₹{w.daily_rate}</td>
                              <td className="px-4 py-3 text-center font-bold">{w.days_worked} Days</td>
                              <td className="px-4 py-3 text-right text-[var(--color-primary)] font-bold">₹{Number(w.total_paid || 0).toLocaleString("en-IN")}</td>
                              {isContractor && (
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => handleUpdateManpowerDays(w.id, parseFloat(w.days_worked), parseFloat(w.daily_rate), "add")}
                                      className="px-2 py-1 rounded-[var(--radius-xs)] bg-[var(--color-primary-muted)] text-[var(--color-primary)] text-[10px] font-bold border border-[var(--color-primary)]/10"
                                    >
                                      +1 Day
                                    </button>
                                    <button
                                      onClick={() => handleUpdateManpowerDays(w.id, parseFloat(w.days_worked), parseFloat(w.daily_rate), "sub")}
                                      className="px-2 py-1 rounded-[var(--radius-xs)] bg-[var(--color-bg-elevated)] text-[var(--color-muted)] text-[10px] font-bold border border-[var(--color-border)]"
                                    >
                                      -1 Day
                                    </button>
                                    <button
                                      onClick={() => handleDeleteManpower(w.id)}
                                      className="w-7 h-7 rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-rose-500 flex items-center justify-center transition-colors ml-1"
                                    >
                                      <FiTrash size={12} />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Expenses Tab */}
            {activeTab === "expenses" && (
              <motion.div
                key="tab-expenses"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center gap-4">
                  <div>
                    <h3 className="font-display text-base font-bold text-[var(--color-heading)]">General Operational Expenses</h3>
                    <p className="text-xs text-[var(--color-muted)] font-semibold">Log logistics, petty cash, rentals, machinery, and utilities.</p>
                  </div>
                  {isContractor && (
                    <button
                      onClick={() => setShowAddExpense(true)}
                      className="btn-primary flex items-center gap-1 py-2 px-3.5 text-xs font-semibold rounded-[var(--radius-sm)]"
                    >
                      <FiPlus /> Log Expense
                    </button>
                  )}
                </div>

                <div className="card border border-[var(--color-border)] bg-[var(--color-surface)] rounded-[var(--radius-lg)] overflow-hidden shadow-sm">
                  {expenses.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm font-semibold text-[var(--color-muted)]">No miscellaneous expenses logged yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[var(--color-bg-elevated)] border-b border-[var(--color-border)] text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                            <th className="px-4 py-3">Expense Details</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3 text-center">Log Date</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                            {isContractor && <th className="px-4 py-3 text-center"></th>}
                          </tr>
                        </thead>
                        <tbody className="font-semibold text-[var(--color-body)]">
                          {expenses.map((e) => (
                            <tr key={e.id} className="border-b border-[var(--color-divider)] last:border-b-0 hover:bg-[var(--color-surface-hover)] transition-colors">
                              <td className="px-4 py-3 text-sm font-bold text-[var(--color-heading)]">{e.description}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded text-[9px] text-[var(--color-muted)] font-bold uppercase">
                                  {e.category}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center font-bold">{e.date ? new Date(e.date).toLocaleDateString("en-IN") : "TBD"}</td>
                              <td className="px-4 py-3 text-right text-[var(--color-primary)] font-bold">₹{Number(e.amount || 0).toLocaleString("en-IN")}</td>
                              {isContractor && (
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => handleDeleteExpense(e.id)}
                                    className="w-7 h-7 rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-rose-500 flex items-center justify-center transition-colors mx-auto"
                                  >
                                    <FiTrash size={12} />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Ledger Tab */}
            {activeTab === "payments" && (
              <motion.div
                key="tab-payments"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Milestone Payouts distribution */}
                <div className="card p-6 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-sm space-y-4">
                  <h3 className="font-display text-sm font-bold text-[var(--color-heading)] uppercase tracking-wider">Milestone Payouts Ledger</h3>
                  
                  <div className="space-y-3.5 text-xs font-semibold">
                    <div className="flex justify-between text-[var(--color-muted)]">
                      <span>Total Milestones Budget:</span>
                      <span className="text-[var(--color-heading)] font-bold">₹{Number(project.estimated_budget || 0).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-[var(--color-muted)] border-b border-[var(--color-divider)] pb-3">
                      <span>Total Logged Operations spent:</span>
                      <span className="text-[var(--color-heading)] font-bold">₹{Number(summary?.total_cost || 0).toLocaleString("en-IN")}</span>
                    </div>
                    
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 pt-1">
                      <span>Released Milestones:</span>
                      <span className="font-bold">₹{Number(summary?.released_milestones || 0).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-[var(--color-primary)]">
                      <span>Secured Escrow Milestones:</span>
                      <span className="font-bold">₹{Number(summary?.escrow_milestones || 0).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-amber-500 font-bold border-t border-[var(--color-divider)] pt-3">
                      <span>Pending Milestone Balances:</span>
                      <span>₹{Number(project.estimated_budget - (summary?.released_milestones || 0) - (summary?.escrow_milestones || 0)).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                {/* Sublogs operational details */}
                <div className="card p-6 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-sm space-y-4">
                  <h3 className="font-display text-sm font-bold text-[var(--color-heading)] uppercase tracking-wider">Operational Cost Breakdown</h3>
                  
                  <div className="space-y-3.5 text-xs font-semibold">
                    <div className="flex justify-between text-[var(--color-muted)]">
                      <span>Procured Materials Cost:</span>
                      <span className="text-[var(--color-heading)] font-bold">₹{Number(summary?.materials_cost || 0).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-[var(--color-muted)]">
                      <span>Manpower Wage Billing Cost:</span>
                      <span className="text-[var(--color-heading)] font-bold">₹{Number(summary?.manpower_cost || 0).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-[var(--color-muted)] border-b border-[var(--color-divider)] pb-3">
                      <span>Petty Cash & Rentals logged:</span>
                      <span className="text-[var(--color-heading)] font-bold">₹{Number(summary?.expenses_cost || 0).toLocaleString("en-IN")}</span>
                    </div>
                    
                    <div className="flex justify-between text-[var(--color-primary)] pt-1 font-bold">
                      <span className="uppercase tracking-wider text-[9px]">Total Logged Spending:</span>
                      <span className="text-sm">₹{Number(summary?.total_cost || 0).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Timeline Tab */}
            {activeTab === "timeline" && (
              <motion.div
                key="tab-timeline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="max-w-md mx-auto space-y-6 pt-4"
              >
                <div>
                  <h3 className="font-display text-base font-bold text-[var(--color-heading)]">Milestones Chronological Timeline</h3>
                  <p className="text-xs text-[var(--color-muted)] font-semibold">Visual flow of project delivery steps.</p>
                </div>

                <div className="relative border-l-2 border-[var(--color-divider)] pl-6 ml-3 space-y-8">
                  {milestones.length === 0 ? (
                    <p className="text-sm font-semibold text-[var(--color-muted)]">No milestones defined.</p>
                  ) : (
                    milestones.map((m, idx) => (
                      <div key={m.id} className="relative">
                        {/* Dot indicator */}
                        <div className={`absolute -left-[31px] top-1 w-4.5 h-4.5 rounded-full border-2 bg-[var(--color-bg)] ${
                          m.status === "COMPLETED" 
                            ? "bg-emerald-500 border-emerald-500/20 shadow-xs" 
                            : "border-[var(--color-border)]"
                        }`} />
                        
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-primary)]">Step {idx+1}</span>
                          <h4 className="font-display text-sm font-bold text-[var(--color-heading)] leading-snug">{m.title}</h4>
                          <p className="text-xs text-[var(--color-muted)] font-semibold max-w-lg leading-relaxed">{m.description}</p>
                          <div className="flex gap-4 text-[9px] font-bold uppercase tracking-wider pt-1">
                            <span className="text-[var(--color-heading)]">Value: ₹{Number(m.amount || 0).toLocaleString("en-IN")}</span>
                            <span className={m.status === "COMPLETED" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"}>{m.status}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>

      {/* Forms modals: Add Milestone */}
      <AnimatePresence>
        {showAddMilestone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-xs">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card max-w-md w-full bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-[var(--radius-lg)] shadow-xl space-y-4 relative">
              <button onClick={() => setShowAddMilestone(false)} className="absolute right-4 top-4 text-[var(--color-muted)] hover:text-[var(--color-heading)] p-1 rounded-full hover:bg-[var(--color-bg-elevated)] transition-colors">
                <FiX size={16} />
              </button>
              <h3 className="font-display text-base font-bold text-[var(--color-heading)] uppercase tracking-wider">Define Milestone</h3>
              
              <form onSubmit={handleCreateMilestone} className="space-y-3.5">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Milestone Title</label>
                  <input required className="input-field" value={milestoneForm.title} onChange={e => setMilestoneForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Slab Casting completion" />
                </div>
                
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Description</label>
                  <textarea rows="3" required className="input-field h-auto py-2 resize-none" value={milestoneForm.description} onChange={e => setMilestoneForm(p => ({ ...p, description: e.target.value }))} placeholder="State deliverables in detail..." />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Payout (₹)</label>
                    <input required type="number" min="1" className="input-field" value={milestoneForm.amount} onChange={e => setMilestoneForm(p => ({ ...p, amount: e.target.value }))} placeholder="Milestone Budget" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Due Date</label>
                    <input required type="date" className="input-field" value={milestoneForm.due_date} onChange={e => setMilestoneForm(p => ({ ...p, due_date: e.target.value }))} />
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button type="button" onClick={() => setShowAddMilestone(false)} className="btn-ghost flex-1 h-11 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] py-2">Cancel</button>
                  <button type="submit" className="btn-primary flex-1 h-11 text-xs font-semibold rounded-[var(--radius-sm)] py-2">Add Milestone</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Add Material modal */}
        {showAddMaterial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-xs">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card max-w-md w-full bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-[var(--radius-lg)] shadow-xl space-y-4 relative">
              <button onClick={() => setShowAddMaterial(false)} className="absolute right-4 top-4 text-[var(--color-muted)] hover:text-[var(--color-heading)] p-1 rounded-full hover:bg-[var(--color-bg-elevated)] transition-colors">
                <FiX size={16} />
              </button>
              <h3 className="font-display text-base font-bold text-[var(--color-heading)] uppercase tracking-wider">Log Procurement</h3>
              
              <form onSubmit={handleCreateMaterial} className="space-y-3.5">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Material Name / Grade</label>
                  <input required className="input-field" value={materialForm.name} onChange={e => setMaterialForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. OPC Cement Grade 53" />
                </div>
                
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Quantity</label>
                    <input required type="number" step="any" min="0.1" className="input-field" value={materialForm.quantity} onChange={e => setMaterialForm(p => ({ ...p, quantity: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Unit</label>
                    <input required className="input-field" value={materialForm.unit} onChange={e => setMaterialForm(p => ({ ...p, unit: e.target.value }))} placeholder="Bags, Tons, Kg..." />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Unit Price (₹)</label>
                    <input required type="number" min="0.1" className="input-field" value={materialForm.unit_price} onChange={e => setMaterialForm(p => ({ ...p, unit_price: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Purchase Date</label>
                    <input required type="date" className="input-field" value={materialForm.purchase_date} onChange={e => setMaterialForm(p => ({ ...p, purchase_date: e.target.value }))} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Category</label>
                    <select className="input-field" value={materialForm.category} onChange={e => setMaterialForm(p => ({ ...p, category: e.target.value }))}>
                      {["Cement", "Steel", "Bricks", "Sand", "Electrical", "Plumbing", "Paint", "Wood", "Other"].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Vendor Name</label>
                    <input className="input-field" value={materialForm.vendor_name} onChange={e => setMaterialForm(p => ({ ...p, vendor_name: e.target.value }))} placeholder="Dealer Name" />
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button type="button" onClick={() => setShowAddMaterial(false)} className="btn-ghost flex-1 h-11 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] py-2">Cancel</button>
                  <button type="submit" className="btn-primary flex-1 h-11 text-xs font-semibold rounded-[var(--radius-sm)] py-2">Log Material</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Add Manpower modal */}
        {showAddManpower && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-xs">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card max-w-md w-full bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-[var(--radius-lg)] shadow-xl space-y-4 relative">
              <button onClick={() => setShowAddManpower(false)} className="absolute right-4 top-4 text-[var(--color-muted)] hover:text-[var(--color-heading)] p-1 rounded-full hover:bg-[var(--color-bg-elevated)] transition-colors">
                <FiX size={16} />
              </button>
              <h3 className="font-display text-base font-bold text-[var(--color-heading)] uppercase tracking-wider">Log Crew Worker</h3>
              
              <form onSubmit={handleCreateManpower} className="space-y-3.5">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Worker Full Name</label>
                  <input required className="input-field" value={manpowerForm.worker_name} onChange={e => setManpowerForm(p => ({ ...p, worker_name: e.target.value }))} placeholder="Worker Name" />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Role / Skill</label>
                    <select className="input-field" value={manpowerForm.role} onChange={e => setManpowerForm(p => ({ ...p, role: e.target.value }))}>
                      {["Mason", "Helper", "Carpenter", "Electrician", "Plumber", "Painter", "Welder", "Supervisor", "Other"].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Contact Phone</label>
                    <input className="input-field" value={manpowerForm.phone} onChange={e => setManpowerForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, "") }))} placeholder="10-digit mobile" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Daily Wage Rate (₹)</label>
                    <input required type="number" min="0" className="input-field" value={manpowerForm.daily_rate} onChange={e => setManpowerForm(p => ({ ...p, daily_rate: e.target.value }))} placeholder="e.g. 400" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Initial Workdays</label>
                    <input required type="number" step="any" min="0" className="input-field" value={manpowerForm.days_worked} onChange={e => setManpowerForm(p => ({ ...p, days_worked: e.target.value }))} />
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button type="button" onClick={() => setShowAddManpower(false)} className="btn-ghost flex-1 h-11 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] py-2">Cancel</button>
                  <button type="submit" className="btn-primary flex-1 h-11 text-xs font-semibold rounded-[var(--radius-sm)] py-2">Log Worker</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Add Expense modal */}
        {showAddExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-xs">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card max-w-md w-full bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-[var(--radius-lg)] shadow-xl space-y-4 relative">
              <button onClick={() => setShowAddExpense(false)} className="absolute right-4 top-4 text-[var(--color-muted)] hover:text-[var(--color-heading)] p-1 rounded-full hover:bg-[var(--color-bg-elevated)] transition-colors">
                <FiX size={16} />
              </button>
              <h3 className="font-display text-base font-bold text-[var(--color-heading)] uppercase tracking-wider">Log Project Expense</h3>
              
              <form onSubmit={handleCreateExpense} className="space-y-3.5">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Expense Description</label>
                  <input required className="input-field" value={expenseForm.description} onChange={e => setExpenseForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Scaffolding machinery rent" />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Amount Spent (₹)</label>
                    <input required type="number" min="0.1" className="input-field" value={expenseForm.amount} onChange={e => setExpenseForm(p => ({ ...p, amount: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Date</label>
                    <input required type="date" className="input-field" value={expenseForm.date} onChange={e => setExpenseForm(p => ({ ...p, date: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Category</label>
                  <select className="input-field" value={expenseForm.category} onChange={e => setExpenseForm(p => ({ ...p, category: e.target.value }))}>
                    {["Rent", "Fuel", "Transport", "Manpower Food", "Tools repair", "Water/Power", "Other"].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-3">
                  <button type="button" onClick={() => setShowAddExpense(false)} className="btn-ghost flex-1 h-11 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] py-2">Cancel</button>
                  <button type="submit" className="btn-primary flex-1 h-11 text-xs font-semibold rounded-[var(--radius-sm)] py-2">Log Expense</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}
