import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import {
  contractorAPI,
  quickBookingAPI,
  subscriptionAPI,
  notificationAPI,
  cooperativeAPI
} from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { getAvatarUrl } from "../../utils/imageUtils";
import toast from "react-hot-toast";
import {
  FiCheckCircle,
  FiShield,
  FiZap,
  FiCalendar,
  FiClock,
  FiDollarSign,
  FiPhone,
  FiFileText,
  FiAlertTriangle,
  FiAward,
  FiArrowRight,
  FiUser,
  FiX,
  FiMapPin
} from "react-icons/fi";
import { FaWhatsapp, FaPhoneAlt } from "react-icons/fa";
import SEOHead from "../../components/common/SEOHead";

export default function ContractorDashboard() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const isHi = lang === "hi";

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [subStatus, setSubStatus] = useState(null);
  const [plans, setPlans] = useState([]);
  const [showSubModal, setShowSubModal] = useState(false);
  const [purchasingPlan, setPurchasingPlan] = useState(false);

  const [activeTab, setActiveTab] = useState("bookings"); // 'bookings', 'subscriptions', 'welfare'

  useEffect(() => {
    loadDashboard();

    // Listen for instant real-time booking push notifications
    const handleRealtimeUpdate = (e) => {
      console.log("Master Dashboard received real-time booking update:", e.detail);
      quickBookingAPI
        .getContractorBookings()
        .then((res) => {
          setBookings(res.data?.bookings || []);
        })
        .catch(() => {});
    };

    window.addEventListener("sahkaari:booking_update", handleRealtimeUpdate);
    return () => window.removeEventListener("sahkaari:booking_update", handleRealtimeUpdate);
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [profRes, bookRes, subRes, plansRes] = await Promise.all([
        contractorAPI.getMyProfile().catch(() => ({ data: { contractor: null } })),
        quickBookingAPI.getContractorBookings().catch(() => ({ data: { bookings: [] } })),
        subscriptionAPI.getStatus().catch(() => ({ data: { subscription: null } })),
        subscriptionAPI.getPlans().catch(() => ({ data: { plans: [] } })),
      ]);

      if (profRes.data?.contractor) {
        setProfile(profRes.data.contractor);
      }
      setBookings(bookRes.data?.bookings || []);
      setSubStatus(subRes.data?.subscription || null);
      setPlans(plansRes.data?.plans || []);
    } catch (err) {
      console.error("Dashboard error:", err);
      toast.error("Failed to load Master dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyPlan = async (planType) => {
    setPurchasingPlan(true);
    try {
      const res = await subscriptionAPI.purchase(planType);
      if (res.data?.ok) {
        // Automatically verify in dev/mock mode
        await subscriptionAPI.verify({
          plan_type: planType,
          razorpay_order_id: res.data.razorpayOrderId,
          razorpay_payment_id: `pay_${Date.now()}`,
          razorpay_signature: "mock_signature",
        });

        toast.success(`Plan activated! Your Master profile is now upgraded.`);
        setShowSubModal(false);
        loadDashboard();
      }
    } catch (err) {
      toast.error("Subscription purchase could not be completed.");
    } finally {
      setPurchasingPlan(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      await quickBookingAPI.updateStatus(bookingId, newStatus);
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
        title="मास्टर डैशबोर्ड — SahKaari Master Partner Portal"
        description="Manage your verified Master profile, incoming customer bookings, Federation verification status, and subscription rankings."
      />

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ═══════ MASTER PROFILE OVERVIEW CARD ═══════ */}
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
                  Master {profile?.category?.replace(/_/g, " ") || "Artisan"}
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
                🏛️ {profile?.society_name || "Bhopal Shramik & Karigar Sahakari Samiti"} • Reg: {profile?.member_registration_no || "SK-MST-82910"}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setShowSubModal(true)}
              className="flex-1 md:flex-initial px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-2"
            >
              <FiZap className="w-4 h-4 fill-white" />
              <span>Upgrade Plan & Boost Leads</span>
            </button>
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
                Documents Submitted — Under Federation Audit
              </h3>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                Your Aadhaar card and Skill certification documents have been submitted to the Cooperative Federation verification queue. Once verified by federation admins, the official Verified Master Shield will appear on your profile.
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

        {/* ═══════ STATS ROW ═══════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase">Customer Bookings</div>
            <div className="text-2xl font-extrabold text-slate-900">{bookings.length}</div>
            <span className="text-[10px] text-emerald-600 font-bold">100% Direct to Artisan</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase">Current Rating</div>
            <div className="text-2xl font-extrabold text-amber-500 flex items-center gap-1">
              <span>★</span> {Number(profile?.rating || 4.9).toFixed(1)}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">From verified reviews</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase">Search Promotion</div>
            <div className="text-sm font-extrabold text-slate-900 mt-1">
              {subStatus?.has_priority_listing ? "Top Recommendation Active" : "Standard Placement"}
            </div>
            <span className="text-[10px] text-indigo-600 font-bold">
              {subStatus?.has_priority_listing ? "Rank #1 in Locality" : "Upgrade for 4x leads"}
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase">Welfare Insurance</div>
            <div className="text-sm font-extrabold text-emerald-700 mt-1">₹5,00,000 Active</div>
            <span className="text-[10px] text-slate-400 font-medium">PM Suraksha Bima Scheme</span>
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
                  `Namaste ${booking.customer_name || ""}, I am Master ${profile?.business_name || user?.name} from SahKaari regarding your booking for ${booking.service_name || "service"}.`
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
                        🛠️ {booking.service_name || profile?.category || "Standard Master Service"}
                      </p>

                      <p className="text-xs text-slate-600 font-medium">
                        📍 <span className="font-semibold text-slate-800">{booking.customer_address || booking.address || "Bhopal, Madhya Pradesh"}</span>
                      </p>

                      <p className="text-[11px] text-slate-500 font-medium">
                        📅 Scheduled: <span className="font-bold text-slate-700">{booking.scheduled_date || "Today"}</span> • ⏰ <span className="font-bold text-slate-700">{booking.scheduled_time_slot || booking.time_slot || "Immediate"}</span>
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

                      {booking.status === "PENDING" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateBookingStatus(booking.id, "CONFIRMED")}
                          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Accept Job
                        </button>
                      )}

                      {booking.status === "CONFIRMED" && (
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
              No customer bookings received yet. Turn on Top Recommendation to get discovered faster!
            </div>
          )}
        </div>

      </div>

      {/* ═══════ UPGRADE SUBSCRIPTION MODAL ═══════ */}
      <AnimatePresence>
        {showSubModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Master Growth & Promotion Plans</h3>
                  <p className="text-xs text-slate-500">Boost your credibility and rank #1 in customer search</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSubModal(false)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(plans.length > 0
                  ? plans
                  : [
                      {
                        id: "verified_badge",
                        title: "Verified Badge Pro",
                        price: 499,
                        period: "year",
                        description: "Golden Verified Shield on profile & search.",
                      },
                      {
                        id: "priority_listing",
                        title: "Top Recommendation",
                        price: 399,
                        period: "month",
                        description: "Rank #1 in customer search for your trade.",
                      },
                      {
                        id: "premium",
                        title: "Super Master All-Access",
                        price: 899,
                        period: "month",
                        description: "Verified Badge + Top Search Ranking + Unlimited leads.",
                      },
                    ]
                ).map((plan) => (
                  <div
                    key={plan.id}
                    className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-600 bg-slate-50 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                        {plan.title}
                      </span>
                      <div className="text-xl font-extrabold text-slate-900">
                        ₹{plan.price} <span className="text-xs text-slate-400 font-normal">/{plan.period}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{plan.description}</p>
                    </div>

                    <button
                      type="button"
                      disabled={purchasingPlan}
                      onClick={() => handleBuyPlan(plan.id)}
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold shadow-sm transition-all text-center"
                    >
                      {purchasingPlan ? "Activating..." : "Upgrade Now"}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
