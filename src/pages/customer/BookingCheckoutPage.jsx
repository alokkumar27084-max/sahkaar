import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FiMapPin, FiBriefcase, FiLock, FiCheckCircle, FiChevronLeft } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { bookingAPI } from "../../services/api";
import { useGeolocation } from "../../hooks/useGeolocation";
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
    const [loading, setLoading] = useState(false);

    // Example default flat fee for booking, could be dynamic
    const bookingAmount = 149;

    useEffect(() => {
        if (!contractor) {
            // In a real app we might fetch the contractor profile here if accessed directly
            toast.error("Contractor details missing.");
            navigate("/search");
        }
    }, [contractor, navigate]);

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleBookAndPay = async () => {
        if (!lat || !lng || !address) {
            toast.error("Please provide your location first to book.");
            return;
        }

        setLoading(true);
        try {
            const res = await bookingAPI.create({
                contractorId: contractor.id,
                serviceCategory: contractor.trade || "General Service",
                amount: bookingAmount,
                notes,
                locationAddress: address,
                locationLat: lat,
                locationLng: lng
            });

            const orderData = res.data.data;

            // If Razorpay keys are omitted by the developer natively, the backend MOCKS the payment immediately.
            if (!orderData.razorpayOrderId) {
                toast.success("MOCK: Booking successful and sent to Escrow");
                navigate("/customer/dashboard");
                return;
            }

            // Load Razorpay Script
            const resScript = await loadRazorpayScript();
            if (!resScript) {
                toast.error("Failed to load Razorpay SDK.");
                setLoading(false);
                return;
            }

            // Prepare Razorpay Options
            const options = {
                key: orderData.razorpayKey,
                amount: bookingAmount * 100,
                currency: "INR",
                name: "Thekedaar",
                description: `Secure Escrow Booking: ${contractor.trade}`,
                order_id: orderData.razorpayOrderId,
                handler: async function (response) {
                    try {
                        // Send Verify Signature back to server
                        await bookingAPI.verify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            booking_id: orderData.booking.id,
                        });
                        toast.success("Payment secured in Escrow. Booking Confirmed!");
                        navigate("/customer/dashboard"); // Assuming they have a dashboard later
                    } catch (err) {
                        toast.error("Payment Verification Failed.");
                    }
                },
                prefill: {
                    name: user?.name || "",
                    email: user?.email || "",
                    contact: user?.phone || "",
                },
                theme: {
                    color: "#0891b2", // Cyan 600
                },
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
    };

    if (!contractor) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="bg-[var(--color-bg)] min-h-screen pt-20 pb-10 px-4 md:px-0">
            <div className="max-w-2xl mx-auto">
                <button onClick={() => navigate(-1)} className="flex items-center text-[var(--color-muted)] hover:text-[var(--color-heading)] mb-6 transition-colors">
                    <FiChevronLeft className="mr-1" size={20} /> Back
                </button>

                <h1 className="font-display text-3xl font-bold text-[var(--color-heading)] mb-6">Booking Checkout</h1>

                <div className="glass-card p-6 md:p-8 rounded-2xl space-y-8">

                    {/* Section 1: Contractor Details */}
                    <div>
                        <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-4">You are booking</h2>
                        <div className="flex items-center gap-4 bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)]">
                            <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold flex items-center justify-center text-xl shrink-0">
                                {contractor.business_name?.[0] || contractor.name[0]}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[var(--color-heading)]">{contractor.business_name || contractor.name}</h3>
                                <p className="text-[var(--color-primary)] font-medium text-sm flex items-center gap-1.5 mt-1">
                                    <FiBriefcase /> {contractor.trade || "General Service"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Smart Location */}
                    <div>
                        <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-4">Service Location</h2>
                        <div className={`p-5 rounded-xl border ${address ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5' : 'border-[var(--color-border)] bg-[var(--color-surface)]'}`}>

                            {!address ? (
                                <div className="text-center py-2">
                                    <p className="text-[var(--color-body)] mb-4 text-sm">We need your exact location for the contractor to reach you effectively.</p>
                                    <button
                                        onClick={() => requestLocation()}
                                        disabled={geoLoading}
                                        className="btn-outline-cyan mx-auto text-sm"
                                    >
                                        {geoLoading ? <LoadingSpinner size="sm" /> : <><FiMapPin className="mr-2" /> Detect My Location</>}
                                    </button>
                                    {geoError && <p className="text-danger mt-3 text-xs">{geoError}</p>}
                                </div>
                            ) : (
                                <div className="flex items-start gap-3">
                                    <FiCheckCircle className="text-[var(--color-primary)] mt-1 shrink-0" size={20} />
                                    <div>
                                        <p className="text-[var(--color-heading)] font-medium mb-1">Detected Address</p>
                                        <p className="text-sm text-[var(--color-body)] leading-relaxed">{address}</p>
                                        <button onClick={() => requestLocation()} className="text-[var(--color-primary)] text-xs mt-2 hover:underline">
                                            Re-detect Location
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 3: Extra Info */}
                    <div>
                        <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-4">Job Details (Optional)</h2>
                        <textarea
                            className="input-field min-h-[100px] resize-y"
                            placeholder="Describe the issue, parking instructions, or any specific requirements..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    {/* Section 4: Price & Escrow */}
                    <div className="border-t border-[var(--color-border)] pt-8">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-[var(--color-heading)] font-semibold text-lg">Booking Fee</span>
                            <span className="text-2xl font-bold text-[var(--color-heading)]">₹{bookingAmount}</span>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3 mb-6">
                            <FiLock className="text-blue-500 mt-1 shrink-0" size={18} />
                            <p className="text-xs text-blue-500/80 leading-relaxed">
                                <strong>Escrow Protection Enabled.</strong> Your money is held securely on the platform. It will only be released to the contractor once the job is marked complete.
                            </p>
                        </div>

                        <button
                            onClick={handleBookAndPay}
                            disabled={loading || !address}
                            className={`btn-primary w-full h-14 ${(!address || loading) && 'opacity-70 cursor-not-allowed'}`}
                        >
                            {loading ? <LoadingSpinner /> : `Secure Pay ₹${bookingAmount} & Book`}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
