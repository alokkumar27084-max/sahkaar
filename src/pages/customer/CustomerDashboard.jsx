import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiBell, FiCheckCircle, FiClock, FiMapPin, FiBriefcase } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { bookingAPI, notificationAPI, servicesAPI } from "../../services/api";
import toast from "react-hot-toast";

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
            case "COMPLETED": return <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase">Completed</span>;
            case "IN_PROGRESS": return <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold uppercase">In Progress</span>;
            case "CANCELLED": return <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-bold uppercase">Cancelled</span>;
            default: return <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold uppercase">Pending</span>;
        }
    };

    return (
        <div className="bg-[var(--color-bg)] min-h-screen pt-20 pb-10 px-4 md:px-6">
            <div className="max-w-[1200px] mx-auto">
                <h1 className="font-display text-3xl font-extrabold text-[var(--color-heading)] uppercase tracking-tight mb-8">My Dashboard</h1>

                <div className="grid md:grid-cols-4 gap-6">
                    {/* Sidebar */}
                    <div className="glass-card p-6 h-fit md:col-span-1">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-white flex items-center justify-center text-xl font-bold mb-4">
                            {user?.name?.[0]?.toUpperCase()}
                        </div>
                        <h2 className="font-semibold text-[var(--color-heading)]">{user?.name}</h2>
                        <p className="text-sm text-[var(--color-muted)] mb-6">{user?.phone}</p>

                        <nav className="space-y-2 border-t border-[var(--color-border)] pt-4">
                            <span className="flex items-center gap-3 px-3 py-2 text-[var(--color-primary)] font-medium rounded-lg bg-[var(--color-primary)]/10">
                                <FiBriefcase /> My Bookings
                            </span>
                        </nav>
                    </div>

                    {/* Main Content */}
                    <div className="md:col-span-3 space-y-6">
                        <div className="glass-card p-6 rounded-2xl">
                            <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <FiBell className="text-[var(--color-primary)]" />
                                    <div>
                                        <h2 className="text-xl font-extrabold text-[var(--color-heading)] uppercase tracking-tight">Recent Updates</h2>
                                        <p className="text-sm text-[var(--color-muted)] mt-1">Stay on top of booking, payment, and service activity.</p>
                                    </div>
                                </div>
                                {notifications.some((item) => !item.is_read) && (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            await notificationAPI.markAllRead();
                                            setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
                                        }}
                                        className="btn-secondary text-xs"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>

                            {loading ? (
                                <div className="p-4 text-sm text-[var(--color-muted)]">Loading updates...</div>
                            ) : notifications.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-[var(--color-border)] p-6 text-center">
                                    <p className="text-[var(--color-body)]">No notifications yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {notifications.slice(0, 5).map((item) => (
                                        <div
                                            key={item.id}
                                            className={`rounded-xl border p-4 ${item.is_read ? "border-[var(--color-border)] bg-[var(--color-surface)]" : "border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5"}`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-medium text-[var(--color-heading)]">{item.message}</p>
                                                    <p className="mt-1 text-xs uppercase tracking-wide text-[var(--color-muted)]">
                                                        {item.type || "update"} · {new Date(item.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                                {!item.is_read && (
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            await notificationAPI.markRead(item.id);
                                                            setNotifications((prev) => prev.map((n) => n.id === item.id ? { ...n, is_read: true } : n));
                                                        }}
                                                        className="text-xs font-semibold text-[var(--color-primary)]"
                                                    >
                                                        Mark read
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="glass-card p-6 rounded-2xl">
                            <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4 mb-4">
                                <div>
                                    <h2 className="text-xl font-extrabold text-[var(--color-heading)] uppercase tracking-tight">Quick Service Requests</h2>
                                    <p className="text-sm text-[var(--color-muted)] mt-1">Track your Chhota Kaam requests and confirmations.</p>
                                </div>
                                <Link to="/quick-services" className="btn-secondary text-sm">
                                    Explore Quick Services
                                </Link>
                            </div>

                            {loading ? (
                                <div className="p-4 text-sm text-[var(--color-muted)]">Loading requests...</div>
                            ) : requests.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-[var(--color-border)] p-6 text-center">
                                    <p className="text-[var(--color-body)]">You have not submitted any quick service requests yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {requests.slice(0, 5).map((request) => (
                                        <div key={request.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-[var(--color-heading)]">
                                                        {request.service_name || request.category_name || "Service Request"}
                                                    </h3>
                                                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                                                        {request.customer_address || "Address not added"}
                                                    </p>
                                                    {(request.preferred_date || request.preferred_time) && (
                                                        <p className="mt-2 text-xs text-[var(--color-muted)]">
                                                            Preferred: {request.preferred_date || "Flexible"} {request.preferred_time ? `· ${request.preferred_time}` : ""}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                                    request.status === "completed"
                                                        ? "bg-emerald-500/10 text-emerald-500"
                                                        : request.status === "confirmed"
                                                            ? "bg-blue-500/10 text-blue-500"
                                                            : request.status === "cancelled"
                                                                ? "bg-red-500/10 text-red-500"
                                                                : "bg-amber-500/10 text-amber-500"
                                                }`}>
                                                    {request.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <h2 className="text-xl font-extrabold text-[var(--color-heading)] uppercase tracking-tight mb-4">Active & Past Bookings</h2>

                        {loading ? (
                            <div className="p-10 text-center text-[var(--color-muted)]">Loading bookings...</div>
                        ) : bookings.length === 0 ? (
                            <div className="glass-card p-10 text-center">
                                <FiBriefcase className="mx-auto w-12 h-12 text-[var(--color-muted)] mb-4" />
                                <h3 className="text-lg font-semibold text-[var(--color-heading)] mb-2">No bookings yet</h3>
                                <p className="text-[var(--color-body)] mb-6">Find a trusted contractor and book them securely.</p>
                                <Link to="/search" className="btn-primary inline-flex">Explore Services</Link>
                            </div>
                        ) : (
                            bookings.map((booking) => (
                                <div key={booking.id} className="glass-card p-6 rounded-2xl">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[var(--color-border)] pb-4 mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-[var(--color-heading)]">{booking.contractor_name}</h3>
                                            <p className="text-sm text-[var(--color-primary)] font-medium">{booking.service_category}</p>
                                            <p className="mt-1 text-xs uppercase tracking-wide text-[var(--color-muted)]">
                                                {booking.service_tier === "macro" ? "Bada Kaam" : "Chhota Kaam"} · {String(booking.payment_plan || "").replaceAll("_", " ")}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            {getStatusBadge(booking.status)}
                                            <p className="text-xl font-bold text-[var(--color-heading)] mt-2">₹{booking.amount}</p>
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-4 text-sm text-[var(--color-body)]">
                                        <div>
                                            <p className="flex items-center gap-2 mb-2">
                                                <FiMapPin className="text-[var(--color-muted)] shrink-0" /> <span className="truncate">{booking.location_address || "No address"}</span>
                                            </p>
                                            <p className="flex items-center gap-2 text-[var(--color-muted)]">
                                                <FiClock className="text-[var(--color-muted)] shrink-0" /> {new Date(booking.created_at).toLocaleDateString()}
                                            </p>
                                        </div>

                                        <div className="text-right flex flex-col items-end justify-between">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-navy/5 rounded-full text-xs font-medium text-slate-500">
                                                Payment: {booking.payment_status}
                                            </span>
                                            {Array.isArray(booking.milestone_details) && booking.milestone_details.length > 1 && (
                                                <span className="mt-2 text-[11px] text-[var(--color-muted)]">
                                                    {booking.milestone_details.length} milestones protected
                                                </span>
                                            )}

                                            {booking.status === "IN_PROGRESS" && (
                                                <button
                                                    onClick={() => handleMarkComplete(booking.id)}
                                                    className="btn-primary py-2 px-4 mt-3 text-xs"
                                                >
                                                    <FiCheckCircle size={14} className="mr-1" /> Mark Job Complete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
