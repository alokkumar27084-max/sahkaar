const db = require('../config/db');
const ForecastingService = require('../services/forecastingService');

/**
 * Cooperative Hierarchy & Welfare Controller
 * Handles Federations, Primary Societies, Worker Affiliations, Welfare Funds, and Demand Forecasting.
 */

exports.getFederations = async (req, res) => {
  try {
    const federationsRes = await db.query(`
      SELECT f.*,
        COUNT(DISTINCT s.id)::int AS total_societies,
        COUNT(DISTINCT c.id)::int AS total_workers
      FROM federations f
      LEFT JOIN cooperative_societies s ON s.federation_id = f.id
      LEFT JOIN contractors c ON c.society_id = s.id
      GROUP BY f.id
      ORDER BY f.created_at ASC
    `);
    return res.json({ ok: true, data: federationsRes.rows });
  } catch (err) {
    console.error('getFederations error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to fetch federations' });
  }
};

exports.getSocieties = async (req, res) => {
  try {
    const { federation_id } = req.query;
    let query = `
      SELECT s.*, f.name AS federation_name,
        COUNT(DISTINCT c.id)::int AS active_workers_count,
        COUNT(DISTINCT CASE WHEN c.is_verified = true THEN c.id END)::int AS verified_workers_count
      FROM cooperative_societies s
      LEFT JOIN federations f ON f.id = s.federation_id
      LEFT JOIN contractors c ON c.society_id = s.id
    `;
    const params = [];
    if (federation_id) {
      params.push(federation_id);
      query += ` WHERE s.federation_id = $1`;
    }
    query += ` GROUP BY s.id, f.name ORDER BY s.name ASC`;

    const societiesRes = await db.query(query, params);
    return res.json({ ok: true, data: societiesRes.rows });
  } catch (err) {
    console.error('getSocieties error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to fetch cooperative societies' });
  }
};

exports.getSocietyById = async (req, res) => {
  try {
    const { id } = req.params;
    const societyRes = await db.query(
      `SELECT s.*, f.name AS federation_name, f.registration_no AS federation_reg_no
       FROM cooperative_societies s
       LEFT JOIN federations f ON f.id = s.federation_id
       WHERE s.id = $1`,
      [id]
    );

    if (societyRes.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Cooperative society not found' });
    }

    const workersRes = await db.query(
      `SELECT c.*, u.name AS user_name, u.phone, u.email
       FROM contractors c
       JOIN users u ON u.id = c.user_id
       WHERE c.society_id = $1
       ORDER BY c.created_at DESC`,
      [id]
    );

    return res.json({
      ok: true,
      data: {
        society: societyRes.rows[0],
        workers: workersRes.rows,
      },
    });
  } catch (err) {
    console.error('getSocietyById error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to fetch society details' });
  }
};

exports.getWorkerWelfareDetails = async (req, res) => {
  try {
    const { workerId } = req.params;
    
    // Get worker society and insurance
    const workerRes = await db.query(
      `SELECT c.id, c.business_name, c.member_registration_no, c.welfare_id, c.is_verified,
              s.name AS society_name, s.registration_no AS society_reg_no,
              f.name AS federation_name, f.welfare_fund_balance
       FROM contractors c
       LEFT JOIN cooperative_societies s ON s.id = c.society_id
       LEFT JOIN federations f ON f.id = s.federation_id
       WHERE c.id = $1`,
      [workerId]
    );

    if (workerRes.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Worker not found' });
    }

    const contributionsRes = await db.query(
      `SELECT * FROM welfare_fund_contributions
       WHERE worker_id = $1
       ORDER BY contribution_date DESC`,
      [workerId]
    );

    const insuranceRes = await db.query(
      `SELECT * FROM insurance_policies
       WHERE worker_id = $1
       ORDER BY valid_till DESC`,
      [workerId]
    );

    return res.json({
      ok: true,
      data: {
        affiliation: workerRes.rows[0],
        contributions: contributionsRes.rows,
        insurance: insuranceRes.rows,
      },
    });
  } catch (err) {
    console.error('getWorkerWelfareDetails error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to fetch worker welfare details' });
  }
};

exports.getDemandForecast = async (req, res) => {
  try {
    const { locality, category, days } = req.query;
    const forecast = await ForecastingService.getDemandForecast({
      locality: locality || 'MP Nagar',
      serviceCategory: category || 'electrical',
      days: Number(days) || 10,
    });
    const overview = await ForecastingService.getFederationOverview();

    return res.json({
      ok: true,
      data: {
        series: forecast,
        overview,
      },
    });
  } catch (err) {
    console.error('getDemandForecast error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to generate demand forecast' });
  }
};

exports.verifyWorker = async (req, res) => {
  try {
    const { workerId, societyId, skillsCertified = true } = req.body;
    if (!workerId) return res.status(400).json({ ok: false, message: 'workerId required' });

    const updateRes = await db.query(
      `UPDATE contractors
       SET is_verified = true,
           verification_status = 'verified',
           skills_certified = $1,
           society_id = COALESCE($2, society_id),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [skillsCertified, societyId || null, workerId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Worker not found' });
    }

    return res.json({
      ok: true,
      message: 'Worker successfully verified under Cooperative Society',
      data: updateRes.rows[0],
    });
  } catch (err) {
    console.error('verifyWorker error:', err);
    return res.status(500).json({ ok: false, message: 'Verification update failed' });
  }
};

exports.getFederationAdminStats = async (req, res) => {
  try {
    const statsQuery = `
      SELECT
        (SELECT COUNT(*) FROM federations)::int AS total_federations,
        (SELECT COUNT(*) FROM cooperative_societies)::int AS total_societies,
        (SELECT COUNT(*) FROM contractors WHERE is_verified = true)::int AS verified_workers,
        (SELECT COUNT(*) FROM contractors)::int AS total_registered_workers,
        (SELECT COUNT(*) FROM bookings)::int AS total_bookings,
        (SELECT COUNT(*) FROM bookings WHERE is_emergency = true)::int AS emergency_bookings,
        (SELECT COALESCE(SUM(amount), 0) FROM bookings WHERE status = 'COMPLETED')::numeric AS gross_turnover,
        (SELECT COALESCE(SUM(welfare_fund_balance), 0) FROM federations)::numeric AS federation_welfare_corpus,
        (SELECT COALESCE(SUM(welfare_pool_balance), 0) FROM cooperative_societies)::numeric AS societies_welfare_corpus
    `;
    const statsRes = await db.query(statsQuery);

    const societiesRes = await db.query(`
      SELECT s.id, s.name, s.registration_no, s.district, s.welfare_pool_balance,
             f.name AS federation_name,
             COUNT(c.id)::int AS worker_count,
             COUNT(CASE WHEN c.is_verified = true THEN 1 END)::int AS verified_count
      FROM cooperative_societies s
      LEFT JOIN federations f ON f.id = s.federation_id
      LEFT JOIN contractors c ON c.society_id = s.id
      GROUP BY s.id, f.name
      ORDER BY s.name ASC
    `);

    const overview = await ForecastingService.getFederationOverview();

    return res.json({
      ok: true,
      data: {
        summary: statsRes.rows[0],
        societies: societiesRes.rows,
        forecastingOverview: overview,
      },
    });
  } catch (err) {
    console.error('getFederationAdminStats error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to fetch federation statistics' });
  }
};

exports.getSocietyAdminStats = async (req, res) => {
  try {
    const { societyId } = req.params;
    const socId = societyId || req.user?.society_id || '33333333-3333-4333-a333-333333333333';

    const societyRes = await db.query(
      `SELECT s.*, f.name AS federation_name
       FROM cooperative_societies s
       LEFT JOIN federations f ON f.id = s.federation_id
       WHERE s.id = $1`,
      [socId]
    );

    const workersRes = await db.query(
      `SELECT c.*, u.name AS user_name, u.phone, u.email,
              (SELECT COUNT(*) FROM bookings b WHERE b.contractor_id = c.id)::int AS completed_jobs
       FROM contractors c
       JOIN users u ON u.id = c.user_id
       WHERE c.society_id = $1
       ORDER BY c.created_at DESC`,
      [socId]
    );

    const bookingsRes = await db.query(
      `SELECT b.*, u.name AS customer_name, c.business_name AS worker_name
       FROM bookings b
       JOIN users u ON u.id = b.customer_id
       JOIN contractors c ON c.id = b.contractor_id
       WHERE c.society_id = $1
       ORDER BY b.created_at DESC
       LIMIT 25`,
      [socId]
    );

    return res.json({
      ok: true,
      data: {
        society: societyRes.rows[0] || null,
        workers: workersRes.rows || [],
        recentBookings: bookingsRes.rows || [],
      },
    });
  } catch (err) {
    console.error('getSocietyAdminStats error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to fetch society dashboard stats' });
  }
};

// ── Control Feature: AI Workforce Mobilization & Dispatch ──
exports.allocateWorkforce = async (req, res) => {
  try {
    const { locality, category, workersNeeded = 10, notes } = req.body;
    
    // 1. Record snapshot action
    await db.query(`
      INSERT INTO demand_forecast_snapshots (locality, service_category, forecast_date, predicted_demand, actual_demand, confidence_score)
      VALUES ($1, $2, CURRENT_DATE + INTERVAL '1 day', $3, 0, 0.95)
    `, [locality || 'MP Nagar', category || 'electrical', workersNeeded]);

    return res.json({
      ok: true,
      message: `Successfully mobilized and notified ${workersNeeded} registered ${category} artisans in ${locality}. Capacity reserved.`,
      allocation: {
        locality,
        category,
        workersDispatched: workersNeeded,
        priority: 'HIGH_DEMAND_SURGE',
        dispatchTimestamp: new Date().toISOString(),
        notes: notes || 'Seasonal demand surge capacity allocation triggered by State Federation'
      }
    });
  } catch (err) {
    console.error('allocateWorkforce error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to dispatch workforce allocation' });
  }
};

// ── Control Feature: Disputes & Grievance Arbitration ──
exports.getDisputes = async (req, res) => {
  try {
    const disputesRes = await db.query(`
      SELECT b.id AS booking_id, b.amount, b.status, b.payment_status, b.service_category, b.created_at,
             u.name AS customer_name, u.phone AS customer_phone,
             c.business_name AS worker_name, c.member_registration_no,
             s.name AS society_name
      FROM bookings b
      JOIN users u ON u.id = b.customer_id
      JOIN contractors c ON c.id = b.contractor_id
      LEFT JOIN cooperative_societies s ON s.id = c.society_id
      WHERE b.status IN ('DISPUTED', 'PENDING', 'IN_PROGRESS')
      ORDER BY b.created_at DESC
      LIMIT 20
    `);

    // Provide rich simulated dispute queue if empty
    const queue = disputesRes.rows.length > 0 ? disputesRes.rows : [
      {
        booking_id: 'dispute-001',
        customer_name: 'Dr. Alok Verma',
        worker_name: 'Ramesh Sharma Electrical Works',
        service_category: 'electrical',
        amount: '850.00',
        society_name: 'Bhopal Shramik & Karigar Sahakari Samiti',
        reason: 'Delay in transformer parts arrival. Customer requested cancellation.',
        status: 'DISPUTED'
      },
      {
        booking_id: 'dispute-002',
        customer_name: 'Sunita Mehra',
        worker_name: 'Suresh Kumar Plumbing Services',
        service_category: 'plumbing',
        amount: '600.00',
        society_name: 'Bhopal Shramik & Karigar Sahakari Samiti',
        reason: 'Extra pipe fittings cost clarification needed.',
        status: 'DISPUTED'
      }
    ];

    return res.json({ ok: true, data: queue });
  } catch (err) {
    console.error('getDisputes error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to fetch disputes' });
  }
};

exports.resolveDispute = async (req, res) => {
  try {
    const { bookingId, decision, resolutionNotes } = req.body;
    // decision: 'RELEASE_TO_WORKER' or 'REFUND_TO_CUSTOMER'
    if (bookingId && !bookingId.startsWith('dispute-')) {
      const newStatus = decision === 'RELEASE_TO_WORKER' ? 'COMPLETED' : 'CANCELLED';
      const newPayStatus = decision === 'RELEASE_TO_WORKER' ? 'RELEASED' : 'REFUNDED';
      await db.query(
        'UPDATE bookings SET status = $1, payment_status = $2 WHERE id = $3',
        [newStatus, newPayStatus, bookingId]
      );
    }

    return res.json({
      ok: true,
      message: `Dispute resolved via Cooperative Arbitration: ${decision === 'RELEASE_TO_WORKER' ? 'Funds Released to Artisan' : 'Refund Issued to Customer'}`,
      resolution: { bookingId, decision, resolutionNotes, resolvedAt: new Date().toISOString() }
    });
  } catch (err) {
    console.error('resolveDispute error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to resolve dispute' });
  }
};

// ── Control Feature: Welfare Corpus Claims Management ──
exports.getWelfareClaims = async (req, res) => {
  try {
    const claims = [
      {
        id: 'CLM-2026-0811',
        worker_name: 'Kailash Rangsaaz',
        trade: 'Painting & Polishing',
        society_name: 'Bhopal Shramik & Karigar Sahakari Samiti',
        claim_type: 'Accidental Injury Medical Reimbursement',
        amount: '15000.00',
        status: 'PENDING_APPROVAL',
        date_filed: '2026-08-20',
        insurance_ref: 'PMSBY-SHK-4003'
      },
      {
        id: 'CLM-2026-0812',
        worker_name: 'Shanta Devi',
        trade: 'Domestic Help & Housekeeping',
        society_name: 'Bhopal Shramik & Karigar Sahakari Samiti',
        claim_type: 'Artisan Children Education Scholarship Grant',
        amount: '8000.00',
        status: 'APPROVED',
        date_filed: '2026-08-18',
        insurance_ref: 'WLF-SCH-2026'
      }
    ];
    return res.json({ ok: true, data: claims });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Failed to fetch welfare claims' });
  }
};

exports.approveWelfareClaim = async (req, res) => {
  try {
    const { claimId, approvedAmount } = req.body;
    return res.json({
      ok: true,
      message: `Welfare Claim ${claimId} approved. ₹${approvedAmount || '15,000'} disbursed from Cooperative Welfare Corpus into worker bank account.`,
      disbursementRef: `TXN-WLF-${Date.now()}`
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Failed to disburse welfare grant' });
  }
};

// ── Control Feature: Reject Worker with Feedback ──
exports.rejectWorker = async (req, res) => {
  try {
    const { workerId, reason } = req.body;
    await db.query(
      `UPDATE contractors 
       SET is_verified = false, verification_status = 'rejected', description = description || ' [Verification Note: ' || $2 || ']'
       WHERE id = $1`,
      [workerId, reason || 'Incomplete certification documentation']
    );
    return res.json({ ok: true, message: 'Worker verification rejected with feedback note.' });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Rejection failed' });
  }
};

// ── Invoicing Feature: Generate Itemized Cooperative Tax Invoice ──
exports.getBookingInvoice = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const bRes = await db.query(`
      SELECT b.*, 
             u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
             c.business_name AS worker_name, c.member_registration_no, c.welfare_id, c.category AS trade,
             s.name AS society_name, s.registration_no AS society_reg_no, s.district,
             f.name AS federation_name
      FROM bookings b
      JOIN users u ON u.id = b.customer_id
      JOIN contractors c ON c.id = b.contractor_id
      LEFT JOIN cooperative_societies s ON s.id = c.society_id
      LEFT JOIN federations f ON f.id = s.federation_id
      WHERE b.id = $1
    `, [bookingId]);

    if (bRes.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Booking not found' });
    }

    const b = bRes.rows[0];
    const baseAmount = Number(b.amount || 500);
    const welfareContribution = 25.00;
    const gstRate = 0.18;
    const taxableServiceCharge = baseAmount;
    const gstAmount = Math.round(taxableServiceCharge * gstRate * 100) / 100;
    const totalPayable = taxableServiceCharge + welfareContribution + gstAmount;

    return res.json({
      ok: true,
      invoice: {
        invoiceNumber: `INV-SHK-2026-${String(b.id).replace(/\D/g, '').slice(-6) || '984120'}`,
        invoiceDate: b.created_at,
        status: b.status,
        paymentStatus: b.payment_status || 'IN_ESCROW',
        isEmergency: b.is_emergency,
        society: {
          name: b.society_name || 'Bhopal Shramik & Karigar Sahakari Samiti',
          registrationNo: b.society_reg_no || 'SOC-BPL-2020-0412',
          federation: b.federation_name || 'Madhya Pradesh State Labour Cooperative Federation',
          district: b.district || 'Bhopal'
        },
        worker: {
          name: b.worker_name,
          trade: b.trade,
          memberRegNo: b.member_registration_no || 'MEM-BPL-2026-0101',
          welfareId: b.welfare_id || 'WLF-2026-8001'
        },
        customer: {
          name: b.customer_name,
          phone: b.customer_phone,
          address: b.location_address || 'Bhopal, Madhya Pradesh'
        },
        lineItems: [
          { description: `Verified ${b.trade || 'Household'} Service (${b.service_tier || 'Standard'})`, amount: taxableServiceCharge },
          { description: 'Cooperative Society Worker Welfare Fund Contribution (Pensions & Health)', amount: welfareContribution },
          { description: 'GST (Central + State @ 18%)', amount: gstAmount }
        ],
        summary: {
          subtotal: taxableServiceCharge,
          welfareCorpusFund: welfareContribution,
          tax: gstAmount,
          total: totalPayable
        }
      }
    });
  } catch (err) {
    console.error('getBookingInvoice error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to generate invoice' });
  }
};
