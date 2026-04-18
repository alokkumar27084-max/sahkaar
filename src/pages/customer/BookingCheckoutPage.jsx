import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FiMapPin,
  FiBriefcase,
  FiLock,
  FiCheckCircle,
  FiChevronLeft,
  FiCalendar,
  FiShield,
  FiCreditCard,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { bookingAPI } from "../../services/api";
import { useGeolocation } from "../../hooks/useGeolocation";
import LocationSearchInput from "../../components/common/LocationSearchInput";
import ContractorMapPanel from "../../components/common/ContractorMapPanel";
import { inferServiceTier, getSuggestedProjectValue } from "../../utils/bookingPricing";
import { readSavedLocation, saveLocationSnapshot } from "../../utils/locationStorage";
import { reverseGeocodeCoords } from "../../utils/googleMaps";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const STEPS = [
  { id: 1, label: "Details" },
  { id: 2, label: "Location" },
  { id: 3, label: "Pay" },
];

export default function BookingCheckoutPage() {
  useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lat, lng, address, loading: geoLoading, request: requestLocation, error: geoError } = useGeolocation();
  const [contractor] = useState(state?.contractor || null);
  const [notes, setNotes] = useState("");
  const [serviceTier, setServiceTier] = useState(() => inferServiceTier(state?.contractor || null));
  const [projectValue, setProjectValue] = useState(() =>
    getSuggestedProjectValue(state?.contractor || null, inferServiceTier(state?.contractor || null))
  );
  const [pricing, setPricing] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [addressInput, setAddressInput] = useState(() => readSavedLocation()?.address || "");
  const [selectedLocation, setSelectedLocation] = useState(() => {
    const saved = readSavedLocation();
    return saved?.lat && saved?.lng ? saved : null;
  });
  const [scheduledFor, setScheduledFor] = useState("");
  const [loading, setLoading] = useState(false);

  // Fix stale localStorage / old builds that stored the literal "Selected Location"
  useEffect(() => {
    let cancelled = false;
    const saved = readSavedLocation();
    if (!saved?.lat || !saved?.lng) return;
    const a = (saved.address || "").trim().toLowerCase();
    if (a && a !== "selected location" && a !== "location detected") return;

    (async () => {
      const resolved =
        (await reverseGeocodeCoords(saved.lat, saved.lng)) ||
        `Near ${Number(saved.lat).toFixed(5)}, ${Number(saved.lng).toFixed(5)}`;
      if (cancelled) return;
      setAddressInput(resolved);
      const snap = { address: resolved, lat: Number(saved.lat), lng: Number(saved.lng) };
      setSelectedLocation(snap);
      saveLocationSnapshot(snap);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const stepProgress = useMemo(() => {
    let s = 1;
    if (selectedLocation?.lat && selectedLocation?.lng && addressInput?.trim()) s = 2;
    if (s === 2 && pricing && !pricingLoading) s = 3;
    return s;
  }, [selectedLocation, addressInput, pricing, pricingLoading]);

  useEffect(() => {
    if (!contractor) {
      toast.error("Contractor details missing.");
      navigate("/search");
    }
  }, [contractor, navigate]);

  useEffect(() => {
    if (!address || !lat || !lng) return;
    const snapshot = { address, lat, lng };
    setSelectedLocation(snapshot);
    setAddressInput(address);
    saveLocationSnapshot(snapshot);
  }, [address, lat, lng]);

  useEffect(() => {
    if (!contractor) return;
    let active = true;
    async function fetchQuote() {
      setPricingLoading(true);
      try {
        const res = await bookingAPI.quote({
          contractorId: contractor.id,
          serviceTier,
          estimatedProjectValue: projectValue,
        });
        if (active) setPricing(res.data.data);
      } catch (err) {
        if (active) toast.error(err.response?.data?.message || "Failed to prepare payment quote.");
      } finally {
        if (active) setPricingLoading(false);
      }
    }
    fetchQuote();
    return () => {
      active = false;
    };
  }, [contractor, projectValue, serviceTier]);

  const loadRazorpayScript = useCallback(
    () =>
      new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      }),
    []
  );

  async function handleBookAndPay() {
    if (!selectedLocation?.lat || !selectedLocation?.lng || !addressInput?.trim()) {
      toast.error("Please provide your location first to book.");
      return;
    }
    if (!pricing) {
      toast.error("Payment details are still loading. Please wait a moment.");
      return;
    }
    setLoading(true);
    try {
      const res = await bookingAPI.create({
        contractorId: contractor.id,
        serviceCategory: contractor.category || contractor.trade || "General Service",
        serviceTier,
        estimatedProjectValue: projectValue,
        notes,
        locationAddress: addressInput,
        addressLabel: addressInput,
        locationLat: selectedLocation.lat,
        locationLng: selectedLocation.lng,
        scheduledFor: scheduledFor || null,
      });
      const orderData = res.data.data;
      if (!orderData.razorpayOrderId) {
        toast.success("Booking created and protected on the platform.");
        setLoading(false);
        navigate("/customer/dashboard");
        return;
      }

      if (orderData.razorpayKey === "mock_key_only_for_dev") {
        toast.loading("Simulating payment (dev only)...", { id: "mock_pay" });
        setTimeout(async () => {
          try {
            await bookingAPI.verify({
              razorpay_order_id: orderData.razorpayOrderId,
              razorpay_payment_id: "mock_payment_" + Date.now(),
              razorpay_signature: "mock_signature",
              booking_id: orderData.booking.id,
            });
            toast.success("Payment secured in escrow (mock). Booking confirmed!", { id: "mock_pay" });
            navigate("/customer/dashboard");
          } catch {
            toast.error("Mock payment verification failed.", { id: "mock_pay" });
          } finally {
            setLoading(false);
          }
        }, 1200);
        return;
      }

      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        toast.error("Could not load Razorpay. Check your connection and try again.");
        setLoading(false);
        return;
      }

      const amountPaise = Math.round(Number(orderData.pricing?.amount || pricing.amount || 0) * 100);

      const options = {
        key: orderData.razorpayKey,
        amount: amountPaise,
        currency: "INR",
        name: "Thekedaar",
        description: `Escrow booking — ${contractor.category || contractor.trade || "Service"}`,
        order_id: orderData.razorpayOrderId,
        handler: async function (response) {
          setLoading(true);
          try {
            await bookingAPI.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              booking_id: orderData.booking.id,
            });
            toast.success("Payment secured in escrow. Booking confirmed!");
            navigate("/customer/dashboard");
          } catch {
            toast.error("Payment verification failed. Contact support with your order ID.");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: { color: "#6366f1" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        const msg = response?.error?.description || response?.error?.reason || "Payment failed";
        toast.error(msg);
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start booking.");
      setLoading(false);
    }
  }

  if (!contractor) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center pt-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const payableNow = pricing?.amount || 0;
  const initial = contractor.business_name?.[0] || contractor.name?.[0] || "?";

  return (
    <div className="bg-[var(--color-bg)] min-h-screen pt-24 pb-16 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center text-[var(--color-muted)] hover:text-[var(--color-heading)] mb-6 transition-colors text-sm font-medium"
        >
          <FiChevronLeft className="mr-1" size={18} /> Back
        </button>

        {/* Hero strip */}
        <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-gradient-to-br from-indigo-500/10 via-[var(--color-surface)] to-cyan-500/5 p-6 md:p-8 mb-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(99,102,241,0.12),transparent)] pointer-events-none" />
          <div className="relative">
            <p className="text-[var(--color-primary)] text-[10px] md:text-[11px] font-bold uppercase tracking-[0.25em] mb-2">
              Secure payment
            </p>
            <h1 className="font-display text-2xl md:text-4xl font-extrabold text-[var(--color-heading)] tracking-tight mb-2">
              Book & pay with escrow
            </h1>
            <p className="text-[var(--color-muted)] text-sm md:text-base max-w-2xl leading-relaxed">
              You’ll review everything below, then the{" "}
              <strong className="text-[var(--color-heading)]">Razorpay</strong> checkout opens in a secure window to
              complete payment. Funds stay protected until work milestones are met.
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              {STEPS.map((s, i) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
                    stepProgress >= s.id
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-heading)]"
                      : "border-[var(--color-border)] text-[var(--color-muted)]"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                      stepProgress >= s.id ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-border)] text-[var(--color-muted)]"
                    }`}
                  >
                    {stepProgress > s.id ? "✓" : s.id}
                  </span>
                  {s.label}
                  {i < STEPS.length - 1 && <span className="hidden sm:inline text-[var(--color-border)] mx-1">→</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_minmax(300px,380px)] gap-8 lg:gap-10 items-start">
          {/* Main column */}
          <div className="space-y-8">
            <section className="glass-card p-6 md:p-8 rounded-2xl space-y-6">
              <h2 className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-[0.15em]">Professional</h2>
              <div className="flex items-center gap-4 bg-[var(--color-surface)] p-4 rounded-2xl border border-[var(--color-border)]">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/20 to-cyan-500/10 text-[var(--color-primary)] font-bold flex items-center justify-center text-xl shrink-0 ring-2 ring-[var(--color-border)]">
                  {initial}
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-[var(--color-heading)]">
                    {contractor.business_name || contractor.name}
                  </h3>
                  <p className="text-[var(--color-primary)] font-medium text-sm flex items-center gap-1.5 mt-1">
                    <FiBriefcase size={14} /> {contractor.category || contractor.trade || "General Service"}
                  </p>
                </div>
              </div>
            </section>

            <section className="glass-card p-6 md:p-8 rounded-2xl space-y-4">
              <h2 className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-[0.15em]">Job type</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { id: "quick", title: "Chhota Kaam", copy: "Full amount held in escrow until completion." },
                  { id: "macro", title: "Bada Kaam", copy: "Milestone-style plan for larger projects." },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setServiceTier(option.id);
                      setProjectValue(getSuggestedProjectValue(contractor, option.id));
                    }}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      serviceTier === option.id
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/8 shadow-md ring-1 ring-[var(--color-primary)]/20"
                        : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/30"
                    }`}
                  >
                    <p className="font-semibold text-[var(--color-heading)]">{option.title}</p>
                    <p className="mt-1 text-sm text-[var(--color-body)] leading-snug">{option.copy}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="glass-card p-6 md:p-8 rounded-2xl space-y-4">
              <h2 className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-[0.15em]">Service location</h2>
              <LocationSearchInput
                value={addressInput}
                onChange={setAddressInput}
                onSelect={(selection) => {
                  setSelectedLocation(selection);
                  setAddressInput(selection.address);
                  saveLocationSnapshot(selection);
                }}
                placeholder="Search address, society, or landmark"
              />
              <div
                className={`p-5 rounded-2xl border ${
                  selectedLocation?.lat
                    ? "border-emerald-500/30 bg-emerald-500/[0.04]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)]"
                }`}
              >
                {!selectedLocation?.lat || !selectedLocation?.lng ? (
                  <div className="text-center py-2">
                    <p className="text-[var(--color-body)] mb-4 text-sm">
                      Pin your location so the professional can reach you on time.
                    </p>
                    <button
                      type="button"
                      onClick={() => requestLocation()}
                      disabled={geoLoading}
                      className="btn-outline-cyan mx-auto text-sm"
                    >
                      {geoLoading ? <LoadingSpinner size="sm" /> : <><FiMapPin className="mr-2 inline" /> Use my current location</>}
                    </button>
                    {geoError && <p className="text-rose-500 mt-3 text-xs">{geoError}</p>}
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <FiCheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={20} />
                    <div>
                      <p className="text-[var(--color-heading)] font-semibold mb-1">Location saved</p>
                      <p className="text-sm text-[var(--color-body)] leading-relaxed">{addressInput}</p>
                      <button
                        type="button"
                        onClick={() => requestLocation()}
                        className="text-[var(--color-primary)] text-xs mt-2 font-semibold hover:underline"
                      >
                        Update location
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {selectedLocation?.lat && selectedLocation?.lng && (
              <ContractorMapPanel
                center={{ lat: Number(selectedLocation.lat), lng: Number(selectedLocation.lng) }}
                currentLocationLabel={addressInput}
                contractors={[contractor]}
                heightClass="h-[240px] md:h-[280px]"
              />
            )}

            <section className="glass-card p-6 md:p-8 rounded-2xl space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h2 className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-[0.15em] mb-3">
                    {serviceTier === "macro" ? "Estimated project value" : "Service budget"}
                  </h2>
                  <input
                    type="number"
                    min={149}
                    step="50"
                    value={projectValue}
                    onChange={(e) => setProjectValue(Number(e.target.value) || 0)}
                    className="input-field"
                    placeholder="₹ Amount"
                  />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-[0.15em] mb-3">Schedule</h2>
                  <div className="relative">
                    <FiCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] pointer-events-none" />
                    <input
                      type="datetime-local"
                      value={scheduledFor}
                      onChange={(e) => setScheduledFor(e.target.value)}
                      className="input-field !pl-10"
                    />
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-[0.15em] mb-3">Notes (optional)</h2>
                <textarea
                  className="input-field min-h-[96px] resize-y"
                  placeholder="Access instructions, parking, materials…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </section>
          </div>

          {/* Sticky summary */}
          <aside className="lg:sticky lg:top-28 space-y-4">
            <div className="glass-card p-6 md:p-7 rounded-2xl border border-[var(--color-border)] shadow-xl shadow-black/5">
              <div className="flex items-center gap-2 mb-4 text-[var(--color-heading)]">
                <FiCreditCard className="text-[var(--color-primary)]" />
                <span className="font-display font-bold text-lg">Payment summary</span>
              </div>

              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 mb-4">
                <div className="flex justify-between items-start gap-3 text-sm">
                  <span className="text-[var(--color-muted)]">
                    {serviceTier === "macro" ? "Project estimate" : "Protected total"}
                  </span>
                  <span className="font-bold text-[var(--color-heading)]">
                    ₹{Number(pricing?.estimatedProjectValue || projectValue || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                {pricingLoading ? (
                  <p className="mt-3 text-xs text-[var(--color-muted)]">Calculating escrow…</p>
                ) : pricing?.milestoneDetails?.length ? (
                  <div className="mt-4 space-y-2 pt-4 border-t border-[var(--color-border)]">
                    {pricing.milestoneDetails.map((item) => (
                      <div key={item.title} className="flex justify-between text-xs">
                        <span className="text-[var(--color-body)]">{item.title}</span>
                        <span className="font-semibold text-[var(--color-heading)]">
                          ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex justify-between items-baseline mb-2">
                <span className="text-[var(--color-heading)] font-semibold">Pay now</span>
                <span className="text-3xl font-black text-[var(--color-heading)] tracking-tight">
                  ₹{Number(payableNow || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-muted)] mb-6 leading-relaxed">
                This is the amount collected today into escrow for this booking. GST may apply as per invoice from the
                professional.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex gap-3 p-3 rounded-xl bg-indigo-500/[0.06] border border-indigo-500/15">
                  <FiLock className="text-indigo-500 shrink-0 mt-0.5" size={18} />
                  <p className="text-xs text-[var(--color-body)] leading-relaxed">
                    <strong className="text-[var(--color-heading)]">Escrow.</strong>{" "}
                    {pricing?.customerCopy || "Funds are held safely and released as work is completed."}
                  </p>
                </div>
                <div className="flex gap-3 p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15">
                  <FiShield className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                  <p className="text-xs text-[var(--color-body)] leading-relaxed">
                    Payments are processed by <strong>Razorpay</strong>. We never store your card on our servers.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleBookAndPay}
                disabled={loading || !selectedLocation?.lat || pricingLoading || !pricing}
                className={`btn-primary w-full h-14 text-base font-bold shadow-glow ${
                  !selectedLocation?.lat || loading || pricingLoading || !pricing ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    Continue to Razorpay — ₹{Number(payableNow || 0).toLocaleString("en-IN")}
                  </>
                )}
              </button>
              <p className="text-center text-[10px] text-[var(--color-muted)] mt-3 uppercase tracking-wider">
                Secure checkout · Powered by Razorpay
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
