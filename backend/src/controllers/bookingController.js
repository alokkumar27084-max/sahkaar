const pool = require("../config/db");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const notificationService = require("../services/notificationService");
const emergencyDispatchService = require("../services/emergencyDispatchService");

// ── RAZORPAY INITIALIZATION ──
// We construct an instance ONLY if valid real keys exist, avoiding crashes for development with mock keys.
let razorpayInstance = null;
if (
    process.env.RAZORPAY_KEY_ID && 
    process.env.RAZORPAY_KEY_SECRET && 
    !process.env.RAZORPAY_KEY_ID.includes("mock_") &&
    !process.env.RAZORPAY_KEY_ID.includes("your_")
) {
    razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
}

async function notifyUser(userId, message, type, templateName, templateData) {
    if (!userId) return;
    try {
        const userRes = await pool.query("SELECT email, name FROM users WHERE id = $1", [userId]);
        const user = userRes.rows[0];
        const templateArgs = templateData ? [...templateData] : [user?.name || 'User'];
        if (templateArgs[0] === null) templateArgs[0] = user?.name || 'User';

        await notificationService.notify({ 
            userId, 
            message, 
            type, 
            email: user?.email, 
            templateName, 
            templateData: templateArgs
        });
    } catch (err) {
        console.error("NotifyUser Error:", err);
    }
}

async function getContractorOwnerUserId(contractorId) {
    const res = await pool.query("SELECT user_id, business_name, category FROM contractors WHERE id = $1", [contractorId]);
    return res.rows[0] || null;
}

function idsEqual(left, right) {
    return String(left) === String(right);
}

function canCustomerOrAdminAccessBooking(user, booking) {
    if (!user || !booking) return false;
    if (user.role === "admin") return true;
    return user.role === "customer" && idsEqual(booking.customer_id, user.id);
}

function toMoney(value, fallback = 0) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return fallback;
    return Math.round(parsed * 100) / 100;
}

const legacyToWorkflowStatus = {
    PENDING_PAYMENT: "created",
    PAYMENT_ESCROWED: "created",
    IN_PROGRESS: "accepted",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
    DISPUTED: "disputed",
};

const workflowTransitions = {
    created: new Set(["matching", "offered", "accepted", "cancelled"]),
    matching: new Set(["offered", "dispatch_escalated", "cancelled"]),
    offered: new Set(["accepted", "matching", "dispatch_escalated", "cancelled"]),
    accepted: new Set(["en_route", "in_progress", "cancelled"]),
    en_route: new Set(["arrived", "cancelled"]),
    arrived: new Set(["in_progress", "cancelled"]),
    in_progress: new Set(["completed", "cancelled"]),
    completed: new Set(),
    cancelled: new Set(),
    disputed: new Set(),
};

function getBookingWorkflowStatus(booking) {
    return booking?.workflow_status || legacyToWorkflowStatus[booking?.status] || "created";
}

function canTransitionWorkflow(currentStatus, nextStatus) {
    return workflowTransitions[currentStatus]?.has(nextStatus) === true;
}

function canActorSetWorkflowStatus({ user, booking, nextStatus, currentStatus }) {
    if (!user || !booking) return false;
    const isAdmin = user.role === "admin";
    const isScopedAdmin = user.role === 'society_admin' && user.society_id && booking.society_id && idsEqual(user.society_id, booking.society_id)
        || user.role === 'federation_admin' && user.federation_id && booking.federation_id && idsEqual(user.federation_id, booking.federation_id);
    const isCustomer = user.role === "customer" && idsEqual(user.id, booking.customer_id);
    const isWorker = ["contractor", "worker", "master"].includes(user.role) && idsEqual(user.id, booking.worker_user_id);

    if (isAdmin || isScopedAdmin) return true;
    if (nextStatus === "completed") return isCustomer && currentStatus === 'in_progress';
    if (nextStatus === "cancelled") return (isCustomer || isWorker) && !['completed', 'cancelled'].includes(currentStatus);
    return isWorker && !['created'].includes(currentStatus);
}

async function releaseFederationBookingTransfer(bookingId) {
    if (!razorpayInstance) return { status: 'mock_only' };
    const result = await pool.query(`
      SELECT p.razorpay_payment_id, p.federation_id, p.razorpay_linked_account_id,
             b.amount, f.razorpay_linked_account_id AS current_linked_account_id
      FROM payments p
      JOIN bookings b ON b.id = p.booking_id
      LEFT JOIN federations f ON f.id = p.federation_id
      WHERE p.booking_id = $1`, [bookingId]);
    const payment = result.rows[0];
    if (!payment?.razorpay_payment_id || !payment.federation_id || !payment.current_linked_account_id) {
      await pool.query("UPDATE bookings SET payment_status = 'RELEASE_FAILED' WHERE id = $1", [bookingId]);
      return { status: 'failed', message: 'Federation Route transfer is not configured' };
    }
    const transferResponse = await razorpayInstance.payments.fetchTransfer(payment.razorpay_payment_id);
    const transfers = transferResponse.items || transferResponse.data?.items || (Array.isArray(transferResponse) ? transferResponse : []);
    const expectedAccountId = payment.razorpay_linked_account_id;
    if (!expectedAccountId || expectedAccountId !== payment.current_linked_account_id) {
      await pool.query("UPDATE bookings SET payment_status = 'RELEASE_FAILED' WHERE id = $1", [bookingId]);
      return { status: 'failed', message: 'Federation payout account changed after payment capture; admin review is required' };
    }
    const transfer = transfers.find((item) => item.recipient === expectedAccountId || item.account === expectedAccountId);
    if (!transfer) {
      await pool.query("UPDATE bookings SET payment_status = 'RELEASE_FAILED' WHERE id = $1", [bookingId]);
      return { status: 'failed', message: 'No federation transfer was found for the captured payment' };
    }
    if (transfer.on_hold || transfer.settlement_status === 'on_hold') {
      await razorpayInstance.transfers.edit(transfer.id, { on_hold: 0 });
    }
    await pool.query(`
      INSERT INTO federation_booking_transfers (booking_id, federation_id, razorpay_transfer_id, amount, status, released_at)
      VALUES ($1,$2,$3,$4,'released',NOW())
      ON CONFLICT (booking_id) DO UPDATE SET razorpay_transfer_id = EXCLUDED.razorpay_transfer_id,
        amount = EXCLUDED.amount, status = 'released', released_at = NOW()`,
    [bookingId, payment.federation_id, transfer.id, Number(transfer.amount || Number(payment.amount) * 100) / 100]);
    await pool.query("UPDATE bookings SET payment_status = 'RELEASED' WHERE id = $1", [bookingId]);
    return { status: 'released', transferId: transfer.id };
}

function buildPricingQuote({ serviceTier, estimatedProjectValue, contractorDailyRate }) {
    const baseProjectValue = toMoney(
        estimatedProjectValue,
        Math.max(toMoney(contractorDailyRate, 0), 5000)
    );

    const paymentAmount = baseProjectValue;

    return {
        serviceTier: "macro",
        paymentPlan: "full_service_payment",
        estimatedProjectValue: baseProjectValue,
        amount: paymentAmount,
        escrowAmount: paymentAmount,
        milestoneDetails: [
            { title: "Full service payment", percentage: 100, amount: paymentAmount, status: "due_now" },
        ],
        customerCopy: "The full service amount is collected with the booking and allocated through the cooperative ledger on confirmed completion.",
    };
}

function buildQuoteBasedPricing(quote) {
    const amount = Number(quote.total_amount);
    return {
        serviceTier: "custom",
        paymentPlan: "full_service_payment",
        estimatedProjectValue: amount,
        amount: amount,
        escrowAmount: amount,
        milestoneDetails: [
            { title: `Quote: ${quote.items.length} items`, percentage: 100, amount: amount, status: "due_now" },
        ],
        customerCopy: "The full quoted amount is collected and allocated through the cooperative ledger on confirmed completion.",
    };
}

const bookingController = {

    getMatchingWorkers: async (req, res) => {
        const { bookingId } = req.params;
        const radiusKm = Math.max(1, Math.min(Number(req.query.radius_km || req.query.radiusKm || 15), 100));
        try {
            const ownerRes = await pool.query(`SELECT b.customer_id, c.society_id, s.federation_id
              FROM bookings b JOIN contractors c ON c.id=b.contractor_id
              LEFT JOIN cooperative_societies s ON s.id=c.society_id WHERE b.id=$1`, [bookingId]);
            const owner = ownerRes.rows[0];
            const canAdminView = req.user?.role === 'admin'
              || (req.user?.role === 'society_admin' && req.user.society_id && owner?.society_id && idsEqual(req.user.society_id, owner.society_id))
              || (req.user?.role === 'federation_admin' && req.user.federation_id && owner?.federation_id && idsEqual(req.user.federation_id, owner.federation_id));
            if (!owner) return res.status(404).json({ status: 'error', message: 'Booking not found' });
            if (!canAdminView && String(owner.customer_id) !== String(req.user?.id)) return res.status(403).json({ status: 'error', message: 'Access denied' });
            const result = await pool.query(`
                SELECT c.id, c.business_name, c.category, c.rating, c.review_count,
                       CASE
                         WHEN COALESCE(b.service_lat, b.location_lat) IS NOT NULL
                          AND COALESCE(b.service_lng, b.location_lng) IS NOT NULL
                          AND COALESCE(c.lat, c.latitude) IS NOT NULL
                          AND COALESCE(c.lng, c.longitude) IS NOT NULL
                         THEN earth_distance(
                           ll_to_earth(COALESCE(b.service_lat, b.location_lat)::float8, COALESCE(b.service_lng, b.location_lng)::float8),
                           ll_to_earth(COALESCE(c.lat, c.latitude)::float8, COALESCE(c.lng, c.longitude)::float8)
                         ) / 1000.0
                         ELSE NULL
                       END AS distance_km,
                       c.response_time_minutes,
                       c.skills_certified, c.verification_status,
                       s.name AS society_name, s.registration_no AS society_registration_no
                FROM bookings b
                JOIN contractors c ON (
                  lower(COALESCE(c.category, '')) = lower(COALESCE(b.service_category, ''))
                  OR lower(COALESCE(b.service_category, '')) = ANY (
                    SELECT lower(category_name) FROM unnest(COALESCE(c.categories, '{}')) AS category_name
                  )
                )
                LEFT JOIN cooperative_societies s ON s.id = c.society_id
                WHERE b.id = $1
                  AND s.id IS NOT NULL AND s.is_active = true
                  AND (c.is_verified = true OR c.verification_status = 'verified')
                  AND c.is_available = true
                  AND (
                    COALESCE(b.service_lat, b.location_lat) IS NULL
                    OR COALESCE(b.service_lng, b.location_lng) IS NULL
                    OR (
                      COALESCE(c.lat, c.latitude) IS NOT NULL
                      AND COALESCE(c.lng, c.longitude) IS NOT NULL
                      AND earth_box(
                        ll_to_earth(COALESCE(b.service_lat, b.location_lat)::float8, COALESCE(b.service_lng, b.location_lng)::float8),
                        LEAST($2, COALESCE(c.service_radius_km, 15) * 1000)
                      ) @> ll_to_earth(COALESCE(c.lat, c.latitude)::float8, COALESCE(c.lng, c.longitude)::float8)
                      AND earth_distance(
                        ll_to_earth(COALESCE(b.service_lat, b.location_lat)::float8, COALESCE(b.service_lng, b.location_lng)::float8),
                        ll_to_earth(COALESCE(c.lat, c.latitude)::float8, COALESCE(c.lng, c.longitude)::float8)
                      ) <= LEAST($2, COALESCE(c.service_radius_km, 15) * 1000)
                    )
                  )
                  AND (COALESCE(cardinality(s.jurisdiction_districts), 0) = 0 OR EXISTS (
                    SELECT 1 FROM unnest(s.jurisdiction_districts) AS district_name
                    WHERE lower(district_name) = lower(COALESCE(b.service_locality, ''))
                  ))
                ORDER BY (distance_km IS NULL), distance_km ASC NULLS LAST, c.rating DESC NULLS LAST, c.response_time_minutes ASC NULLS LAST
                LIMIT 10`, [bookingId, radiusKm * 1000]);
            return res.json({ status: "success", data: { workers: result.rows } });
        } catch (error) {
            console.error("Matching workers error:", error);
            return res.status(500).json({ status: "error", message: "Failed to find matching workers" });
        }
    },

    updateWorkflowStatus: async (req, res) => {
        const { bookingId } = req.params;
        const nextStatus = String(req.body?.status || '').toLowerCase();
        const allowed = new Set(['accepted', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled']);
        if (!allowed.has(nextStatus)) return res.status(400).json({ status: "error", message: "Invalid workflow status" });
        const client = await pool.pool.connect();
        try {
            await client.query("BEGIN");
            const bookingRes = await client.query(`
                SELECT b.*, c.user_id AS worker_user_id, c.society_id, s.federation_id, s.district AS worker_district,
                       f.razorpay_linked_account_id
                FROM bookings b
                JOIN contractors c ON c.id = b.contractor_id
                LEFT JOIN cooperative_societies s ON s.id = c.society_id
                LEFT JOIN federations f ON f.id = s.federation_id
                WHERE b.id = $1
                FOR UPDATE OF b`, [bookingId]);
            const booking = bookingRes.rows[0];
            if (!booking) {
                await client.query("ROLLBACK");
                return res.status(404).json({ status: "error", message: "Booking not found" });
            }

            const currentStatus = getBookingWorkflowStatus(booking);
            if (!canActorSetWorkflowStatus({ user: req.user, booking, nextStatus, currentStatus })) {
                await client.query("ROLLBACK");
                return res.status(403).json({ status: "error", message: "Access denied" });
            }
            if (!canTransitionWorkflow(currentStatus, nextStatus)) {
                await client.query("ROLLBACK");
                return res.status(409).json({
                    status: "error",
                    message: `Cannot move booking from ${currentStatus} to ${nextStatus}`,
                });
            }

            const statusMap = { accepted: 'IN_PROGRESS', en_route: 'IN_PROGRESS', arrived: 'IN_PROGRESS', in_progress: 'IN_PROGRESS', completed: 'COMPLETED', cancelled: 'CANCELLED' };
            const timestampColumn = { accepted: 'accepted_at', en_route: null, arrived: 'arrived_at', in_progress: null, completed: 'completed_at', cancelled: 'cancelled_at' }[nextStatus];
            const columnSql = timestampColumn ? `, ${timestampColumn} = NOW()` : '';
            const update = await client.query(`UPDATE bookings SET workflow_status = $1, status = $2${columnSql}, payment_status = CASE WHEN $1 = 'completed' AND payment_status = 'IN_ESCROW' THEN 'RELEASE_PENDING' ELSE payment_status END, updated_at = NOW() WHERE id = $3 RETURNING *`, [nextStatus, statusMap[nextStatus], bookingId]);

            await client.query(`INSERT INTO cooperative_audit_logs (actor_user_id, booking_id, worker_id, action, details) VALUES ($1, $2, $3, $4, $5)`, [req.user.id, bookingId, booking.contractor_id, `booking_${nextStatus}`, JSON.stringify({ previousStatus: currentStatus })]);

            if (nextStatus === 'completed') {
                const gross = Math.round(Number(booking.amount || 0) * 100) / 100;
                const welfare = Math.min(gross, Math.max(0, Math.round(Number(booking.welfare_fee || 0) * 100) / 100));
                const distributable = Math.max(0, gross - welfare);
                const societyAmount = Math.round(distributable * 0.05 * 100) / 100;
                const federationAmount = Math.round(distributable * 0.02 * 100) / 100;
                const workerAmount = Math.max(0, Math.round((distributable - societyAmount - federationAmount) * 100) / 100);
                const allocation = await client.query(`
                    INSERT INTO booking_financial_allocations
                      (booking_id, gross_amount, worker_amount, society_amount, federation_amount, welfare_amount, platform_amount)
                    VALUES ($1,$2,$3,$4,$5,$6,0)
                    ON CONFLICT (booking_id) DO NOTHING
                    RETURNING id`,
                    [bookingId, gross, workerAmount, societyAmount, federationAmount, welfare]
                );

                if (allocation.rows.length > 0) {
                    const entries = [
                        [booking.contractor_id, booking.society_id, booking.federation_id, 'worker_payout', workerAmount],
                        [booking.contractor_id, booking.society_id, booking.federation_id, 'society_share', societyAmount],
                        [booking.contractor_id, booking.society_id, booking.federation_id, 'federation_share', federationAmount],
                        [booking.contractor_id, booking.society_id, booking.federation_id, 'welfare_contribution', welfare],
                    ];
                    for (const [workerId, societyId, federationId, type, amount] of entries) {
                        await client.query(`INSERT INTO cooperative_ledger_entries (booking_id, society_id, federation_id, worker_id, entry_type, amount, reference) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [bookingId, societyId, federationId, workerId, type, amount, `BOOKING-${bookingId}`]);
                    }
                    if (booking.society_id) {
                        await client.query(`UPDATE cooperative_societies SET welfare_pool_balance = COALESCE(welfare_pool_balance,0) + $1, updated_at = NOW() WHERE id = $2`, [welfare, booking.society_id]);
                    }
                }

                if (booking.worker_district && booking.service_category) {
                    await client.query(`
                      INSERT INTO demand_forecast_snapshots
                        (locality, service_category, forecast_date, predicted_demand, actual_demand, confidence_score, seasonal_factor, data_source)
                      VALUES ($1,$2,CURRENT_DATE,0,1,0,1,'observed')
                      ON CONFLICT (locality, service_category, forecast_date) WHERE data_source = 'observed'
                      DO UPDATE SET actual_demand = demand_forecast_snapshots.actual_demand + 1`,
                    [booking.worker_district, booking.service_category]);
                }
            }
            await client.query("COMMIT");
            let payout = null;
            if (nextStatus === 'completed' && razorpayInstance) {
                try {
                    payout = await releaseFederationBookingTransfer(bookingId);
                } catch (payoutError) {
                    console.error('Federation Route release failed:', payoutError);
                    await pool.query("UPDATE bookings SET payment_status = 'RELEASE_FAILED' WHERE id = $1", [bookingId]).catch(() => {});
                    payout = { status: 'failed', message: 'Completion recorded; federation transfer needs retry' };
                }
            }
            return res.json({ status: "success", data: { booking: update.rows[0], workflowStatus: nextStatus, payout } });
        } catch (error) {
            await client.query("ROLLBACK").catch(() => {});
            console.error("Workflow status error:", error);
            return res.status(500).json({ status: "error", message: "Failed to update booking status" });
        } finally {
            client.release();
        }
    },

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
            quoteId,
            serviceCategory,
            serviceTier,
            estimatedProjectValue,
            notes,
            locationAddress,
            addressLabel,
            locationLat,
            locationLng,
            serviceLocality,
            scheduledFor,
            is_emergency,
            isEmergency,
        } = req.body;

        const emergencyFlag = Boolean(is_emergency || isEmergency);
        if (!contractorId || !serviceCategory || !locationAddress || !serviceLocality || !Number.isFinite(Number(locationLat)) || !Number.isFinite(Number(locationLng))) {
            return res.status(400).json({ status: 'error', message: 'Choose a cooperative worker and provide the service address, map pin, and district/locality.' });
        }
        if (Number(locationLat) < -90 || Number(locationLat) > 90 || Number(locationLng) < -180 || Number(locationLng) > 180) {
            return res.status(400).json({ status: 'error', message: 'Service location pin coordinates are invalid.' });
        }

        const client = await pool.pool.connect();
        try {
            await client.query("BEGIN");

            let pricing;
            if (quoteId) {
                const quoteRes = await client.query("SELECT * FROM quotes WHERE id = $1", [quoteId]);
                if (quoteRes.rows.length === 0) {
                    await client.query("ROLLBACK");
                    return res.status(404).json({ status: "error", message: "Quote not found" });
                }
                pricing = buildQuoteBasedPricing(quoteRes.rows[0]);
            } else {
            const contractorPricingRes = await client.query(
                "SELECT daily_rate, is_verified, verification_status, society_id FROM contractors WHERE id = $1 LIMIT 1",
                    [contractorId]
                );

                if (!contractorPricingRes.rows[0]) {
                    await client.query("ROLLBACK");
                    return res.status(404).json({ status: "error", message: "Contractor not found" });
                }
                if (!contractorPricingRes.rows[0].is_verified && contractorPricingRes.rows[0].verification_status !== 'verified') {
                    await client.query("ROLLBACK");
                    return res.status(409).json({ status: "error", message: "This cooperative worker is awaiting verification" });
                }
                if (!contractorPricingRes.rows[0].society_id) {
                    await client.query("ROLLBACK");
                    return res.status(409).json({ status: "error", message: "This worker is not affiliated with a cooperative society and cannot receive cooperative bookings." });
                }

                pricing = buildPricingQuote({
                    serviceTier,
                    estimatedProjectValue,
                    contractorDailyRate: contractorPricingRes.rows[0].daily_rate,
                });
            }

            let routeFederation = null;
            if (razorpayInstance) {
                const routeRes = await client.query(`
                  SELECT f.id, f.razorpay_linked_account_id, f.payout_onboarding_status
                  FROM contractors c
                  JOIN cooperative_societies s ON s.id = c.society_id
                  JOIN federations f ON f.id = s.federation_id
                  WHERE c.id = $1 AND f.is_active = true`, [contractorId]);
                routeFederation = routeRes.rows[0];
                if (!routeFederation?.razorpay_linked_account_id || routeFederation.payout_onboarding_status !== 'active') {
                    await client.query("ROLLBACK");
                    return res.status(503).json({ status: "error", message: "This cooperative federation has not completed marketplace payout onboarding yet. Please choose another verified worker or contact the federation." });
                }
            }

            const insertBookingQuery = `
        INSERT INTO bookings (
          customer_id, contractor_id, quote_id, service_category, service_tier, payment_plan,
          amount, estimated_project_value, escrow_amount, milestone_details, scheduled_for,
          address_label, location_address, location_lat, location_lng, notes,
          is_emergency, priority_level, service_lat, service_lng, service_locality, welfare_fee
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, $14, $15, $16, $17, $18, $14, $15, $19, 0)
        RETURNING *;
      `;
            const bookingResult = await client.query(insertBookingQuery, [
                customerId,
                contractorId,
                quoteId || null,
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
                notes || "",
                emergencyFlag,
                emergencyFlag ? 'emergency' : 'standard',
                serviceLocality || null
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
                ...(routeFederation ? { transfers: [{
                    account: routeFederation.razorpay_linked_account_id,
                    amount: Math.round(pricing.amount * 100),
                    currency: "INR",
                    on_hold: true,
                    notes: { booking_id: String(booking.id), federation_id: String(routeFederation.id) },
                }] } : {}),
            });

            await client.query(
                "INSERT INTO payments (booking_id, razorpay_order_id, amount, federation_id, razorpay_linked_account_id) VALUES ($1, $2, $3, $4, $5)",
                [booking.id, rzpOrderResponse.id, pricing.amount, routeFederation.id, routeFederation.razorpay_linked_account_id]
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
            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !booking_id) {
                return res.status(400).json({ status: "error", message: "Payment verification data is incomplete" });
            }

            const isMockMode = !process.env.RAZORPAY_KEY_SECRET || 
                               process.env.RAZORPAY_KEY_SECRET.includes("mock_") || 
                               razorpay_order_id.startsWith("mock_order_");

            if (isMockMode) {
                if (process.env.NODE_ENV === "production") {
                    return res.status(503).json({ status: "error", message: "Payment verification is not configured" });
                }

                const bookingRes = await pool.query("SELECT customer_id, contractor_id, service_category, is_emergency FROM bookings WHERE id = $1", [booking_id]);
                const booking = bookingRes.rows[0];
                if (!booking) {
                    return res.status(404).json({ status: "error", message: "Booking not found" });
                }
                if (!canCustomerOrAdminAccessBooking(req.user, booking)) {
                    return res.status(403).json({ status: "error", message: "Access Denied" });
                }

                await pool.query(
                    "UPDATE bookings SET payment_status = $1, status = $2, workflow_status = CASE WHEN workflow_status='created' THEN 'created' ELSE workflow_status END WHERE id = $3",
                    ["IN_ESCROW", "PENDING", booking_id]
                );
                const emergencyRes = await pool.query('SELECT is_emergency FROM bookings WHERE id = $1', [booking_id]);
                if (emergencyRes.rows[0]?.is_emergency) await emergencyDispatchService.start(booking_id);
                const contractorMeta = await getContractorOwnerUserId(booking.contractor_id);
                await notifyUser(booking?.customer_id, `Payment secured for ${booking?.service_category || 'your booking'}. Work can now begin.`, 'payment');
                await notifyUser(contractorMeta?.user_id, `Payment secured for ${booking?.service_category || 'a booking'}. You can start the job.`, 'payment');
                return res.json({ status: "success", message: "MOCK: Development payment simulated" });
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

            const paymentRes = await pool.query(
                `SELECT p.booking_id, b.customer_id, b.contractor_id, b.service_category, b.is_emergency
                 FROM payments p
                 JOIN bookings b ON b.id = p.booking_id
                 WHERE p.razorpay_order_id = $1`,
                [razorpay_order_id]
            );
            const linkedBooking = paymentRes.rows[0];
            if (!linkedBooking) {
                return res.status(404).json({ status: "error", message: "Payment order not found" });
            }
            if (!idsEqual(linkedBooking.booking_id, booking_id)) {
                return res.status(400).json({ status: "error", message: "Payment order does not match booking" });
            }
            if (!canCustomerOrAdminAccessBooking(req.user, linkedBooking)) {
                return res.status(403).json({ status: "error", message: "Access Denied" });
            }

            const providerPayment = await razorpayInstance.payments.fetch(razorpay_payment_id);
            if (!providerPayment || providerPayment.order_id !== razorpay_order_id || providerPayment.status !== 'captured') {
                return res.status(409).json({ status: 'error', message: 'Payment has not been captured by the payment provider.' });
            }

            // 1. Update Payment Record Tracking
            await pool.query(
                "UPDATE payments SET razorpay_payment_id = $1, razorpay_signature = $2, status = $3 WHERE razorpay_order_id = $4 AND booking_id = $5 AND status <> 'SUCCESS'",
                [razorpay_payment_id, razorpay_signature, 'SUCCESS', razorpay_order_id, linkedBooking.booking_id]
            );

            // 2. Update the Unified Booking row indicating funds are locked in Escrow
            await pool.query(
                "UPDATE bookings SET payment_status = $1, status = $2 WHERE id = $3 AND payment_status <> 'IN_ESCROW'",
                ["IN_ESCROW", "PENDING", linkedBooking.booking_id]
            );
            if (linkedBooking.is_emergency) await emergencyDispatchService.start(linkedBooking.booking_id);
            const contractorMeta = await getContractorOwnerUserId(linkedBooking.contractor_id);
            await notifyUser(
                linkedBooking.customer_id, 
                `Payment secured for ${linkedBooking.service_category || 'your booking'}. Work can now begin.`, 
                'payment',
                'bookingConfirmed',
                [null, linkedBooking.service_category, linkedBooking.amount] // name will be fetched by notifyUser
            );
            await notifyUser(
                contractorMeta?.user_id, 
                `Payment secured for ${linkedBooking.service_category || 'a booking'}. You can start the job.`, 
                'payment',
                'paymentReceived',
                [null, linkedBooking.service_category, linkedBooking.amount]
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
        if (req.user?.role === 'contractor' || req.user?.role === 'worker' || req.user?.role === 'master') {
            return res.status(403).json({ status: "error", message: "Access Denied" });
        }
        req.body = { ...(req.body || {}), status: 'completed' };
        return bookingController.updateWorkflowStatus(req, res);
        /* Legacy implementation retained below for reference during migration. */
        const userId = req.user.id;
        const userRole = req.user.role;

        try {
            // Find the booking to ensure access control logic works
            const bRes = await pool.query("SELECT * FROM bookings WHERE id = $1", [bookingId]);
            if (bRes.rows.length === 0) {
                return res.status(404).json({ status: "error", message: "Booking not found." });
            }

            const booking = bRes.rows[0];

            // Only the paying customer or an admin can release escrow.
            if (userRole !== "admin" && (userRole !== "customer" || !idsEqual(booking.customer_id, userId))) {
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
            } else if (["contractor", "worker", "master"].includes(userRole)) {
                query = `
          SELECT b.*, u.name as customer_name, u.phone as customer_phone,
                 c.user_id AS worker_user_id, c.society_id, s.federation_id
          FROM bookings b
          JOIN contractors c ON b.contractor_id = c.id
          LEFT JOIN cooperative_societies s ON s.id = c.society_id
          JOIN users u ON b.customer_id = u.id
          WHERE c.user_id = $1
          ORDER BY b.created_at DESC
        `;
            } else {
                return res.status(400).json({ status: "error", message: "Invalid role for fetching bookings." });
            }

            const result = await pool.query(query, [userId]);
            if (userRole === 'federation_admin' && !req.user.federation_id) return res.status(403).json({ status: 'error', message: 'Federation account is not assigned to a federation' });
            if (userRole === 'federation_admin') {
                const scoped = await pool.query(`SELECT b.*, u.name AS customer_name, u.phone AS customer_phone
                  FROM bookings b JOIN contractors c ON c.id=b.contractor_id JOIN cooperative_societies s ON s.id=c.society_id JOIN users u ON u.id=b.customer_id
                  WHERE s.federation_id=$1 ORDER BY b.created_at DESC`, [req.user.federation_id]);
                return res.json({ status: 'success', data: { bookings: scoped.rows } });
            }
            if (userRole === 'society_admin') {
                const scoped = await pool.query(`SELECT b.*, u.name AS customer_name, u.phone AS customer_phone
                  FROM bookings b JOIN contractors c ON c.id=b.contractor_id JOIN users u ON u.id=b.customer_id
                  WHERE c.society_id=$1 ORDER BY b.created_at DESC`, [req.user.society_id]);
                return res.json({ status: 'success', data: { bookings: scoped.rows } });
            }
            res.json({ status: "success", data: { bookings: result.rows } });
        } catch (error) {
            console.error("Get Bookings Error:", error);
            res.status(500).json({ status: "error", message: "Failed loading bookings architecture" });
        }
    }
};

module.exports = bookingController;
module.exports.bookingController = bookingController;
module.exports.notifyUser = notifyUser;
module.exports.getContractorOwnerUserId = getContractorOwnerUserId;
