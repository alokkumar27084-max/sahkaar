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
  FiX
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
    contractor_id: "",
    customer_phone_email: ""
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
      const dbRes = await projectAPI.create({
        title: form.title,
        description: form.description,
        estimated_budget: parseFloat(form.estimated_budget),
        start_date: form.start_date,
        expected_end_date: form.expected_end_date,
        escrow_opted: form.escrow_opted,
        contractor_id: user.contractorId || 1,
        customer_id: 1
      });

      if (dbRes.data?.ok) {
        toast.success("Project workspace created successfully!");
        setShowCreateModal(false);
        setForm({ title: "", description: "", estimated_budget: "", start_date: "", expected_end_date: "", escrow_opted: false, customer_phone_email: "" });
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
    <main className="min-h-screen bg-[var(--color-bg)] pt-24 pb-16 px-4 md:px-6 transition-colors duration-300">
      <div className="max-w-[850px] mx-auto space-y-6">
        
        {/* Header Strip */}
        <div className="card bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-[var(--radius-lg)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)]">Enterprise Workspace</span>
            <h1 className="font-display text-2xl font-bold text-[var(--color-heading)] tracking-tight">
              Milestone Planners
            </h1>
            <p className="text-xs text-[var(--color-muted)] font-semibold leading-relaxed">
              Track material billing, work timelines, and secure milestone payments.
            </p>
          </div>

          {isContractor && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-1.5 py-3 px-5 text-sm font-semibold rounded-[var(--radius-sm)] shadow-xs shrink-0 self-start sm:self-auto"
            >
              <FiPlus /> New Planner
            </button>
          )}
        </div>

        {/* Project Listings Grid */}
        <div className="space-y-4">
          {projects.length === 0 ? (
            <div className="text-center py-16 card bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-8 shadow-sm">
              <div className="w-12 h-12 bg-[var(--color-primary-muted)] text-[var(--color-primary)] rounded-[var(--radius-md)] flex items-center justify-center mx-auto mb-4 border border-[var(--color-border)]">
                <FiBriefcase size={20} />
              </div>
              <h3 className="font-display text-base font-bold text-[var(--color-heading)]">No Planners Found</h3>
              <p className="mt-1 text-xs text-[var(--color-muted)] max-w-xs mx-auto leading-relaxed font-semibold">
                Project workspaces are automatically initialized after an agreement or meeting schedule is finalized.
              </p>
            </div>
          ) : (
            projects.map((p) => (
              <div
                key={p.id}
                className="card bg-[var(--color-surface)] border border-[var(--color-border)] p-5 rounded-[var(--radius-lg)] shadow-sm hover:border-[var(--color-border-hover)] hover:shadow-card-hover transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-bold text-[var(--color-heading)] tracking-tight truncate">
                      {p.title}
                    </h3>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[var(--radius-pill)] border ${
                      p.status === "PLANNING" ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                      p.status === "IN_PROGRESS" ? "bg-[var(--color-primary-muted)] border-[var(--color-primary)]/20 text-[var(--color-primary)]" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                    }`}>
                      {p.status}
                    </span>
                    {p.escrow_opted && (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-[var(--radius-pill)] flex items-center gap-0.5">
                        <FiLock size={9} /> Escrow
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-[var(--color-muted)] leading-relaxed font-semibold line-clamp-2">
                    {p.description || "No description logged. View dashboard to track milestone execution details."}
                  </p>

                  <div className="flex flex-wrap gap-4 text-[9px] font-bold text-[var(--color-muted)] uppercase tracking-wider pt-2 border-t border-[var(--color-divider)]">
                    <span className="flex items-center gap-1"><FiCalendar className="text-[var(--color-primary)]" /> Start: {p.start_date ? new Date(p.start_date).toLocaleDateString("en-IN") : "TBD"}</span>
                    <span className="flex items-center gap-1"><FiDollarSign className="text-[var(--color-primary)]" /> Budget: ₹{Number(p.estimated_budget || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <Link
                  to={`/project/${p.id}`}
                  className="btn-ghost border border-[var(--color-border)] text-xs rounded-[var(--radius-sm)] flex items-center justify-center gap-1 py-2.5 px-4 font-bold shrink-0 self-start md:self-auto"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card max-w-md w-full bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-[var(--radius-lg)] shadow-xl space-y-4 relative"
            >
              <button 
                onClick={() => setShowCreateModal(false)}
                className="absolute right-4 top-4 text-[var(--color-muted)] hover:text-[var(--color-heading)] p-1 rounded-full hover:bg-[var(--color-bg-elevated)] transition-colors"
              >
                <FiX size={16} />
              </button>

              <div className="space-y-1">
                <h3 className="font-display text-lg font-bold text-[var(--color-heading)]">Create Project Workspace</h3>
                <p className="text-[11px] text-[var(--color-muted)] leading-relaxed font-semibold">Initialize a milestones tracking planner for your client.</p>
              </div>

              <form onSubmit={handleCreateProjectSubmit} className="space-y-3.5">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Project Name / Title</label>
                  <input required className="input-field" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. 2BHK Home Renovation" />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Client Contact (Email or Mobile)</label>
                  <input required className="input-field" value={form.customer_phone_email} onChange={e => setForm(p => ({ ...p, customer_phone_email: e.target.value }))} placeholder="Find client to link project..." />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Description</label>
                  <textarea rows="3" required className="input-field h-auto py-2 resize-none" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief details on layout and works..." />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Estimated Budget (₹)</label>
                    <input required type="number" min="1" className="input-field" value={form.estimated_budget} onChange={e => setForm(p => ({ ...p, estimated_budget: e.target.value }))} placeholder="Project Value" />
                  </div>
                  
                  <div className="flex items-center gap-2 pt-5 pl-2">
                    <input type="checkbox" id="escrow_check" className="w-4 h-4 accent-[var(--color-primary)] cursor-pointer" checked={form.escrow_opted} onChange={e => setForm(p => ({ ...p, escrow_opted: e.target.checked }))} />
                    <label htmlFor="escrow_check" className="text-xs font-semibold text-[var(--color-heading)] cursor-pointer">Escrow Payments</label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Start Date</label>
                    <input required type="date" className="input-field" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Expected Finish</label>
                    <input required type="date" className="input-field" value={form.expected_end_date} onChange={e => setForm(p => ({ ...p, expected_end_date: e.target.value }))} />
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn-ghost flex-1 h-11 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] py-2">Cancel</button>
                  <button type="submit" className="btn-primary flex-1 h-11 text-xs font-semibold rounded-[var(--radius-sm)] py-2">Create Planner</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}

