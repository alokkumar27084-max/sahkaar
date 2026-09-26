import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  contractorAPI,
  bookingAPI,
  quickBookingAPI,
  cooperativeAPI
} from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { getAvatarUrl } from "../../utils/imageUtils";
import toast from "react-hot-toast";
import {
  FiCheckCircle,
  FiShield,
  FiClock,
  FiAlertTriangle,
  FiStar,
  FiMapPin,
  FiCalendar
} from "react-icons/fi";
import { FaWhatsapp, FaPhoneAlt } from "react-icons/fa";
import SEOHead from "../../components/common/SEOHead";

export default function ContractorDashboard() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [dispatchOffers, setDispatchOffers] = useState([]);

  useEffect(() => {
    loadDashboard();

    // Listen for real-time booking push notifications
    const handleRealtimeUpdate = (e) => {
      console.log("Worker dashboard received real-time booking update:", e.detail);
      Promise.all([quickBookingAPI.getContractorBookings(), bookingAPI.getMyBookings()])
        .then(([quickRes, cooperativeRes]) => setBookings([
          ...(quickRes.data?.bookings || []),
          ...(cooperativeRes.data?.bookings || []).map((booking) => ({
            ...booking,
            service_name: booking.service_category,
            service_price: booking.amount,
            customer_address: booking.location_address,
            scheduled_date: booking.scheduled_for,
            status: ({ created: 'PENDING', accepted: 'ACCEPTED', en_route: 'EN_ROUTE', arrived: 'ARRIVED', in_progress: 'IN_PROGRESS' })[booking.workflow_status] || booking.workflow_status.toUpperCase(),
            cooperative_booking: true,
          })),
        ]))
        .catch(() => {});
    };

    window.addEventListener("sahkaar:booking_update", handleRealtimeUpdate);
    window.addEventListener("sahkaari:booking_update", handleRealtimeUpdate);
    return () => {
      window.removeEventListener("sahkaar:booking_update", handleRealtimeUpdate);
      window.removeEventListener("sahkaari:booking_update", handleRealtimeUpdate);
    };
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [profRes, bookRes, offersRes] = await Promise.all([
        contractorAPI.getMyProfile().catch(() => ({ data: { contractor: null } })),
        Promise.all([
          quickBookingAPI.getContractorBookings().catch(() => ({ data: { bookings: [] } })),
          bookingAPI.getMyBookings().catch(() => ({ data: { bookings: [] } })),
        ]),
        cooperativeAPI.getMyDispatchOffers().catch(() => ({ data: { data: [] } })),
      ]);

      if (profRes.data?.contractor) {
        setProfile(profRes.data.contractor);
      }
      const [quickRes, cooperativeRes] = bookRes;
      setBookings([
        ...(quickRes.data?.bookings || []),
        ...(cooperativeRes.data?.bookings || []).map((booking) => ({
          ...booking,
          service_name: booking.service_category,
          service_price: booking.amount,
          customer_address: booking.location_address,
          scheduled_date: booking.scheduled_for,
          status: ({ created: 'PENDING', accepted: 'ACCEPTED', en_route: 'EN_ROUTE', arrived: 'ARRIVED', in_progress: 'IN_PROGRESS' })[booking.workflow_status] || booking.workflow_status.toUpperCase(),
          cooperative_booking: true,
        })),
      ]);
      setDispatchOffers(offersRes.data?.data || []);
    } catch (err) {
      console.error("Dashboard error:", err);
      toast.error("Failed to load worker dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      const current = bookings.find((booking) => booking.id === bookingId);
      if (current?.cooperative_booking) {
      const workflowStatus = {
          CONFIRMED: "accepted",
          EN_ROUTE: "en_route",
          ARRIVED: "arrived",
          IN_PROGRESS: "in_progress",
        }[newStatus] || newStatus.toLowerCase();
        await bookingAPI.updateWorkflowStatus(bookingId, workflowStatus);
      } else {
        await quickBookingAPI.updateStatus(bookingId, newStatus);
      }
      toast.success(`Booking marked as ${newStatus}`);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const isVerified = profile?.is_verified || profile?.verification_status === "verified";
  const isPending = profile?.verification_status === "pending";
  const isRejected = profile?.verification_status === "rejected";

  return (
    <main className="bg-slate-50 min-h-screen py-8 px-4 sm:px-6">
      <SEOHead
        title="सहकार worker dashboard — SahKaar Cooperative Worker Portal"
        description="Manage your verified worker profile, incoming customer bookings, federation verification status, dispatch offers, and welfare records."
      />

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ═══════ WORKER PROFILE OVERVIEW CARD ═══════ */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            <div className="relative shrink-0">
              <img
                src={getAvatarUrl(profile?.photo_url || profile?.image_url)}
                alt={profile?.business_name || user?.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-slate-100 shadow-sm"
              />
              {isVerified && (
                <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-white shadow-sm">
                  <FiCheckCircle className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg">
                  Worker {profile?.category?.replace(/_/g, " ") || "Service"}
                </span>
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg">
                    <FiShield className="w-3.5 h-3.5" /> Cooperative Verified
                  </span>
                ) : isPending ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg">
                    <FiClock className="w-3.5 h-3.5" /> Verification Pending
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-lg">
                    <FiAlertTriangle className="w-3.5 h-3.5" /> Verification Required
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-extrabold text-slate-900">
                {profile?.business_name || user?.name}
              </h1>

              <p className="text-xs text-slate-500">
                {profile?.society_name || "Society pending"} • Member Reg: {profile?.member_registration_no || "Pending"}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link
              to="/contractor/edit"
              className="flex-1 md:flex-initial px-5 py-3 rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-2"
            >
              <FiShield className="w-4 h-4" />
              <span>Update Verification Details</span>
            </Link>
          </div>
        </div>

        {/* ═══════ FEDERATION AUDIT NOTIFICATION BANNER ═══════ */}
        {isPending && (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <FiClock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-amber-900">
                Documents Submitted — Awaiting Cooperative Verification
              </h3>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                Your identity and cooperative membership documents are awaiting review. Skill certificates are checked when provided and are required before your skills can be marked certified.
              </p>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
              <FiAlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-rose-900">
                Verification Action Needed
              </h3>
              <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                {profile?.rejection_reason || "Incomplete documentation submitted. Please re-upload verified credentials."}
              </p>
            </div>
          </div>
        )}

        {dispatchOffers.length > 0 && (
          <section className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h2 className="text-sm font-extrabold text-indigo-950">Federation dispatch offers</h2>
                <p className="text-xs text-indigo-700 mt-1">Verified cooperative capacity requests near your service area.</p>
              </div>
              <span className="px-2 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold">{dispatchOffers.length} open</span>
            </div>
            <div className="space-y-2">
              {dispatchOffers.map((offer) => (
                <div key={offer.id} className="bg-white rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-indigo-100">
                  <div><p className="text-xs font-extrabold text-slate-900">{offer.service_category} · {offer.locality}</p><p className="text-[10px] text-slate-500">{offer.priority === "emergency" ? "Emergency response · respond within 60 seconds" : "Federation capacity request · respond within 24 hours"} · {offer.notes || "Federation request"}</p></div>
                  <div className="flex gap-2"><button onClick={async () => { try { await cooperativeAPI.respondToDispatchOffer(offer.id, "declined"); setDispatchOffers((prev) => prev.filter((item) => item.id !== offer.id)); } catch { toast.error("Offer expired or could not be declined."); loadDashboard(); } }} className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-600">Decline</button><button onClick={async () => { try { await cooperativeAPI.respondToDispatchOffer(offer.id, "accepted"); setDispatchOffers((prev) => prev.filter((item) => item.id !== offer.id)); toast.success("Dispatch accepted. The booking is now assigned to you."); loadDashboard(); } catch { toast.error("Offer expired or could not be accepted."); loadDashboard(); } }} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-[10px] font-bold">Accept</button></div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══════ STATS ROW ═══════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase">Customer Bookings</div>
            <div className="text-2xl font-extrabold text-slate-900">{bookings.length}</div>
            <span className="text-[10px] text-emerald-600 font-bold">100% Direct to Artisan</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase">Current Rating</div>
            <div className="text-2xl font-extrabold text-amber-500 flex items-center gap-1.5">
              <FiStar className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span>{Number(profile?.rating || 4.9).toFixed(1)}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">From verified reviews</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase">Verification</div>
            <div className="text-sm font-extrabold text-slate-900 mt-1">
              {isVerified ? "Society / Federation Verified" : isPending ? "Pending Review" : "Action Needed"}
            </div>
            <span className="text-[10px] text-indigo-600 font-bold">
              Cooperative-first trust controls
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase">Welfare</div>
            <div className="text-sm font-extrabold text-emerald-700 mt-1">Society Ledger Linked</div>
            <span className="text-[10px] text-slate-400 font-medium">Claims reviewed by federation admins</span>
          </div>
        </div>

        {/* ═══════ TABS & BOOKINGS QUEUE ═══════ */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg font-extrabold text-slate-900">Direct Customer Bookings</h2>
            <span className="text-xs font-bold text-slate-500">{bookings.length} Total</span>
          </div>

          {bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const cleanPhone = (booking.customer_phone || "").replace(/\D/g, "");
                const waText = encodeURIComponent(
                  `Namaste ${booking.customer_name || ""}, I am ${profile?.business_name || user?.name} from SahKaar regarding your booking for ${booking.service_name || "service"}.`
                );

                return (
                  <div
                    key={booking.id}
                    className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-sm font-extrabold text-slate-900">
                          {booking.customer_name || "Customer"}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            booking.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800"
                              : booking.status === "CONFIRMED"
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {booking.status}
                        </span>
                        {booking.service_price > 0 && (
                          <span className="text-xs font-black text-slate-800 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-xs">
                            ₹{booking.service_price}
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-bold text-indigo-600">
                        {booking.service_name || profile?.category || "Standard Cooperative Service"}
                      </p>

                      <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                        <FiMapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="font-semibold text-slate-800">{booking.customer_address || booking.address || "Bhopal, Madhya Pradesh"}</span>
                      </p>

                      <p className="text-[11px] text-slate-500 font-medium flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          <FiCalendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>Scheduled: <strong className="text-slate-700">{booking.scheduled_date || "Today"}</strong></span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <FiClock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>Slot: <strong className="text-slate-700">{booking.scheduled_time_slot || booking.time_slot || "Immediate"}</strong></span>
                        </span>
                      </p>
                    </div>

                    {/* Customer Action & Status Buttons */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      {booking.customer_phone && (
                        <>
                          <a
                            href={`tel:${cleanPhone}`}
                            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                            title="Call Customer"
                          >
                            <FaPhoneAlt className="w-3 h-3 text-emerald-600" />
                            <span>Call ({booking.customer_phone})</span>
                          </a>

                          <a
                            href={`https://wa.me/91${cleanPhone}?text=${waText}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                            title="WhatsApp Customer"
                          >
                            <FaWhatsapp className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        </>
                      )}

                      {booking.workflow_status === "created" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateBookingStatus(booking.id, "CONFIRMED")}
                          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Accept Job
                        </button>
                      )}

                      {booking.cooperative_booking && booking.workflow_status === "accepted" && (
                        <button type="button" onClick={() => handleUpdateBookingStatus(booking.id, "EN_ROUTE")} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">Mark En Route</button>
                      )}
                      {booking.cooperative_booking && booking.workflow_status === "en_route" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateBookingStatus(booking.id, "EN_ROUTE")}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Mark En Route
                        </button>
                      )}

                      {booking.cooperative_booking && booking.workflow_status === "arrived" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateBookingStatus(booking.id, "ARRIVED")}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Mark Arrived
                        </button>
                      )}

                      {booking.cooperative_booking && booking.workflow_status === "in_progress" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateBookingStatus(booking.id, "IN_PROGRESS")}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Start Work
                        </button>
                      )}

                      {booking.cooperative_booking && booking.workflow_status === "in_progress" && (
                        <span className="px-3 py-2 text-xs font-bold text-emerald-700">Awaiting customer completion confirmation</span>
                      )}

                      {!booking.cooperative_booking && booking.status === "CONFIRMED" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateBookingStatus(booking.id, "COMPLETED")}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs font-semibold">
              No customer bookings received yet. Verified cooperative workers appear in customer matching after federation approval.
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
