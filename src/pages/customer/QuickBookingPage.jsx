import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiCheck,
  FiPhone,
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiShield,
  FiMessageCircle,
  FiArrowRight,
  FiUser,
  FiStar,
  FiNavigation,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { contractorAPI } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";

/* ─── constants ─── */
const STEPS = [
  { id: 1, label: "Details", icon: FiCalendar },
  { id: 2, label: "Confirm", icon: FiCreditCard },
  { id: 3, label: "Secured", icon: FiCheck },
];

const TIME_SLOTS = [
  { id: "morning", label: "Morning", time: "8 AM – 12 PM", icon: "🌅" },
  { id: "afternoon", label: "Afternoon", time: "12 PM – 5 PM", icon: "☀️" },
  { id: "evening", label: "Evening", time: "5 PM – 9 PM", icon: "🌆" },
];

const CONFIRMATION_FEE = 30;

/* ─── helpers ─── */
function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function getTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

/* ─── animation variants ─── */
const stepVariants = {
  enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

const successPop = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 200, damping: 20, delay: 0.1 },
  },
};

export default function QuickBookingPage() {
  const { contractorId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const serviceName = searchParams.get("serviceName") || "General Service";
  const servicePrice = Number(searchParams.get("servicePrice")) || 0;

  /* ── state ── */
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [contractor, setContractor] = useState(null);
  const [contractorLoading, setContractorLoading] = useState(true);

  // step 1 form
  const [preferredDate, setPreferredDate] = useState(getTomorrowDate());
  const [timeSlot, setTimeSlot] = useState("");
  const [address, setAddress] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);

  // payment
  const [loading, setLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  /* ── load contractor ── */
  useEffect(() => {
    if (!contractorId) return;
    let active = true;
    (async () => {
      setContractorLoading(true);
      try {
        const res = await contractorAPI.getById(contractorId);
        if (active) setContractor(res.data.contractor);
      } catch {
        toast.error("Could not load contractor details.");
        navigate(-1);
      } finally {
        if (active) setContractorLoading(false);
      }
    })();
    return () => { active = false; };
  }, [contractorId, navigate]);

  const goTo = useCallback((nextStep) => {
    setDirection(nextStep > step ? 1 : -1);
    setStep(nextStep);
  }, [step]);

  const canProceedStep1 = useMemo(
    () => preferredDate && timeSlot && address.trim().length >= 5,
    [preferredDate, timeSlot, address]
  );

  /* ── location detect ── */
  function handleDetectLocation() {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await resp.json();
          setAddress(data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        } catch {
          setAddress(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        } finally {
          setDetectingLocation(false);
          toast.success("Location detected!");
        }
      },
      () => {
        toast.error("Could not detect location. Please enter manually.");
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  /* ── razorpay loader ── */
  const loadRazorpayScript = useCallback(
    () =>
      new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        document.body.appendChild(s);
      }),
    []
  );

  /* ── pay & book ── */
  async function handlePayment() {
    setLoading(true);
    try {
      const res = await api.post("/quick-bookings", {
        contractorId,
        serviceName,
        servicePrice,
        preferredDate,
        timeSlot,
        address,
      });
      const orderData = res.data.data || res.data;

      // mock mode
      if (orderData.razorpayKey === "mock_key_only_for_dev") {
        toast.loading("Simulating payment…", { id: "mock_pay" });
        setTimeout(async () => {
          try {
            const verifyRes = await api.post("/quick-bookings/verify", {
              razorpay_order_id: orderData.razorpayOrderId,
              razorpay_payment_id: `mock_payment_${Date.now()}`,
              razorpay_signature: "mock_signature",
              booking_id: orderData.booking?.id,
            });
            toast.success("Payment confirmed!", { id: "mock_pay" });
            setBookingResult(verifyRes.data.data || verifyRes.data || orderData);
            goTo(3);
          } catch {
            toast.error("Mock payment failed.", { id: "mock_pay" });
          } finally {
            setLoading(false);
          }
        }, 1200);
        return;
      }

      // real razorpay
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        toast.error("Could not load Razorpay. Please check your connection.");
        setLoading(false);
        return;
      }

      const amountPaise = Math.round(CONFIRMATION_FEE * 100);
      const rzp = new window.Razorpay({
        key: orderData.razorpayKey,
        amount: amountPaise,
        currency: "INR",
        name: "Thekedaar",
        description: `Quick Booking – ${serviceName}`,
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: { color: "#6366f1" },
        handler: async (response) => {
          setLoading(true);
          try {
            const verifyRes = await api.post("/quick-bookings/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              booking_id: orderData.booking?.id,
            });
            toast.success("Payment confirmed! Booking secured.");
            setBookingResult(verifyRes.data.data || verifyRes.data || orderData);
            goTo(3);
          } catch {
            toast.error("Payment verification failed. Contact support.");
          } finally {
            setLoading(false);
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });

      rzp.on("payment.failed", (response) => {
        toast.error(response?.error?.description || "Payment failed.");
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed. Please try again.");
      setLoading(false);
    }
  }

  /* ── simulate payment (fallback button) ── */
  async function handleSimulatePayment() {
    setLoading(true);
    toast.loading("Simulating payment…", { id: "sim_pay" });
    try {
      const res = await api.post("/quick-bookings", {
        contractorId,
        serviceName,
        servicePrice,
        preferredDate,
        timeSlot,
        address,
      });
      const orderData = res.data.data || res.data;

      const verifyRes = await api.post("/quick-bookings/verify", {
        razorpay_order_id: orderData.razorpayOrderId || `sim_order_${Date.now()}`,
        razorpay_payment_id: `sim_payment_${Date.now()}`,
        razorpay_signature: "simulated_signature",
        booking_id: orderData.booking?.id,
      });
      toast.success("Payment simulated successfully!", { id: "sim_pay" });
      setBookingResult(verifyRes.data.data || verifyRes.data || orderData);
      goTo(3);
    } catch {
      toast.error("Simulated payment failed.", { id: "sim_pay" });
    } finally {
      setLoading(false);
    }
  }

  const displayName = contractor?.business_name || contractor?.name || contractor?.user_name || "Contractor";
  const initial = displayName[0]?.toUpperCase() || "?";
  const photoUrl = contractor?.photo_url || contractor?.profile_photo;
  const contractorPhone = contractor?.phone || contractor?.user_phone || "";
  const whatsappLink = contractorPhone
    ? `https://wa.me/91${contractorPhone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(`Hi, I booked ${serviceName} on Thekedaar. My booking ID: ${bookingResult?.booking?.id || "N/A"}`)}`
    : "";

  if (contractorLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] pt-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-4 pb-20 pt-24 md:px-6 transition-colors duration-300">
      <div className="mx-auto max-w-xl">
        {/* back button */}
        <button
          type="button"
          onClick={() => (step > 1 && step < 3 ? goTo(step - 1) : navigate(-1))}
          className="mb-6 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] transition-colors hover:text-[var(--color-heading)]"
        >
          <FiChevronLeft size={16} />
          {step > 1 && step < 3 ? "Back" : "Go Back"}
        </button>

        {/* header block */}
        <section className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:p-6 shadow-sm">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
            Quick Booking
          </p>
          <h1 className="font-display text-xl font-bold text-[var(--color-heading)] md:text-2xl">
            {serviceName}
          </h1>
          {servicePrice > 0 && (
            <p className="mt-1 text-base font-semibold text-[var(--color-muted)]">
              Base Price: {money(servicePrice)}
            </p>
          )}
        </section>

        {/* step indicator */}
        <div className="mb-8 flex items-center justify-between gap-2 px-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-1.5">
                  <motion.div
                    animate={{
                      scale: isActive ? 1.05 : 1,
                      backgroundColor: isDone
                        ? "var(--color-primary)"
                        : isActive
                        ? "var(--color-primary)"
                        : "var(--color-border)",
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors"
                  >
                    {isDone ? (
                      <FiCheck size={16} />
                    ) : (
                      <Icon size={14} className={isActive ? "text-white" : "text-[var(--color-muted)]"} />
                    )}
                  </motion.div>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider ${
                      isActive || isDone ? "text-[var(--color-heading)]" : "text-[var(--color-muted)]"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="mb-4 h-0.5 flex-1 rounded-full bg-[var(--color-border)] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-[var(--color-primary)]"
                      initial={{ width: "0%" }}
                      animate={{ width: step > s.id ? "100%" : "0%" }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* step content */}
        <AnimatePresence mode="wait" custom={direction}>
          {/* STEP 1: Details */}
          {step === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="space-y-6"
            >
              {/* contractor card */}
              <div className="card rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] p-4 shadow-sm">
                <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Your Professional
                </p>
                <div className="flex items-center gap-4">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={displayName}
                      className="h-12 w-12 rounded-[var(--radius-md)] object-cover bg-[var(--color-bg-elevated)] border border-[var(--color-border)] shadow-sm"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-muted)] text-[var(--color-primary)] font-bold border border-[var(--color-border)]">
                      {initial}
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-bold text-[var(--color-heading)]">{displayName}</h3>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--color-muted)] font-semibold">
                      {contractor?.rating && (
                        <span className="flex items-center gap-0.5 text-amber-500">
                          <FiStar size={12} className="fill-amber-500" />
                          {contractor.rating}
                        </span>
                      )}
                      <span>{contractor?.category || contractor?.trade || "Professional"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* preferred date */}
              <div className="card rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] p-5 shadow-sm">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                    <FiCalendar size={13} className="text-[var(--color-primary)]" /> Preferred Date
                  </span>
                  <input
                    type="date"
                    value={preferredDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="input-field w-full"
                  />
                </label>
              </div>

              {/* time slot */}
              <div className="card rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] p-5 shadow-sm">
                <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                  <FiClock size={13} className="text-[var(--color-primary)]" /> Time Slot
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setTimeSlot(slot.id)}
                      className={`group relative rounded-[var(--radius-sm)] border-2 p-3 text-center transition-all duration-150 ${
                        timeSlot === slot.id
                          ? "border-[var(--color-primary)] bg-[var(--color-primary-muted)]"
                          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-hover)]"
                      }`}
                    >
                      <span className="mb-1 block text-lg">{slot.icon}</span>
                      <span
                        className={`block text-xs font-bold ${
                          timeSlot === slot.id ? "text-[var(--color-heading)]" : "text-[var(--color-muted)]"
                        }`}
                      >
                        {slot.label}
                      </span>
                      <span className="block text-[9px] text-[var(--color-muted)]">{slot.time}</span>
                      {timeSlot === slot.id && (
                        <div className="absolute -right-1.5 -top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-xs">
                          <FiCheck size={10} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* address */}
              <div className="card rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] p-5 shadow-sm">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                    <FiMapPin size={13} className="text-[var(--color-primary)]" /> Service Address
                  </span>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your full address — flat no., building, area, landmark…"
                    rows={3}
                    className="input-field w-full resize-none"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={detectingLocation}
                  className="mt-3 flex items-center gap-2 rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2 text-xs font-semibold text-[var(--color-body)] transition-all hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
                >
                  {detectingLocation ? (
                    <LoadingSpinner size="xs" />
                  ) : (
                    <FiNavigation size={12} className="text-[var(--color-primary)]" />
                  )}
                  {detectingLocation ? "Detecting…" : "Detect my location"}
                </button>
              </div>

              {/* next button */}
              <button
                type="button"
                onClick={() => {
                  if (!canProceedStep1) {
                    toast.error("Please fill all fields — date, time slot, and address.");
                    return;
                  }
                  goTo(2);
                }}
                disabled={!canProceedStep1}
                className="btn-primary flex h-12 w-full items-center justify-center gap-2 text-sm font-semibold tracking-wide disabled:opacity-50"
              >
                Continue to Payment
                <FiChevronRight size={16} />
              </button>
            </motion.div>
          )}

          {/* STEP 2: Confirm & Pay */}
          {step === 2 && (
            <motion.div
              key="step-2"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="space-y-6"
            >
              {/* booking summary */}
              <div className="card rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] p-5 shadow-sm">
                <p className="mb-3 text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Booking Summary
                </p>
                <div className="space-y-2">
                  <SummaryRow icon={<FiUser size={14} />} label="Professional" value={displayName} />
                  <SummaryRow icon={<FiStar size={14} />} label="Service" value={serviceName} />
                  {servicePrice > 0 && (
                    <SummaryRow icon={<FiCreditCard size={14} />} label="Service Price" value={money(servicePrice)} highlight />
                  )}
                  <SummaryRow icon={<FiCalendar size={14} />} label="Date" value={new Date(preferredDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} />
                  <SummaryRow icon={<FiClock size={14} />} label="Time Slot" value={TIME_SLOTS.find((s) => s.id === timeSlot)?.label + " (" + TIME_SLOTS.find((s) => s.id === timeSlot)?.time + ")"} />
                  <SummaryRow icon={<FiMapPin size={14} />} label="Address" value={address} />
                </div>
              </div>

              {/* payment card */}
              <div className="card rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2 border-b border-[var(--color-divider)] pb-3">
                  <FiCreditCard className="text-[var(--color-primary)]" size={16} />
                  <h2 className="font-display text-base font-bold text-[var(--color-heading)]">Confirmation Fee</h2>
                </div>

                <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-semibold text-[var(--color-body)]">Booking confirmation</span>
                    <span className="text-2xl font-bold text-[var(--color-heading)]">{money(CONFIRMATION_FEE)}</span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--color-muted)]">
                    A small fee to confirm your booking. The service cost is settled directly with the contractor on-site.
                  </p>
                </div>

                {/* secure tags */}
                <div className="space-y-2">
                  <div className="flex gap-2.5 rounded-[var(--radius-sm)] border border-[var(--color-divider)] bg-[var(--color-bg)] p-3">
                    <FiShield className="mt-0.5 shrink-0 text-[var(--color-primary)]" size={15} />
                    <p className="text-xs leading-relaxed text-[var(--color-body)]">
                      <strong className="text-[var(--color-heading)]">Verified professional.</strong> All Thekedaar contractors are background-checked and reviewed.
                    </p>
                  </div>
                  <div className="flex gap-2.5 rounded-[var(--radius-sm)] border border-[var(--color-divider)] bg-[var(--color-bg)] p-3">
                    <FiShield className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" size={15} />
                    <p className="text-xs leading-relaxed text-[var(--color-body)]">
                      Secure checkout via Razorpay. Your card details are never saved or stored.
                    </p>
                  </div>
                </div>

                {/* pay button */}
                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={loading}
                  className="btn-primary flex h-12 w-full items-center justify-center gap-2 text-sm font-semibold tracking-wide disabled:opacity-50"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    <>
                      Pay {money(CONFIRMATION_FEE)} via Razorpay
                      <FiArrowRight size={16} />
                    </>
                  )}
                </button>

                {/* simulate button */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    disabled={loading}
                    className="text-xs font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] underline transition-colors"
                  >
                    Simulate Payment (Dev Mode)
                  </button>
                </div>

                <p className="text-center text-[9px] font-bold uppercase tracking-wider text-[var(--color-subtle)]">
                  Secure checkout &bull; Powered by Razorpay
                </p>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Confirmed */}
          {step === 3 && (
            <motion.div
              key="step-3"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="space-y-5"
            >
              {/* success notification */}
              <div className="flex flex-col items-center text-center">
                <motion.div
                  variants={successPop}
                  initial="hidden"
                  animate="visible"
                  className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-muted)] text-[var(--color-primary)] border border-[var(--color-border)] shadow-xs"
                >
                  <FiCheck size={32} />
                </motion.div>
                <h2 className="font-display text-lg font-bold text-[var(--color-heading)]">
                  Booking Confirmed!
                </h2>
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-[var(--color-muted)] font-medium">
                  Your {serviceName} has been booked successfully. The contractor will reach out to you shortly.
                </p>
              </div>

              {/* booking details */}
              <div className="card rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] p-5 shadow-sm">
                <p className="mb-3 text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Booking Details
                </p>
                <div className="space-y-2">
                  {bookingResult?.booking?.id && (
                    <SummaryRow
                      icon={<FiCheck size={14} />}
                      label="Booking ID"
                      value={`#${bookingResult.booking.id}`}
                      highlight
                    />
                  )}
                  <SummaryRow icon={<FiUser size={14} />} label="Contractor" value={displayName} />
                  <SummaryRow icon={<FiStar size={14} />} label="Service" value={serviceName} />
                  <SummaryRow icon={<FiCalendar size={14} />} label="Date" value={new Date(preferredDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} />
                  <SummaryRow icon={<FiClock size={14} />} label="Time" value={TIME_SLOTS.find((s) => s.id === timeSlot)?.label || timeSlot} />
                  <SummaryRow icon={<FiMapPin size={14} />} label="Address" value={address} />
                  <SummaryRow icon={<FiCreditCard size={14} />} label="Fee Paid" value={money(CONFIRMATION_FEE)} highlight />
                </div>
              </div>

              {/* contact contractor */}
              <div className="card rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] p-5 shadow-sm">
                <p className="mb-3 text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Contact Contractor
                </p>
                <div className="flex items-center gap-3">
                  {photoUrl ? (
                    <img src={photoUrl} alt={displayName} className="h-11 w-11 rounded-[var(--radius-md)] object-cover bg-[var(--color-bg-elevated)] border border-[var(--color-border)] shadow-xs" />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-muted)] text-[var(--color-primary)] font-bold border border-[var(--color-border)]">
                      {initial}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[var(--color-heading)] text-sm truncate">{displayName}</p>
                    {contractorPhone && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--color-muted)] font-semibold">
                        <FiPhone size={12} />
                        {contractorPhone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  {contractorPhone && (
                    <a
                      href={`tel:${contractorPhone}`}
                      className="btn-ghost border border-[var(--color-border)] text-xs rounded-[var(--radius-sm)] flex items-center justify-center gap-2 py-2.5 font-bold"
                    >
                      <FiPhone size={14} />
                      Call
                    </a>
                  )}
                  {whatsappLink && (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary rounded-[var(--radius-sm)] flex items-center justify-center gap-2 py-2.5 text-xs text-white font-bold"
                    >
                      <FiMessageCircle size={14} />
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {/* track booking */}
              <button
                type="button"
                onClick={() => navigate("/customer/dashboard")}
                className="btn-primary flex h-12 w-full items-center justify-center gap-2 text-sm font-semibold tracking-wide"
              >
                Track Booking
                <FiArrowRight size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

/* ── helper components ── */
function SummaryRow({ icon, label, value, highlight = false }) {
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--color-divider)] bg-[var(--color-bg-elevated)] px-3.5 py-2.5">
      <span className="mt-0.5 shrink-0 text-[var(--color-primary)]">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)]">{label}</p>
        <p
          className={`mt-0.5 text-xs font-bold break-words leading-tight ${
            highlight ? "text-[var(--color-primary)]" : "text-[var(--color-heading)]"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

