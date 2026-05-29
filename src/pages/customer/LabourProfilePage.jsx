import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiUsers,
  FiPhone,
  FiMapPin,
  FiAward,
  FiStar,
  FiCalendar,
  FiClock,
  FiInfo,
  FiCheckCircle,
  FiArrowLeft,
  FiDollarSign,
  FiSmile
} from "react-icons/fi";
import { labourAPI, quickBookingAPI } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { WHATSAPP_URL } from "../../utils/constants";

export default function LabourProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [crew, setCrew] = useState(null);

  // Booking Flow States
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingData, setBookingData] = useState({
    scheduled_date: "",
    duration_days: 1,
    notes: ""
  });
  const [pricing, setPricing] = useState({ totalDailyCost: 0, totalContractCost: 0 });

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const res = await labourAPI.getDetails(id);
      if (res.data?.ok) {
        setCrew(res.data.contractor);
        calculatePricing(res.data.contractor, 1);
      } else {
        toast.error("Profile not found.");
        navigate("/search");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load labour group.");
      navigate("/search");
    } finally {
      setLoading(false);
    }
  };

  const calculatePricing = (contractorObj, days) => {
    let dailyCost = 0;
    if (contractorObj.labour_crew && Array.isArray(contractorObj.labour_crew)) {
      contractorObj.labour_crew.forEach(item => {
        dailyCost += (item.count * item.rate);
      });
    }
    // Fallback to base contractor rate if no crew breakdown listed
    if (dailyCost === 0) {
      dailyCost = (contractorObj.daily_rate || 400) * (contractorObj.team_size || 1);
    }

    setPricing({
      totalDailyCost: dailyCost,
      totalContractCost: dailyCost * days
    });
  };

  const handleDurationChange = (e) => {
    const days = Math.max(1, parseInt(e.target.value) || 1);
    setBookingData(p => ({ ...p, duration_days: days }));
    if (crew) calculatePricing(crew, days);
  };

  const handleHireSubmit = async (e) => {
    e.preventDefault();
    if (!bookingData.scheduled_date) {
      toast.error("Please choose a start date.");
      return;
    }

    setBookingLoading(true);
    try {
      // Create quick booking on backend for Labour Group
      const res = await quickBookingAPI.create({
        contractor_id: crew.id,
        service_name: `Labour Squad Booking (${crew.team_size} workers)`,
        scheduled_date: bookingData.scheduled_date,
        scheduled_time_slot: "09:00 AM (Daily wage start)",
        service_price: pricing.totalContractCost,
        customer_address: crew.location_text || "Customer Site",
        service_details: {
          duration_days: bookingData.duration_days,
          labour_crew: crew.labour_crew,
          notes: bookingData.notes
        }
      });

      if (res.data?.ok) {
        const { booking, razorpay_order } = res.data;

        // Secure Razorpay payment for ₹30 booking fee
        const options = {
          key: razorpay_order.key,
          amount: razorpay_order.amount,
          currency: razorpay_order.currency,
          name: "Thekedaar hiring fee",
          description: `Securing labour crew: ${crew.name}`,
          order_id: razorpay_order.id,
          handler: async (response) => {
            try {
              const verifyRes = await quickBookingAPI.verify({
                booking_id: booking.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                razorpay_order_id: response.razorpay_order_id
              });

              if (verifyRes.data?.ok) {
                toast.success("Squad Hired successfully! Leader notified.");
                navigate("/customer/dashboard");
              }
            } catch (err) {
              toast.error("Payment verification failed.");
            }
          },
          prefill: {
            name: "Hiring Client"
          },
          theme: { color: "#6366F1" }
        };

        // If mock payment triggers (Razorpay environment keys not loaded)
        if (razorpay_order.id.startsWith("mock_order_")) {
          // Simulate payment verification
          setTimeout(async () => {
            const verifyRes = await quickBookingAPI.verify({
              booking_id: booking.id,
              razorpay_payment_id: `mock_pay_${Date.now()}`
            });
            if (verifyRes.data?.ok) {
              toast.success("Mock Payment Confirmed! Squad booked.");
              navigate("/customer/dashboard");
            }
          }, 1000);
        } else {
          const rzp = new window.Razorpay(options);
          rzp.open();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit booking.");
    } finally {
      setBookingLoading(false);
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
      <div className="max-w-[1200px] mx-auto space-y-8">
        
        {/* Back Link */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--color-muted)] hover:text-indigo-500 transition-colors"
        >
          <FiArrowLeft size={14} /> Back to Search
        </button>

        {/* Profile Card */}
        <div className="glass-card border border-[var(--color-border)] bg-[var(--color-card)] p-8 md:p-12 rounded-[2.5rem] shadow-sm relative overflow-hidden">
          <div className="absolute -right-32 -top-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center relative z-10">
            <img
              src={crew.photo_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${crew.id}`}
              alt={crew.name}
              className="w-28 h-28 rounded-3xl object-cover bg-[var(--color-bg)] border border-[var(--color-border)] shadow-md"
            />
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl font-black tracking-tight text-[var(--color-heading)]">
                  {crew.name}
                </h1>
                {crew.is_verified && (
                  <span className="text-indigo-500 bg-indigo-500/10 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest shadow-sm">
                    <FiCheckCircle size={11} /> Verified Squad
                  </span>
                )}
              </div>
              <p className="text-sm font-bold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-2">
                <FiUsers className="text-indigo-500" /> Daily wage labour group leader (Thekedaar)
              </p>
              <div className="flex flex-wrap gap-4 text-xs font-bold text-[var(--color-body)]">
                <span className="flex items-center gap-1.5"><FiMapPin className="text-indigo-500" /> {crew.location_text || "Local service area"}</span>
                <span className="flex items-center gap-1.5"><FiAward className="text-indigo-500" /> {crew.experience_years} Years Experience</span>
              </div>
            </div>
            
            {/* Quick Contact buttons */}
            <div className="flex gap-3 w-full md:w-auto self-stretch md:self-auto shrink-0 flex-col sm:flex-row md:flex-col justify-center">
              <a
                href={`tel:+91${crew.phone || "9999999999"}`}
                className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 font-black text-xs uppercase tracking-widest hover:bg-indigo-500/10 transition-all text-center"
              >
                <FiPhone size={14} /> Call Leader
              </a>
              <a
                href={WHATSAPP_URL(crew.phone || "9999999999", crew.name)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-500 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20 text-center"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Detailed Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Crew Force details & Profile details */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Squad Force Breakdown */}
            <div className="glass-card border border-[var(--color-border)] bg-[var(--color-card)] p-8 rounded-[2.5rem] shadow-sm space-y-6">
              <div>
                <h3 className="font-display text-xl font-black text-[var(--color-heading)] uppercase tracking-tight flex items-center gap-2">
                  <FiUsers className="text-indigo-500" /> Active Squad Force Breakdown
                </h3>
                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] leading-relaxed">
                  List of manpower worker categories managed directly by {crew.name}.
                </p>
              </div>

              {crew.labour_crew && Array.isArray(crew.labour_crew) && crew.labour_crew.length > 0 ? (
                <div className="overflow-hidden border border-[var(--color-border)] rounded-2xl">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                        <th className="px-6 py-4 font-black uppercase tracking-wider text-[var(--color-muted)] text-[10px]">Worker Skill / Role</th>
                        <th className="px-6 py-4 font-black uppercase tracking-wider text-[var(--color-muted)] text-[10px] text-center">Squad Qty</th>
                        <th className="px-6 py-4 font-black uppercase tracking-wider text-[var(--color-muted)] text-[10px] text-right">Daily Rate / worker</th>
                        <th className="px-6 py-4 font-black uppercase tracking-wider text-[var(--color-muted)] text-[10px] text-right">Cost Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {crew.labour_crew.map((item, idx) => (
                        <tr key={idx} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors">
                          <td className="px-6 py-4 font-bold text-[var(--color-heading)]">{item.role}</td>
                          <td className="px-6 py-4 font-bold text-[var(--color-heading)] text-center">{item.count}</td>
                          <td className="px-6 py-4 font-bold text-[var(--color-heading)] text-right">₹{item.rate}</td>
                          <td className="px-6 py-4 font-bold text-indigo-500 text-right">₹{item.count * item.rate}</td>
                        </tr>
                      ))}
                      <tr className="bg-[var(--color-bg)] font-black">
                        <td colSpan="3" className="px-6 py-4 text-right uppercase tracking-wider text-[10px] text-[var(--color-muted)]">Squad Daily Operational Cost:</td>
                        <td className="px-6 py-4 text-right text-indigo-600 dark:text-indigo-400 text-lg">₹{pricing.totalDailyCost}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl text-center">
                  <p className="text-sm font-bold text-[var(--color-muted)]">No crew breakdown listed. Squad size is {crew.team_size || 1} workers.</p>
                </div>
              )}
            </div>

            {/* Profile Bio */}
            <div className="glass-card border border-[var(--color-border)] bg-[var(--color-card)] p-8 rounded-[2.5rem] shadow-sm space-y-4">
              <h3 className="font-display text-xl font-black text-[var(--color-heading)] uppercase tracking-tight">Leader's Biography</h3>
              <p className="text-sm leading-relaxed text-[var(--color-body)] font-medium whitespace-pre-line">
                {crew.description || "Experienced crew leader managing daily wage workforces for structural, masonry, and finishing operations."}
              </p>
            </div>

            {/* Rating Section */}
            <div className="glass-card border border-[var(--color-border)] bg-[var(--color-card)] p-8 rounded-[2.5rem] shadow-sm space-y-4">
              <h3 className="font-display text-xl font-black text-[var(--color-heading)] uppercase tracking-tight">Client Reviews</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-500 font-display text-2xl font-black flex items-center justify-center shadow-inner">
                  {Number(crew.rating || 5.0).toFixed(1)}
                </div>
                <div>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    <FiStar className="fill-amber-500" />
                    <FiStar className="fill-amber-500" />
                    <FiStar className="fill-amber-500" />
                    <FiStar className="fill-amber-500" />
                    <FiStar className="fill-amber-500" />
                  </div>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Perfect Satisfaction index across {crew.review_count || 1} bookings</p>
                </div>
              </div>
            </div>

          </div>

          {/* Hiring calculator form */}
          <div>
            <div className="glass-card border border-[var(--color-border)] bg-[var(--color-card)] p-8 rounded-[2.5rem] shadow-md space-y-8 sticky top-24">
              <div>
                <h3 className="font-display text-lg font-black text-[var(--color-heading)] uppercase tracking-tight">Hire Daily Wage Squad</h3>
                <p className="mt-1.5 text-xs text-[var(--color-muted)] font-medium leading-relaxed">
                  Book this labour group directly. Pay a standard ₹30 processing fee to secure booking. Total wage contract paid on-site directly to the leader.
                </p>
              </div>

              <form onSubmit={handleHireSubmit} className="space-y-6">
                
                {/* Date Picker */}
                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Start Date</span>
                  <div className="relative">
                    <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" />
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-10 py-3.5 text-[var(--color-heading)] font-bold text-sm focus:border-indigo-500 outline-none shadow-inner"
                      value={bookingData.scheduled_date}
                      onChange={(e) => setBookingData(p => ({ ...p, scheduled_date: e.target.value }))}
                    />
                  </div>
                </label>

                {/* Duration select */}
                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Contract Duration (Days)</span>
                  <div className="relative">
                    <FiClock className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" />
                    <input
                      type="number"
                      required
                      min="1"
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-10 py-3.5 text-[var(--color-heading)] font-bold text-sm focus:border-indigo-500 outline-none shadow-inner"
                      value={bookingData.duration_days}
                      onChange={handleDurationChange}
                    />
                  </div>
                </label>

                {/* Notes */}
                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Job Notes / Instructions</span>
                  <textarea
                    rows="3"
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3.5 text-[var(--color-heading)] font-bold text-sm focus:border-indigo-500 outline-none resize-none shadow-inner"
                    placeholder="Briefly state construction job details..."
                    value={bookingData.notes}
                    onChange={(e) => setBookingData(p => ({ ...p, notes: e.target.value }))}
                  />
                </label>

                {/* Costs breakdown */}
                <div className="p-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl space-y-2 text-sm shadow-inner">
                  <div className="flex justify-between font-bold text-[var(--color-muted)] text-xs">
                    <span>Wage Cost / Day:</span>
                    <span className="text-[var(--color-heading)]">₹{pricing.totalDailyCost}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[var(--color-muted)] text-xs border-b border-[var(--color-border)] pb-2">
                    <span>Contract Period:</span>
                    <span className="text-[var(--color-heading)]">{bookingData.duration_days} Days</span>
                  </div>
                  <div className="flex justify-between font-black text-indigo-500 pt-1">
                    <span className="uppercase tracking-widest text-[10px]">Estimated Wage:</span>
                    <span className="text-base">₹{pricing.totalContractCost}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-[10px] text-[var(--color-muted)] font-black uppercase tracking-widest leading-relaxed">
                  <FiInfo className="text-indigo-500 shrink-0 mt-0.5" />
                  <span>Only ₹30 confirmation fee paid now. Balance wage paid on site.</span>
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full flex items-center justify-center gap-2 py-4.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 disabled:opacity-50 active:scale-95 transition-all"
                >
                  {bookingLoading ? <LoadingSpinner size="xs" color="white" /> : <FiSmile size={16} />}
                  Confirm & Hire Squad
                </button>
              </form>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
