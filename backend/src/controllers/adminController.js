const db = require('../config/db');

exports.pendingContractors = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT c.*, u.name AS user_name, u.phone, u.email
       FROM contractors c
       JOIN users u ON u.id = c.user_id
       WHERE c.is_verified = false
       ORDER BY c.created_at ASC`
    );
    return res.json({ ok: true, contractors: result.rows });
  } catch (err) {
    return next(err);
  }
};

exports.verifyContractor = async (req, res, next) => {
  try {
    const result = await db.query(
      `UPDATE contractors
       SET is_verified = true, updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );
    const contractor = result.rows[0];
    if (!contractor) return res.status(404).json({ ok: false, message: 'Contractor not found' });

    await db.query(
      `INSERT INTO notifications (user_id, message, type)
       VALUES ($1, $2, $3)`,
      [contractor.user_id, 'Your profile has been verified.', 'verification']
    );

    return res.json({ ok: true, contractor });
  } catch (err) {
    return next(err);
  }
};

exports.stats = async (req, res, next) => {
  try {
    const [users, contractors, verified, reviewsToday, featured] = await Promise.all([
      db.query(`SELECT COUNT(*)::int AS count FROM users`),
      db.query(`SELECT COUNT(*)::int AS count FROM contractors`),
      db.query(`SELECT COUNT(*)::int AS count FROM contractors WHERE is_verified = true`),
      db.query(`SELECT COUNT(*)::int AS count FROM reviews WHERE created_at::date = now()::date`),
      db.query(`SELECT COUNT(*)::int AS count FROM contractors WHERE is_featured = true`),
    ]);
    return res.json({
      ok: true,
      stats: {
        total_users: users.rows[0].count,
        total_contractors: contractors.rows[0].count,
        verified_contractors: verified.rows[0].count,
        reviews_today: reviewsToday.rows[0].count,
        active_featured: featured.rows[0].count,
      },
    });
  } catch (err) {
    return next(err);
  }
};

exports.reports = async (req, res, next) => {
  try {
    const status = (req.query.status || 'pending').toString().trim().toLowerCase();
    const allowed = new Set(['pending', 'resolved', 'rejected', 'all']);
    if (!allowed.has(status)) {
      return res.status(400).json({ ok: false, message: 'invalid status filter' });
    }

    const whereClause = status === 'all' ? '' : 'WHERE r.status = $1';
    const values = status === 'all' ? [] : [status];
    const result = await db.query(
      `SELECT r.*, u.name AS reporter_name, c.business_name
       FROM reports r
       LEFT JOIN users u ON u.id = r.reporter_id
       LEFT JOIN contractors c ON c.id = r.contractor_id
       ${whereClause}
       ORDER BY r.created_at DESC`,
      values
    );
    return res.json({ ok: true, reports: result.rows });
  } catch (err) {
    return next(err);
  }
};

exports.resolveReport = async (req, res, next) => {
  try {
    const nextStatus = req.body?.status;
    if (!['resolved', 'rejected'].includes(nextStatus)) {
      return res.status(400).json({ ok: false, message: 'status must be resolved or rejected' });
    }

    const result = await db.query(
      `UPDATE reports
       SET status = $2
       WHERE id = $1
       RETURNING *`,
      [req.params.id, nextStatus]
    );
    const report = result.rows[0];
    if (!report) return res.status(404).json({ ok: false, message: 'Report not found' });
    return res.json({ ok: true, report });
  } catch (err) {
    return next(err);
  }
};
