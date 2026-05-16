import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiBell, FiCheckCircle, FiClock, FiMapPin, FiBriefcase, FiArrowRight, FiSettings, FiStar } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { bookingAPI, notificationAPI, servicesAPI } from "../../services/api";
import toast from "react-hot-toast";

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };

export default function CustomerDashboard() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [requests, setRequests] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const [bookingsRes, requestsRes, notificationsRes] = await Promise.all([
                bookingAPI.getMyBookings(),
                servicesAPI.getMyRequests(),
                notificationAPI.getMine(),
            ]);
            setBookings(bookingsRes.data.data.bookings || []);
            setRequests(requestsRes.data.requests || []);
            setNotifications(notificationsRes.data.notifications || []);
        } catch (err) {
            toast.error("Failed to load your dashboard");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkComplete = async (bookingId) => {
        try {
            await bookingAPI.completeBooking(bookingId);
            toast.success("Job marked as complete. Funds released!");
            fetchBookings();
        } catch (err) {
            toast.error("Failed to mark complete.");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "COMPLETED": return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>Completed</span>;
            case "IN_PROGRESS": return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse"></span>In Progress</span>;
            case "CANCELLED": return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>Cancelled</span>;
            default: return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Pending</span>;
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <main className="bg-[var(--color-bg)] min-h-screen pt-24 pb-20 overflow-hidden">
            <div className="max-w-[1200px] mx-auto px-4 md:px-8">
                
                {/* Premium Header Area */}
                <motion.div initial="hidden" animate="show" variants={fadeUp} className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                    <div>
                        <span className="text-[var(--color-primary)] font-bold tracking-[0.2em] uppercase text-xs mb-2 block">Dashboard Overview</span>
                        <h1 className="font-display text-4xl md:text-5xl font-extrabold text-[var(--color-heading)] tracking-tight">
                            Welcome Back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500">{user?.name?.split(' ')[0]}</span>
                        </h1>
                        <p className="text-[var(--color-muted)] mt-2 font-medium">Manage your bookings, requests, and notifications.</p>
                    </div>
                </motion.div>

                {/* Summary Stats */}
                {!loading && (
                    <motion.div initial="hidden" animate="show" variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                        {[
                            { label: "Total Bookings", value: bookings.length, color: "indigo" },
                            { label: "Active", value: bookings.filter(b => b.status === "IN_PROGRESS").length, color: "cyan" },
                            { label: "Completed", value: bookings.filter(b => b.status === "COMPLETED").length, color: "emerald" },
                            { label: "Pending", value: bookings.filter(b => !['COMPLETED', 'IN_PROGRESS', 'CANCELLED'].includes(b.status)).length, color: "amber" },
                        ].map((stat, i) => (
                            <motion.div key={stat.label} variants={fadeUp}
                                className="glass-card p-4 md:p-5 text-center"
                            >
                                <p className={`font-display text-2xl font-bold text-${stat.color}-500 leading-none`}>{stat.value}</p>
                                <p className="text-[11px] text-[var(--color-muted)] mt-1.5 font-semibold uppercase tracking-wider">{stat.label}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                <div className="grid lg:grid-cols-[320px_1fr] gap-8 relative z-10">
                    
                    {/* LEFT COLUMN: Profile Sidebar & Notifications */}
                    <div className="space-y-6">
                        {/* Profile Identity Card */}
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 md:p-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 blur-[40px] -mr-10 -mt-10 rounded-full"></div>
                            
                            <div className="flex items-center gap-5 mb-8 relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-white flex items-center justify-center text-2xl font-black shadow-glow">
                                    {user?.name?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="font-display font-bold text-xl text-[var(--color-heading)] leading-tight">{user?.name}</h2>
                                    <p className="text-sm text-[var(--color-muted)] font-medium mt-1">{user?.phone}</p>
                                </div>
                            </div>

                            <nav className="space-y-2 border-t border-[var(--color-border)] pt-6 relative z-10">
                                <Link to="/search" className="flex items-center justify-between px-4 py-3 text-[var(--color-heading)] font-semibold rounded-xl hover:bg-[var(--color-border)] transition-colors group/link">
                                    <span className="flex items-center gap-3"><FiStar className="text-amber-500" /> New Booking</span>
                                    <FiArrowRight className="opacity-0 group-hover/link:opacity-100 transition-opacity text-[var(--color-muted)]" />
                                </Link>
                                <button className="w-full flex items-center justify-between px-4 py-3 text-[var(--color-primary)] font-semibold rounded-xl bg-[var(--color-primary)]/10 transition-colors">
                                    <span className="flex items-center gap-3"><FiBriefcase /> Dashboard</span>
                                </button>
                                <button className="w-full flex items-center justify-between px-4 py-3 text-[var(--color-muted)] font-semibold rounded-xl hover:bg-[var(--color-border)] hover:text-[var(--color-heading)] transition-colors">
                                    <span className="flex items-center gap-3"><FiSettings /> Account Settings</span>
                                </button>
                            </nav>
                        </motion.div>

                        {/* Notifications Module */}
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 md:p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-display text-lg font-bold text-[var(--color-heading)] flex items-center gap-2">
                                    <FiBell className="text-[var(--color-primary)]" /> Updates
                                    {unreadCount > 0 && <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">{unreadCount}</span>}
                                </h3>
                                {unreadCount > 0 && (
                                    <button onClick={async () => {
                                        await notificationAPI.markAllRead();
                                        setNotifications(prev => prev.map(item => ({ ...item, is_read: true })));
                                    }} className="text-xs font-semibold text-[var(--color-primary)] hover:underline">
                                        Mark Read
                                    </button>
                                )}
                            </div>

                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2].map(i => <div key={i} className="skeleton h-16 w-full rounded-xl" />)}
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="py-8 text-center border border-dashed border-[var(--color-border)] rounded-xl bg-[var(--color-bg)]/50">
                                    <p className="text-[var(--color-muted)] text-sm font-medium">No new updates.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <AnimatePresence>
                                        {notifications.slice(0, 4).map((item) => (
                                            <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                                className={`p-3.5 rounded-xl border transition-colors ${item.is_read ? "border-[var(--color-border)] bg-[var(--color-surface)]/50" : "border-indigo-500/30 bg-indigo-500/5 shadow-sm"}`}
                                            >
                                                <p className="text-sm font-medium text-[var(--color-heading)] leading-snug">{item.message}</p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] opacity-70">
                                                        {new Date(item.created_at).toLocaleDateString()}
                                                    </span>
                                                    {!item.is_read && (
                                                        <button onClick={async () => {
                                                            await notificationAPI.markRead(item.id);
                                                            setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
                                                        }} className="text-[10px] font-bold text-[var(--color-primary)] uppercase">
                                                            Acknowledge
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* RIGHT COLUMN: Bookings & Requests */}
                    <div className="space-y-8">

                        {/* Recent Service Requests (Small cards) */}
                        <motion.section initial="hidden" animate="show" variants={stagger}>
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="font-display text-2xl font-bold text-[var(--color-heading)] tracking-tight">Recent Requests</h2>
                                <Link to="/search" className="text-sm font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] flex items-center gap-1 transition-colors">
                                    Book New <FiArrowRight size={14} />
                                </Link>
                            </div>

                            {loading ? (
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {[1, 2].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
                                </div>
                            ) : requests.length === 0 ? (
                                <div className="glass-card p-10 text-center flex flex-col items-center justify-center border-dashed">
                                    <div className="w-12 h-12 rounded-full bg-[var(--color-border)] flex items-center justify-center mb-4"><FiClock className="text-[var(--color-muted)]" size={20} /></div>
                                    <p className="text-[var(--color-heading)] font-semibold mb-1">No service requests</p>
                                    <p className="text-[var(--color-muted)] text-sm mb-4">Request services from premium contractors.</p>
                                </div>
                            ) : (
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {requests.slice(0, 4).map((request) => (
                                        <div key={request.id} className="glass-card p-5 group hover:border-[var(--color-primary)]/40 transition-colors">
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="font-bold text-[var(--color-heading)] text-base">{request.service_name || request.category_name || "Service"}</h3>
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                                    request.status === "completed" ? "bg-emerald-500/10 text-emerald-600"
                                                    : request.status === "confirmed" ? "bg-indigo-500/10 text-indigo-600"
                                                    : request.status === "cancelled" ? "bg-rose-500/10 text-rose-600"
                                                    : "bg-amber-500/10 text-amber-600"
                                                }`}>
                                                    {request.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-[var(--color-muted)] flex items-start gap-1.5 line-clamp-1 mb-2">
                                                <FiMapPin className="shrink-0 mt-0.5" /> {request.customer_address || "No address"}
                                            </p>
                                            <div className="text-xs font-medium text-[var(--color-body)] bg-[var(--color-bg)] inline-flex px-2 py-1 rounded border border-[var(--color-border)]">
                                                By: {request.preferred_date || "Anytime"}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.section>

                        {/* Major Bookings */}
                        <motion.section initial="hidden" animate="show" variants={stagger}>
                            <h2 className="font-display text-2xl font-bold text-[var(--color-heading)] tracking-tight mb-5">Contractor Bookings</h2>
                            
                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}
                                </div>
                            ) : bookings.length === 0 ? (
                                <div className="glass-card p-12 text-center flex flex-col items-center justify-center border-dashed">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 flex items-center justify-center mb-5"><FiBriefcase className="text-[var(--color-primary)]" size={28} /></div>
                                    <h3 className="text-xl font-display font-bold text-[var(--color-heading)] mb-2">No active bookings</h3>
                                    <p className="text-[var(--color-muted)] text-base max-w-sm mb-6">Connect with premium verified contractors and book them securely through Escrow.</p>
                                    <Link to="/search" className="btn-primary px-8">Find Contractors</Link>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {bookings.map((booking) => (
                                        <motion.div key={booking.id} variants={fadeUp} className="glass-card p-0 overflow-hidden group">
                                            {/* Header */}
                                            <div className="bg-gradient-to-r from-[var(--color-surface)] to-[var(--color-bg)] p-6 border-b border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                                                            Macro Project
                                                        </span>
                                                        <span className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider">
                                                            ID: #{booking.id.slice(0,8)}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-xl font-display font-bold text-[var(--color-heading)]">{booking.contractor_name}</h3>
                                                    <p className="text-sm text-[var(--color-muted)] font-medium mt-0.5">{booking.service_category?.replace('_', ' ')}</p>
                                                </div>
                                                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                                                    <p className="text-2xl font-black text-[var(--color-heading)]">₹{Number(booking.amount).toLocaleString('en-IN')}</p>
                                                    {getStatusBadge(booking.status)}
                                                </div>
                                            </div>

                                            {/* Body */}
                                            <div className="p-6">
                                                <div className="grid sm:grid-cols-2 gap-6 mb-6">
                                                    <div className="space-y-3">
                                                        <div className="flex items-start gap-2.5">
                                                            <div className="w-8 h-8 rounded-full bg-[var(--color-bg)] flex items-center justify-center shrink-0 border border-[var(--color-border)]">
                                                                <FiMapPin className="text-[var(--color-muted)]" size={14} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-0.5">Location</p>
                                                                <p className="text-sm font-medium text-[var(--color-body)]">{booking.location_address || "Not specified"}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-2.5">
                                                            <div className="w-8 h-8 rounded-full bg-[var(--color-bg)] flex items-center justify-center shrink-0 border border-[var(--color-border)]">
                                                                <FiClock className="text-[var(--color-muted)]" size={14} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-0.5">Date Created</p>
                                                                <p className="text-sm font-medium text-[var(--color-body)]">{new Date(booking.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="bg-[var(--color-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                                                        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3">Payment details</p>
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-sm text-[var(--color-body)] font-medium">Plan</span>
                                                            <span className="text-sm text-[var(--color-heading)] font-semibold capitalize">{String(booking.payment_plan || "").replace(/_/g, " ")}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-[var(--color-body)] font-medium">Status</span>
                                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                                booking.payment_status === "CAPTURED" || booking.payment_status === "RELEASED" || booking.payment_status === "IN_ESCROW"
                                                                    ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                                                            }`}>
                                                                {booking.payment_status?.replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {booking.milestone_details && booking.milestone_details.length > 0 && (
                                                    <div className="mb-6 bg-[var(--color-bg)]/30 rounded-xl p-4 border border-[var(--color-border)]">
                                                        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3 flex items-center gap-2">
                                                            <FiCheckCircle className="text-indigo-500" /> Milestone Breakdown
                                                        </p>
                                                        <div className="space-y-2">
                                                            {booking.milestone_details.map((m, idx) => (
                                                                <div key={idx} className="flex justify-between items-center text-xs">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className={`w-2 h-2 rounded-full ${m.status === 'due_now' ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                                                        <span className="text-[var(--color-body)] font-medium">{m.title} ({m.percentage}%)</span>
                                                                    </div>
                                                                    <span className="font-bold text-[var(--color-heading)]">₹{Number(m.amount).toLocaleString('en-IN')}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {booking.status === "IN_PROGRESS" && (
                                                    <div className="flex justify-end pt-4 border-t border-[var(--color-border)]">
                                                        <button onClick={() => handleMarkComplete(booking.id)} className="btn-primary shadow-glow hover:scale-105 transition-transform">
                                                            <FiCheckCircle size={16} /> Mark Project Complete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.section>

                    </div>
                </div>
            </div>
        </main>
    );
}
