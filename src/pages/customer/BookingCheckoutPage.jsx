import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FiBriefcase, FiCalendar, FiCheckCircle, FiChevronLeft, FiCreditCard, FiMapPin, FiShield } from "react-icons/fi";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { bookingAPI, contractorAPI, quoteAPI } from "../../services/api";
import { useGeolocation } from "../../hooks/useGeolocation";
import LocationSearchInput from "../../components/common/LocationSearchInput";
import ContractorMapPanel from "../../components/common/ContractorMapPanel";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { inferServiceTier, getSuggestedProjectValue } from "../../utils/bookingPricing";
import { readSavedLocation, saveLocationSnapshot } from "../../utils/locationStorage";
import { reverseGeocodeCoords } from "../../utils/googleMaps";

const STEPS = [
  { id: 1, label: "Details" },
  { id: 2, label: "Location" },
  { id: 3, label: "Payment" },
];

function money(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function BookingCheckoutPage() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lat, lng, address, loading: geoLoading, request: requestLocation, error: geoError } = useGeolocation();

  const [contractor, setContractor] = useState(state?.contractor || null);
  const [contractorLoading, setContractorLoading] = useState(!state?.contractor);
  const [serviceTier, setServiceTier] = useState(() => inferServiceTier(state?.contractor || null));
  const [projectValue, setProjectValue] = useState(() => getSuggestedProjectValue(state?.contractor || null, inferServiceTier(state?.contractor || null)));
  const [pricing, setPricing] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [addressInput, setAddressInput] = useState(() => readSavedLocation()?.address || "");
  const [selectedLocation, setSelectedLocation] = useState(() => {
    const saved = readSavedLocation();
    return saved?.lat && saved?.lng ? saved : null;
  });
  const [scheduledFor, setScheduledFor] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(!!state?.quoteId);

  useEffect(() => {
    let active = true;
    if (contractor || !id) {
      setContractorLoading(false);
      return undefined;
    }
    async function loadContractor() {
      setContractorLoading(true);
      try {
        const res = await contractorAPI.getById(id);
        if (!active) return;
        const nextContractor = res.data.contractor;
        setContractor(nextContractor);
        const nextTier = inferServiceTier(nextContractor);
        setServiceTier(nextTier);
        setProjectValue(getSuggestedProjectValue(nextContractor, nextTier));
      } catch {
        toast.error("Contractor details could not be loaded.");
        navigate("/search");
      } finally {
        if (active) setContractorLoading(false);
      }
    }
    loadContractor();
    return () => {
      active = false;
    };
  }, [contractor, id, navigate]);

  useEffect(() => {
    if (!state?.quoteId) return;
    let active = true;
    async function loadQuote() {
      setLoadingQuote(true);
      try {
        const res = await quoteAPI.getQuoteById(state.quoteId);
        if (active) {
          setQuote(res.data.quote);
          setProjectValue(res.data.quote.total_amount);
          setServiceTier("custom");
        }
      } catch (err) {
        toast.error("Failed to load quote details.");
      } finally {
        if (active) setLoadingQuote(false);
      }
    }
    loadQuote();
    return () => { active = false; };
  }, [state?.quoteId]);

  useEffect(() => {
    let cancelled = false;
    const saved = readSavedLocation();
    if (!saved?.lat || !saved?.lng) return undefined;
    const currentAddress = (saved.address || "").trim().toLowerCase();
    if (currentAddress && currentAddress !== "selected location" && currentAddress !== "location detected") return undefined;

    (async () => {
      const resolved =
        (await reverseGeocodeCoords(saved.lat, saved.lng)) ||
        `Near ${Number(saved.lat).toFixed(5)}, ${Number(saved.lng).toFixed(5)}`;
      if (cancelled) return;
      const snapshot = { address: resolved, lat: Number(saved.lat), lng: Number(saved.lng) };
      setAddressInput(resolved);
      setSelectedLocation(snapshot);
      saveLocationSnapshot(snapshot);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!address || !lat || !lng) return;
    const snapshot = { address, lat, lng };
    setSelectedLocation(snapshot);
    setAddressInput(address);
    saveLocationSnapshot(snapshot);
  }, [address, lat, lng]);

  useEffect(() => {
    if (!contractor || quote) return undefined;
    let active = true;
    async function fetchQuote() {
      setPricingLoading(true);
      try {
        const res = await bookingAPI.quote({
          contractorId: contractor.id,
          quoteId: state?.quoteId,
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
  }, [contractor, projectValue, quote, serviceTier, state?.quoteId]);

  const stepProgress = useMemo(() => {
    if (pricing && !pricingLoading) return 3;
    if (selectedLocation?.lat && selectedLocation?.lng && addressInput?.trim()) return 2;
    return 1;
  }, [addressInput, pricing, pricingLoading, selectedLocation]);

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
    if (!selectedLocation?.lat || !selectedLocation?.lng || !addressInput.trim()) {
      toast.error("Please pin your service location first.");
      return;
    }
    if (!pricing) {
      toast.error("Payment quote is still loading.");
      return;
    }

    setLoading(true);
    try {
      const res = await bookingAPI.create({
        contractorId: contractor.id,
        quoteId: state?.quoteId,
        serviceCategory: contractor.category || contractor.trade || "General Service",
        serviceTier: quote ? "custom" : serviceTier,
        estimatedProjectValue: projectValue,
        notes,
        locationAddress: addressInput,
        addressLabel: addressInput,
        locationLat: selectedLocation.lat,
        locationLng: selectedLocation.lng,
        scheduledFor: scheduledFor || null,
      });
      const orderData = res.data.data;

      if (orderData.razorpayKey === "mock_key_only_for_dev") {
        toast.loading("Simulating payment in development...", { id: "mock_pay" });
        setTimeout(async () => {
          try {
            await bookingAPI.verify({
              razorpay_order_id: orderData.razorpayOrderId,
              razorpay_payment_id: `mock_payment_${Date.now()}`,
              razorpay_signature: "mock_signature",
              booking_id: orderData.booking.id,
            });
            toast.success("Payment secured in escrow. Booking confirmed.", { id: "mock_pay" });
            navigate("/customer/dashboard");
          } catch {
            toast.error("Mock payment verification failed.", { id: "mock_pay" });
          } finally {
            setLoading(false);
          }
        }, 900);
        return;
      }

      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        toast.error("Could not load Razorpay. Check your connection and try again.");
        setLoading(false);
        return;
      }

      const amountPaise = Math.round(Number(orderData.pricing?.amount || pricing.amount || 0) * 100);
      const rzp = new window.Razorpay({
        key: orderData.razorpayKey,
        amount: amountPaise,
        currency: "INR",
        name: "Thekedaar",
        description: `Escrow booking - ${contractor.category || contractor.trade || "Service"}`,
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
            await bookingAPI.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              booking_id: orderData.booking.id,
            });
            toast.success("Payment secured in escrow. Booking confirmed.");
            navigate("/customer/dashboard");
          } catch {
            toast.error("Payment verification failed. Contact support with your order ID.");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      rzp.on("payment.failed", (response) => {
        toast.error(response?.error?.description || response?.error?.reason || "Payment failed");
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start booking.");
      setLoading(false);
    }
  }

  if (!contractor || contractorLoading || loadingQuote) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] pt-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const payableNow = pricing?.amount || 0;
  const initial = contractor.business_name?.[0] || contractor.name?.[0] || "?";
  const displayName = contractor.business_name || contractor.name || contractor.user_name || "Contractor";

  return (
    <main className="min-h-screen bg-[var(--color-bg-elevated)] px-4 pb-20 pt-24 md:px-6">
      <div className="mx-auto max-w-5xl">
        
        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors"
        >
          <FiChevronLeft className="mr-1.5" size={16} /> Back
        </button>

        {/* Page Title Card */}
        <section className="mb-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)]">Secure Escrow Checkout</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-heading)] mt-2 md:text-4xl">Confirm and pay</h1>
          <p className="mt-2 text-sm font-semibold text-[var(--color-muted)] leading-relaxed max-w-2xl">
            Your payment is held safely in escrow and only released to the contractor as they complete verified milestones.
          </p>
          
          {/* Progress Indicator */}
          <div className="mt-6 flex flex-wrap gap-3">
            {STEPS.map((step) => {
              const isCompleted = stepProgress > step.id;
              const isActive = stepProgress === step.id;
              return (
                <span
                  key={step.id}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                    isActive || isCompleted
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-heading)]"
                      : "border-[var(--color-border)] text-[var(--color-muted)]"
                  }`}
                >
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${isCompleted ? "bg-emerald-500 text-white" : isActive ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-border)] text-[var(--color-muted)]"}`}>
                    {isCompleted ? "✓" : step.id}
                  </span>
                  {step.label}
                </span>
              );
            })}
          </div>
        </section>

        {/* 2-Column Grid */}
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
          
          {/* Left Column: Checkout Form Details */}
          <div className="space-y-6">
            
            {/* Contractor Information Panel */}
            <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
              <span className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3">Booking Professional</span>
              <div className="flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/15 text-lg font-bold text-[var(--color-primary)]">
                  {initial}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-[var(--color-heading)]">{displayName}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)]">
                    <FiBriefcase size={12} /> {contractor.category || contractor.trade || "General Service"}
                  </p>
                </div>
              </div>
            </section>


            {/* Quoted Items (If quote exists) */}
            {quote && (
              <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
                <span className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3">Quotation Details</span>
                <div className="space-y-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 font-semibold">
                  {quote.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-[var(--color-body)]">{item.title}</span>
                      <span className="text-[var(--color-heading)] font-bold">{money(item.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-[var(--color-border)] pt-2 text-sm font-extrabold text-[var(--color-heading)]">
                    <span>Quoted Total</span>
                    <span>{money(quote.total_amount)}</span>
                  </div>
                </div>
              </section>
            )}

            {/* Service Location Pinner */}
            <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
              <span className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3">Service Address</span>
              <LocationSearchInput
                value={addressInput}
                onChange={setAddressInput}
                onSelect={(selection) => {
                  setSelectedLocation(selection);
                  setAddressInput(selection.address);
                  saveLocationSnapshot(selection);
                }}
                placeholder="Search address, society, market, or landmark base..."
              />
              
              <div className={`mt-4 rounded-xl border p-4 font-semibold ${selectedLocation?.lat ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-800" : "border-[var(--color-border)] bg-[var(--color-bg-elevated)]"}`}>
                {selectedLocation?.lat && selectedLocation?.lng ? (
                  <div className="flex gap-3">
                    <FiCheckCircle className="mt-0.5 shrink-0 text-emerald-600" size={18} />
                    <div className="text-xs">
                      <p className="font-extrabold text-[var(--color-heading)]">Coordinates Pinned Successfully</p>
                      <p className="mt-1 text-[var(--color-muted)] leading-relaxed font-semibold">{addressInput}</p>
                      <button type="button" onClick={() => requestLocation()} className="mt-2 text-[10px] font-bold text-[var(--color-primary)] hover:underline uppercase tracking-wider">
                        Use precise GPS coordinates
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs text-[var(--color-muted)] font-semibold mb-3">Add your service address to connect your contractor correctly.</p>
                    <button type="button" onClick={() => requestLocation()} disabled={geoLoading} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-4 py-2 text-xs font-bold text-[var(--color-heading)] bg-[var(--color-surface)] hover:bg-[var(--color-bg-elevated)] transition-all">
                      {geoLoading ? <LoadingSpinner size="sm" /> : <FiMapPin size={14} />}
                      Detect Location using GPS
                    </button>
                    {geoError && <p className="mt-2 text-xs font-bold text-rose-500">{geoError}</p>}
                  </div>
                )}
              </div>
            </section>

            {/* Map Preview Panel */}
            {selectedLocation?.lat && selectedLocation?.lng && (
              <div className="rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-sm">
                <ContractorMapPanel
                  center={{ lat: Number(selectedLocation.lat), lng: Number(selectedLocation.lng) }}
                  currentLocationLabel={addressInput}
                  contractors={[contractor]}
                  heightClass="h-[200px]"
                />
              </div>
            )}

            {/* Scheduling and Service Budget Section */}
            <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">
                    {serviceTier === "macro" ? "Estimated Project Value (₹)" : "Service Budget (₹)"}
                  </label>
                  <input className="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-heading)] font-semibold outline-none focus:border-[var(--color-primary)] transition-all" type="number" min={149} step="50" value={projectValue} onChange={(event) => setProjectValue(Number(event.target.value) || 0)} placeholder="Amount in Rs" readOnly={!!quote} />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Appointment Time</label>
                  <div className="relative">
                    <FiCalendar className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" size={14} />
                    <input className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-heading)] font-semibold outline-none focus:border-[var(--color-primary)] transition-all" type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} />
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Job Details & Notes (Optional)</label>
                <textarea className="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-heading)] font-semibold outline-none focus:border-[var(--color-primary)] transition-all min-h-[90px] resize-none" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Access instructions, building landmarks, parking, material choices..." />
              </div>
            </section>
          </div>

          {/* Right Column: Airbnb Sticky Payment Summary Box */}
          <aside className="lg:sticky lg:top-24">
            <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
              <div className="mb-4 flex items-center gap-2 text-[var(--color-heading)]">
                <FiCreditCard className="text-[var(--color-primary)]" size={18} />
                <h2 className="text-lg font-extrabold tracking-tight">Price details</h2>
              </div>

              {/* Fee Breakdown */}
              <div className="mb-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 font-semibold text-xs text-[var(--color-muted)] space-y-3">
                <div className="flex justify-between gap-4">
                  <span>{serviceTier === "macro" ? "Total project value" : "Base service cost"}</span>
                  <span className="font-extrabold text-[var(--color-heading)]">{money(pricing?.estimatedProjectValue || projectValue)}</span>
                </div>
                {pricingLoading ? (
                  <p className="text-[10px] text-[var(--color-muted)] italic">Computing escrow breakdown...</p>
                ) : pricing?.milestoneDetails?.length ? (
                  <div className="mt-3 space-y-2 border-t border-[var(--color-border)] pt-3">
                    {pricing.milestoneDetails.map((item) => (
                      <div key={item.title} className="flex justify-between gap-4">
                        <span>{item.title}</span>
                        <span className="font-bold text-[var(--color-heading)]">{money(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Total Payable Box */}
              <div className="mb-3 flex items-baseline justify-between gap-4 border-b border-[var(--color-border)] pb-3">
                <span className="font-extrabold text-[var(--color-heading)] text-sm">Payable now</span>
                <span className="text-2xl font-black text-[var(--color-heading)]">{money(payableNow)}</span>
              </div>
              <p className="mb-5 text-[10px] leading-relaxed text-[var(--color-muted)] font-semibold">
                Your funds are held securely in a multi-stage escrow account. The contractor only gets paid upon your project milestone approval.
              </p>

              {/* Escrow Lock Details */}
              <div className="mb-5 space-y-2">
                <div className="flex gap-2.5 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-3 text-xs leading-relaxed">
                  <FiShield className="shrink-0 text-emerald-600 mt-0.5" size={15} />
                  <p className="text-[var(--color-muted)] font-semibold text-[10px]">
                    <strong className="text-[var(--color-heading)]">100% Secure Escrow.</strong>{" "}
                    Funds are guarded securely and only released upon milestone completion via Razorpay. Zero hidden commissions.
                  </p>
                </div>
              </div>

              {/* Checkout CTA Button */}
              <button
                type="button"
                onClick={handleBookAndPay}
                disabled={loading || !selectedLocation?.lat || pricingLoading || !pricing}
                className="w-full text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                  boxShadow: "0 4px 14px rgba(79,70,229,0.3)",
                }}
              >
                {loading ? <LoadingSpinner size="sm" /> : `Pay with Razorpay · ${money(payableNow)}`}
              </button>
              
              <p className="mt-3 text-center text-[9px] font-extrabold uppercase tracking-widest text-[var(--color-muted)]">
                Secure transaction powered by Razorpay
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
