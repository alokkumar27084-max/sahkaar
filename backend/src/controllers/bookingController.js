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

const bookingController = {

    // 1. Create a Booking (+ Razorpay Order Escrow Intent)
    createBooking: async (req, res) => {
        const customerId = req.user.id;
        const { contractorId, serviceCategory, amount, notes, locationAddress, locationLat, locationLng } = req.body;

        try {
            // Begin Database Transaction
            await pool.query("BEGIN");

            // Insert Booking Record
            const insertBookingQuery = `
        INSERT INTO bookings (
          customer_id, contractor_id, service_category, amount, 
          location_address, location_lat, location_lng, notes
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *;
      `;
            const bookingResult = await pool.query(insertBookingQuery, [
                customerId, contractorId, serviceCategory, amount,
                locationAddress, locationLat, locationLng, notes || ""
            ]);

            const booking = bookingResult.rows[0];

            // If Razorpay is missing (like during active dev right now), we fake the Escrow tracking
            if (!razorpayInstance) {
                await pool.query("COMMIT");
                return res.status(201).json({
                    status: "success",
                    message: "Booking requested (Razorpay Escrow Skipped - Keys missing)",
                    data: { booking }
                });
            }

            // Generate actual Razorpay Order for Escrow hold
            const rzpOrderResponse = await razorpayInstance.orders.create({
                amount: Math.round(amount * 100), // convert to paise
                currency: "INR",
                receipt: `receipt_booking_${booking.id}`,
                payment_capture: 1, // Auto-capture the escrow explicitly 
            });

            // Insert tracking record into Payments table
            await pool.query(
                "INSERT INTO payments (booking_id, razorpay_order_id, amount) VALUES ($1, $2, $3)",
                [booking.id, rzpOrderResponse.id, amount]
            );

            await pool.query("COMMIT");

            return res.status(201).json({
                status: "success",
                message: "Escrow Intent generated",
                data: {
                    booking,
                    razorpayOrderId: rzpOrderResponse.id,
                    razorpayKey: process.env.RAZORPAY_KEY_ID
                }
            });

        } catch (error) {
            await pool.query("ROLLBACK");
            console.error("Booking Creation Error:", error);
            res.status(500).json({ status: "error", message: "Error generating booking link", error: error.message });
        }
    },

    // 2. Verify Razorpay Escrow Successful Capture
    verifyEscrow: async (req, res) => {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id } = req.body;

        try {
            if (!process.env.RAZORPAY_KEY_SECRET) {
                // Dev Mock Fallback: Force verification
                await pool.query(
                    "UPDATE bookings SET payment_status = $1, status = $2 WHERE id = $3",
                    ["IN_ESCROW", "IN_PROGRESS", booking_id]
                );
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
          JOIN users u ON b.customer_id = u.id
          WHERE b.contractor_id = $1
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
