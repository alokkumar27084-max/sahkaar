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
import { getImageUrl } from "../../utils/imageUtils";
import LoadingSpinner from "../../components/common/LoadingSpinner";

/* ── Constants ── */
const MEETING_FEE = 30;

const STEPS = [
  { id: 1, label: "Schedule" },
  { id: 2, label: "Confirm & Pay" },
  { id: 3, label: "Booked" },
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
  { id: "phone_call", label: "Phone Call", icon: FiPhone, description: "Quick phone discussion" },
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
  initial: { opacity: 0, x: 40, filter: "blur(6px)" },
  animate: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    x: -40,
    filter: "blur(6px)",
    transition: { duration: 0.35, ease: [0.7, 0, 0.84, 0] },
  },
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  }),
};

/* ──────────────────────────────────────────────────────────── */
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
    // Simulate Razorpay payment (mock)
    await new Promise((resolve) => setTimeout(resolve, 1800));
    setPaying(false);
    setStep(3);
    toast.success("Meeting booked successfully!");
  }

  /* ── Loading ── */
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

  /* ───────────────── RENDER ───────────────── */
  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-4 pb-20 pt-24 md:px-6">
      <div className="mx-auto max-w-4xl">
        {/* Back button */}
        <button
          type="button"
          onClick={() => (step === 1 ? navigate(-1) : setStep((s) => s - 1))}
          className="mb-6 flex items-center gap-1.5 text-sm font-bold text-[var(--color-muted)] transition-colors hover:text-[var(--color-heading)]"
          disabled={step === 3}
        >
          <FiArrowLeft size={16} />
          {step === 1 ? "Back" : "Previous step"}
        </button>

        {/* ── Header ── */}
        <section className="mb-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--color-primary)]">
            Meeting booking
          </p>
          <h1 className="font-display text-3xl font-black text-[var(--color-heading)] md:text-4xl">
            Schedule a project discussion
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-muted)] md:text-base">
            Book a meeting with this contractor to discuss your project requirements, get estimates, and plan the work.
          </p>

          {/* Step indicator */}
          <div className="mt-5 flex flex-wrap gap-3">
            {STEPS.map((s) => (
              <span
                key={s.id}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                  step >= s.id
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-heading)]"
                    : "border-[var(--color-border)] text-[var(--color-muted)]"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black transition-all ${
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

        {/* ── Contractor Card ── */}
        <section className="mb-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">Meeting with</p>
          <div className="flex items-center gap-4">
            {contractor.photo_url ? (
              <img
                src={getImageUrl(contractor.photo_url)}
                alt={displayName}
                className="h-16 w-16 shrink-0 rounded-xl border-2 border-[var(--color-border)] object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-xl font-black text-white">
                {initial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-black text-[var(--color-heading)] md:text-xl">{displayName}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1.5 font-bold text-[var(--color-primary)]">
                  <FiBriefcase size={13} /> {String(category).replace(/_/g, " ")}
                </span>
                {rating > 0 && (
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-500">
                    <FiStar size={13} /> {rating.toFixed(1)}
                    <span className="text-[var(--color-muted)]">({reviewCount})</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Step Content ── */}
        <AnimatePresence mode="wait">
          {/* ════════════ STEP 1 - Schedule ════════════ */}
          {step === 1 && (
            <motion.div key="step-1" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
              {/* Date Picker */}
              <motion.section
                variants={fadeUp}
                initial="initial"
                animate="animate"
                custom={0}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <div className="mb-4 flex items-center gap-2">
                  <FiCalendar className="text-[var(--color-primary)]" size={18} />
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">Select date</p>
                </div>
                <div className="grid grid-cols-7 gap-2 sm:gap-3">
                  {next7Days.map((day, i) => {
                    const isSelected = isSameDay(selectedDate, day);
                    const isToday = isSameDay(day, new Date());
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedDate(day)}
                        className={`group relative flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all sm:p-3 ${
                          isSelected
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-lg shadow-[var(--color-primary)]/10"
                            : "border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-primary)]/40"
                        }`}
                      >
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wide ${
                            isSelected ? "text-[var(--color-primary)]" : "text-[var(--color-muted)]"
                          }`}
                        >
                          {formatDay(day)}
                        </span>
                        <span
                          className={`text-xl font-black sm:text-2xl ${
                            isSelected ? "text-[var(--color-heading)]" : "text-[var(--color-heading)]"
                          }`}
                        >
                          {formatDate(day)}
                        </span>
                        <span
                          className={`text-[10px] font-semibold ${
                            isSelected ? "text-[var(--color-primary)]" : "text-[var(--color-muted)]"
                          }`}
                        >
                          {formatMonth(day)}
                        </span>
                        {isToday && (
                          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-white">
                            Today
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.section>

              {/* Time Slots */}
              <motion.section
                variants={fadeUp}
                initial="initial"
                animate="animate"
                custom={1}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <div className="mb-4 flex items-center gap-2">
                  <FiClock className="text-[var(--color-primary)]" size={18} />
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">Select time slot</p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {TIME_SLOTS.map((slot) => {
                    const isActive = selectedSlot === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlot(slot.id)}
                        className={`rounded-xl border-2 px-3 py-3 text-center transition-all sm:px-4 ${
                          isActive
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-lg shadow-[var(--color-primary)]/10"
                            : "border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-primary)]/40"
                        }`}
                      >
                        <span
                          className={`block text-sm font-black ${
                            isActive ? "text-[var(--color-primary)]" : "text-[var(--color-heading)]"
                          }`}
                        >
                          {slot.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.section>

              {/* Meeting Type */}
              <motion.section
                variants={fadeUp}
                initial="initial"
                animate="animate"
                custom={2}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <p className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">Meeting type</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {MEETING_TYPES.map((mt) => {
                    const Icon = mt.icon;
                    const isActive = meetingType === mt.id;
                    return (
                      <button
                        key={mt.id}
                        type="button"
                        onClick={() => setMeetingType(mt.id)}
                        className={`group flex flex-col items-center gap-2 rounded-xl border-2 p-5 text-center transition-all ${
                          isActive
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-lg shadow-[var(--color-primary)]/10"
                            : "border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-primary)]/40"
                        }`}
                      >
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all ${
                            isActive
                              ? "bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/25"
                              : "bg-[var(--color-border)] text-[var(--color-muted)] group-hover:bg-[var(--color-primary)]/20 group-hover:text-[var(--color-primary)]"
                          }`}
                        >
                          <Icon size={22} />
                        </div>
                        <span
                          className={`text-sm font-black ${
                            isActive ? "text-[var(--color-heading)]" : "text-[var(--color-heading)]"
                          }`}
                        >
                          {mt.label}
                        </span>
                        <span
                          className={`text-[11px] font-semibold ${
                            isActive ? "text-[var(--color-primary)]" : "text-[var(--color-muted)]"
                          }`}
                        >
                          {mt.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.section>

              {/* Location (In Person only) */}
              <AnimatePresence>
                {meetingType === "in_person" && (
                  <motion.section
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                      <div className="mb-4 flex items-center gap-2">
                        <FiMapPin className="text-[var(--color-primary)]" size={18} />
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">
                          Meeting location
                        </p>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row">
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
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-4 py-3 text-sm font-bold text-[var(--color-primary)] transition-all hover:bg-[var(--color-primary)]/20"
                        >
                          {detectingGps ? <LoadingSpinner size="sm" /> : <FiNavigation size={16} />}
                          {detectingGps ? "Detecting..." : "GPS"}
                        </button>
                      </div>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>

              {/* Project Description */}
              <motion.section
                variants={fadeUp}
                initial="initial"
                animate="animate"
                custom={3}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Project description
                </p>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="input-field min-h-[120px] resize-y"
                  placeholder="Briefly describe your project — what work is needed, approximate area/size, any special requirements..."
                  maxLength={600}
                />
                <p className="mt-2 text-right text-[11px] font-semibold text-[var(--color-muted)]">
                  {projectDescription.length}/600
                </p>
              </motion.section>

              {/* Continue Button */}
              <motion.div variants={fadeUp} initial="initial" animate="animate" custom={4}>
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
                  className={`btn-primary h-14 w-full justify-center text-base font-black ${
                    !step1Valid ? "cursor-not-allowed opacity-60" : ""
                  }`}
                >
                  Continue to Payment <FiArrowRight className="ml-2" />
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* ════════════ STEP 2 - Confirm & Pay ════════════ */}
          {step === 2 && (
            <motion.div key="step-2" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
              {/* Booking Summary */}
              <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8">
                <p className="mb-5 text-xs font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Booking summary
                </p>

                <div className="space-y-4">
                  {/* Date & Time */}
                  <div className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                    <FiCalendar className="mt-0.5 shrink-0 text-[var(--color-primary)]" size={18} />
                    <div>
                      <p className="font-bold text-[var(--color-heading)]">{selectedDate ? formatFullDate(selectedDate) : ""}</p>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        {TIME_SLOTS.find((s) => s.id === selectedSlot)?.label || ""}
                      </p>
                    </div>
                  </div>

                  {/* Meeting type */}
                  <div className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                    {(() => {
                      const mt = MEETING_TYPES.find((m) => m.id === meetingType);
                      const MtIcon = mt?.icon || FiUsers;
                      return (
                        <>
                          <MtIcon className="mt-0.5 shrink-0 text-[var(--color-primary)]" size={18} />
                          <div>
                            <p className="font-bold text-[var(--color-heading)]">{mt?.label || ""}</p>
                            <p className="mt-1 text-sm text-[var(--color-muted)]">{mt?.description || ""}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Location (if in-person) */}
                  {meetingType === "in_person" && locationAddress && (
                    <div className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                      <FiMapPin className="mt-0.5 shrink-0 text-[var(--color-primary)]" size={18} />
                      <div>
                        <p className="font-bold text-[var(--color-heading)]">Location</p>
                        <p className="mt-1 text-sm text-[var(--color-muted)]">{locationAddress}</p>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.15em] text-[var(--color-muted)]">Project notes</p>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--color-body)]">{projectDescription}</p>
                  </div>
                </div>
              </section>

              {/* Payment Card */}
              <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl md:p-8">
                <div className="mb-4 flex items-center gap-2 text-[var(--color-heading)]">
                  <FiCreditCard className="text-[var(--color-primary)]" />
                  <h2 className="font-display text-xl font-black">Payment</h2>
                </div>

                <div className="mb-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-sm text-[var(--color-muted)]">Meeting booking fee</span>
                    <span className="text-3xl font-black text-[var(--color-heading)]">₹{MEETING_FEE}</span>
                  </div>
                </div>

                {/* Refund info */}
                <div className="mb-6 space-y-3">
                  <div className="flex gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.06] p-3">
                    <FiShield className="mt-0.5 shrink-0 text-emerald-600" size={18} />
                    <p className="text-xs leading-relaxed text-[var(--color-body)]">
                      <strong className="text-[var(--color-heading)]">100% Refundable.</strong>{" "}
                      If the contractor cancels the meeting, your ₹{MEETING_FEE} will be fully refunded.
                    </p>
                  </div>
                  <div className="flex gap-3 rounded-xl border border-indigo-500/15 bg-indigo-500/[0.06] p-3">
                    <FiShield className="mt-0.5 shrink-0 text-indigo-500" size={18} />
                    <p className="text-xs leading-relaxed text-[var(--color-body)]">
                      Payments are processed securely by Razorpay. Card details are never stored on Thekedaar servers.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={paying}
                  className={`btn-primary h-14 w-full justify-center text-base font-black ${
                    paying ? "cursor-not-allowed opacity-60" : ""
                  }`}
                >
                  {paying ? (
                    <span className="flex items-center gap-2">
                      <LoadingSpinner size="sm" /> Processing payment...
                    </span>
                  ) : (
                    `Pay ₹${MEETING_FEE} via Razorpay`
                  )}
                </button>
                <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Secure checkout | Powered by Razorpay
                </p>
              </section>
            </motion.div>
          )}

          {/* ════════════ STEP 3 - Success ════════════ */}
          {step === 3 && (
            <motion.div key="step-3" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center md:p-12">
                {/* Success animation */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15"
                >
                  <FiCheckCircle className="text-emerald-500" size={40} />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="font-display text-3xl font-black text-[var(--color-heading)] md:text-4xl"
                >
                  Meeting Booked!
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  className="mx-auto mt-4 max-w-md text-[var(--color-muted)]"
                >
                  The contractor will confirm your meeting within 24 hours. You'll receive a notification once confirmed.
                </motion.p>

                {/* Meeting Details */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="mx-auto mt-8 max-w-md space-y-3 text-left"
                >
                  <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                    <FiCalendar className="shrink-0 text-[var(--color-primary)]" />
                    <span className="text-sm font-bold text-[var(--color-heading)]">
                      {selectedDate ? formatFullDate(selectedDate) : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                    <FiClock className="shrink-0 text-[var(--color-primary)]" />
                    <span className="text-sm font-bold text-[var(--color-heading)]">
                      {TIME_SLOTS.find((s) => s.id === selectedSlot)?.label || ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                    {(() => {
                      const mt = MEETING_TYPES.find((m) => m.id === meetingType);
                      const MtIcon = mt?.icon || FiUsers;
                      return (
                        <>
                          <MtIcon className="shrink-0 text-[var(--color-primary)]" />
                          <span className="text-sm font-bold text-[var(--color-heading)]">{mt?.label || ""}</span>
                        </>
                      );
                    })()}
                  </div>
                  {meetingType === "in_person" && locationAddress && (
                    <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                      <FiMapPin className="shrink-0 text-[var(--color-primary)]" />
                      <span className="text-sm font-bold text-[var(--color-heading)]">{locationAddress}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
                    <FiCreditCard className="shrink-0 text-emerald-500" />
                    <span className="text-sm font-bold text-emerald-600">₹{MEETING_FEE} paid</span>
                  </div>
                </motion.div>

                {/* CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="mt-10"
                >
                  <button
                    type="button"
                    onClick={() => navigate("/customer/dashboard")}
                    className="btn-primary mx-auto h-14 justify-center px-10 text-base font-black"
                  >
                    Go to Dashboard <FiArrowRight className="ml-2" />
                  </button>
                </motion.div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
