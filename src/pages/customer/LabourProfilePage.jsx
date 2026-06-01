import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  FiSmile
} from "react-icons/fi";
import { labourAPI, quickBookingAPI } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { WHATSAPP_URL } from "../../utils/constants";
import { getAvatarUrl } from "../../utils/imageUtils";

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

        if (razorpay_order.id.startsWith("mock_order_")) {
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
    <main className="min-h-screen bg-[var(--color-bg)] pt-24 pb-16 px-4 md:px-8 transition-colors duration-300">
      <div className="max-w-[1100px] mx-auto space-y-6">
        
        {/* Back Link */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors"
        >
          <FiArrowLeft size={14} /> Back to Search
        </button>

        {/* Profile Header Block */}
        <div className="card bg-[var(--color-surface)] border border-[var(--color-border)] p-6 md:p-8 rounded-[var(--radius-lg)] shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <img
              src={getAvatarUrl(crew.photo_url)}
              alt={crew.name}
              className="w-24 h-24 rounded-[var(--radius-md)] object-cover bg-[var(--color-bg-elevated)] border border-[var(--color-border)] shadow-sm"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = getAvatarUrl("");
              }}
            />
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-heading)]">
                  {crew.name}
                </h1>
                {crew.is_verified && (
                  <span className="text-[var(--color-primary)] bg-[var(--color-primary-muted)] px-3 py-1 rounded-[var(--radius-pill)] flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                    <FiCheckCircle size={12} /> Verified Squad
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-2">
                <FiUsers className="text-[var(--color-primary)]" /> Daily wage labour group leader (Thekedaar)
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-[var(--color-body)]">
                <span className="flex items-center gap-1.5"><FiMapPin className="text-[var(--color-primary)]" /> {crew.location_text || "Local service area"}</span>
                <span className="flex items-center gap-1.5"><FiAward className="text-[var(--color-primary)]" /> {crew.experience_years} Years Experience</span>
              </div>
            </div>
            
            {/* Quick Contact Buttons */}
            <div className="flex gap-2 w-full md:w-auto self-stretch md:self-auto shrink-0 flex-col sm:flex-row md:flex-col justify-center">
              <a
                href={`tel:+91${crew.phone || "9999999999"}`}
                className="btn-ghost border border-[var(--color-border)] text-sm rounded-[var(--radius-sm)] flex items-center justify-center gap-2 py-3 px-5 text-center font-bold"
              >
                <FiPhone size={14} /> Call Leader
              </a>
              <a
                href={WHATSAPP_URL(crew.phone || "9999999999", crew.name)}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary rounded-[var(--radius-sm)] flex items-center justify-center gap-2 py-3 px-5 text-center text-white font-bold"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Detailed Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Crew Force details & Profile details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Squad Force Breakdown */}
            <div className="card bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-[var(--radius-lg)] shadow-sm space-y-4">
              <div>
                <h3 className="font-display text-lg font-bold text-[var(--color-heading)] flex items-center gap-2">
                  <FiUsers className="text-[var(--color-primary)]" /> Active Squad Force Breakdown
                </h3>
                <p className="mt-1 text-xs text-[var(--color-muted)] leading-relaxed">
                  List of manpower worker categories managed directly by {crew.name}.
                </p>
              </div>

              {crew.labour_crew && Array.isArray(crew.labour_crew) && crew.labour_crew.length > 0 ? (
                <div className="overflow-hidden border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-bg)]">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-[var(--color-bg-elevated)] border-b border-[var(--color-border)]">
                        <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[var(--color-muted)] text-[10px]">Worker Skill / Role</th>
                        <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[var(--color-muted)] text-[10px] text-center">Squad Qty</th>
                        <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[var(--color-muted)] text-[10px] text-right">Daily Rate</th>
                        <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[var(--color-muted)] text-[10px] text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {crew.labour_crew.map((item, idx) => (
                        <tr key={idx} className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-hover)] transition-colors">
                          <td className="px-4 py-3 font-semibold text-[var(--color-heading)]">{item.role}</td>
                          <td className="px-4 py-3 font-semibold text-[var(--color-heading)] text-center">{item.count}</td>
                          <td className="px-4 py-3 font-semibold text-[var(--color-heading)] text-right">₹{item.rate}</td>
                          <td className="px-4 py-3 font-semibold text-[var(--color-heading)] text-right">₹{item.count * item.rate}</td>
                        </tr>
                      ))}
                      <tr className="bg-[var(--color-bg-elevated)] font-bold border-t border-[var(--color-border)]">
                        <td colSpan="3" className="px-4 py-3 text-right uppercase tracking-wider text-[10px] text-[var(--color-muted)]">Squad Daily Operational Cost:</td>
                        <td className="px-4 py-3 text-right text-[var(--color-primary)] text-base">₹{pricing.totalDailyCost}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-center">
                  <p className="text-sm font-semibold text-[var(--color-muted)]">No crew breakdown listed. Squad size is {crew.team_size || 1} workers.</p>
                </div>
              )}
            </div>

            {/* Profile Bio */}
            <div className="card bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-[var(--radius-lg)] shadow-sm space-y-3">
              <h3 className="font-display text-lg font-bold text-[var(--color-heading)]">Leader's Biography</h3>
              <p className="text-sm leading-relaxed text-[var(--color-body)] whitespace-pre-line">
                {crew.description || "Experienced crew leader managing daily wage workforces for structural, masonry, and finishing operations."}
              </p>
            </div>

            {/* Rating Section */}
            <div className="card bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-[var(--radius-lg)] shadow-sm space-y-4">
              <h3 className="font-display text-lg font-bold text-[var(--color-heading)]">Client Reviews</h3>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-[var(--radius-md)] bg-[var(--color-primary-muted)] text-[var(--color-primary)] font-display text-xl font-bold flex items-center justify-center border border-[var(--color-border)]">
                  {Number(crew.rating || 5.0).toFixed(1)}
                </div>
                <div>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <FiStar key={i} className="fill-amber-500" size={16} />
                    ))}
                  </div>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Perfect Satisfaction index across {crew.review_count || 1} bookings</p>
                </div>
              </div>
            </div>

          </div>

          {/* Hiring Calculator Form */}
          <div>
            <div className="card bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-[var(--radius-lg)] shadow-sm space-y-6 sticky top-24">
              <div>
                <h3 className="font-display text-base font-bold text-[var(--color-heading)]">Hire Daily Wage Squad</h3>
                <p className="mt-1.5 text-xs text-[var(--color-muted)] leading-relaxed">
                  Book this labour group directly. Pay a standard ₹30 processing fee to secure booking. Total wage contract paid on-site directly to the leader.
                </p>
              </div>

              <form onSubmit={handleHireSubmit} className="space-y-4">
                
                {/* Date Picker */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Start Date</label>
                  <div className="relative">
                    <FiCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split("T")[0]}
                      className="input-field pl-10"
                      value={bookingData.scheduled_date}
                      onChange={(e) => setBookingData(p => ({ ...p, scheduled_date: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Duration Picker */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Contract Duration (Days)</label>
                  <div className="relative">
                    <FiClock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
                    <input
                      type="number"
                      required
                      min="1"
                      className="input-field pl-10"
                      value={bookingData.duration_days}
                      onChange={handleDurationChange}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Job Notes / Instructions</label>
                  <textarea
                    rows="3"
                    className="input-field h-auto py-2.5 resize-none"
                    placeholder="Briefly state construction job details..."
                    value={bookingData.notes}
                    onChange={(e) => setBookingData(p => ({ ...p, notes: e.target.value }))}
                  />
                </div>

                {/* Costs breakdown */}
                <div className="p-3.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-md)] space-y-2 text-sm">
                  <div className="flex justify-between text-xs text-[var(--color-body)]">
                    <span>Wage Cost / Day:</span>
                    <span className="font-semibold text-[var(--color-heading)]">₹{pricing.totalDailyCost}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[var(--color-body)] border-b border-[var(--color-border)] pb-2">
                    <span>Contract Period:</span>
                    <span className="font-semibold text-[var(--color-heading)]">{bookingData.duration_days} Days</span>
                  </div>
                  <div className="flex justify-between font-bold text-[var(--color-primary)] pt-1">
                    <span className="uppercase tracking-wider text-[10px]">Estimated Wage:</span>
                    <span className="text-base">₹{pricing.totalContractCost}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-[10px] text-[var(--color-muted)] font-semibold uppercase tracking-wider leading-relaxed">
                  <FiInfo className="text-[var(--color-primary)] shrink-0 mt-0.5" size={13} />
                  <span>Only ₹30 confirmation fee paid now. Balance wage paid on site.</span>
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-[var(--radius-sm)] text-sm font-semibold tracking-wide disabled:opacity-50"
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

