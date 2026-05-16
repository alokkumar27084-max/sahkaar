const pool = require("../config/db");
const crypto = require("crypto");
const notificationService = require("../services/notificationService");
const { notifyUser } = require("./bookingController");

const paymentController = {
    handleWebhook: async (req, res) => {
        const signature = req.headers["x-razorpay-signature"];
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!secret) {
            console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
            return res.status(500).json({ status: "error", message: "Webhook secret missing" });
        }

        const shasum = crypto.createHmac("sha256", secret);
        shasum.update(JSON.stringify(req.body));
        const digest = shasum.digest("hex");

        if (signature !== digest) {
            console.error("Invalid Webhook Signature");
            return res.status(400).json({ status: "error", message: "Invalid signature" });
        }

        // Webhook is authentic
        const event = req.body.event;
        const payload = req.body.payload;

        try {
            if (event === "order.paid" || event === "payment.captured") {
                const orderId = payload.payment.entity.order_id || payload.order.entity.id;
                
                // Update booking status if not already updated by frontend verification
                const paymentRes = await pool.query(
                    `SELECT p.booking_id, b.status, b.customer_id, b.contractor_id, b.service_category
                     FROM payments p
                     JOIN bookings b ON b.id = p.booking_id
                     WHERE p.razorpay_order_id = $1`,
                    [orderId]
                );

                if (paymentRes.rows.length > 0) {
                    const booking = paymentRes.rows[0];
                    
                    if (booking.status === "PENDING") {
                        await pool.query(
                            "UPDATE bookings SET payment_status = $1, status = $2 WHERE id = $3",
                            ["IN_ESCROW", "IN_PROGRESS", booking.booking_id]
                        );
                        
                        // Notifications
                        await notifyUser(
                            booking.customer_id,
                            `Payment secured via Webhook for ${booking.service_category}. Work can now begin.`,
                            'payment',
                            'bookingConfirmed',
                            [null, booking.service_category, payload.payment.entity.amount / 100]
                        );
                        
                        const contractorMeta = await pool.query("SELECT user_id FROM contractors WHERE id = $1", [booking.contractor_id]);
                        if (contractorMeta.rows[0]) {
                            await notifyUser(
                                contractorMeta.rows[0].user_id,
                                `Payment secured via Webhook for ${booking.service_category}. You can start the job.`,
                                'payment',
                                'paymentReceived',
                                [null, booking.service_category, payload.payment.entity.amount / 100]
                            );
                        }
                        
                        console.log(`Booking ${booking.booking_id} updated via Webhook (${event})`);
                    }
                }
            }

            res.json({ status: "ok" });
        } catch (error) {
            console.error("Webhook Processing Error:", error);
            res.status(500).json({ status: "error", message: "Internal processing error" });
        }
    }
};

module.exports = paymentController;
