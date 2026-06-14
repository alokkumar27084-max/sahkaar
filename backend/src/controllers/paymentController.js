const pool = require("../config/db");
const { notifyUser } = require("./bookingController");
const { verifyWebhookSignature } = require('../utils/razorpay');

const paymentController = {
    handleWebhook: async (req, res) => {
        const signature = req.headers["x-razorpay-signature"];
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!secret) {
            console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
            return res.status(500).json({ status: "error", message: "Webhook secret missing" });
        }

        if (!verifyWebhookSignature(req.rawBody, signature, secret)) {
            console.error("Invalid Webhook Signature");
            return res.status(400).json({ status: "error", message: "Invalid signature" });
        }

        // Webhook is authentic
        const event = req.body.event;
        const payload = req.body.payload;

        try {
            if (event === "order.paid" || event === "payment.captured") {
                const paymentEntity = payload?.payment?.entity;
                const orderId = paymentEntity?.order_id || payload?.order?.entity?.id;
                if (!orderId) {
                    return res.status(400).json({ status: "error", message: "Webhook order ID missing" });
                }

                const client = await pool.pool.connect();
                let booking;
                let shouldNotify = false;
                
                try {
                    await client.query('BEGIN');
                    const paymentRes = await client.query(
                    `SELECT p.booking_id, p.status AS payment_record_status,
                            b.status, b.customer_id, b.contractor_id, b.service_category
                     FROM payments p
                     JOIN bookings b ON b.id = p.booking_id
                     WHERE p.razorpay_order_id = $1`,
                    [orderId]
                    );

                    booking = paymentRes.rows[0];
                    if (booking) {
                        shouldNotify = booking.status === "PENDING";
                        await client.query(
                            `UPDATE payments
                             SET razorpay_payment_id = COALESCE(razorpay_payment_id, $1), status = 'SUCCESS'
                             WHERE razorpay_order_id = $2`,
                            [paymentEntity?.id || null, orderId]
                        );
                        await client.query(
                            `UPDATE bookings
                             SET payment_status = 'IN_ESCROW', status = 'IN_PROGRESS', updated_at = NOW()
                             WHERE id = $1 AND payment_status = 'UNPAID'`,
                            [booking.booking_id]
                        );
                    }
                    await client.query('COMMIT');
                } catch (error) {
                    await client.query('ROLLBACK').catch(() => {});
                    throw error;
                } finally {
                    client.release();
                }

                if (booking && shouldNotify) {
                        // Notifications
                        await notifyUser(
                            booking.customer_id,
                            `Payment secured via Webhook for ${booking.service_category}. Work can now begin.`,
                            'payment',
                            'bookingConfirmed',
                            [null, booking.service_category, Number(paymentEntity?.amount || 0) / 100]
                        );
                        
                        const contractorMeta = await pool.query("SELECT user_id FROM contractors WHERE id = $1", [booking.contractor_id]);
                        if (contractorMeta.rows[0]) {
                            await notifyUser(
                                contractorMeta.rows[0].user_id,
                                `Payment secured via Webhook for ${booking.service_category}. You can start the job.`,
                                'payment',
                                'paymentReceived',
                                [null, booking.service_category, Number(paymentEntity?.amount || 0) / 100]
                            );
                        }
                        
                        console.log(`Booking ${booking.booking_id} updated via Webhook (${event})`);
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
