import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FiMapPin, FiBriefcase, FiLock, FiCheckCircle, FiChevronLeft, FiCalendar } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { bookingAPI } from "../../services/api";
import { useGeolocation } from "../../hooks/useGeolocation";
import LocationSearchInput from "../../components/common/LocationSearchInput";
import ContractorMapPanel from "../../components/common/ContractorMapPanel";
import { inferServiceTier, getSuggestedProjectValue } from "../../utils/bookingPricing";
import { readSavedLocation, saveLocationSnapshot } from "../../utils/locationStorage";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function BookingCheckoutPage() {
  useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lat, lng, address, loading: geoLoading, request: requestLocation, error: geoError } = useGeolocation();
  const [contractor] = useState(state?.contractor || null);
  const [notes, setNotes] = useState("");
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
  const [loading, setLoading] = useState(false);

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
        const res = await bookingAPI.quote({ contractorId: contractor.id, serviceTier, estimatedProjectValue: projectValue });
        if (active) setPricing(res.data.data);
      } catch (err) {
        if (active) toast.error(err.response?.data?.message || "Failed to prepare payment quote.");
      } finally {
        if (active) setPricingLoading(false);
      }
    }
    fetchQuote();
    return () => { active = false; };
  }, [contractor, projectValue, serviceTier]);

  const loadRazorpayScript = () => new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  async function handleBookAndPay() {
    if (!selectedLocation?.lat || !selectedLocation?.lng || !addressInput) {
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
        scheduledFor: scheduledFor || null
      });
      const orderData = res.data.data;
      if (!orderData.razorpayOrderId) {
        toast.success("Booking created and protected on the platform.");
        navigate("/customer/dashboard");
        return;
      }
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        toast.error("Failed to load Razorpay SDK.");
        setLoading(false);
        return;
      }
      const options = {
        key: orderData.razorpayKey,
        amount: Math.round(Number(orderData.pricing?.amount || pricing.amount || 0) * 100),
        currency: "INR",
        name: "Thekedaar",
        description: `Secure Escrow Booking: ${contractor.category || contractor.trade || "Service"}`,
        order_id: orderData.razorpayOrderId,
        handler: async function (response) {
          try {
            await bookingAPI.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              booking_id: orderData.booking.id,
            });
            toast.success("Payment secured in Escrow. Booking Confirmed!");
            navigate("/customer/dashboard");
          } catch {
            toast.error("Payment Verification Failed.");
          }
        },
        prefill: { name: user?.name || "", email: user?.email || "", contact: user?.phone || "" },
        theme: { color: "#0891b2" },
      };
      const rzp1 = new window.Razorpay(options);
      rzp1.on("payment.failed", function (response) {
        toast.error(`Payment Failed: ${response.error.description}`);
      });
      rzp1.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initialize booking.");
    } finally {
      setLoading(false);
    }
  }

  if (!contractor) return <div className="p-10 text-center">Loading...</div>;
  const payableNow = pricing?.amount || 0;
  return (
    <div className="bg-[var(--color-bg)] min-h-screen pt-20 pb-10 px-4 md:px-0">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center text-[var(--color-muted)] hover:text-[var(--color-heading)] mb-6 transition-colors"><FiChevronLeft className="mr-1" size={20} /> Back</button>
        <h1 className="font-display text-3xl font-bold text-[var(--color-heading)] mb-6">Booking Checkout</h1>
        <div className="glass-card p-6 md:p-8 rounded-2xl space-y-8">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-4">You are booking</h2>
            <div className="flex items-center gap-4 bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)]">
              <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold flex items-center justify-center text-xl shrink-0">{contractor.business_name?.[0] || contractor.name[0]}</div>
              <div>
                <h3 className="text-xl font-bold text-[var(--color-heading)]">{contractor.business_name || contractor.name}</h3>
                <p className="text-[var(--color-primary)] font-medium text-sm flex items-center gap-1.5 mt-1"><FiBriefcase /> {contractor.category || contractor.trade || "General Service"}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-4">Booking Type</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { id: "quick", title: "Chhota Kaam", copy: "Protect the full service amount in escrow." },
                { id: "macro", title: "Bada Kaam", copy: "Use milestone-based payments for bigger work." },
              ].map((option) => (
                <button key={option.id} type="button" onClick={() => { setServiceTier(option.id); setProjectValue(getSuggestedProjectValue(contractor, option.id)); }} className={`rounded-2xl border p-4 text-left transition-colors ${serviceTier === option.id ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" : "border-[var(--color-border)] bg-[var(--color-surface)]"}`}>
                  <p className="font-semibold text-[var(--color-heading)]">{option.title}</p>
                  <p className="mt-1 text-sm text-[var(--color-body)]">{option.copy}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-4">Service Location</h2>
            <div className="mb-4">
              <LocationSearchInput value={addressInput} onChange={setAddressInput} onSelect={(selection) => { setSelectedLocation(selection); setAddressInput(selection.address); saveLocationSnapshot(selection); }} placeholder="Search your exact address or landmark" />
            </div>
            <div className={`p-5 rounded-xl border ${selectedLocation?.lat ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5" : "border-[var(--color-border)] bg-[var(--color-surface)]"}`}>
              {!selectedLocation?.lat || !selectedLocation?.lng ? (
                <div className="text-center py-2">
                  <p className="text-[var(--color-body)] mb-4 text-sm">We need your exact location for the contractor to reach you effectively.</p>
                  <button onClick={() => requestLocation()} disabled={geoLoading} className="btn-outline-cyan mx-auto text-sm">
                    {geoLoading ? <LoadingSpinner size="sm" /> : <><FiMapPin className="mr-2" /> Detect My Location</>}
                  </button>
                  {geoError && <p className="text-danger mt-3 text-xs">{geoError}</p>}
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <FiCheckCircle className="text-[var(--color-primary)] mt-1 shrink-0" size={20} />
                  <div>
                    <p className="text-[var(--color-heading)] font-medium mb-1">Selected Address</p>
                    <p className="text-sm text-[var(--color-body)] leading-relaxed">{addressInput}</p>
                    <button onClick={() => requestLocation()} className="text-[var(--color-primary)] text-xs mt-2 hover:underline">Re-detect Location</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedLocation?.lat && selectedLocation?.lng && <ContractorMapPanel center={{ lat: Number(selectedLocation.lat), lng: Number(selectedLocation.lng) }} currentLocationLabel={addressInput} contractors={[contractor]} heightClass="h-[260px]" />}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-4">{serviceTier === "macro" ? "Estimated Project Value" : "Expected Service Amount"}</h2>
              <input type="number" min={149} step="50" value={projectValue} onChange={(e) => setProjectValue(Number(e.target.value) || 0)} className="input-field" placeholder="Enter the expected budget" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-4">Preferred Schedule</h2>
              <div className="relative">
                <FiCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
                <input type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} className="input-field !pl-10" />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-4">Job Details (Optional)</h2>
            <textarea className="input-field min-h-[100px] resize-y" placeholder="Describe the issue, parking instructions, or any specific requirements..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="border-t border-[var(--color-border)] pt-8">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 mb-5">
              <div className="flex justify-between items-center gap-4">
                <span className="text-sm font-semibold text-[var(--color-heading)]">{serviceTier === "macro" ? "Estimated total project value" : "Total protected amount"}</span>
                <span className="text-lg font-bold text-[var(--color-heading)]">₹{Number(pricing?.estimatedProjectValue || projectValue || 0).toLocaleString("en-IN")}</span>
              </div>
              {pricingLoading ? (
                <p className="mt-3 text-sm text-[var(--color-muted)]">Preparing payment protection summary...</p>
              ) : pricing?.milestoneDetails?.length ? (
                <div className="mt-4 space-y-2">
                  {pricing.milestoneDetails.map((item) => (
                    <div key={item.title} className="flex items-center justify-between rounded-xl bg-[var(--color-bg)] px-3 py-2 text-sm">
                      <span className="text-[var(--color-body)]">{item.title}</span>
                      <span className="font-semibold text-[var(--color-heading)]">₹{Number(item.amount || 0).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex justify-between items-center mb-6">
              <span className="text-[var(--color-heading)] font-semibold text-lg">Payable Now</span>
              <span className="text-2xl font-bold text-[var(--color-heading)]">₹{Number(payableNow || 0).toLocaleString("en-IN")}</span>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3 mb-6">
              <FiLock className="text-blue-500 mt-1 shrink-0" size={18} />
              <p className="text-xs text-blue-500/80 leading-relaxed"><strong>Escrow Protection Enabled.</strong> {pricing?.customerCopy || "Your money is held securely on the platform and only released as work progresses."}</p>
            </div>

            <button onClick={handleBookAndPay} disabled={loading || !selectedLocation?.lat || pricingLoading || !pricing} className={`btn-primary w-full h-14 ${(!selectedLocation?.lat || loading || pricingLoading || !pricing) ? "opacity-70 cursor-not-allowed" : ""}`}>
              {loading ? <LoadingSpinner /> : `Secure Pay ₹${Number(payableNow || 0).toLocaleString("en-IN")} & Book`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
