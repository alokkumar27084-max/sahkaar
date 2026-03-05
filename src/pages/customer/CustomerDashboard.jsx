import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiCheckCircle, FiClock, FiMapPin, FiBriefcase, FiXCircle } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { bookingAPI } from "../../services/api";
import toast from "react-hot-toast";

export default function CustomerDashboard() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const res = await bookingAPI.getMyBookings();
            setBookings(res.data.data.bookings || []);
        } catch (err) {
            toast.error("Failed to load your bookings");
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
