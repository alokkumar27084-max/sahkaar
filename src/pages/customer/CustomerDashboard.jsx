import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiBell,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiBriefcase,
  FiArrowRight,
  FiSettings,
  FiStar,
  FiZap,
  FiCalendar,
  FiAlertTriangle,
  FiPhone,
  FiMessageCircle,
  FiExternalLink
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import {
  quickBookingAPI,
  meetingAPI,
  projectAPI,
  subscriptionAPI,
  notificationAPI
} from "../../services/api";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const fadeUp = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("quick_bookings");
  const [quickBookings, setQuickBookings] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review states
  const [reviewingBooking, setReviewingBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  // Reschedule states
  const [reschedulingMeeting, setReschedulingMeeting] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [newSlot, setNewSlot] = useState("morning");
  const [rescheduleNote, setRescheduleNote] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      quickBookingAPI.getMyBookings(),
      meetingAPI.getMyMeetings("customer"),
      projectAPI.getMyProjects("customer"),
      subscriptionAPI.getMyDisputes(),
      notificationAPI.getMine()
    ]);

    const [qbRes, meetRes, projRes, dispRes, notifRes] = results;
    if (qbRes.status === "fulfilled") setQuickBookings(qbRes.value.data.bookings || []);
    if (meetRes.status === "fulfilled") setMeetings(meetRes.value.data.meetings || []);
    if (projRes.status === "fulfilled") setProjects(projRes.value.data.projects || []);
    if (dispRes.status === "fulfilled") setDisputes(dispRes.value.data.disputes || []);
    if (notifRes.status === "fulfilled") setNotifications(notifRes.value.data.notifications || []);

    const failed = results.filter((result) => result.status === "rejected");
    if (failed.length) {
      console.error("Dashboard modules failed to load", failed.map((result) => result.reason));
      toast.error("Some dashboard sections could not be loaded.");
    }
    setLoading(false);
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!newDate) {
      toast.error("Please select a date.");
      return;
    }
    setRescheduleLoading(true);
    try {
      const res = await meetingAPI.reschedule(
        reschedulingMeeting.id,
        newDate,
        newSlot,
        rescheduleNote
      );
      if (res.data?.ok) {
        toast.success("Reschedule request submitted successfully.");
        setReschedulingMeeting(null);
        setNewDate("");
        setRescheduleNote("");
        fetchDashboardData();
      }
    } catch (err) {
      toast.error("Failed to request rescheduling.");
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewLoading(true);
    try {
      const res = await quickBookingAPI.addReview(
        reviewingBooking.id,
        reviewRating,
        reviewText
      );
      if (res.data?.ok) {
        toast.success("Review submitted. Thank you!");
        setReviewingBooking(null);
        setReviewText("");
        setReviewRating(5);
        fetchDashboardData();
      }
    } catch (err) {
      toast.error("Failed to submit review.");
    } finally {
      setReviewLoading(false);
    }
  };

  const getMeetingStatusBadge = (status) => {
    switch (status) {
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
            Scheduled
          </span>
        );
      case "RESCHEDULED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-wider animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Rescheduled
          </span>
        );
      case "DECLINED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-black uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            Declined
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            Pending Accept
          </span>
        );
    }
  };

  const getQuickBookingStatusBadge = (status) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Job Done
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse"></span>
            Assigned
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-black uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400 text-xs font-black uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Unconfirmed
          </span>
        );
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <main className="bg-[var(--color-bg-elevated)] text-[var(--color-heading)] min-h-screen pt-24 pb-20 overflow-hidden relative">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 relative z-10">

        {/* Header Block */}
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[var(--color-primary)] font-bold tracking-widest uppercase text-[10px] mb-1.5 block">Premium Client Workspace</span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-none text-[var(--color-heading)]">
              Welcome Back, <span className="text-[var(--color-primary)]">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-[var(--color-muted)] mt-2 text-sm font-semibold">Track scheduled visits, complete small handymen slots, or view SaaS constructions.</p>
          </div>
        </motion.div>

        {/* Tab Selector */}
        <div className="flex border-b border-[var(--color-border)] mb-8 overflow-x-auto no-scrollbar gap-6">
          {[
            { id: "quick_bookings", label: "Quick Bookings", icon: FiZap, count: quickBookings.length },
            { id: "meetings", label: "Consultation Visits", icon: FiCalendar, count: meetings.length },
            { id: "projects", label: "Milestone Projects", icon: FiBriefcase, count: projects.length },
            { id: "disputes", label: "Dispute Tickets", icon: FiAlertTriangle, count: disputes.length }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 py-4 border-b-2 font-extrabold text-xs uppercase tracking-wider shrink-0 transition-all ${
                  isActive
                    ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                    : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-heading)]"
                }`}
              >
                <Icon size={13} />
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1.5 px-2 py-0.5 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[9px] font-bold text-[var(--color-muted)]">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">

          {/* LEFT SIDEBAR: Personal profile info & quick updates strip */}
          <div className="space-y-6">

            {/* Identity Card */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-card p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--color-primary)]/5 to-cyan-500/5 blur-[40px] -mr-10 -mt-10 rounded-full pointer-events-none" />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center text-lg font-bold shadow-sm">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[var(--color-heading)] leading-tight">{user?.name}</h3>
                  <p className="text-[10px] text-[var(--color-muted)] font-bold mt-1 uppercase tracking-wider">{user?.phone}</p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-[var(--color-border)] flex flex-col gap-2">
                <button
                  onClick={() => navigate("/search")}
                  className="w-full py-2.5 text-center rounded-lg bg-[var(--color-primary)] text-white font-bold text-[10px] uppercase tracking-wider hover:bg-[var(--color-primary)]/90 active:scale-95 transition-all shadow-sm"
                >
                  Book Contractor
                </button>
                <button
                  onClick={() => navigate("/labour")}
                  className="w-full py-2.5 text-center rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)] text-[var(--color-heading)] font-bold text-[10px] uppercase tracking-wider transition-all"
                >
                  Labour Chowk
                </button>
              </div>
            </motion.div>

            {/* Notification Widget */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-heading)] flex items-center gap-2">
                  <FiBell className="text-[var(--color-primary)] shrink-0" /> Inbox Logs
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold">
                      {unreadCount}
                    </span>
                  )}
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={async () => {
                      await notificationAPI.markAllRead();
                      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                    }}
                    className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-primary)] hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-[var(--color-border)] bg-[var(--color-bg-elevated)] rounded-xl">
                  <p className="text-[var(--color-muted)] text-[10px] font-bold uppercase tracking-wider">No notifications yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {notifications.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border text-xs leading-relaxed transition-all ${
                        item.is_read
                          ? "border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-muted)]"
                          : "border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 text-[var(--color-heading)]"
                      }`}
                    >
                      <p className="font-semibold">{item.message}</p>
                      <div className="mt-2 flex items-center justify-between opacity-80">
                        <span className="text-[9px] font-bold uppercase text-[var(--color-muted)]">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                        {!item.is_read && (
                          <button
                            onClick={async () => {
                              await notificationAPI.markRead(item.id);
                              setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
                            }}
                            className="text-[9px] font-bold uppercase text-[var(--color-primary)] hover:underline"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

          </div>

          {/* RIGHT PANELS: Active tab items */}
          <div className="space-y-6">

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-card">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">Fetching workspace state...</p>
              </div>
            ) : (
              <AnimatePresence mode="wait">

                {/* TAB 1: QUICK HANDYMAN BOOKINGS */}
                {activeTab === "quick_bookings" && (
                  <motion.div key="quick" initial="hidden" animate="show" exit="hidden" variants={stagger} className="space-y-5">
                    {quickBookings.length === 0 ? (
                      <div className="text-center py-16 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 shadow-card">
                        <div className="w-12 h-12 bg-[var(--color-primary)]/10 rounded-xl flex items-center justify-center mx-auto mb-5 text-[var(--color-primary)]">
                          <FiZap size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--color-heading)]">No Handyman Bookings</h3>
                        <p className="mt-2 text-xs font-semibold text-[var(--color-muted)] max-w-sm mx-auto leading-relaxed">
                          Need minor electrician, plumber, AC servicing or salon bookings? Get standard slot confirmations instantly.
                        </p>
                        <button
                          onClick={() => navigate("/search?mode=quick")}
                          className="mt-6 px-5 py-2.5 bg-[var(--color-primary)] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[var(--color-primary)]/90 active:scale-95 transition-all shadow-sm"
                        >
                          Find Handyman Services
                        </button>
                      </div>
                    ) : (
                      quickBookings.map((qb) => (
                        <motion.div key={qb.id} variants={fadeUp} className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-2xl shadow-card relative overflow-hidden group">

                          {/* Top Row header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)] mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded">
                                  {qb.service_name}
                                </span>
                                <span className="text-[9px] font-semibold text-[var(--color-muted)] uppercase tracking-wider">Ref: {qb.id.slice(0, 8)}</span>
                              </div>
                              <h3 className="text-lg font-extrabold text-[var(--color-heading)] group-hover:text-[var(--color-primary)] transition-all">
                                {qb.contractor_name}
                              </h3>
                            </div>
                            <div className="flex items-center sm:items-end justify-between sm:justify-center gap-3">
                              {getQuickBookingStatusBadge(qb.status)}
                            </div>
                          </div>

                          {/* Body items */}
                          <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <div className="flex items-start gap-3 text-xs">
                                <FiCalendar className="text-[var(--color-primary)] mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Scheduled Visit</p>
                                  <p className="font-bold text-[var(--color-heading)] mt-0.5">
                                    {new Date(qb.scheduled_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3 text-xs">
                                <FiClock className="text-[var(--color-primary)] mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Selected Time Window</p>
                                  <p className="font-bold text-[var(--color-heading)] mt-0.5 capitalize">{qb.scheduled_time_slot}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3 text-xs">
                                <FiMapPin className="text-[var(--color-primary)] mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Location Address</p>
                                  <p className="font-bold text-[var(--color-heading)] mt-0.5 line-clamp-1">{qb.customer_address}</p>
                                </div>
                              </div>
                            </div>

                            {/* Settlement panel */}
                            <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col justify-between font-semibold">
                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2">Pricing Terms Set</p>
                                <div className="flex justify-between items-baseline mb-1">
                                  <span className="text-xs text-[var(--color-muted)]">Escrow Booking Fee</span>
                                  <span className="text-xs font-bold text-emerald-600 uppercase">Paid (₹30)</span>
                                </div>
                                <div className="flex justify-between items-baseline">
                                  <span className="text-xs text-[var(--color-muted)]">Direct Job Pricing</span>
                                  <span className="text-sm font-extrabold text-[var(--color-heading)]">₹{qb.service_price || "Quoted"}</span>
                                </div>
                              </div>

                              <div className="flex gap-2 mt-4">
                                {qb.contractor_phone && (
                                  <>
                                    <a
                                      href={`tel:${qb.contractor_phone}`}
                                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface)] text-[10px] font-bold uppercase tracking-wider text-[var(--color-heading)] transition-all bg-[var(--color-surface)] shadow-sm"
                                    >
                                      <FiPhone size={12} /> Call
                                    </a>
                                    <a
                                      href={`https://wa.me/91${qb.contractor_phone.replace(/\D/g, "")}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-[10px] font-bold uppercase tracking-wider text-emerald-600 transition-all border border-emerald-500/20"
                                    >
                                      <FiMessageCircle size={12} /> WhatsApp
                                    </a>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Completing reviews option */}
                          {qb.status === "COMPLETED" && !qb.rating && (
                            <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex justify-end">
                              <button
                                onClick={() => setReviewingBooking(qb)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-primary)] text-white font-bold text-[10px] uppercase tracking-wider rounded-lg hover:bg-[var(--color-primary)]/90 transition-all active:scale-95 shadow-sm"
                              >
                                <FiStar size={12} /> Leave Review
                              </button>
                            </div>
                          )}

                          {qb.rating && (
                            <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex items-center gap-2 text-xs font-semibold text-[var(--color-body)]">
                              <FiStar className="text-amber-500 fill-amber-500 shrink-0" size={13} />
                              <span>You rated {qb.rating}/5 ·</span>
                              <span className="text-[var(--color-muted)] italic">"{qb.review_text}"</span>
                            </div>
                          )}

                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}

                {/* TAB 2: CONSULTATION VISITS */}
                {activeTab === "meetings" && (
                  <motion.div key="meetings" initial="hidden" animate="show" exit="hidden" variants={stagger} className="space-y-5">
                    {meetings.length === 0 ? (
                      <div className="text-center py-16 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 shadow-card">
                        <div className="w-12 h-12 bg-[var(--color-primary)]/10 rounded-xl flex items-center justify-center mx-auto mb-5 text-[var(--color-primary)]">
                          <FiCalendar size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--color-heading)]">No Consultation Visits</h3>
                        <p className="mt-2 text-xs font-semibold text-[var(--color-muted)] max-w-sm mx-auto leading-relaxed">
                          Want an upfront face-to-face site estimate before launching a big project? Book an in-person meeting.
                        </p>
                        <button
                          onClick={() => navigate("/search")}
                          className="mt-6 px-5 py-2.5 bg-[var(--color-primary)] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[var(--color-primary)]/90 active:scale-95 transition-all shadow-sm"
                        >
                          Find Contractor Profiles
                        </button>
                      </div>
                    ) : (
                      meetings.map((m) => (
                        <motion.div key={m.id} variants={fadeUp} className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-2xl shadow-card relative overflow-hidden group">

                          {/* Top Row header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)] mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded">
                                  {m.meeting_type?.replace("_", " ") || "In-Person Visit"}
                                </span>
                                <span className="text-[9px] font-semibold text-[var(--color-muted)] uppercase tracking-wider">REF: {m.id.slice(0, 8)}</span>
                              </div>
                              <h3 className="text-lg font-extrabold text-[var(--color-heading)] group-hover:text-[var(--color-primary)] transition-all">
                                {m.contractor_name}
                              </h3>
                            </div>
                            <div className="flex items-center sm:items-end justify-between sm:justify-center gap-3">
                              {getMeetingStatusBadge(m.status)}
                            </div>
                          </div>

                          {/* Details */}
                          <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <div className="flex items-start gap-3 text-xs">
                                <FiCalendar className="text-[var(--color-primary)] mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Proposed Visit Date</p>
                                  <p className="font-bold text-[var(--color-heading)] mt-0.5">
                                    {new Date(m.proposed_date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3 text-xs">
                                <FiClock className="text-[var(--color-primary)] mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Time Window</p>
                                  <p className="font-bold text-[var(--color-heading)] mt-0.5 capitalize">{m.proposed_time_slot}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3 text-xs">
                                <FiMapPin className="text-[var(--color-primary)] mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Meeting Location</p>
                                  <p className="font-bold text-[var(--color-heading)] mt-0.5 line-clamp-1">{m.proposed_location}</p>
                                </div>
                              </div>
                            </div>

                            <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col justify-between font-semibold">
                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2">Notes & Context</p>
                                <p className="text-xs text-[var(--color-body)] italic">
                                  "{m.customer_note || "No specific note provided."}"
                                </p>
                                {m.contractor_note && (
                                  <div className="mt-3 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/10 p-2.5 rounded-lg text-[11px]">
                                    <span className="font-bold text-[var(--color-primary)] uppercase tracking-wider block mb-0.5">Contractor Response</span>
                                    <p className="text-[var(--color-heading)] font-semibold">"{m.contractor_note}"</p>
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-2 mt-4">
                                {m.contractor_phone && (
                                  <a
                                    href={`tel:${m.contractor_phone}`}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface)] text-[10px] font-bold uppercase tracking-wider text-[var(--color-heading)] bg-[var(--color-surface)] shadow-sm transition-all"
                                  >
                                    <FiPhone size={12} /> Call
                                  </a>
                                )}
                                {m.status !== "DECLINED" && m.status !== "ACCEPTED" && (
                                  <button
                                    onClick={() => setReschedulingMeeting(m)}
                                    className="flex-1 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm"
                                  >
                                    Reschedule
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}

                {/* TAB 3: SAAS MILESTONE PROJECTS */}
                {activeTab === "projects" && (
                  <motion.div key="projects" initial="hidden" animate="show" exit="hidden" variants={stagger} className="space-y-5">
                    {projects.length === 0 ? (
                      <div className="text-center py-16 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 shadow-card">
                        <div className="w-12 h-12 bg-[var(--color-primary)]/10 rounded-xl flex items-center justify-center mx-auto mb-5 text-[var(--color-primary)]">
                          <FiBriefcase size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--color-heading)]">No Active Projects</h3>
                        <p className="mt-2 text-xs font-semibold text-[var(--color-muted)] max-w-sm mx-auto leading-relaxed">
                          Your major construction, masonry, or interior project boards will show up here once initiated by your contractor.
                        </p>
                        <button
                          onClick={() => navigate("/search")}
                          className="mt-6 px-5 py-2.5 bg-[var(--color-primary)] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[var(--color-primary)]/90 active:scale-95 transition-all shadow-sm"
                        >
                          Find Contractors
                        </button>
                      </div>
                    ) : (
                      projects.map((proj) => (
                        <motion.div key={proj.id} variants={fadeUp} className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-2xl shadow-card relative overflow-hidden group">

                          {/* Top Row header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)] mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded">
                                  Milestone Project Board
                                </span>
                                <span className="text-[9px] font-semibold text-[var(--color-muted)] uppercase tracking-wider">ID: {proj.id.slice(0, 8)}</span>
                              </div>
                              <h3 className="text-lg font-extrabold text-[var(--color-heading)] group-hover:text-[var(--color-primary)] transition-all">
                                {proj.title}
                              </h3>
                              <p className="text-xs text-[var(--color-muted)] font-semibold mt-0.5">Lead Thekedaar: {proj.contractor_name}</p>
                            </div>

                            <div className="flex flex-col items-end">
                              <span className="text-base font-extrabold text-[var(--color-heading)]">₹{Number(proj.estimated_budget || 0).toLocaleString()}</span>
                              <span className="text-[9px] font-bold text-[var(--color-muted)] uppercase tracking-wider mt-0.5">Budget</span>
                            </div>
                          </div>

                          {/* Body items */}
                          <div className="grid sm:grid-cols-2 gap-6 items-center">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2">Project Brief</p>
                              <p className="text-xs text-[var(--color-body)] leading-relaxed font-semibold">
                                {proj.description || "No project description logged."}
                              </p>

                              <div className="mt-4 grid grid-cols-2 gap-4 text-xs font-semibold">
                                <div>
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Start Date</span>
                                  <p className="text-[var(--color-heading)] mt-0.5">{proj.start_date ? new Date(proj.start_date).toLocaleDateString() : "Pending"}</p>
                                </div>
                                <div>
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Expected End</span>
                                  <p className="text-[var(--color-heading)] mt-0.5">{proj.expected_end_date ? new Date(proj.expected_end_date).toLocaleDateString() : "Pending"}</p>
                                </div>
                              </div>
                            </div>

                            {/* Progress bar panel */}
                            <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl p-5 flex flex-col justify-between h-full font-semibold">
                              <div>
                                <div className="flex justify-between items-baseline mb-2">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)]">System Escrow</span>
                                  <span className="text-[10px] font-bold text-[var(--color-heading)]">{proj.escrow_opted ? "OPTED IN" : "NO ESCROW"}</span>
                                </div>

                                <div className="w-full bg-[var(--color-border)] h-2 rounded-full overflow-hidden mb-2 mt-4">
                                  <div className="bg-[var(--color-primary)] h-full rounded-full" style={{ width: proj.status === 'COMPLETED' ? '100%' : '35%' }} />
                                </div>
                                <div className="flex justify-between text-[10px] text-[var(--color-muted)] font-bold uppercase tracking-wider">
                                  <span>Gantt Progress</span>
                                  <span>{proj.status || "In Progress"}</span>
                                </div>
                              </div>

                              <button
                                onClick={() => navigate(`/project/${proj.id}`)}
                                className="mt-6 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95"
                              >
                                View Gantt Dashboard <FiExternalLink size={12} />
                              </button>
                            </div>
                          </div>

                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}

                {/* TAB 4: DISPUTE MEDIATION TICKETS */}
                {activeTab === "disputes" && (
                  <motion.div key="disputes" initial="hidden" animate="show" exit="hidden" variants={stagger} className="space-y-5">
                    {disputes.length === 0 ? (
                      <div className="text-center py-16 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 shadow-card">
                        <div className="w-12 h-12 bg-[var(--color-primary)]/10 rounded-xl flex items-center justify-center mx-auto mb-5 text-[var(--color-primary)]">
                          <FiAlertTriangle size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--color-heading)]">No Dispute Tickets</h3>
                        <p className="mt-2 text-xs font-semibold text-[var(--color-muted)] max-w-sm mx-auto leading-relaxed">
                          Mediation services are completely free. If you have active dispute issues with quality or payments, raise a desk case.
                        </p>
                      </div>
                    ) : (
                      disputes.map((d) => (
                        <motion.div key={d.id} variants={fadeUp} className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-2xl shadow-card relative overflow-hidden group">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600 bg-rose-500/10 px-2.5 py-0.5 rounded">
                                {d.reason}
                              </span>
                              <h4 className="text-sm font-extrabold text-[var(--color-heading)] mt-2">
                                Booking Ref ID: {d.booking_ref_id}
                              </h4>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              d.status === "RESOLVED"
                                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse"
                            }`}>
                              {d.status}
                            </span>
                          </div>

                          <p className="text-xs text-[var(--color-body)] font-semibold leading-relaxed">
                            {d.description}
                          </p>

                          {d.resolution_note && (
                            <div className="mt-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-xs text-[var(--color-heading)]">
                              <span className="font-bold text-emerald-600 uppercase tracking-wider block mb-1">Resolution Summary</span>
                              <p className="font-semibold">"{d.resolution_note}"</p>
                            </div>
                          )}
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            )}

          </div>

        </div>

      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewingBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full bg-[var(--color-surface)] border border-[var(--color-border)] p-6 md:p-8 rounded-2xl shadow-2xl space-y-6 text-[var(--color-heading)]"
            >
              <div>
                <h3 className="text-lg font-extrabold tracking-tight flex items-center gap-2 text-[var(--color-primary)]">
                  <FiStar /> Rate Service Work
                </h3>
                <p className="mt-1 text-xs text-[var(--color-muted)] font-semibold">Share your feedback to help others select high-trust contractors.</p>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Star Rating</span>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="text-2xl transition-transform hover:scale-110 active:scale-95"
                      >
                        <FiStar className={star <= reviewRating ? "text-amber-500 fill-amber-500 shrink-0" : "text-[var(--color-border)] shrink-0"} />
                      </button>
                    ))}
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Comments</span>
                  <textarea
                    rows="3"
                    required
                    className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-sm font-semibold text-[var(--color-heading)] outline-none resize-none focus:border-[var(--color-primary)]"
                    placeholder="Describe promptness, cleanliness, and expertise..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                  />
                </label>

                <div className="flex gap-3 pt-4 font-semibold">
                  <button
                    type="button"
                    onClick={() => setReviewingBooking(null)}
                    className="flex-1 py-2.5 rounded-lg border border-[var(--color-border)] text-xs font-bold uppercase tracking-wider text-[var(--color-heading)] bg-[var(--color-surface)] hover:bg-[var(--color-bg-elevated)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reviewLoading}
                    className="flex-1 py-2.5 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-xs font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5"
                  >
                    {reviewLoading ? <LoadingSpinner size="xs" /> : <FiCheckCircle />}
                    Submit Review
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reschedule Modal */}
      <AnimatePresence>
        {reschedulingMeeting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full bg-[var(--color-surface)] border border-[var(--color-border)] p-6 md:p-8 rounded-2xl shadow-2xl space-y-6 text-[var(--color-heading)]"
            >
              <div>
                <h3 className="text-lg font-extrabold tracking-tight flex items-center gap-2 text-[var(--color-primary)]">
                  <FiCalendar /> Reschedule Visit
                </h3>
                <p className="mt-1 text-xs text-[var(--color-muted)] font-semibold">Propose a new visit date and time slot to the contractor.</p>
              </div>

              <form onSubmit={handleRescheduleSubmit} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">New Date</span>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-sm font-semibold text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)]"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">New Time Window</span>
                  <select
                    className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-sm font-semibold text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)]"
                    value={newSlot}
                    onChange={(e) => setNewSlot(e.target.value)}
                  >
                    <option value="morning">Morning (8 AM – 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM – 5 PM)</option>
                    <option value="evening">Evening (5 PM – 9 PM)</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Short Note</span>
                  <textarea
                    rows="2"
                    className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-sm font-semibold text-[var(--color-heading)] outline-none resize-none focus:border-[var(--color-primary)]"
                    placeholder="e.g. Rescheduling due to sudden change in my travel plans..."
                    value={rescheduleNote}
                    onChange={(e) => setRescheduleNote(e.target.value)}
                  />
                </label>

                <div className="flex gap-3 pt-4 font-semibold">
                  <button
                    type="button"
                    onClick={() => setReschedulingMeeting(null)}
                    className="flex-1 py-2.5 rounded-lg border border-[var(--color-border)] text-xs font-bold uppercase tracking-wider text-[var(--color-heading)] bg-[var(--color-surface)] hover:bg-[var(--color-bg-elevated)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={rescheduleLoading}
                    className="flex-1 py-2.5 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-xs font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5"
                  >
                    {rescheduleLoading ? <LoadingSpinner size="xs" /> : <FiCheckCircle />}
                    Request Reschedule
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}
