const db = require('../config/db');
const ForecastingService = require('../services/forecastingService');
const emergencyDispatchService = require('../services/emergencyDispatchService');

/**
 * Cooperative Hierarchy & Welfare Controller
 * Handles Federations, Primary Societies, Worker Affiliations, Welfare Funds, and Demand Forecasting.
 */

function isPlatformAdmin(user) {
  return user?.role === 'admin';
}

function getActorScope(user) {
  if (!user || isPlatformAdmin(user)) return { clause: '', params: [] };
  if (user.role === 'society_admin' && user.society_id) {
    return { clause: ' AND c.society_id = $SCOPE', params: [user.society_id] };
  }
  if (user.role === 'federation_admin' && user.federation_id) {
    return { clause: ' AND f.id = $SCOPE', params: [user.federation_id] };
  }
  return { clause: ' AND 1 = 0', params: [] };
}

function applyActorScope(query, params, user) {
  const scope = getActorScope(user);
  if (!scope.clause) return { query, params };
  if (scope.params.length === 0) return { query: `${query}${scope.clause}`, params };
  return {
    query: `${query}${scope.clause.replace('$SCOPE', `$${params.length + 1}`)}`,
    params: [...params, scope.params[0]],
  };
}

async function loadScopedWorker(workerId, user) {
  const scoped = applyActorScope(`
    SELECT c.*, s.federation_id
    FROM contractors c
    LEFT JOIN cooperative_societies s ON s.id = c.society_id
    LEFT JOIN federations f ON f.id = s.federation_id
    WHERE c.id = $1
  `, [workerId], user);
  const result = await db.query(scoped.query, scoped.params);
  return result.rows[0] || null;
}

exports.getFederations = async (req, res) => {
  try {
    const lat = req.query.lat === undefined ? null : Number(req.query.lat);
    const lng = req.query.lng === undefined ? null : Number(req.query.lng);
    const withDistance = Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    const federationsRes = await db.query(`
      SELECT f.id, f.name, f.registration_no, f.state, f.jurisdiction_state, f.region,
        f.jurisdiction_districts, f.contact_email, f.contact_phone, f.office_address,
        f.latitude, f.longitude,
        ${withDistance ? 'earth_distance(ll_to_earth($1::float8, $2::float8), ll_to_earth(f.latitude::float8, f.longitude::float8)) / 1000.0' : 'NULL::float8'} AS distance_km,
        COUNT(DISTINCT s.id)::int AS total_societies,
        COUNT(DISTINCT c.id)::int AS total_workers
      FROM federations f
      LEFT JOIN cooperative_societies s ON s.federation_id = f.id
      LEFT JOIN contractors c ON c.society_id = s.id
      WHERE f.is_active = true
      GROUP BY f.id
      ORDER BY ${withDistance ? 'distance_km ASC NULLS LAST,' : ''} f.created_at ASC
    `, withDistance ? [lat, lng] : []);
    return res.json({ ok: true, data: federationsRes.rows });
  } catch (err) {
    console.error('getFederations error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to fetch federations' });
  }
};

exports.getSocieties = async (req, res) => {
  try {
    const { federation_id } = req.query;
    if (req.user?.role === 'federation_admin') {
      if (!req.user.federation_id) return res.status(403).json({ ok: false, message: 'Federation account is not assigned to a federation' });
      const scoped = await db.query(`
        SELECT s.id, s.federation_id, s.name, s.registration_no, s.district, s.jurisdiction_state,
          s.jurisdiction_districts, s.contact_phone, s.contact_email, s.office_address, s.is_active,
          f.name AS federation_name,
          COUNT(DISTINCT c.id)::int AS active_workers_count,
          COUNT(DISTINCT CASE WHEN c.is_verified=true THEN c.id END)::int AS verified_workers_count,
          COALESCE((SELECT GREATEST(0,SUM(le.amount)) FROM cooperative_ledger_entries le WHERE le.society_id=s.id
            AND le.entry_type IN ('welfare_contribution','welfare_claim_reservation')),0)::numeric AS welfare_pool_balance
        FROM cooperative_societies s JOIN federations f ON f.id=s.federation_id
        LEFT JOIN contractors c ON c.society_id=s.id
        WHERE s.federation_id=$1 GROUP BY s.id,f.name ORDER BY s.name`, [req.user.federation_id]);
      return res.json({ ok: true, data: scoped.rows });
    }
    let query = `
      SELECT s.id, s.federation_id, s.name, s.registration_no, s.district, s.jurisdiction_state,
        s.jurisdiction_districts, s.contact_phone, s.contact_email, s.office_address, s.is_active,
        f.name AS federation_name,
        COALESCE((SELECT GREATEST(0,SUM(le.amount)) FROM cooperative_ledger_entries le WHERE le.society_id=s.id
          AND le.entry_type IN ('welfare_contribution','welfare_claim_reservation')),0)::numeric AS welfare_pool_balance,
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
    if (req.user?.role === 'federation_admin' && !req.user.federation_id) {
      return res.status(403).json({ ok: false, message: 'Federation account is not assigned to a federation' });
    }
    const societyRes = await db.query(
      `SELECT s.id, s.federation_id, s.name, s.registration_no, s.district, s.jurisdiction_state,
              s.jurisdiction_districts, s.contact_phone, s.contact_email, s.office_address,
              f.name AS federation_name, f.registration_no AS federation_reg_no,
              COALESCE((SELECT SUM(le.amount) FROM cooperative_ledger_entries le WHERE le.society_id=s.id
                AND le.entry_type IN ('welfare_contribution','welfare_claim_reservation')),0)::numeric AS welfare_pool_balance
       FROM cooperative_societies s
       LEFT JOIN federations f ON f.id = s.federation_id
       WHERE s.id = $1`,
      [id]
    );

    if (societyRes.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Cooperative society not found' });
    }
    if (req.user?.role === 'federation_admin' && String(societyRes.rows[0].federation_id) !== String(req.user.federation_id)) {
      return res.status(403).json({ ok: false, message: 'Society is outside your federation' });
    }

    const workersRes = await db.query(
      `SELECT c.id, c.business_name, c.category, c.categories, c.description, c.daily_rate, c.experience_years,
              c.rating, c.review_count, c.is_verified, c.verification_status, c.skills_certified,
              c.society_id, c.member_registration_no, c.certificate_url, c.skill_certification_body,
              c.photo_url, c.image_url, c.created_at, u.name AS user_name
       FROM contractors c
       JOIN users u ON u.id = c.user_id
       WHERE c.society_id = $1 AND ($2::boolean OR c.is_verified = true)
       ORDER BY c.created_at DESC`,
      [id, req.user?.role === 'admin' || req.user?.role === 'society_admin' || req.user?.role === 'federation_admin']
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
    if (!req.user) return res.status(401).json({ ok: false, message: 'Authentication required' });
    
    // Report recorded welfare activity only; insurance is not integrated.
    const workerRes = await db.query(
      `SELECT c.id, c.business_name, c.member_registration_no, c.welfare_id, c.is_verified,
              s.id AS society_id, s.name AS society_name, s.registration_no AS society_reg_no,
              f.id AS federation_id, f.name AS federation_name
       FROM contractors c
       LEFT JOIN cooperative_societies s ON s.id = c.society_id
       LEFT JOIN federations f ON f.id = s.federation_id
       WHERE c.id = $1`,
      [workerId]
    );

    if (workerRes.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Worker not found' });
    }
    const affiliation = workerRes.rows[0];
    const ownWorkerRes = await db.query('SELECT id FROM contractors WHERE user_id=$1', [req.user.id]);
    const canView = req.user.role === 'admin'
      || (ownWorkerRes.rows[0] && String(ownWorkerRes.rows[0].id) === String(workerId))
      || (req.user.role === 'society_admin' && String(req.user.society_id) === String(affiliation.society_id))
      || (req.user.role === 'federation_admin' && String(req.user.federation_id) === String(affiliation.federation_id));
    if (!canView) return res.status(403).json({ ok: false, message: 'Access denied' });

    const contributionsRes = await db.query(
      `SELECT le.id, le.amount, le.created_at AS contribution_date, le.reference
       FROM cooperative_ledger_entries le
       WHERE le.worker_id = $1 AND le.entry_type = 'welfare_contribution'
       ORDER BY le.created_at DESC`,
      [workerId]
    );

    const claimsRes = await db.query(
      `SELECT id, claim_type, amount, approved_amount, status, filed_at, approved_at, disbursed_at
       FROM welfare_claims WHERE worker_id = $1 ORDER BY filed_at DESC`,
      [workerId]
    );

    return res.json({
      ok: true,
      data: {
        affiliation: workerRes.rows[0],
        contributions: contributionsRes.rows,
        claims: claimsRes.rows,
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
    if (req.user?.role === 'federation_admin') {
      if (!req.user.federation_id) return res.status(403).json({ ok: false, message: 'Federation account is not assigned to a federation' });
      const districtsRes = await db.query('SELECT DISTINCT district FROM cooperative_societies WHERE federation_id = $1 AND district IS NOT NULL', [req.user.federation_id]);
      const districts = districtsRes.rows.map((row) => row.district);
      if (locality && !districts.some((district) => district.toLowerCase() === String(locality).toLowerCase())) {
        return res.status(403).json({ ok: false, message: 'Forecast locality is outside your federation' });
      }
      const scopedSeries = await db.query(`
        SELECT d.id, d.locality, d.service_category, TO_CHAR(d.forecast_date,'YYYY-MM-DD') AS forecast_date,
          d.predicted_demand, d.actual_demand, d.confidence_score, d.seasonal_factor, d.data_source
        FROM demand_forecast_snapshots d
        WHERE d.data_source IN ('observed', 'demo') AND d.locality = ANY($1::text[])
          AND ($2::text IS NULL OR d.service_category ILIKE $2)
          AND ($3::text IS NULL OR d.locality ILIKE $3)
        ORDER BY d.forecast_date DESC LIMIT $4`, [districts, category || null, locality || null, Number(days) || 10]);
      let overview = await ForecastingService.getFederationOverview(districts);
      const overviewLocalities = await db.query(`SELECT locality, SUM(actual_demand)::int AS total_predicted, AVG(confidence_score)::numeric AS avg_confidence
        FROM demand_forecast_snapshots WHERE data_source IN ('observed','demo') AND locality=ANY($1::text[])
        GROUP BY locality ORDER BY SUM(actual_demand) DESC LIMIT 5`, [districts]);
      overview = { ...overview, topLocalities: overviewLocalities.rows, dataSource: overviewLocalities.rows.length ? 'observed_completed_bookings' : 'no_data' };
      return res.json({ ok: true, data: { series: scopedSeries.rows, overview } });
    }
    const forecast = await ForecastingService.getDemandForecast({
      locality: locality || null,
      serviceCategory: category || null,
      days: Number(days) || 10,
    });
    let overview = await ForecastingService.getFederationOverview();
    if (req.user?.role === 'admin') {
      overview = await ForecastingService.getFederationOverview([]);
    }

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

exports.getPendingWorkers = async (req, res) => {
  try {
    const { federation_id, society_id } = req.query;
    if (req.user?.role === 'federation_admin' && !req.user.federation_id) {
      return res.status(403).json({ ok: false, message: 'Federation account is not assigned to a federation' });
    }
    let query = `
      SELECT c.*, u.name AS user_name, u.phone, u.email,
             s.name AS society_name, s.registration_no AS society_registration_no, s.district AS society_district,
             f.name AS federation_name, f.id AS federation_id
      FROM contractors c
      JOIN users u ON u.id = c.user_id
      LEFT JOIN cooperative_societies s ON s.id = c.society_id
      LEFT JOIN federations f ON f.id = s.federation_id
      WHERE (c.verification_status = 'pending' OR c.is_verified = false)
    `;
    const params = [];
    if (req.user?.role === 'federation_admin') {
      params.push(req.user.federation_id);
      query += ` AND f.id = $${params.length}`;
    } else if (req.user?.role === 'society_admin') {
      if (!req.user.society_id) return res.status(403).json({ ok: false, message: 'Society account is not assigned to a society' });
      params.push(req.user.society_id);
      query += ` AND c.society_id = $${params.length}`;
    } else if (society_id) {
      params.push(society_id);
      query += ` AND c.society_id = $${params.length}`;
    } else if (federation_id) {
      params.push(federation_id);
      query += ` AND f.id = $${params.length}`;
    }
    if (req.user?.role === 'federation_admin' && !req.user.federation_id) {
      return res.status(403).json({ ok: false, message: 'Federation account is not assigned to a federation' });
    }
    const scoped = applyActorScope(query, params, req.user);
    query = scoped.query;
    params.splice(0, params.length, ...scoped.params);
    query += ` ORDER BY c.created_at DESC`;

    const result = await db.query(query, params);
    return res.json({ ok: true, data: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('getPendingWorkers error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to fetch pending workers' });
  }
};

exports.verifyWorker = async (req, res) => {
  try {
    const { workerId, societyId, skillsCertified = false, badgeType = 'Cooperative Verified Worker' } = req.body;
    if (!workerId) return res.status(400).json({ ok: false, message: 'workerId required' });
    const scopedWorker = await loadScopedWorker(workerId, req.user);
    if (!scopedWorker) return res.status(403).json({ ok: false, message: 'Worker is outside your cooperative jurisdiction' });
    const docsRes = await db.query(`SELECT society_id, member_registration_no, id_proof_url, cooperative_card_url, certificate_url, skill_certification_body FROM contractors WHERE id=$1`, [workerId]);
    const docs = docsRes.rows[0];
    if (!docs?.society_id || !String(docs.member_registration_no || '').trim() || !docs.id_proof_url || !docs.cooperative_card_url) {
      return res.status(400).json({ ok: false, message: 'Identity document, cooperative membership card, society affiliation, and existing member number must be verified before approval.' });
    }
    if (skillsCertified && (!docs.certificate_url || !docs.skill_certification_body)) {
      return res.status(400).json({ ok: false, message: 'A skill certificate and its issuing body are required when marking skills as certified.' });
    }
    if (societyId && req.user?.role === 'society_admin' && String(societyId) !== String(req.user.society_id)) {
      return res.status(403).json({ ok: false, message: 'Cannot assign worker outside your society' });
    }
    if (societyId && req.user?.role === 'federation_admin') {
      const societyRes = await db.query('SELECT federation_id FROM cooperative_societies WHERE id = $1', [societyId]);
      if (!societyRes.rows[0] || String(societyRes.rows[0].federation_id) !== String(req.user.federation_id)) {
        return res.status(403).json({ ok: false, message: 'Cannot assign worker outside your federation' });
      }
    }

    const updateRes = await db.query(
      `UPDATE contractors
       SET is_verified = true,
           verification_status = 'verified',
           skills_certified = $1,
           society_id = COALESCE($2, society_id),
           badge_type = $3,
           rejection_reason = NULL,
           verified_at = NOW(),
           verified_by = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [skillsCertified, societyId || docs.society_id, badgeType, req.user?.id || null, workerId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Worker not found' });
    }

    const worker = updateRes.rows[0];
    await db.query(
      `INSERT INTO worker_verification_history
         (worker_id, reviewer_user_id, action, reason, checklist, verification_status)
       VALUES ($1, $2, 'approved', NULL, $3::jsonb, 'verified')`,
      [workerId, req.user?.id || null, JSON.stringify({ identityReviewed: true, membershipReviewed: Boolean(worker.member_registration_no), skillsCertified: Boolean(skillsCertified), societyAssigned: Boolean(worker.society_id) })]
    );
    // Send in-app notification
    await db.query(
      `INSERT INTO notifications (user_id, message, type)
       VALUES ($1, $2, 'verification')`,
      [
        worker.user_id,
        'Congratulations! Your cooperative worker profile has been verified by the Cooperative Federation.'
      ]
    ).catch(() => {});

    return res.json({
      ok: true,
      message: 'Worker successfully verified under Cooperative Federation',
      data: worker,
    });
  } catch (err) {
    console.error('verifyWorker error:', err);
    return res.status(500).json({ ok: false, message: 'Verification update failed' });
  }
};

exports.getFederationAdminStats = async (req, res) => {
  try {
    const federationId = req.user?.role === 'admin' ? null : req.user?.federation_id;
    if (req.user?.role === 'federation_admin' && !federationId) {
      return res.status(403).json({ ok: false, message: 'Federation account is not assigned to a federation' });
    }
    const federationFilter = federationId ? ' = $1' : ' IS NOT NULL';
    const scopedSocietyBalances = federationId
      ? await db.query(`SELECT s.id, s.name, s.registration_no, s.district, f.name AS federation_name,
          COUNT(DISTINCT c.id)::int AS worker_count,
          COUNT(DISTINCT CASE WHEN c.is_verified = true THEN c.id END)::int AS verified_count,
          COALESCE((SELECT GREATEST(0,SUM(le.amount)) FROM cooperative_ledger_entries le WHERE le.society_id=s.id
            AND le.entry_type IN ('welfare_contribution','welfare_claim_reservation')),0)::numeric AS welfare_pool_balance
        FROM cooperative_societies s LEFT JOIN federations f ON f.id=s.federation_id
        LEFT JOIN contractors c ON c.society_id=s.id
        WHERE s.federation_id=$1 GROUP BY s.id,f.name ORDER BY s.name`, [federationId])
      : null;
    const statsQuery = `
      SELECT
        (SELECT COUNT(*) FROM federations f WHERE f.id${federationFilter})::int AS total_federations,
        (SELECT COUNT(*) FROM cooperative_societies s WHERE s.federation_id${federationFilter})::int AS total_societies,
        (SELECT COUNT(*) FROM contractors c JOIN cooperative_societies s ON s.id=c.society_id WHERE s.federation_id${federationFilter} AND c.is_verified = true)::int AS verified_workers,
        (SELECT COUNT(*) FROM contractors c JOIN cooperative_societies s ON s.id=c.society_id WHERE s.federation_id${federationFilter})::int AS total_registered_workers,
        (SELECT COUNT(*) FROM bookings b JOIN contractors c ON c.id=b.contractor_id JOIN cooperative_societies s ON s.id=c.society_id WHERE s.federation_id${federationFilter})::int AS total_bookings,
        (SELECT COUNT(*) FROM bookings b JOIN contractors c ON c.id=b.contractor_id JOIN cooperative_societies s ON s.id=c.society_id WHERE s.federation_id${federationFilter} AND b.is_emergency = true)::int AS emergency_bookings,
        (SELECT COALESCE(SUM(b.amount), 0) FROM bookings b JOIN contractors c ON c.id=b.contractor_id JOIN cooperative_societies s ON s.id=c.society_id WHERE s.federation_id${federationFilter} AND b.status = 'COMPLETED')::numeric AS gross_turnover,
        (SELECT COALESCE(SUM(le.amount), 0) FROM cooperative_ledger_entries le JOIN cooperative_societies s ON s.id=le.society_id WHERE s.federation_id${federationFilter} AND le.entry_type='federation_share')::numeric AS federation_contributions,
        (SELECT GREATEST(0, COALESCE(SUM(le.amount), 0)) FROM cooperative_ledger_entries le JOIN cooperative_societies s ON s.id=le.society_id WHERE s.federation_id${federationFilter} AND le.entry_type IN ('welfare_contribution','welfare_claim_reservation'))::numeric AS societies_welfare_corpus,
        (SELECT COALESCE(SUM(le.amount), 0) FROM cooperative_ledger_entries le JOIN cooperative_societies s ON s.id=le.society_id WHERE s.federation_id${federationFilter} AND le.entry_type='worker_payout')::numeric AS worker_payouts,
        (SELECT COUNT(*) FROM workforce_dispatch_offers o JOIN contractors c ON c.id=o.worker_id JOIN cooperative_societies s ON s.id=c.society_id WHERE s.federation_id${federationFilter} AND o.status='offered')::int AS open_dispatch_offers
    `;
    const statsRes = await db.query(statsQuery, federationId ? [federationId] : []);
    const federationRes = federationId
      ? await db.query('SELECT id, name, registration_no, state, jurisdiction_state, contact_email, contact_phone FROM federations WHERE id = $1', [federationId])
      : { rows: [] };

    const societiesRes = scopedSocietyBalances || await db.query(`
      SELECT s.id, s.name, s.registration_no, s.district,
             COALESCE(GREATEST(0,SUM(le.amount) FILTER (WHERE le.entry_type IN ('welfare_contribution','welfare_claim_reservation'))),0)::numeric AS welfare_pool_balance,
             f.name AS federation_name,
             COUNT(c.id)::int AS worker_count,
             COUNT(CASE WHEN c.is_verified = true THEN 1 END)::int AS verified_count
      FROM cooperative_societies s
      LEFT JOIN federations f ON f.id = s.federation_id
      LEFT JOIN contractors c ON c.society_id = s.id
      LEFT JOIN cooperative_ledger_entries le ON le.society_id = s.id
      ${federationId ? 'WHERE s.federation_id = $1' : ''}
      GROUP BY s.id, f.name
      ORDER BY s.name ASC
    `, federationId ? [federationId] : []);

    let overview = await ForecastingService.getFederationOverview();
    if (federationId) {
      const districtRes = await db.query('SELECT DISTINCT district FROM cooperative_societies WHERE federation_id=$1 AND district IS NOT NULL', [federationId]);
      const districts = districtRes.rows.map((row) => row.district);
      const observedRes = await db.query(`SELECT locality, SUM(actual_demand)::int AS total_predicted, AVG(confidence_score)::numeric AS avg_confidence
        FROM demand_forecast_snapshots WHERE data_source IN ('observed','demo') AND locality=ANY($1::text[])
        GROUP BY locality ORDER BY SUM(actual_demand) DESC LIMIT 5`, [districts]);
      const scopedCategories = await db.query(`SELECT service_category, SUM(actual_demand)::int AS total_predicted,
          SUM(actual_demand)::int AS total_actual FROM demand_forecast_snapshots
        WHERE data_source IN ('observed','demo') AND locality=ANY($1::text[]) GROUP BY service_category ORDER BY SUM(actual_demand) DESC`, [districts]);
      overview = { ...overview, topLocalities: observedRes.rows, categoryTrends: scopedCategories.rows,
        dataSource: observedRes.rows.length || scopedCategories.rows.length ? 'observed_completed_bookings' : 'no_data' };
    }

    return res.json({
      ok: true,
      data: {
        summary: statsRes.rows[0],
        federation: federationRes.rows[0] || null,
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
    const socId = societyId || req.user?.society_id;
    if (!socId) return res.status(400).json({ ok: false, message: 'Society id is required' });
    if (req.user?.role === 'society_admin' && String(socId) !== String(req.user.society_id)) {
      return res.status(403).json({ ok: false, message: 'Society is outside your jurisdiction' });
    }
    if (req.user?.role === 'federation_admin') {
      const access = await db.query('SELECT id FROM cooperative_societies WHERE id = $1 AND federation_id = $2', [socId, req.user.federation_id]);
      if (!access.rows[0]) return res.status(403).json({ ok: false, message: 'Society is outside your federation' });
    }

    const societyRes = await db.query(
      `SELECT s.id, s.federation_id, s.name, s.registration_no, s.district, s.jurisdiction_state,
              s.jurisdiction_districts, s.contact_phone, s.contact_email, s.office_address,
              COALESCE((SELECT SUM(le.amount) FROM cooperative_ledger_entries le WHERE le.society_id=s.id
                AND le.entry_type IN ('welfare_contribution','welfare_claim_reservation')),0)::numeric AS welfare_pool_balance,
              f.name AS federation_name
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

    const ledgerRes = await db.query(`
      SELECT COALESCE(SUM(le.amount) FILTER (WHERE le.entry_type = 'welfare_contribution'), 0)::numeric AS welfare_earned,
             COALESCE(SUM(le.amount) FILTER (WHERE le.entry_type = 'welfare_claim_reservation'), 0)::numeric AS welfare_reserved,
             COALESCE(SUM(le.amount) FILTER (WHERE le.entry_type = 'worker_payout'), 0)::numeric AS worker_payouts,
             COUNT(*) FILTER (WHERE le.entry_type = 'welfare_contribution')::int AS settled_jobs
      FROM cooperative_ledger_entries le
      WHERE le.society_id = $1`, [socId]);

    return res.json({
      ok: true,
      data: {
        society: societyRes.rows[0] || null,
        workers: workersRes.rows || [],
        recentBookings: bookingsRes.rows || [],
        ledger: ledgerRes.rows[0] || { welfare_earned: 0, worker_payouts: 0, settled_jobs: 0 },
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
    if (req.user?.role === 'federation_admin' && !req.user.federation_id) {
      return res.status(403).json({ ok: false, message: 'Federation account is not assigned to a federation' });
    }
    if (!locality || !category || !Number.isInteger(Number(workersNeeded)) || Number(workersNeeded) < 1 || Number(workersNeeded) > 500) {
      return res.status(400).json({ ok: false, message: 'Choose a locality and service category, and request between 1 and 500 workers.' });
    }
    if (req.user?.role === 'federation_admin') {
      const scopedDistricts = await db.query('SELECT DISTINCT district FROM cooperative_societies WHERE federation_id=$1', [req.user.federation_id]);
      if (!scopedDistricts.rows.some((row) => row.district?.toLowerCase() === locality.toLowerCase())) {
        return res.status(403).json({ ok: false, message: 'Allocation locality is outside your federation' });
      }
    }
    // This is an estimate/request, not a reservation. Workers accept offers individually.
    await db.query(`
      INSERT INTO demand_forecast_snapshots (locality, service_category, forecast_date, predicted_demand, actual_demand, confidence_score, data_source)
      VALUES ($1, $2, CURRENT_DATE + INTERVAL '1 day', $3, 0, 0, 'allocation_recommendation')
    `, [locality, category, Number(workersNeeded)]);

    const workersRes = await db.query(`
      SELECT c.id, c.user_id
      FROM contractors c
      JOIN cooperative_societies s ON s.id = c.society_id
      WHERE s.federation_id = $3
        AND c.is_available = true
        AND (c.is_verified = true OR c.verification_status = 'verified')
        AND c.category ILIKE $1
      ORDER BY c.rating DESC NULLS LAST, c.response_time_minutes ASC NULLS LAST
      LIMIT $2`, [category, Number(workersNeeded), req.user.federation_id]);

    for (const worker of workersRes.rows) {
      await db.query(`
        INSERT INTO workforce_dispatch_offers (worker_id, locality, service_category, priority, notes, expires_at)
        VALUES ($1, $2, $3, 'high', $4, NOW() + INTERVAL '24 hours')
        ON CONFLICT DO NOTHING`, [worker.id, locality || 'Unspecified locality', category || 'electrical', notes || 'Federation demand allocation offer']);
      await db.query(`
        INSERT INTO notifications (user_id, message, type)
        VALUES ($1, $2, 'dispatch')`, [worker.user_id, `High-demand ${category || 'service'} allocation available in ${locality || 'your area'}. Open your worker dashboard to respond.`]).catch(() => {});
    }

      return res.json({
      ok: true,
      message: `Successfully notified ${workersRes.rows.length} verified cooperative workers about this allocation. Capacity is not reserved until workers accept.`,
      allocation: {
        locality,
        category,
        workersDispatched: workersRes.rows.length,
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

exports.getMyDispatchOffers = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT o.*, c.business_name, c.category
      FROM workforce_dispatch_offers o
      JOIN contractors c ON c.id = o.worker_id
      WHERE c.user_id = $1 AND o.status = 'offered' AND o.expires_at > NOW()
      ORDER BY o.offered_at DESC`, [req.user.id]);
    return res.json({ ok: true, data: result.rows });
  } catch (err) {
    console.error('getMyDispatchOffers error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to load dispatch offers' });
  }
};

exports.respondToDispatchOffer = async (req, res) => {
  const { offerId } = req.params;
  const response = String(req.body?.response || '').toLowerCase();
  if (!['accepted', 'declined'].includes(response)) return res.status(400).json({ ok: false, message: 'Response must be accepted or declined' });
  try {
    const result = await emergencyDispatchService.respond(offerId, req.user.id, response);
    if (result.status === 'not_found') return res.status(404).json({ ok: false, message: 'Offer not found or expired' });
    if (result.status === 'failed') return res.status(500).json({ ok: false, message: 'Could not process the dispatch response' });
    return res.json({ ok: true, data: result.offer, status: result.status });
  } catch (err) {
    console.error('respondToDispatchOffer error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to respond to dispatch offer' });
  }
};

// ── Control Feature: Disputes & Grievance Arbitration ──
exports.getDisputes = async (req, res) => {
  try {
    let query = `
      SELECT b.id AS booking_id, b.amount, b.status, b.payment_status, b.service_category, b.created_at,
             u.name AS customer_name, u.phone AS customer_phone,
             c.business_name AS worker_name, c.member_registration_no,
             s.name AS society_name,
             f.name AS federation_name
      FROM bookings b
      JOIN users u ON u.id = b.customer_id
      JOIN contractors c ON c.id = b.contractor_id
      LEFT JOIN cooperative_societies s ON s.id = c.society_id
      LEFT JOIN federations f ON f.id = s.federation_id
      WHERE b.status IN ('DISPUTED', 'PENDING', 'IN_PROGRESS')
    `;
    const scoped = applyActorScope(query, [], req.user);
    query = `${scoped.query}
      ORDER BY b.created_at DESC
      LIMIT 20`;
    const disputesRes = await db.query(query, scoped.params);

    return res.json({ ok: true, data: disputesRes.rows });
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
      const scoped = applyActorScope(`
        SELECT b.id
        FROM bookings b
        JOIN contractors c ON c.id = b.contractor_id
        LEFT JOIN cooperative_societies s ON s.id = c.society_id
        LEFT JOIN federations f ON f.id = s.federation_id
        WHERE b.id = $1
      `, [bookingId], req.user);
      const bookingRes = await db.query(scoped.query, scoped.params);
      if (!bookingRes.rows[0]) return res.status(403).json({ ok: false, message: 'Booking is outside your cooperative jurisdiction' });
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
    let query = `
      SELECT wc.*, u.name AS worker_name, c.category AS trade, s.name AS society_name
      FROM welfare_claims wc
      JOIN contractors c ON c.id = wc.worker_id
      JOIN users u ON u.id = c.user_id
      LEFT JOIN cooperative_societies s ON s.id = wc.society_id
      LEFT JOIN federations f ON f.id = s.federation_id
    `;
    const scoped = applyActorScope(query, [], req.user);
    query = `${scoped.query} ORDER BY wc.filed_at DESC`;
    const result = await db.query(query, scoped.params);
    return res.json({ ok: true, data: result.rows });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Failed to fetch welfare claims' });
  }
};

exports.approveWelfareClaim = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { claimId, approvedAmount } = req.body;
    if (!claimId) return res.status(400).json({ ok: false, message: 'claimId is required' });
    const scopedClaim = applyActorScope(`
      SELECT wc.id, wc.worker_id, wc.society_id, wc.amount
      FROM welfare_claims wc
      JOIN contractors c ON c.id = wc.worker_id
      LEFT JOIN cooperative_societies s ON s.id = wc.society_id
      LEFT JOIN federations f ON f.id = s.federation_id
      WHERE wc.id = $1 AND wc.status = 'PENDING_APPROVAL'
    `, [claimId], req.user);
    await client.query('BEGIN');
    const claimScopeRes = await client.query(`${scopedClaim.query} FOR UPDATE OF wc`, scopedClaim.params);
    const pending = claimScopeRes.rows[0];
    if (!pending) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, message: 'Pending welfare claim not found in your jurisdiction' });
    }
    if (!pending.society_id) {
      await client.query('ROLLBACK');
      return res.status(409).json({ ok: false, message: 'Worker must be affiliated with a society before a welfare claim can be approved' });
    }
    const amount = approvedAmount === undefined ? Number(pending.amount) : Number(approvedAmount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > Number(pending.amount)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ ok: false, message: 'Approved amount must be positive and cannot exceed the requested amount' });
    }
    await client.query('SELECT id FROM cooperative_societies WHERE id = $1 FOR UPDATE', [pending.society_id]);
    const balanceRes = await client.query(`SELECT GREATEST(0, COALESCE(SUM(amount),0))::numeric AS balance
      FROM cooperative_ledger_entries WHERE society_id = $1
        AND entry_type IN ('welfare_contribution','welfare_claim_reservation')`, [pending.society_id]);
    const available = Number(balanceRes.rows[0]?.balance || 0);
    if (amount > available) {
      await client.query('ROLLBACK');
      return res.status(409).json({ ok: false, message: `Insufficient recorded welfare balance. Available: ₹${available.toFixed(2)}` });
    }
    const claimRes = await client.query(`
      UPDATE welfare_claims
      SET status = 'APPROVED', approved_amount = $1, approved_by = $2, approved_at = NOW()
      WHERE id = $3 AND status = 'PENDING_APPROVAL'
      RETURNING *`, [amount, req.user.id, claimId]);
    if (!claimRes.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, message: 'Pending welfare claim not found' });
    }
    const claim = claimRes.rows[0];
    await client.query(`INSERT INTO cooperative_ledger_entries (society_id, worker_id, entry_type, amount, reference) VALUES ($1, $2, 'welfare_claim_reservation', $3, $4)`, [claim.society_id, claim.worker_id, -amount, `CLAIM-${claim.id}`]);
    await client.query('COMMIT');
    return res.json({
      ok: true,
      message: `Welfare claim approved and ₹${amount.toFixed(2)} reserved from the recorded society fund. Bank disbursement must be recorded separately.`,
      reservationRef: `CLAIM-${claim.id}`
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('approveWelfareClaim error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to disburse welfare grant' });
  } finally {
    client.release();
  }
};

exports.fileWelfareClaim = async (req, res) => {
  try {
    const { claimType, amount, supportingDocumentUrl } = req.body || {};
    if (!claimType || !Number.isFinite(Number(amount)) || Number(amount) <= 0) return res.status(400).json({ ok: false, message: 'claimType and a positive amount are required' });
    const workerRes = await db.query('SELECT id, society_id FROM contractors WHERE user_id = $1', [req.user.id]);
    if (!workerRes.rows[0]) return res.status(404).json({ ok: false, message: 'Worker profile not found' });
    const result = await db.query(`
      INSERT INTO welfare_claims (worker_id, society_id, claim_type, amount, supporting_document_url)
      VALUES ($1, $2, $3, $4, $5) RETURNING *`, [workerRes.rows[0].id, workerRes.rows[0].society_id, claimType, Number(amount), supportingDocumentUrl || null]);
    return res.status(201).json({ ok: true, data: result.rows[0] });
  } catch (err) {
    console.error('fileWelfareClaim error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to file welfare claim' });
  }
};

// ── Control Feature: Reject Worker with Feedback ──
exports.rejectWorker = async (req, res) => {
  try {
    const { workerId, reason } = req.body;
    if (!workerId) return res.status(400).json({ ok: false, message: 'workerId required' });
    const scopedWorker = await loadScopedWorker(workerId, req.user);
    if (!scopedWorker) return res.status(403).json({ ok: false, message: 'Worker is outside your cooperative jurisdiction' });
    const resUpdate = await db.query(
      `UPDATE contractors 
       SET is_verified = false,
           verification_status = 'rejected',
           rejection_reason = $2,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [workerId, reason || 'Incomplete or unclear documentation submitted. Please re-upload verified documents.']
    );

    const worker = resUpdate.rows[0];
    if (worker) {
      await db.query(
        `INSERT INTO worker_verification_history
           (worker_id, reviewer_user_id, action, reason, checklist, verification_status)
         VALUES ($1, $2, 'rejected', $3, '{}'::jsonb, 'rejected')`,
        [workerId, req.user?.id || null, reason || 'Incomplete or unclear documentation submitted']
      );
    }
    if (worker) {
      await db.query(
        `INSERT INTO notifications (user_id, message, type)
         VALUES ($1, $2, 'verification')`,
        [
          worker.user_id,
          `Verification update: ${reason || 'Document verification could not be completed. Please review feedback in your worker dashboard.'}`
        ]
      ).catch(() => {});
    }

    return res.json({ ok: true, message: 'Worker verification rejected with feedback note.', data: worker });
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
             c.business_name AS worker_name, c.user_id AS worker_user_id, c.member_registration_no, c.welfare_id, c.category AS trade,
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
    let scopedAdminCanView = false;
    if (['society_admin', 'federation_admin'].includes(req.user.role)) {
      scopedAdminCanView = Boolean(await loadScopedWorker(b.contractor_id, req.user));
    }
    const canView = req.user.role === 'admin'
      || String(req.user.id) === String(b.customer_id)
      || String(req.user.id) === String(b.worker_user_id)
      || scopedAdminCanView;
    if (!canView) return res.status(403).json({ ok: false, message: 'Access denied' });
    const baseAmount = Number(b.amount || 0);
    const allocationRes = await db.query(`SELECT * FROM booking_financial_allocations WHERE booking_id = $1`, [bookingId]);
    const allocation = allocationRes.rows[0];
    const transferRes = await db.query(`SELECT status, razorpay_transfer_id, amount, released_at FROM federation_booking_transfers WHERE booking_id = $1`, [bookingId]);
    const welfareContribution = Number(allocation?.welfare_amount || 0);
    const totalPaid = baseAmount;
    const workerPayout = Number(allocation?.worker_amount ?? 0);
    const societyContribution = Number(allocation?.society_amount ?? 0);
    const federationContribution = Number(allocation?.federation_amount ?? 0);

    return res.json({
      ok: true,
      invoice: {
        invoiceNumber: `INV-SHK-${new Date(b.created_at).getFullYear()}-${String(b.id).replace(/\D/g, '').slice(-8)}`,
        invoiceDate: b.created_at,
        status: b.status,
        paymentStatus: b.payment_status || 'IN_ESCROW',
        isEmergency: b.is_emergency,
        society: {
          name: b.society_name || 'Unassigned cooperative society',
          registrationNo: b.society_reg_no || 'Pending registration',
          federation: b.federation_name || 'Unassigned federation',
          district: b.district || 'Not specified'
        },
        worker: {
          name: b.worker_name,
          trade: b.trade,
          memberRegNo: b.member_registration_no || 'Pending',
          welfareId: b.welfare_id || 'Pending'
        },
        customer: {
          name: b.customer_name,
          phone: b.customer_phone,
          address: b.location_address || 'Address not recorded'
        },
        lineItems: [
          { description: `Cooperative ${b.trade || 'Household'} service payment (${b.service_tier || 'Standard'})`, amount: totalPaid },
        ],
        cooperativeAllocation: allocation ? {
          workerPayout,
          societyContribution,
          federationContribution,
          welfareContribution,
          platformFee: Number(allocation.platform_amount || 0),
          tax: 0,
          note: 'Amounts are allocations within the paid total. The federation receives the provider-linked transfer; member payouts are recorded in the cooperative ledger for federation/society disbursement.'
        } : null,
        federationTransfer: transferRes.rows[0] || { status: b.payment_status === 'IN_ESCROW' ? 'held_until_completion' : 'not_created' },
        summary: {
          subtotal: totalPaid,
          welfareCorpusFund: welfareContribution,
          tax: 0,
          total: totalPaid
        }
      }
    });
  } catch (err) {
    console.error('getBookingInvoice error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to generate invoice' });
  }
};
