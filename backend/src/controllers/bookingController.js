const pool = require("../config/db");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// ── RAZORPAY INITIALIZATION ──
// We construct an instance ONLY if keys exist, avoiding crashes for the user who hasn't generated them.
let razorpayInstance = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
}

async function notifyUser(userId, message, type) {
    if (!userId) return;
    await pool.query(
        "INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)",
        [userId, message, type]
    ).catch(() => { });
}

async function getContractorOwnerUserId(contractorId) {
    const res = await pool.query("SELECT user_id, business_name, category FROM contractors WHERE id = $1", [contractorId]);
    return res.rows[0] || null;
}

function toMoney(value, fallback = 0) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return fallback;
    return Math.round(parsed * 100) / 100;
}

function buildPricingQuote({ serviceTier, estimatedProjectValue, contractorDailyRate }) {
    const normalizedTier = serviceTier === "macro" ? "macro" : "quick";
    const baseProjectValue = toMoney(
        estimatedProjectValue,
        normalizedTier === "macro" ? Math.max(toMoney(contractorDailyRate, 0), 5000) : Math.max(toMoney(contractorDailyRate, 0), 149)
    );

    if (normalizedTier === "macro") {
        const escrowAmount = toMoney(baseProjectValue * 0.3, 0);
        const midMilestone = toMoney(baseProjectValue * 0.4, 0);
        const finalMilestone = toMoney(baseProjectValue - escrowAmount - midMilestone, 0);

        return {
            serviceTier: "macro",
            paymentPlan: "milestone_30_40_30",
            estimatedProjectValue: baseProjectValue,
            amount: escrowAmount,
            escrowAmount,
            milestoneDetails: [
                { title: "Booking Advance", percentage: 30, amount: escrowAmount, status: "due_now" },
                { title: "Mid-project Milestone", percentage: 40, amount: midMilestone, status: "due_later" },
                { title: "Final Completion", percentage: 30, amount: finalMilestone, status: "due_later" },
            ],
            customerCopy: "30% is secured now. Remaining milestones are released as work progresses.",
        };
    }

    const quickAmount = toMoney(Math.max(baseProjectValue, 149), 149);
    return {
        serviceTier: "quick",
        paymentPlan: "full_escrow",
        estimatedProjectValue: quickAmount,
        amount: quickAmount,
        escrowAmount: quickAmount,
        milestoneDetails: [
            { title: "Service Escrow", percentage: 100, amount: quickAmount, status: "due_now" },
        ],
        customerCopy: "The full service amount stays protected in escrow until the job is completed.",
    };
}

const bookingController = {

    getPricingQuote: async (req, res) => {
        const { contractorId, serviceTier, estimatedProjectValue } = req.body || {};

        try {
            let contractorDailyRate = 0;
            if (contractorId) {
                const contractorRes = await pool.query("SELECT daily_rate FROM contractors WHERE id = $1", [contractorId]);
                contractorDailyRate = toMoney(contractorRes.rows[0]?.daily_rate, 0);
            }

            const pricing = buildPricingQuote({
                serviceTier,
                estimatedProjectValue,
                contractorDailyRate,
            });

            return res.json({ status: "success", data: pricing });
        } catch (error) {
            console.error("Pricing Quote Error:", error);
            return res.status(500).json({ status: "error", message: "Failed to calculate pricing quote" });
        }
    },

    // 1. Create a Booking (+ Razorpay Order Escrow Intent)
    createBooking: async (req, res) => {
        const customerId = req.user.id;
        const {
            contractorId,
            serviceCategory,
            serviceTier,
            estimatedProjectValue,
            notes,
            locationAddress,
            addressLabel,
            locationLat,
            locationLng,
            scheduledFor,
        } = req.body;

        const client = await pool.pool.connect();
        try {
            await client.query("BEGIN");

            const contractorPricingRes = await client.query(
                "SELECT daily_rate FROM contractors WHERE id = $1 LIMIT 1",
                [contractorId]
            );

            if (!contractorPricingRes.rows[0]) {
                await client.query("ROLLBACK");
                return res.status(404).json({ status: "error", message: "Contractor not found" });
            }

            const pricing = buildPricingQuote({
                serviceTier,
                estimatedProjectValue,
                contractorDailyRate: contractorPricingRes.rows[0].daily_rate,
            });

            const insertBookingQuery = `
        INSERT INTO bookings (
          customer_id, contractor_id, service_category, service_tier, payment_plan,
          amount, estimated_project_value, escrow_amount, milestone_details, scheduled_for,
          address_label, location_address, location_lat, location_lng, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12, $13, $14, $15)
        RETURNING *;
      `;
            const bookingResult = await client.query(insertBookingQuery, [
                customerId,
                contractorId,
                serviceCategory,
                pricing.serviceTier,
                pricing.paymentPlan,
                pricing.amount,
                pricing.estimatedProjectValue,
                pricing.escrowAmount,
                JSON.stringify(pricing.milestoneDetails || []),
                scheduledFor || null,
                addressLabel || null,
                locationAddress,
                locationLat,
                locationLng,
                notes || ""
            ]);

            const booking = bookingResult.rows[0];
            const contractorMeta = await getContractorOwnerUserId(contractorId);

            if (!razorpayInstance) {
                if (process.env.NODE_ENV === "production") {
                    await client.query("ROLLBACK");
                    return res.status(503).json({
                        status: "error",
                        message: "Payment provider is not configured",
                    });
                }
                await notifyUser(customerId, `Your booking request for ${serviceCategory} has been created.`, 'booking');
                await notifyUser(contractorMeta?.user_id, `You received a new booking request for ${serviceCategory}.`, 'booking');
                await client.query("COMMIT");
                return res.status(201).json({
                    status: "success",
                    message: "Escrow Intent generated (Mocked - Keys missing)",
                    data: {
                        booking,
                        pricing,
                        razorpayOrderId: "mock_order_" + booking.id,
                        razorpayKey: "mock_key_only_for_dev"
                    }
                });
            }

            const rzpOrderResponse = await razorpayInstance.orders.create({
                amount: Math.round(pricing.amount * 100),
                currency: "INR",
                receipt: String(booking.id).replace(/-/g, "").substring(0, 39),
                notes: {
                    contractor_id: String(contractorId),
                    customer_id: String(customerId),
                    service_tier: pricing.serviceTier,
                },
            });

            await client.query(
                "INSERT INTO payments (booking_id, razorpay_order_id, amount) VALUES ($1, $2, $3)",
                [booking.id, rzpOrderResponse.id, pricing.amount]
            );

            await notifyUser(customerId, `Your booking request for ${serviceCategory} has been created.`, 'booking');
            await notifyUser(contractorMeta?.user_id, `You received a new booking request for ${serviceCategory}.`, 'booking');
            await client.query("COMMIT");

            return res.status(201).json({
                status: "success",
                message: "Escrow Intent generated",
                data: {
                    booking,
                    pricing,
                    razorpayOrderId: rzpOrderResponse.id,
                    razorpayKey: process.env.RAZORPAY_KEY_ID
                }
            });

        } catch (error) {
            await client.query("ROLLBACK").catch(() => { });
            console.error("Booking Creation Error:", error);
            res.status(500).json({ status: "error", message: "Error generating booking link", error: error.message });
        } finally {
            client.release();
        }
    },

    // 2. Verify Razorpay Escrow Successful Capture
    verifyEscrow: async (req, res) => {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id } = req.body;

        try {
            if (!process.env.RAZORPAY_KEY_SECRET) {
                if (process.env.NODE_ENV === "production") {
                    return res.status(503).json({ status: "error", message: "Payment verification is not configured" });
                }
                await pool.query(
                    "UPDATE bookings SET payment_status = $1, status = $2 WHERE id = $3",
                    ["IN_ESCROW", "IN_PROGRESS", booking_id]
                );
                const bookingRes = await pool.query("SELECT customer_id, contractor_id, service_category FROM bookings WHERE id = $1", [booking_id]);
                const booking = bookingRes.rows[0];
                const contractorMeta = booking ? await getContractorOwnerUserId(booking.contractor_id) : null;
                await notifyUser(booking?.customer_id, `Payment secured for ${booking?.service_category || 'your booking'}. Work can now begin.`, 'payment');
                await notifyUser(contractorMeta?.user_id, `Payment secured for ${booking?.service_category || 'a booking'}. You can start the job.`, 'payment');
                return res.json({ status: "success", message: "MOCK: Escrow Confirmed" });
            }

            // Cryptographic Validation mapping
            const body = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(body.toString())
                .digest("hex");

            if (expectedSignature !== razorpay_signature) {
                return res.status(400).json({ status: "error", message: "Invalid Payment Signature" });
            }

            // 1. Update Payment Record Tracking
            await pool.query(
                "UPDATE payments SET razorpay_payment_id = $1, razorpay_signature = $2, status = $3 WHERE razorpay_order_id = $4",
                [razorpay_payment_id, razorpay_signature, 'SUCCESS', razorpay_order_id]
            );

            // 2. Update the Unified Booking row indicating funds are locked in Escrow
            await pool.query(
                "UPDATE bookings SET payment_status = $1, status = $2 WHERE id = $3",
                ["IN_ESCROW", "IN_PROGRESS", booking_id]
            );
            const bookingRes = await pool.query("SELECT customer_id, contractor_id, service_category FROM bookings WHERE id = $1", [booking_id]);
            const booking = bookingRes.rows[0];
            const contractorMeta = booking ? await getContractorOwnerUserId(booking.contractor_id) : null;
            await notifyUser(booking?.customer_id, `Payment secured for ${booking?.service_category || 'your booking'}. Work can now begin.`, 'payment');
            await notifyUser(contractorMeta?.user_id, `Payment secured for ${booking?.service_category || 'a booking'}. You can start the job.`, 'payment');

            res.json({ status: "success", message: "Payment safely held in Escrow. Work started!" });
        } catch (error) {
            console.error("Escrow Verify Error:", error);
            res.status(500).json({ status: "error", message: "Failed verifying escrow intent." });
        }
    },

    // 3. Mark the Job complete, signaling a virtual release from Escrow
    releaseAndComplete: async (req, res) => {
        const { bookingId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        try {
            // Find the booking to ensure access control logic works
            const bRes = await pool.query("SELECT * FROM bookings WHERE id = $1", [bookingId]);
            if (bRes.rows.length === 0) {
                return res.status(404).json({ status: "error", message: "Booking not found." });
            }

            const booking = bRes.rows[0];

            // Customers and Admins can release Escrow
            if (userRole === "customer" && booking.customer_id !== userId) {
                return res.status(403).json({ status: "error", message: "Access Denied" });
            }

            // Update logic tracking state
            await pool.query(
                "UPDATE bookings SET status = $1, payment_status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
                ["COMPLETED", "RELEASED", bookingId]
            );
            const contractorMeta = await getContractorOwnerUserId(booking.contractor_id);
            await notifyUser(booking.customer_id, `Your booking for ${booking.service_category} has been marked completed.`, 'booking');
            await notifyUser(contractorMeta?.user_id, `A customer marked your ${booking.service_category} job as completed.`, 'booking');

            // If we had Razorpay Route we would trigger razorpayInstance.transfers(...) mathematically here,
            // For standard gateways we manually execute payouts weekly based on 'RELEASED' states internally.

            res.json({ status: "success", message: "Job Completed and Payout Released from Escrow!" });
        } catch (error) {
            console.error("Escrow Release Error:", error);
            res.status(500).json({ status: "error", message: "Failed generating release." });
        }
    },

    // 4. Trace the Customer's / Contractor's Bookings
    getMyBookings: async (req, res) => {
        const userId = req.user.id;
        const userRole = req.user.role;

        try {
            let query;
            if (userRole === "customer") {
                query = `
          SELECT b.*, c.business_name as contractor_name, c.category as contractor_trade
          FROM bookings b
          JOIN contractors c ON b.contractor_id = c.id
          WHERE b.customer_id = $1
          ORDER BY b.created_at DESC
        `;
            } else if (userRole === "contractor") {
                query = `
          SELECT b.*, u.name as customer_name, u.phone as customer_phone
          FROM bookings b
          JOIN contractors c ON b.contractor_id = c.id
          JOIN users u ON b.customer_id = u.id
          WHERE c.user_id = $1
          ORDER BY b.created_at DESC
        `;
            } else {
                return res.status(400).json({ status: "error", message: "Invalid role for fetching bookings." });
            }

            const result = await pool.query(query, [userId]);
            res.json({ status: "success", data: { bookings: result.rows } });
        } catch (error) {
            console.error("Get Bookings Error:", error);
            res.status(500).json({ status: "error", message: "Failed loading bookings architecture" });
        }
    }
};

module.exports = bookingController;
