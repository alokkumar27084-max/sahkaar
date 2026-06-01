import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiArrowRight,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiMapPin,
  FiMonitor,
  FiNavigation,
  FiPhone,
  FiShield,
  FiStar,
  FiUsers,
} from "react-icons/fi";
import { contractorAPI } from "../../services/api";
import { getImageUrl, getAvatarUrl } from "../../utils/imageUtils";
import LoadingSpinner from "../../components/common/LoadingSpinner";

/* ── Constants ── */
const MEETING_FEE = 30;

const STEPS = [
  { id: 1, label: "Schedule" },
  { id: 2, label: "Confirm" },
  { id: 3, label: "Secured" },
];

const TIME_SLOTS = [
  { id: "9-11", label: "9 – 11 AM", from: "09:00", to: "11:00" },
  { id: "11-1", label: "11 – 1 PM", from: "11:00", to: "13:00" },
  { id: "2-4", label: "2 – 4 PM", from: "14:00", to: "16:00" },
  { id: "4-6", label: "4 – 6 PM", from: "16:00", to: "18:00" },
];

const MEETING_TYPES = [
  { id: "in_person", label: "In Person", icon: FiUsers, description: "Meet at a location" },
  { id: "video_call", label: "Video Call", icon: FiMonitor, description: "Google Meet / Zoom" },
  { id: "phone_call", label: "Phone Call", icon: FiPhone, description: "Quick phone call" },
];

/* ── Helpers ── */
function getNext7Days() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDay(date) {
  return date.toLocaleDateString("en-IN", { weekday: "short" });
}

function formatDate(date) {
  return date.getDate();
}

function formatMonth(date) {
  return date.toLocaleDateString("en-IN", { month: "short" });
}

function formatFullDate(date) {
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isSameDay(a, b) {
  return a && b && a.toDateString() === b.toDateString();
}

/* ── Animation Variants ── */
const stepVariants = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

const successPop = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 200, damping: 20 },
  },
};

export default function MeetingBookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  /* ── State ── */
  const [contractor, setContractor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);

  // Step 1 fields
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [meetingType, setMeetingType] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [detectingGps, setDetectingGps] = useState(false);
  const [projectDescription, setProjectDescription] = useState("");

  // Step 2
  const [paying, setPaying] = useState(false);

  const next7Days = useMemo(() => getNext7Days(), []);

  /* ── Load Contractor ── */
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const res = await contractorAPI.getById(id);
        if (active) setContractor(res.data.contractor);
      } catch {
        toast.error("Could not load contractor details.");
        navigate("/search");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [id, navigate]);

  /* ── Validation ── */
  const step1Valid = useMemo(() => {
    if (!selectedDate || !selectedSlot || !meetingType) return false;
    if (meetingType === "in_person" && !locationAddress.trim()) return false;
    if (!projectDescription.trim()) return false;
    return true;
  }, [selectedDate, selectedSlot, meetingType, locationAddress, projectDescription]);

  /* ── GPS Detection ── */
  function handleDetectGps() {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocationAddress(`Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}`);
        setDetectingGps(false);
        toast.success("Location detected!");
      },
      () => {
        toast.error("Could not detect location. Please enter manually.");
        setDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  /* ── Mock Payment ── */
  async function handlePayment() {
    setPaying(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setPaying(false);
    setStep(3);
    toast.success("Meeting booked successfully!");
  }

  if (loading || !contractor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] pt-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const displayName = contractor.business_name || contractor.name || contractor.user_name || "Contractor";
  const category = contractor.category || contractor.trade || "General Service";
  const rating = Number(contractor.rating || 0);
  const reviewCount = contractor.review_count ?? contractor.reviews_count ?? 0;
  const initial = displayName[0] || "?";

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-4 pb-20 pt-24 md:px-6 transition-colors duration-300">
      <div className="mx-auto max-w-xl">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => (step === 1 ? navigate(-1) : setStep((s) => s - 1))}
          className="mb-6 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] transition-colors hover:text-[var(--color-heading)]"
          disabled={step === 3}
        >
          <FiArrowLeft size={16} />
          {step === 1 ? "Back" : "Previous step"}
        </button>

        {/* Header Block */}
        <section className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:p-6 shadow-sm">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
            Meeting booking
          </p>
          <h1 className="font-display text-xl font-bold text-[var(--color-heading)] md:text-2xl">
            Schedule a project discussion
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)] font-medium">
            Book a meeting with this contractor to discuss your project requirements, get estimates, and plan the work.
          </p>

          {/* Steps */}
          <div className="mt-4 flex flex-wrap gap-2">
            {STEPS.map((s) => (
              <span
                key={s.id}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold transition-all ${
                  step >= s.id
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-muted)] text-[var(--color-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-muted)]"
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold transition-all ${
                    step > s.id
                      ? "bg-emerald-500 text-white"
                      : step === s.id
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-border)]"
                  }`}
                >
                  {step > s.id ? "✓" : s.id}
                </span>
                {s.label}
              </span>
            ))}
          </div>
        </section>

        {/* Contractor Profile */}
        <section className="card mb-6 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] p-4 shadow-sm">
          <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Meeting with</p>
          <div className="flex items-center gap-4">
            {contractor.photo_url ? (
              <img
                src={getAvatarUrl(contractor.photo_url)}
                alt={displayName}
                className="h-12 w-12 rounded-[var(--radius-md)] object-cover bg-[var(--color-bg-elevated)] border border-[var(--color-border)] shadow-xs"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = getAvatarUrl("");
                }}
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-muted)] text-[var(--color-primary)] font-bold border border-[var(--color-border)]">
                {initial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-bold text-[var(--color-heading)]">{displayName}</h2>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="inline-flex items-center gap-1 text-[var(--color-primary)]">
                  <FiBriefcase size={12} /> {String(category).replace(/_/g, " ")}
                </span>
                {rating > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-amber-500">
                    <FiStar size={12} className="fill-amber-500" /> {rating.toFixed(1)}
                    <span className="text-[var(--color-muted)] font-normal">({reviewCount})</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {/* STEP 1 - Schedule */}
          {step === 1 && (
            <motion.div key="step-1" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
              
              {/* Date Selector */}
              <div className="card rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <FiCalendar className="text-[var(--color-primary)]" size={15} />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Select Date</p>
                </div>
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {next7Days.map((day, i) => {
                    const isSelected = isSameDay(selectedDate, day);
                    const isToday = isSameDay(day, new Date());
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedDate(day)}
                        className={`group relative flex flex-col items-center gap-0.5 rounded-[var(--radius-sm)] border p-2 transition-all ${
                          isSelected
                            ? "border-[var(--color-primary)] bg-[var(--color-primary-muted)]"
                            : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-hover)]"
                        }`}
                      >
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                          {formatDay(day)}
                        </span>
                        <span className="text-sm font-bold text-[var(--color-heading)]">
                          {formatDate(day)}
                        </span>
                        <span className="text-[8px] font-semibold text-[var(--color-muted)]">
                          {formatMonth(day)}
                        </span>
                        {isToday && (
                          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-[var(--radius-xs)] bg-[var(--color-primary)] px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-white">
                            Today
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots */}
              <div className="card rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <FiClock className="text-[var(--color-primary)]" size={15} />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Select Time Slot</p>
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {TIME_SLOTS.map((slot) => {
                    const isActive = selectedSlot === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlot(slot.id)}
                        className={`rounded-[var(--radius-sm)] border p-2.5 text-center transition-all ${
                          isActive
                            ? "border-[var(--color-primary)] bg-[var(--color-primary-muted)] text-[var(--color-primary)] font-bold"
                            : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-hover)]"
                        }`}
                      >
                        <span className={`block text-xs font-semibold ${isActive ? "text-[var(--color-primary)]" : "text-[var(--color-heading)]"}`}>
                          {slot.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Meeting Type */}
              <div className="card rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] p-5 shadow-sm space-y-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Meeting Type</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {MEETING_TYPES.map((mt) => {
                    const Icon = mt.icon;
                    const isActive = meetingType === mt.id;
                    return (
                      <button
                        key={mt.id}
                        type="button"
                        onClick={() => setMeetingType(mt.id)}
                        className={`group flex flex-col items-center gap-1.5 rounded-[var(--radius-sm)] border-2 p-4 text-center transition-all ${
                          isActive
                            ? "border-[var(--color-primary)] bg-[var(--color-primary-muted)]"
                            : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-hover)]"
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] transition-all ${
                            isActive
                              ? "bg-[var(--color-primary)] text-white shadow-xs"
                              : "bg-[var(--color-bg-elevated)] text-[var(--color-muted)] group-hover:text-[var(--color-primary)]"
                          }`}
                        >
                          <Icon size={18} />
                        </div>
                        <span className="text-xs font-bold text-[var(--color-heading)]">
                          {mt.label}
                        </span>
                        <span className="text-[9px] font-semibold text-[var(--color-muted)]">
                          {mt.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location (In Person only) */}
              {meetingType === "in_person" && (
                <div className="card rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <FiMapPin className="text-[var(--color-primary)]" size={15} />
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                      Meeting Location
                    </p>
                  </div>
                  <div className="flex flex-col gap-2.5 sm:flex-row">
                    <input
                      type="text"
                      value={locationAddress}
                      onChange={(e) => setLocationAddress(e.target.value)}
                      placeholder="Enter address or landmark"
                      className="input-field flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleDetectGps}
                      disabled={detectingGps}
                      className="inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-2 text-xs font-semibold text-[var(--color-body)] transition-all hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
                    >
                      {detectingGps ? <LoadingSpinner size="xs" /> : <FiNavigation size={13} className="text-[var(--color-primary)]" />}
                      {detectingGps ? "Detecting..." : "GPS"}
                    </button>
                  </div>
                </div>
              )}

              {/* Project Description */}
              <div className="card rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] p-5 shadow-sm space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                  Project Description
                </p>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="input-field min-h-[100px] resize-none py-2.5"
                  placeholder="Describe your project — what work is needed, approximate area/size, timing..."
                  maxLength={600}
                />
                <p className="text-right text-[10px] font-semibold text-[var(--color-muted)]">
                  {projectDescription.length}/600
                </p>
              </div>

              {/* Continue Button */}
              <button
                type="button"
                onClick={() => {
                  if (!step1Valid) {
                    if (!selectedDate) toast.error("Please select a date.");
                    else if (!selectedSlot) toast.error("Please select a time slot.");
                    else if (!meetingType) toast.error("Please select meeting type.");
                    else if (meetingType === "in_person" && !locationAddress.trim()) toast.error("Please enter a location.");
                    else if (!projectDescription.trim()) toast.error("Please describe your project.");
                    return;
                  }
                  setStep(2);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={!step1Valid}
                className="btn-primary w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold tracking-wide disabled:opacity-50"
              >
                Continue to Payment <FiArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {/* STEP 2 - Confirm & Pay */}
          {step === 2 && (
            <motion.div key="step-2" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
              
              {/* Booking Summary */}
              <section className="card rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] p-5 shadow-sm space-y-4">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Booking Summary
                </p>

                <div className="space-y-3.5">
                  <div className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--color-divider)] bg-[var(--color-bg-elevated)] p-3">
                    <FiCalendar className="mt-0.5 shrink-0 text-[var(--color-primary)]" size={16} />
                    <div>
                      <p className="font-bold text-sm text-[var(--color-heading)]">{selectedDate ? formatFullDate(selectedDate) : ""}</p>
                      <p className="mt-1 text-xs text-[var(--color-muted)] font-semibold">
                        {TIME_SLOTS.find((s) => s.id === selectedSlot)?.label || ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--color-divider)] bg-[var(--color-bg-elevated)] p-3">
                    {(() => {
                      const mt = MEETING_TYPES.find((m) => m.id === meetingType);
                      const MtIcon = mt?.icon || FiUsers;
                      return (
                        <>
                          <MtIcon className="mt-0.5 shrink-0 text-[var(--color-primary)]" size={16} />
                          <div>
                            <p className="font-bold text-sm text-[var(--color-heading)]">{mt?.label || ""}</p>
                            <p className="mt-1 text-xs text-[var(--color-muted)] font-semibold">{mt?.description || ""}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {meetingType === "in_person" && locationAddress && (
                    <div className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--color-divider)] bg-[var(--color-bg-elevated)] p-3">
                      <FiMapPin className="mt-0.5 shrink-0 text-[var(--color-primary)]" size={16} />
                      <div>
                        <p className="font-bold text-sm text-[var(--color-heading)]">Location</p>
                        <p className="mt-1 text-xs text-[var(--color-muted)] font-semibold">{locationAddress}</p>
                      </div>
                    </div>
                  )}

                  <div className="rounded-[var(--radius-sm)] border border-[var(--color-divider)] bg-[var(--color-bg-elevated)] p-3 space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Project notes</p>
                    <p className="text-xs leading-relaxed text-[var(--color-body)] font-medium">{projectDescription}</p>
                  </div>
                </div>
              </section>

              {/* Payment Card */}
              <section className="card rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2 border-b border-[var(--color-divider)] pb-3 text-[var(--color-heading)]">
                  <FiCreditCard className="text-[var(--color-primary)]" size={16} />
                  <h2 className="font-display text-base font-bold">Payment</h2>
                </div>

                <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-xs font-semibold text-[var(--color-body)]">Meeting booking fee</span>
                    <span className="text-2xl font-bold text-[var(--color-heading)]">₹{MEETING_FEE}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2.5 rounded-[var(--radius-sm)] border border-[var(--color-divider)] bg-[var(--color-bg)] p-3">
                    <FiShield className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" size={16} />
                    <p className="text-xs leading-relaxed text-[var(--color-body)]">
                      <strong className="text-[var(--color-heading)]">100% Refundable.</strong> If the contractor cancels the meeting, your ₹{MEETING_FEE} will be fully refunded.
                    </p>
                  </div>
                  <div className="flex gap-2.5 rounded-[var(--radius-sm)] border border-[var(--color-divider)] bg-[var(--color-bg)] p-3">
                    <FiShield className="mt-0.5 shrink-0 text-[var(--color-primary)]" size={16} />
                    <p className="text-xs leading-relaxed text-[var(--color-body)]">
                      Secure payment processing via Razorpay. Your card details are never saved or stored.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={paying}
                  className="btn-primary w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold tracking-wide disabled:opacity-50"
                >
                  {paying ? (
                    <span className="flex items-center gap-2">
                      <LoadingSpinner size="xs" color="white" /> Processing payment...
                    </span>
                  ) : (
                    `Pay ₹${MEETING_FEE} via Razorpay`
                  )}
                </button>
                <p className="text-center text-[9px] font-bold uppercase tracking-wider text-[var(--color-subtle)]">
                  Secure checkout | Powered by Razorpay
                </p>
              </section>
            </motion.div>
          )}

          {/* STEP 3 - Success */}
          {step === 3 && (
            <motion.div key="step-3" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <section className="card rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] p-6 md:p-8 text-center shadow-sm space-y-6">
                <motion.div
                  variants={successPop}
                  initial="hidden"
                  animate="visible"
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary-muted)] text-[var(--color-primary)] border border-[var(--color-border)] shadow-xs"
                >
                  <FiCheckCircle size={28} />
                </motion.div>

                <div className="space-y-1.5">
                  <h2 className="font-display text-lg font-bold text-[var(--color-heading)] md:text-xl">
                    Meeting Booked!
                  </h2>
                  <p className="mx-auto max-w-sm text-xs text-[var(--color-muted)] font-medium leading-relaxed">
                    The contractor will confirm your meeting within 24 hours. You'll receive a notification once confirmed.
                  </p>
                </div>

                {/* Details Summary */}
                <div className="mx-auto max-w-sm space-y-2 text-left">
                  <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--color-divider)] bg-[var(--color-bg-elevated)] px-3.5 py-2.5">
                    <FiCalendar className="shrink-0 text-[var(--color-primary)]" size={14} />
                    <span className="text-xs font-bold text-[var(--color-heading)]">
                      {selectedDate ? formatFullDate(selectedDate) : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--color-divider)] bg-[var(--color-bg-elevated)] px-3.5 py-2.5">
                    <FiClock className="shrink-0 text-[var(--color-primary)]" size={14} />
                    <span className="text-xs font-bold text-[var(--color-heading)]">
                      {TIME_SLOTS.find((s) => s.id === selectedSlot)?.label || ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--color-divider)] bg-[var(--color-bg-elevated)] px-3.5 py-2.5">
                    {(() => {
                      const mt = MEETING_TYPES.find((m) => m.id === meetingType);
                      const MtIcon = mt?.icon || FiUsers;
                      return (
                        <>
                          <MtIcon className="shrink-0 text-[var(--color-primary)]" size={14} />
                          <span className="text-xs font-bold text-[var(--color-heading)]">{mt?.label || ""}</span>
                        </>
                      );
                    })()}
                  </div>
                  {meetingType === "in_person" && locationAddress && (
                    <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--color-divider)] bg-[var(--color-bg-elevated)] px-3.5 py-2.5">
                      <FiMapPin className="shrink-0 text-[var(--color-primary)]" size={14} />
                      <span className="text-xs font-bold text-[var(--color-heading)] truncate">{locationAddress}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-emerald-500/20 bg-emerald-500/[0.06] px-3.5 py-2.5">
                    <FiCreditCard className="shrink-0 text-emerald-600 dark:text-emerald-400" size={14} />
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">₹{MEETING_FEE} paid</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/customer/dashboard")}
                  className="btn-primary w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold tracking-wide"
                >
                  Go to Dashboard <FiArrowRight size={16} />
                </button>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
