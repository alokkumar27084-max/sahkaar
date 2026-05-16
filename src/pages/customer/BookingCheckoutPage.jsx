import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FiBriefcase, FiCalendar, FiCheckCircle, FiChevronLeft, FiCreditCard, FiLock, FiMapPin, FiShield } from "react-icons/fi";
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
          serviceTier: quote ? "custom" : serviceTier,
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
  }, [contractor, projectValue, serviceTier, state?.quoteId]);

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
    <main className="min-h-screen bg-[var(--color-bg)] px-4 pb-16 pt-24 md:px-6">
      <div className="mx-auto max-w-6xl">
        <button type="button" onClick={() => navigate(-1)} className="mb-6 flex items-center text-sm font-bold text-[var(--color-muted)] hover:text-[var(--color-heading)]">
          <FiChevronLeft className="mr-1" size={18} /> Back
        </button>

        <section className="mb-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--color-primary)]">Secure checkout</p>
          <h1 className="font-display text-3xl font-black text-[var(--color-heading)] md:text-5xl">Book with escrow protection</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-muted)] md:text-base">
            Review the job, pin the service location, and continue to Razorpay. Your payment is tracked against this booking before work begins.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {STEPS.map((step) => (
              <span
                key={step.id}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
                  stepProgress >= step.id ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-heading)]" : "border-[var(--color-border)] text-[var(--color-muted)]"
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${stepProgress > step.id ? "bg-emerald-500 text-white" : stepProgress === step.id ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-border)]"}`}>
                  {stepProgress > step.id ? "✓" : step.id}
                </span>
                {step.label}
              </span>
            ))}
          </div>
        </section>

        <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">Professional</p>
              <div className="flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-xl font-black text-white">
                  {initial}
                </div>
                <div>
                  <h2 className="text-xl font-black text-[var(--color-heading)]">{displayName}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-[var(--color-primary)]">
                    <FiBriefcase size={14} /> {contractor.category || contractor.trade || "General Service"}
                  </p>
                </div>
              </div>
            </section>



            {quote && (
              <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">Quotation details</p>
                <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                  {quote.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-[var(--color-body)]">{item.title}</span>
                      <span className="font-bold text-[var(--color-heading)]">{money(item.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-[var(--color-border)] pt-2 font-black text-[var(--color-heading)]">
                    <span>Quoted Total</span>
                    <span>{money(quote.total_amount)}</span>
                  </div>
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">Service location</p>
              <LocationSearchInput
                value={addressInput}
                onChange={setAddressInput}
                onSelect={(selection) => {
                  setSelectedLocation(selection);
                  setAddressInput(selection.address);
                  saveLocationSnapshot(selection);
                }}
                placeholder="Search address, society, market, or landmark"
              />
              <div className={`mt-4 rounded-xl border p-4 ${selectedLocation?.lat ? "border-emerald-500/30 bg-emerald-500/[0.06]" : "border-[var(--color-border)] bg-[var(--color-bg)]"}`}>
                {selectedLocation?.lat && selectedLocation?.lng ? (
                  <div className="flex gap-3">
                    <FiCheckCircle className="mt-0.5 shrink-0 text-emerald-600" size={20} />
                    <div>
                      <p className="font-bold text-[var(--color-heading)]">Location pinned</p>
                      <p className="mt-1 text-sm text-[var(--color-body)]">{addressInput}</p>
                      <button type="button" onClick={() => requestLocation()} className="mt-2 text-xs font-bold text-[var(--color-primary)] hover:underline">
                        Use current GPS instead
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="mb-3 text-sm text-[var(--color-body)]">Pin your location so the contractor can reach the right place.</p>
                    <button type="button" onClick={() => requestLocation()} disabled={geoLoading} className="btn-secondary mx-auto">
                      {geoLoading ? <LoadingSpinner size="sm" /> : <FiMapPin />}
                      Use current location
                    </button>
                    {geoError && <p className="mt-2 text-xs font-semibold text-rose-500">{geoError}</p>}
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

            <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className={quote ? "opacity-50 pointer-events-none" : ""}>
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">
                    {serviceTier === "macro" ? "Estimated project value" : "Service budget"}
                  </span>
                  <input className="input-field" type="number" min={149} step="50" value={projectValue} onChange={(event) => setProjectValue(Number(event.target.value) || 0)} placeholder="Rs Amount" readOnly={!!quote} />
                </label>
                <label>
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">Schedule</span>
                  <div className="relative">
                    <FiCalendar className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
                    <input className="input-field !pl-10" type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} />
                  </div>
                </label>
              </div>
              <label className="mt-4 block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">Notes</span>
                <textarea className="input-field min-h-[96px] resize-y" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Access instructions, parking, materials..." />
              </label>
            </section>
          </div>

          <aside className="lg:sticky lg:top-28">
            <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl">
              <div className="mb-4 flex items-center gap-2 text-[var(--color-heading)]">
                <FiCreditCard className="text-[var(--color-primary)]" />
                <h2 className="font-display text-xl font-black">Payment summary</h2>
              </div>

              <div className="mb-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-[var(--color-muted)]">{serviceTier === "macro" ? "Project estimate" : "Protected total"}</span>
                  <span className="font-black text-[var(--color-heading)]">{money(pricing?.estimatedProjectValue || projectValue)}</span>
                </div>
                {pricingLoading ? (
                  <p className="mt-3 text-xs text-[var(--color-muted)]">Calculating escrow...</p>
                ) : pricing?.milestoneDetails?.length ? (
                  <div className="mt-4 space-y-2 border-t border-[var(--color-border)] pt-4">
                    {pricing.milestoneDetails.map((item) => (
                      <div key={item.title} className="flex justify-between gap-4 text-xs">
                        <span className="text-[var(--color-body)]">{item.title}</span>
                        <span className="font-bold text-[var(--color-heading)]">{money(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="mb-2 flex items-baseline justify-between gap-4">
                <span className="font-bold text-[var(--color-heading)]">Pay now</span>
                <span className="text-3xl font-black text-[var(--color-heading)]">{money(payableNow)}</span>
              </div>
              <p className="mb-6 text-xs leading-relaxed text-[var(--color-muted)]">
                This amount is collected for the booking and tracked against Razorpay payment verification.
              </p>

              <div className="mb-6 space-y-3">
                <div className="flex gap-3 rounded-xl border border-indigo-500/15 bg-indigo-500/[0.06] p-3">
                  <FiLock className="mt-0.5 shrink-0 text-indigo-500" size={18} />
                  <p className="text-xs leading-relaxed text-[var(--color-body)]">
                    <strong className="text-[var(--color-heading)]">Escrow protection.</strong>{" "}
                    {pricing?.customerCopy || "Funds are recorded safely and released as work is completed."}
                  </p>
                </div>
                <div className="flex gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.06] p-3">
                  <FiShield className="mt-0.5 shrink-0 text-emerald-600" size={18} />
                  <p className="text-xs leading-relaxed text-[var(--color-body)]">
                    Payments are processed by Razorpay. Card details are never stored on Thekedaar servers.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleBookAndPay}
                disabled={loading || !selectedLocation?.lat || pricingLoading || !pricing}
                className={`btn-primary h-14 w-full justify-center text-base font-black ${loading || !selectedLocation?.lat || pricingLoading || !pricing ? "cursor-not-allowed opacity-60" : ""}`}
              >
                {loading ? <LoadingSpinner /> : `Continue to Razorpay - ${money(payableNow)}`}
              </button>
              <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                Secure checkout | Powered by Razorpay
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
