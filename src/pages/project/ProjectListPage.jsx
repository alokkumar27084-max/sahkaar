import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiBriefcase,
  FiPlus,
  FiCalendar,
  FiDollarSign,
  FiLock,
  FiChevronRight,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { projectAPI } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function ProjectListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Project Form State
  const [form, setForm] = useState({
    title: "",
    description: "",
    estimated_budget: "",
    start_date: "",
    expected_end_date: "",
    escrow_opted: false,
    contractor_id: "", // Calculated dynamically or mock
    customer_phone_email: "" // To find or link the customer
  });

  const isContractor = user?.role === "contractor";

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await projectAPI.getMyProjects(user.role);
      if (res.data?.ok) {
        setProjects(res.data.projects || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load projects list.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProjectSubmit = async (e) => {
    e.preventDefault();
    try {
      // Find contractor details if needed
      // For now, contractor is user, we need to pass their contractor id
      const dbRes = await projectAPI.create({
        title: form.title,
        description: form.description,
        estimated_budget: parseFloat(form.estimated_budget),
        start_date: form.start_date,
        expected_end_date: form.expected_end_date,
        escrow_opted: form.escrow_opted,
        contractor_id: user.contractorId || 1, // Fallback if missing
        customer_id: 1 // Link mock client user
      });

      if (dbRes.data?.ok) {
        toast.success("Milestone project manager created successfully!");
        setShowCreateModal(false);
        setForm({ title: "", description: "", estimated_budget: "", start_date: "", expected_end_date: "", escrow_opted: false });
        fetchProjects();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create project.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] pt-24 pb-16 px-4 md:px-8 transition-colors duration-500">
      <div className="max-w-[1100px] mx-auto space-y-8">
        
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden p-8 rounded-[2.5rem] bg-gradient-to-r from-indigo-500/5 to-transparent border border-[var(--color-border)] shadow-sm">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-2 block">Enterprise Workspace</span>
            <h1 className="font-display text-3xl md:text-4xl font-black text-[var(--color-heading)] tracking-tight leading-none">
              SaaS Milestone Projects
            </h1>
            <p className="mt-3 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">
              Manage material billing, worker attendance, and escrow payouts.
            </p>
          </div>

          {isContractor && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
            >
              <FiPlus /> New Project Planner
            </button>
          )}
        </div>

        {/* Project Listings Grid */}
        <div className="grid gap-6">
          {projects.length === 0 ? (
            <div className="text-center py-20 bg-[var(--color-card)] border border-[var(--color-border)] rounded-[2.5rem] p-8">
              <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <FiBriefcase size={24} />
              </div>
              <h3 className="font-display text-xl font-black text-[var(--color-heading)]">No SaaS Projects Found</h3>
              <p className="mt-2 text-xs font-black uppercase tracking-widest text-[var(--color-muted)] max-w-sm mx-auto leading-relaxed">
                Projects are automatically initialized after an agreement or meeting schedule is finalized.
              </p>
            </div>
          ) : (
            projects.map((p, idx) => (
              <div
                key={p.id}
                className="glass-card border border-[var(--color-border)] bg-[var(--color-card)] p-6 rounded-[2rem] hover:border-indigo-500/30 hover:scale-[1.01] transition-all duration-500 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden group"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-display text-xl font-black text-[var(--color-heading)] tracking-tight group-hover:text-indigo-400 transition-colors">
                      {p.title}
                    </h3>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                      p.status === "PLANNING" ? "bg-amber-500/10 text-amber-500" :
                      p.status === "IN_PROGRESS" ? "bg-indigo-500/10 text-indigo-500" : "bg-emerald-500/10 text-emerald-500"
                    }`}>
                      {p.status}
                    </span>
                    {p.escrow_opted && (
                      <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <FiLock size={10} /> Escrow
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-[var(--color-muted)] leading-relaxed font-semibold max-w-2xl line-clamp-2">
                    {p.description || "No description logged. View dashboard to track milestone execution details."}
                  </p>

                  <div className="flex flex-wrap gap-4 text-[10px] font-bold text-[var(--color-body)] uppercase tracking-wider pt-2 border-t border-[var(--color-border)]">
                    <span className="flex items-center gap-1.5"><FiCalendar className="text-indigo-500" /> Start: {p.start_date ? new Date(p.start_date).toLocaleDateString() : "TBD"}</span>
                    <span className="flex items-center gap-1.5"><FiDollarSign className="text-indigo-500" /> Budget: ₹{p.estimated_budget}</span>
                  </div>
                </div>

                <Link
                  to={`/project/${p.id}`}
                  className="flex items-center gap-1 px-5 py-3 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white font-bold text-xs uppercase tracking-widest transition-all"
                >
                  Workspace <FiChevronRight />
                </Link>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Create project modal (Contractor Only) */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card max-w-lg w-full bg-[var(--color-card)] border border-[var(--color-border)] p-8 rounded-[2rem] shadow-xl space-y-6"
            >
              <h3 className="font-display text-2xl font-black text-[var(--color-heading)] uppercase tracking-tight">Create SaaS Project</h3>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] leading-relaxed">Initialize a comprehensive milestones and ledger logbook for your client.</p>

              <form onSubmit={handleCreateProjectSubmit} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Project Name / Title</span>
                  <input required className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] font-bold focus:border-indigo-500 outline-none" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. 2BHK Home Renovation" />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Client Contact (Email or Mobile)</span>
                  <input required className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] font-bold focus:border-indigo-500 outline-none" value={form.customer_phone_email} onChange={e => setForm(p => ({ ...p, customer_phone_email: e.target.value }))} placeholder="Find client to link project..." />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Description</span>
                  <textarea rows="3" required className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] font-bold focus:border-indigo-500 outline-none resize-none" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief details on layout and works..." />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Estimated Budget (₹)</span>
                    <input required type="number" min="1" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] font-bold focus:border-indigo-500 outline-none" value={form.estimated_budget} onChange={e => setForm(p => ({ ...p, estimated_budget: e.target.value }))} placeholder="Project Value" />
                  </label>
                  
                  <label className="block flex items-center gap-3 pt-6 pl-4">
                    <input type="checkbox" className="w-5 h-5 rounded accent-indigo-500 cursor-pointer" checked={form.escrow_opted} onChange={e => setForm(p => ({ ...p, escrow_opted: e.target.checked }))} />
                    <span className="text-xs font-black uppercase tracking-widest text-[var(--color-heading)] cursor-pointer">Escrow Payments</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Start Date</span>
                    <input required type="date" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] font-bold focus:border-indigo-500 outline-none" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Expected Finish</span>
                    <input required type="date" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-heading)] font-bold focus:border-indigo-500 outline-none" value={form.expected_end_date} onChange={e => setForm(p => ({ ...p, expected_end_date: e.target.value }))} />
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3.5 rounded-xl border border-[var(--color-border)] text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Cancel</button>
                  <button type="submit" className="flex-1 py-3.5 rounded-xl bg-indigo-500 text-white text-xs font-black uppercase tracking-widest shadow-md">Create Workspace</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}
