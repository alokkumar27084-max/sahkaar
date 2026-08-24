import React, { useState, useEffect } from "react";
import { adminAPI } from "../../../services/api";
import toast from "react-hot-toast";
import {
  FiShoppingBag,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiMapPin,
  FiPhone,
  FiShield,
  FiDollarSign,
  FiCalendar,
  FiRefreshCw
} from "react-icons/fi";

export default function BookingsEscrowPanel() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAllBookings();
      setBookings(res.data?.bookings || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load platform bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status, bookingType) => {
    try {
      await adminAPI.updateBookingStatus(id, status, bookingType);
      toast.success(`Booking status changed to ${status}`);
      loadBookings();
      if (selectedBooking?.id === id) {
        setSelectedBooking((prev) => ({ ...prev, status }));
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const filtered = bookings.filter((b) => {
    const text = `${b.customer_name} ${b.customer_phone} ${b.contractor_name} ${b.service_name} ${b.customer_address} ${b.society_name}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status?.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <FiShoppingBag className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Nationwide Bookings & Escrow Command Center
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time audit, status override, and payment tracking for all citizen service requests across all federations.
          </p>
        </div>

        <button
          type="button"
          onClick={loadBookings}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <FiRefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by Customer, Master, Locality, Service or Society..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium focus:border-indigo-500 outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold"
        >
          <option value="all">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Bookings Table / Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="p-4">Customer & Service</th>
                <th className="p-4">Assigned Master</th>
                <th className="p-4">Jurisdictional Society</th>
                <th className="p-4">Schedule & Amount</th>
                <th className="p-4">Payment & Order</th>
                <th className="p-4">Status & Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  {/* Customer */}
                  <td className="p-4 space-y-1">
                    <span className="font-extrabold text-slate-900 dark:text-white block">
                      {b.customer_name || "Customer"}
                    </span>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <FiPhone className="w-3 h-3 text-slate-400" />
                      <span>{b.customer_phone || "N/A"}</span>
                    </p>
                    <span className="inline-block text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
                      🛠️ {b.service_name || "Standard Inspection"}
                    </span>
                  </td>

                  {/* Master */}
                  <td className="p-4 space-y-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      {b.contractor_name || "Artisan"}
                    </span>
                    <p className="text-[11px] text-slate-500">📞 {b.contractor_phone || "N/A"}</p>
                    <p className="text-[10px] text-slate-400 truncate max-w-[150px]">
                      📍 {b.customer_address || "Service Address"}
                    </p>
                  </td>

                  {/* Society */}
                  <td className="p-4 space-y-0.5">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block">
                      {b.society_name || "Bhopal Labour Society"}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {b.federation_name || "State Federation"}
                    </span>
                  </td>

                  {/* Schedule & Amount */}
                  <td className="p-4 space-y-1">
                    <span className="font-black text-sm text-slate-900 dark:text-white block">
                      ₹{b.amount || 450}
                    </span>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <FiCalendar className="w-3 h-3 text-slate-400" />
                      <span>{b.scheduled_date || "Today"}</span>
                    </p>
                  </td>

                  {/* Payment */}
                  <td className="p-4 space-y-1">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-block ${
                        b.booking_fee_status === "PAID"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {b.booking_fee_status || "PAID"}
                    </span>
                    {b.booking_fee_order_id && (
                      <span className="text-[9px] text-slate-400 block font-mono">
                        {b.booking_fee_order_id.slice(0, 14)}...
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <select
                        value={b.status || "PENDING"}
                        onChange={(e) => handleUpdateStatus(b.id, e.target.value, b.booking_type)}
                        className={`text-[11px] font-black rounded-lg px-2 py-1 border cursor-pointer ${
                          b.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : b.status === "CONFIRMED"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-300"
                            : b.status === "CANCELLED"
                            ? "bg-red-50 text-red-700 border-red-300"
                            : "bg-amber-50 text-amber-700 border-amber-300"
                        }`}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && !loading && (
            <div className="text-center py-12 text-slate-400 text-xs font-bold">
              No matching bookings found on the platform.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
