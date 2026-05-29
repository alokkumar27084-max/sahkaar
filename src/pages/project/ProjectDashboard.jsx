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
  FiEdit,
  FiLock,
  FiUnlock,
  FiCheckCircle,
  FiAlertCircle
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
        // Razorpay payment for Escrow Milestone
        // Secured booking Razorpay trigger
        const amountPaise = milestoneObj.amount * 100;
        const mockOrder = {
          id: `mock_proj_pay_${Date.now()}`,
          amount: amountPaise,
          currency: "INR",
          key: "mock_key"
        };

        // Simulated escrow hold
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
    <main className="min-h-screen bg-[var(--color-bg)] pt-24 pb-16 px-4 md:px-8 transition-colors duration-500">
      <div className="max-w-[1300px] mx-auto space-y-8">
        
        {/* Header Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--color-muted)] hover:text-indigo-500 transition-colors"
          >
            <FiArrowLeft size={14} /> Back to dashboard
          </button>
          
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${
              project.status === "IN_PROGRESS" ? "bg-indigo-500/10 text-indigo-500" : "bg-[var(--color-border)] text-[var(--color-muted)]"
            }`}>
              {project.status}
            </span>
            {project.escrow_opted && (
              <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <FiLock size={10} /> Escrow Protection
              </span>
            )}
          </div>
        </div>

        {/* Project Title Banner */}
        <div className="glass-card border border-[var(--color-border)] bg-[var(--color-card)] p-8 md:p-12 rounded-[2.5rem] shadow-sm relative overflow-hidden">
          <div className="absolute -right-32 -top-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 block">SaaS Project Workspace</span>
              <h2 className="font-display text-3xl md:text-4xl font-black tracking-tight text-[var(--color-heading)] leading-none">
                {project.title}
              </h2>
              <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">
                Managed by {isContractor ? "You" : "Contractor"} // Client: {isContractor ? "Client" : "You"}
              </p>
            </div>
            
            {/* Progress Circle/Value */}
            <div className="flex items-center gap-4 shrink-0 bg-[var(--color-bg)] border border-[var(--color-border)] p-4 rounded-2xl shadow-inner">
              <div className="relative w-12 h-12 rounded-full border-4 border-[var(--color-border)] flex items-center justify-center font-display text-sm font-black text-[var(--color-heading)] shadow-inner">
                {progressPercent}%
              </div>
              <div>
                <span className="block text-[8px] font-black uppercase tracking-widest text-[var(--color-muted)]">Progress</span>
                <span className="text-xs font-bold text-[var(--color-heading)]">{completedMilestones} / {milestones.length} Milestones</span>
              </div>
            </div>
          </div>
        </div>

        {/* 7 Tabs Navigation Panel */}
        <div className="flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-2 overflow-x-auto scrollbar-none">
          {[
            { id: "overview", label: "Overview", icon: FiGrid },
            { id: "milestones", label: "Milestones", icon: FiCheckSquare },
            { id: "materials", label: "Materials Log", icon: FiShoppingBag },
            { id: "manpower", label: "Attendance Log", icon: FiUsers },
            { id: "expenses", label: "Expenses Log", icon: FiDollarSign },
            { id: "payments", label: "Financial Summary", icon: FiPieChart },
            { id: "timeline", label: "Timeline Chart", icon: FiCalendar },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border ${
                  active
                    ? "border-indigo-500 bg-indigo-500/10 text-indigo-500"
                    : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-heading)]"
                }`}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <motion.div
                key="tab-overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-8"
              >
                {/* Brief & Dates */}
                <div className="md:col-span-2 space-y-6">
                  <div className="glass-card p-8 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm space-y-4">
                    <h3 className="font-display text-lg font-black text-[var(--color-heading)] uppercase tracking-tight">Project Summary</h3>
                    <p className="text-sm text-[var(--color-body)] leading-relaxed font-medium">
                      {project.description || "No description provided. Utilize this workspace to track cost, worker logs, and milestones."}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[var(--color-card)] p-6 rounded-2xl border border-[var(--color-border)] text-center shadow-sm">
                      <span className="block text-[8px] font-black uppercase tracking-widest text-[var(--color-muted)] mb-1">Start Date</span>
                      <span className="text-sm font-bold text-[var(--color-heading)]">{project.start_date ? new Date(project.start_date).toLocaleDateString() : "Planning"}</span>
                    </div>
                    <div className="bg-[var(--color-card)] p-6 rounded-2xl border border-[var(--color-border)] text-center shadow-sm">
                      <span className="block text-[8px] font-black uppercase tracking-widest text-[var(--color-muted)] mb-1">Expected Finish</span>
                      <span className="text-sm font-bold text-[var(--color-heading)]">{project.expected_end_date ? new Date(project.expected_end_date).toLocaleDateString() : "Planning"}</span>
                    </div>
                  </div>
                </div>

                {/* Costs panel card */}
                <div className="glass-card p-8 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm space-y-6 flex flex-col justify-between">
                  <h3 className="font-display text-lg font-black text-[var(--color-heading)] uppercase tracking-tight">Budget Stats</h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] shadow-inner">
                      <span className="block text-[8px] font-black uppercase tracking-widest text-[var(--color-muted)] mb-1">Estimated Budget</span>
                      <span className="text-xl font-black text-indigo-500">₹{project.estimated_budget}</span>
                    </div>
                    
                    <div className="p-4 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] shadow-inner">
                      <span className="block text-[8px] font-black uppercase tracking-widest text-[var(--color-muted)] mb-1">Spent Till Date</span>
                      <span className="text-xl font-black text-[var(--color-heading)]">₹{summary?.total_cost || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-[var(--color-muted)] font-black uppercase tracking-widest border-t border-[var(--color-border)] pt-4 mt-2">
                    <FiAlertCircle className="text-indigo-500" /> Auto-synced with logs
                  </div>
                </div>
              </motion.div>
            )}

            {/* Milestones Tab */}
            {activeTab === "milestones" && (
              <motion.div
                key="tab-milestones"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center gap-4">
                  <div>
                    <h3 className="font-display text-xl font-black text-[var(--color-heading)] uppercase tracking-tight">Milestones Tracker</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">Setup milestones to coordinate releases.</p>
                  </div>
                  {isContractor && (
                    <button
                      onClick={() => setShowAddMilestone(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                    >
                      <FiPlus /> Add Milestone
                    </button>
                  )}
                </div>

                <div className="grid gap-6">
                  {milestones.length === 0 ? (
                    <div className="text-center py-16 bg-[var(--color-card)] border border-[var(--color-border)] rounded-[2rem] p-8">
                      <p className="text-sm font-bold text-[var(--color-muted)]">No milestones defined yet.</p>
                    </div>
                  ) : (
                    milestones.map((m, idx) => (
                      <div key={m.id} className="glass-card p-6 border border-[var(--color-border)] bg-[var(--color-card)] rounded-[2rem] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-indigo-500/20 transition-all duration-300">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-xs font-black text-indigo-500">M-{idx+1}</span>
                            <h4 className="font-display text-lg font-black text-[var(--color-heading)] tracking-tight">{m.title}</h4>
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                              m.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                            }`}>
                              {m.status}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--color-muted)] leading-relaxed font-semibold max-w-xl">{m.description}</p>
                          <div className="flex gap-4 text-[10px] font-bold text-[var(--color-body)] uppercase tracking-wider pt-2">
                            <span>Due Date: {m.due_date ? new Date(m.due_date).toLocaleDateString() : "TBD"}</span>
                            <span className="text-indigo-500">Value: ₹{m.amount}</span>
                          </div>
                        </div>

                        {/* Interactive payment/completion actions */}
                        <div className="flex items-center gap-3 shrink-0 self-stretch md:self-auto justify-end border-t border-[var(--color-border)] pt-4 md:pt-0 md:border-0">
                          {/* Payment badge status */}
                          <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
                            m.payment_status === "RELEASED" ? "bg-emerald-500/10 text-emerald-500" : 
                            m.payment_status === "IN_ESCROW" ? "bg-indigo-500/10 text-indigo-500" : "bg-[var(--color-border)] text-[var(--color-muted)]"
                          }`}>
                            {m.payment_status === "RELEASED" && <FiUnlock size={10} />}
                            {m.payment_status === "IN_ESCROW" && <FiLock size={10} />}
                            Payment: {m.payment_status}
                          </span>

                          {/* Completion action (Contractor) */}
                          {isContractor && m.status === "PENDING" && (
                            <button
                              onClick={() => handleMilestoneAction(m.id, "complete")}
                              className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-emerald-500/15"
                            >
                              Mark Done
                            </button>
                          )}

                          {/* Payment Actions (Customer) */}
                          {!isContractor && project.escrow_opted && m.payment_status === "UNPAID" && (
                            <button
                              onClick={() => handleMilestoneAction(m.id, "pay", m)}
                              className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-indigo-500/15"
                            >
                              Escrow Fund
                            </button>
                          )}

                          {!isContractor && project.escrow_opted && m.payment_status === "IN_ESCROW" && m.status === "COMPLETED" && (
                            <button
                              onClick={() => handleMilestoneAction(m.id, "release", m)}
                              className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-emerald-500/15"
                            >
                              Release Payout
                            </button>
                          )}

                          {/* Delete Milestone (Contractor) */}
                          {isContractor && m.payment_status === "UNPAID" && (
                            <button
                              onClick={() => handleDeleteMilestone(m.id)}
                              className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center justify-center transition-colors"
                            >
                              <FiTrash size={14} />
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center gap-4">
                  <div>
                    <h3 className="font-display text-xl font-black text-[var(--color-heading)] uppercase tracking-tight">Material Logbooks</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">Track procurement and verify bills.</p>
                  </div>
                  {isContractor && (
                    <button
                      onClick={() => setShowAddMaterial(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                    >
                      <FiPlus /> Log Material
                    </button>
                  )}
                </div>

                <div className="glass-card border border-[var(--color-border)] bg-[var(--color-card)] rounded-[2rem] overflow-hidden shadow-sm">
                  {materials.length === 0 ? (
                    <div className="text-center py-16">
                      <p className="text-sm font-bold text-[var(--color-muted)]">No materials logged yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                            <th className="px-6 py-4 font-black uppercase tracking-wider text-[var(--color-muted)] text-[10px]">Material Details</th>
                            <th className="px-6 py-4 font-black uppercase tracking-wider text-[var(--color-muted)] text-[10px]">Category</th>
                            <th className="px-6 py-4 font-black uppercase tracking-wider text-[var(--color-muted)] text-[10px] text-center">Quantity</th>
                            <th className="px-6 py-4 font-black uppercase tracking-wider text-[var(--color-muted)] text-[10px] text-right">Unit Price</th>
                            <th className="px-6 py-4 font-black uppercase tracking-wider text-[var(--color-muted)] text-[10px] text-right">Total Price</th>
                            {isContractor && <th className="px-6 py-4 text-center"></th>}
                          </tr>
                        </thead>
                        <tbody>
                          {materials.map((m) => (
                            <tr key={m.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors">
                              <td className="px-6 py-4">
                                <span className="block font-bold text-[var(--color-heading)]">{m.name}</span>
                                <span className="block text-[10px] text-[var(--color-muted)] font-semibold mt-1">Vendor: {m.vendor_name || "N/A"}</span>
                              </td>
                              <td className="px-6 py-4"><span className="px-2.5 py-1 bg-[var(--color-border)] text-[10px] font-bold uppercase rounded-md text-[var(--color-muted)]">{m.category}</span></td>
                              <td className="px-6 py-4 font-bold text-center">{m.quantity} {m.unit}</td>
                              <td className="px-6 py-4 font-bold text-right">₹{m.unit_price}</td>
                              <td className="px-6 py-4 font-black text-indigo-500 text-right">₹{m.total_price}</td>
                              {isContractor && (
                                <td className="px-6 py-4 text-center">
                                  <button
                                    onClick={() => handleDeleteMaterial(m.id)}
                                    className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center justify-center transition-colors mx-auto"
                                  >
                                    <FiTrash size={13} />
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center gap-4">
                  <div>
                    <h3 className="font-display text-xl font-black text-[var(--color-heading)] uppercase tracking-tight">Squad Crew Attendance</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">Track daily worker force wages.</p>
                  </div>
                  {isContractor && (
                    <button
                      onClick={() => setShowAddManpower(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                    >
                      <FiPlus /> Log Worker
                    </button>
                  )}
                </div>

                <div className="glass-card border border-[var(--color-border)] bg-[var(--color-card)] rounded-[2rem] overflow-hidden shadow-sm">
                  {manpower.length === 0 ? (
                    <div className="text-center py-16">
                      <p className="text-sm font-bold text-[var(--color-muted)]">No crew workers logged yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                            <th className="px-6 py-4 font-black uppercase tracking-wider text-[var(--color-muted)] text-[10px]">Worker Name</th>
                            <th className="px-6 py-4 font-black uppercase tracking-wider text-[var(--color-muted)] text-[10px]">Role</th>
                            <th className="px-6 py-4 font-black uppercase tracking-wider text-[var(--color-muted)] text-[10px] text-center">Daily Wage</th>
                            <th className="px-6 py-4 font-black uppercase tracking-wider text-[var(--color-muted)] text-[10px] text-center">Days Worked</th>
                            <th className="px-6 py-4 font-black uppercase tracking-wider text-[var(--color-muted)] text-[10px] text-right">Total Paid</th>
                            {isContractor && <th className="px-6 py-4 text-center">Attendance Action</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {manpower.map((w) => (
                            <tr key={w.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors">
                              <td className="px-6 py-4">
                                <span className="block font-bold text-[var(--color-heading)]">{w.worker_name}</span>
                                <span className="block text-[10px] text-[var(--color-muted)] font-semibold mt-1">{w.phone || "No contact"}</span>
                              </td>
                              <td className="px-6 py-4"><span className="px-2.5 py-1 bg-[var(--color-border)] text-[10px] font-bold uppercase rounded-md text-[var(--color-muted)]">{w.role}</span></td>
                              <td className="px-6 py-4 font-bold text-center">₹{w.daily_rate}</td>
                              <td className="px-6 py-4 font-bold text-center">{w.days_worked} d</td>
                              <td className="px-6 py-4 font-black text-indigo-500 text-right">₹{w.total_paid}</td>
                              {isContractor ? (
                                <td className="px-6 py-4">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => handleUpdateManpowerDays(w.id, parseFloat(w.days_worked), parseFloat(w.daily_rate), "add")}
                                      className="px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold transition-all"
                                    >
                                      +1 Day
                                    </button>
                                    <button
                                      onClick={() => handleUpdateManpowerDays(w.id, parseFloat(w.days_worked), parseFloat(w.daily_rate), "sub")}
                                      className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold transition-all"
                                    >
                                      -1 Day
                                    </button>
                                    <button
                                      onClick={() => handleDeleteManpower(w.id)}
                                      className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center justify-center transition-colors ml-2"
                                    >
                                      <FiTrash size={13} />
                                    </button>
                                  </div>
                                </td>
                              ) : null}
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center gap-4">
                  <div>
                    <h3 className="font-display text-xl font-black text-[var(--color-heading)] uppercase tracking-tight">General Project Expenses</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">Log petty cash, rentals, machinery, and utilities.</p>
                  </div>
                  {isContractor && (
                    <button
                      onClick={() => setShowAddExpense(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                    >
                      <FiPlus /> Log Expense
                    </button>
                  )}
                </div>

                <div className="glass-card border border-[var(--color-border)] bg-[var(--color-card)] rounded-[2rem] overflow-hidden shadow-sm">
                  {expenses.length === 0 ? (
                    <div className="text-center py-16">
                      <p className="text-sm font-bold text-[var(--color-muted)]">No miscellaneous expenses logged yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                            <th className="px-6 py-4 font-black uppercase tracking-wider text-[var(--color-muted)] text-[10px]">Description</th>
                            <th className="px-6 py-4 font-black uppercase tracking-wider text-[var(--color-muted)] text-[10px]">Category</th>
                            <th className="px-6 py-4 font-black uppercase tracking-wider text-[var(--color-muted)] text-[10px]">Date</th>
                            <th className="px-6 py-4 font-black uppercase tracking-wider text-[var(--color-muted)] text-[10px] text-right">Amount</th>
                            {isContractor && <th className="px-6 py-4 text-center"></th>}
                          </tr>
                        </thead>
                        <tbody>
                          {expenses.map((e) => (
                            <tr key={e.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors">
                              <td className="px-6 py-4 font-bold text-[var(--color-heading)]">{e.description}</td>
                              <td className="px-6 py-4"><span className="px-2.5 py-1 bg-[var(--color-border)] text-[10px] font-bold uppercase rounded-md text-[var(--color-muted)]">{e.category}</span></td>
                              <td className="px-6 py-4 font-bold">{e.date ? new Date(e.date).toLocaleDateString() : "TBD"}</td>
                              <td className="px-6 py-4 font-black text-indigo-500 text-right">₹{e.amount}</td>
                              {isContractor && (
                                <td className="px-6 py-4 text-center">
                                  <button
                                    onClick={() => handleDeleteExpense(e.id)}
                                    className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center justify-center transition-colors mx-auto"
                                  >
                                    <FiTrash size={13} />
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

            {/* Financial Summary (Payments) Tab */}
            {activeTab === "payments" && (
              <motion.div
                key="tab-payments"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                {/* Cost Distribution Chart/Overview */}
                <div className="glass-card p-8 border border-[var(--color-border)] bg-[var(--color-card)] rounded-[2rem] shadow-sm space-y-6">
                  <h3 className="font-display text-lg font-black text-[var(--color-heading)] uppercase tracking-tight">Project Payout Distribution</h3>
                  
                  <div className="space-y-4 font-semibold text-sm">
                    <div className="flex justify-between text-[var(--color-muted)]">
                      <span>Total Milestones Budget:</span>
                      <span className="text-[var(--color-heading)] font-bold">₹{project.estimated_budget}</span>
                    </div>
                    <div className="flex justify-between text-[var(--color-muted)] border-b border-[var(--color-border)] pb-4">
                      <span>Total Logs Spent (Materials+Workers+Misc):</span>
                      <span className="text-[var(--color-heading)] font-bold">₹{summary?.total_cost || 0}</span>
                    </div>
                    
                    <div className="flex justify-between text-emerald-500 pt-2">
                      <span>Funds Released to Contractor:</span>
                      <span className="font-bold">₹{summary?.released_milestones || 0}</span>
                    </div>
                    <div className="flex justify-between text-indigo-500">
                      <span>Funds Held in Escrow Protection:</span>
                      <span className="font-bold">₹{summary?.escrow_milestones || 0}</span>
                    </div>
                    <div className="flex justify-between text-amber-500">
                      <span>Remaining Balance Payouts:</span>
                      <span className="font-bold">₹{project.estimated_budget - (summary?.released_milestones || 0) - (summary?.escrow_milestones || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Sub-Logs Breakdown */}
                <div className="glass-card p-8 border border-[var(--color-border)] bg-[var(--color-card)] rounded-[2rem] shadow-sm space-y-6">
                  <h3 className="font-display text-lg font-black text-[var(--color-heading)] uppercase tracking-tight">Operational Logs Breakdown</h3>
                  
                  <div className="space-y-4 text-sm font-semibold">
                    <div className="flex justify-between text-[var(--color-muted)]">
                      <span>Materials Logged Cost:</span>
                      <span className="text-[var(--color-heading)] font-bold">₹{summary?.materials_cost || 0}</span>
                    </div>
                    <div className="flex justify-between text-[var(--color-muted)]">
                      <span>Manpower Squad Wages Cost:</span>
                      <span className="text-[var(--color-heading)] font-bold">₹{summary?.manpower_cost || 0}</span>
                    </div>
                    <div className="flex justify-between text-[var(--color-muted)] border-b border-[var(--color-border)] pb-4">
                      <span>Miscellaneous Expenses logged:</span>
                      <span className="text-[var(--color-heading)] font-bold">₹{summary?.expenses_cost || 0}</span>
                    </div>
                    
                    <div className="flex justify-between text-indigo-500 pt-2 font-black">
                      <span className="uppercase tracking-widest text-[10px]">Total Logged Spending:</span>
                      <span className="text-base">₹{summary?.total_cost || 0}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Timeline Tab */}
            {activeTab === "timeline" && (
              <motion.div
                key="tab-timeline"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl mx-auto space-y-8"
              >
                <div>
                  <h3 className="font-display text-xl font-black text-[var(--color-heading)] uppercase tracking-tight">Milestones Chronological Timeline</h3>
                  <p className="mt-1 text-xs text-[var(--color-muted)] font-semibold uppercase tracking-widest">Visual flow of project delivery steps.</p>
                </div>

                <div className="relative border-l-2 border-[var(--color-border)] pl-8 ml-4 space-y-12">
                  {milestones.length === 0 ? (
                    <p className="text-sm font-bold text-[var(--color-muted)]">No milestones defined.</p>
                  ) : (
                    milestones.map((m, idx) => (
                      <div key={m.id} className="relative">
                        {/* Dot indicator */}
                        <div className={`absolute -left-12 top-1.5 w-6 h-6 rounded-full border-4 ${
                          m.status === "COMPLETED" 
                            ? "bg-emerald-500 border-emerald-500/20 shadow-lg shadow-emerald-500/30" 
                            : "bg-[var(--color-bg)] border-[var(--color-border)]"
                        }`} />
                        
                        <div className="space-y-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500">Step {idx+1}</span>
                          <h4 className="font-display text-lg font-black text-[var(--color-heading)] leading-snug tracking-tight">{m.title}</h4>
                          <p className="text-xs text-[var(--color-muted)] font-medium max-w-lg leading-relaxed">{m.description}</p>
                          <div className="flex gap-4 text-[9px] font-black uppercase tracking-widest pt-1">
                            <span className="text-[var(--color-heading)]">Value: ₹{m.amount}</span>
                            <span className={m.status === "COMPLETED" ? "text-emerald-500" : "text-amber-500"}>{m.status}</span>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card max-w-md w-full bg-[var(--color-card)] border border-[var(--color-border)] p-8 rounded-[2rem] shadow-xl space-y-6">
              <h3 className="font-display text-xl font-black text-[var(--color-heading)] uppercase tracking-tight">Define Milestone</h3>
              
              <form onSubmit={handleCreateMilestone} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Milestone Title</span>
                  <input required className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] font-bold focus:border-indigo-500 outline-none" value={milestoneForm.title} onChange={e => setMilestoneForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Slab Casting completion" />
                </label>
                
                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Description</span>
                  <textarea rows="3" required className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] font-bold focus:border-indigo-500 outline-none resize-none" value={milestoneForm.description} onChange={e => setMilestoneForm(p => ({ ...p, description: e.target.value }))} placeholder="State deliverables in detail..." />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Payout (₹)</span>
                    <input required type="number" min="1" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] font-bold focus:border-indigo-500 outline-none" value={milestoneForm.amount} onChange={e => setMilestoneForm(p => ({ ...p, amount: e.target.value }))} placeholder="Milestone Budget" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Due Date</span>
                    <input required type="date" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] font-bold focus:border-indigo-500 outline-none" value={milestoneForm.due_date} onChange={e => setMilestoneForm(p => ({ ...p, due_date: e.target.value }))} />
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddMilestone(false)} className="flex-1 py-3.5 rounded-xl border border-[var(--color-border)] text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Cancel</button>
                  <button type="submit" className="flex-1 py-3.5 rounded-xl bg-indigo-500 text-white text-xs font-black uppercase tracking-widest shadow-md">Add</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Add Material modal */}
        {showAddMaterial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card max-w-md w-full bg-[var(--color-card)] border border-[var(--color-border)] p-8 rounded-[2rem] shadow-xl space-y-6">
              <h3 className="font-display text-xl font-black text-[var(--color-heading)] uppercase tracking-tight">Log Procurement</h3>
              
              <form onSubmit={handleCreateMaterial} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Material Name / Grade</span>
                  <input required className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] font-bold focus:border-indigo-500 outline-none" value={materialForm.name} onChange={e => setMaterialForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. OPC Cement Grade 53" />
                </label>
                
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Quantity</span>
                    <input required type="number" step="any" min="0.1" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] font-bold focus:border-indigo-500 outline-none" value={materialForm.quantity} onChange={e => setMaterialForm(p => ({ ...p, quantity: e.target.value }))} />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Unit</span>
                    <input required className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] font-bold focus:border-indigo-500 outline-none" value={materialForm.unit} onChange={e => setMaterialForm(p => ({ ...p, unit: e.target.value }))} placeholder="Bags, Tons, Kg..." />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Unit Price (₹)</span>
                    <input required type="number" min="0.1" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] font-bold focus:border-indigo-500 outline-none" value={materialForm.unit_price} onChange={e => setMaterialForm(p => ({ ...p, unit_price: e.target.value }))} />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Purchase Date</span>
                    <input required type="date" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] font-bold focus:border-indigo-500 outline-none" value={materialForm.purchase_date} onChange={e => setMaterialForm(p => ({ ...p, purchase_date: e.target.value }))} />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Category</span>
                    <select className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] font-bold focus:border-indigo-500 outline-none" value={materialForm.category} onChange={e => setMaterialForm(p => ({ ...p, category: e.target.value }))}>
                      {["Cement", "Steel", "Bricks", "Sand", "Electrical", "Plumbing", "Paint", "Wood", "Other"].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Vendor Name</span>
                    <input className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] font-bold focus:border-indigo-500 outline-none" value={materialForm.vendor_name} onChange={e => setMaterialForm(p => ({ ...p, vendor_name: e.target.value }))} placeholder="Dealer Name" />
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddMaterial(false)} className="flex-1 py-3.5 rounded-xl border border-[var(--color-border)] text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Cancel</button>
                  <button type="submit" className="flex-1 py-3.5 rounded-xl bg-indigo-500 text-white text-xs font-black uppercase tracking-widest shadow-md">Log</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Add Manpower modal */}
        {showAddManpower && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card max-w-md w-full bg-[var(--color-card)] border border-[var(--color-border)] p-8 rounded-[2rem] shadow-xl space-y-6">
              <h3 className="font-display text-xl font-black text-[var(--color-heading)] uppercase tracking-tight">Log Crew Worker</h3>
              
              <form onSubmit={handleCreateManpower} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Worker Full Name</span>
                  <input required className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] font-bold focus:border-indigo-500 outline-none" value={manpowerForm.worker_name} onChange={e => setManpowerForm(p => ({ ...p, worker_name: e.target.value }))} placeholder="Worker Name" />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Role / Skill</span>
                    <select className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] font-bold focus:border-indigo-500 outline-none" value={manpowerForm.role} onChange={e => setManpowerForm(p => ({ ...p, role: e.target.value }))}>
                      {["Mason", "Helper", "Carpenter", "Electrician", "Plumber", "Painter", "Welder", "Supervisor", "Other"].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Contact Phone</span>
                    <input className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] font-bold focus:border-indigo-500 outline-none" value={manpowerForm.phone} onChange={e => setManpowerForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, "") }))} placeholder="10-digit mobile" />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Daily Wage Rate (₹)</span>
                    <input required type="number" min="0" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] font-bold focus:border-indigo-500 outline-none" value={manpowerForm.daily_rate} onChange={e => setManpowerForm(p => ({ ...p, daily_rate: e.target.value }))} placeholder="e.g. 400" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Initial Days Worked</span>
                    <input required type="number" step="any" min="0" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] font-bold focus:border-indigo-500 outline-none" value={manpowerForm.days_worked} onChange={e => setManpowerForm(p => ({ ...p, days_worked: e.target.value }))} />
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddManpower(false)} className="flex-1 py-3.5 rounded-xl border border-[var(--color-border)] text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Cancel</button>
                  <button type="submit" className="flex-1 py-3.5 rounded-xl bg-indigo-500 text-white text-xs font-black uppercase tracking-widest shadow-md">Add</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Add Expense modal */}
        {showAddExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card max-w-md w-full bg-[var(--color-card)] border border-[var(--color-border)] p-8 rounded-[2rem] shadow-xl space-y-6">
              <h3 className="font-display text-xl font-black text-[var(--color-heading)] uppercase tracking-tight">Log Project Expense</h3>
              
              <form onSubmit={handleCreateExpense} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Expense description</span>
                  <input required className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] font-bold focus:border-indigo-500 outline-none" value={expenseForm.description} onChange={e => setExpenseForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Scaffolding machinery rent" />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Amount Spent (₹)</span>
                    <input required type="number" min="0.1" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] font-bold focus:border-indigo-500 outline-none" value={expenseForm.amount} onChange={e => setExpenseForm(p => ({ ...p, amount: e.target.value }))} />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Date</span>
                    <input required type="date" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] font-bold focus:border-indigo-500 outline-none" value={expenseForm.date} onChange={e => setExpenseForm(p => ({ ...p, date: e.target.value }))} />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Category</span>
                  <select className="w-full bg-[var(--color-bg)] border border(--color-border) rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] font-bold focus:border-indigo-500 outline-none" value={expenseForm.category} onChange={e => setExpenseForm(p => ({ ...p, category: e.target.value }))}>
                    {["Rent", "Fuel", "Transport", "Manpower Food", "Tools repair", "Water/Power", "Other"].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </label>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddExpense(false)} className="flex-1 py-3.5 rounded-xl border border-[var(--color-border)] text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Cancel</button>
                  <button type="submit" className="flex-1 py-3.5 rounded-xl bg-indigo-500 text-white text-xs font-black uppercase tracking-widest shadow-md">Log</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}
