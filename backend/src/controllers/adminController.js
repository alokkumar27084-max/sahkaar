const db = require('../config/db');
const bcrypt = require('bcrypt');
const { sanitize, sanitizeObject } = require('../utils/sanitizers');

function toBool(value) {
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  if (value === false || value === 'false' || value === 0 || value === '0') return false;
  return null;
}

function parsePage(req) {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function parseIdParam(rawId) {
  const id = sanitize(rawId || '');
  return id ? String(id) : null;
}

exports.pendingContractors = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT c.*, u.name AS user_name, u.phone, u.email
       FROM contractors c
       JOIN users u ON u.id = c.user_id
       WHERE c.is_verified = false
       ORDER BY c.id ASC`
    );
    return res.json({ ok: true, contractors: result.rows });
  } catch (err) {
    return next(err);
  }
};

exports.verifyContractor = async (req, res, next) => {
  try {
    const { status } = req.body || {};
    let is_verified = true;
    let verification_status = 'approved';
    let message = 'Your profile has been verified.';

    if (status === 'rejected') {
      is_verified = false;
      verification_status = 'rejected';
      message = 'Your profile verification has been rejected. Please update your details and try again.';
    }

    const result = await db.query(
      `UPDATE contractors
       SET is_verified = $2, verification_status = $3, updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [req.params.id, is_verified, verification_status]
    );
    const contractor = result.rows[0];
    if (!contractor) return res.status(404).json({ ok: false, message: 'Contractor not found' });

    await db.query(
      `INSERT INTO notifications (user_id, message, type)
       VALUES ($1, $2, $3)`,
      [contractor.user_id, message, 'verification']
    );

    return res.json({ ok: true, contractor });
  } catch (err) {
    return next(err);
  }
};

exports.stats = async (req, res, next) => {
  try {
    const [
      users,
      customers,
      admins,
      contractors,
      verified,
      reviewsToday,
      featured,
      pendingReports,
      pendingContractors,
    ] = await Promise.all([
      db.query(`SELECT COUNT(*)::int AS count FROM users`),
      db.query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'customer'`),
      db.query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin'`),
      db.query(`SELECT COUNT(*)::int AS count FROM contractors`),
      db.query(`SELECT COUNT(*)::int AS count FROM contractors WHERE is_verified = true`),
      db.query(`SELECT COUNT(*)::int AS count FROM reviews WHERE created_at::date = now()::date`),
      db.query(`SELECT COUNT(*)::int AS count FROM contractors WHERE is_featured = true`),
      db.query(`SELECT COUNT(*)::int AS count FROM reports WHERE status = 'pending'`),
      db.query(`SELECT COUNT(*)::int AS count FROM contractors WHERE is_verified = false`),
    ]);

    return res.json({
      ok: true,
      stats: {
        total_users: users.rows[0].count,
        total_customers: customers.rows[0].count,
        total_admins: admins.rows[0].count,
        total_contractors: contractors.rows[0].count,
        verified_contractors: verified.rows[0].count,
        reviews_today: reviewsToday.rows[0].count,
        active_featured: featured.rows[0].count,
        pending_reports: pendingReports.rows[0].count,
        pending_contractors: pendingContractors.rows[0].count,
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
       ORDER BY r.id DESC`,
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

exports.listUsers = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePage(req);
    const role = sanitize(req.query.role || '').toLowerCase();
    const q = sanitize(req.query.q || '');
    const values = [];
    const where = [];

    if (role && role !== 'all') {
      values.push(role);
      where.push(`u.role = $${values.length}`);
    }

    if (q) {
      values.push(`%${q}%`);
      const idx = values.length;
      where.push(`(COALESCE(u.name, '') ILIKE $${idx} OR COALESCE(u.phone, '') ILIKE $${idx} OR COALESCE(u.email, '') ILIKE $${idx})`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countRes = await db.query(`SELECT COUNT(*)::int AS count FROM users u ${whereSql}`, values);

    values.push(limit, offset);
    const limitIdx = values.length - 1;
    const offsetIdx = values.length;

    const result = await db.query(
      `SELECT u.id, u.name, u.phone, u.email, u.role,
              c.id AS contractor_id,
              c.business_name,
              c.category,
              c.is_verified,
              c.is_featured,
              c.is_available
       FROM users u
       LEFT JOIN contractors c ON c.user_id = u.id
       ${whereSql}
       ORDER BY u.id DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      values
    );

    return res.json({
      ok: true,
      users: result.rows,
      pagination: {
        page,
        limit,
        total: countRes.rows[0].count,
      },
    });
  } catch (err) {
    return next(err);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ ok: false, message: 'invalid id' });

    const result = await db.query(
      `SELECT u.id, u.name, u.phone, u.email, u.role,
              c.*
       FROM users u
       LEFT JOIN contractors c ON c.user_id = u.id
       WHERE u.id = $1`,
      [id]
    );

    if (!result.rows[0]) return res.status(404).json({ ok: false, message: 'User not found' });
    return res.json({ ok: true, user: result.rows[0] });
  } catch (err) {
    return next(err);
  }
};

exports.createUser = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const payload = sanitizeObject(req.body || {});
    const name = payload.name || null;
    const phone = payload.phone || null;
    const email = payload.email || null;
    const role = (payload.role || 'customer').toLowerCase();
    const password = payload.password || null;

    if (!['customer', 'contractor', 'admin'].includes(role)) {
      return res.status(400).json({ ok: false, message: 'invalid role' });
    }
    if (!phone && !email) {
      return res.status(400).json({ ok: false, message: 'phone or email required' });
    }
    if (!password || String(password).length < 8) {
      return res.status(400).json({ ok: false, message: 'password min length is 8' });
    }

    await client.query('BEGIN');

    if (phone) {
      const dupPhone = await client.query('SELECT id FROM users WHERE phone = $1 LIMIT 1', [phone]);
      if (dupPhone.rows[0]) {
        await client.query('ROLLBACK');
        return res.status(409).json({ ok: false, message: 'phone already exists' });
      }
    }

    if (email) {
      const dupEmail = await client.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
      if (dupEmail.rows[0]) {
        await client.query('ROLLBACK');
        return res.status(409).json({ ok: false, message: 'email already exists' });
      }
    }

    const hash = await bcrypt.hash(String(password), 10);
    const userRes = await client.query(
      `INSERT INTO users (name, phone, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, phone, email, role`,
      [name, phone, email, hash, role]
    );

    const user = userRes.rows[0];

    if (role === 'contractor') {
      const contractorData = payload.contractor || {};
      const categories = Array.isArray(contractorData.categories)
        ? contractorData.categories
        : contractorData.category
          ? [contractorData.category]
          : [];
      await client.query(
        `INSERT INTO contractors (
          user_id, business_name, category, categories, description, services,
          daily_rate, experience_years, team_size, is_labour_group,
          is_responsibility_model, location_text, is_available
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          user.id,
          contractorData.business_name || name,
          contractorData.category || categories[0] || null,
          categories,
          contractorData.description || null,
          Array.isArray(contractorData.services) ? contractorData.services : [],
          contractorData.daily_rate || null,
          contractorData.experience_years || 0,
          contractorData.team_size || 1,
          !!contractorData.is_labour_group,
          !!contractorData.is_responsibility_model,
          contractorData.location_text || null,
          contractorData.is_available === undefined ? true : !!contractorData.is_available,
        ]
      );
    }

    await client.query('COMMIT');
    return res.status(201).json({ ok: true, user });
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {
      // no-op
    }
    return next(err);
  } finally {
    client.release();
  }
};

exports.updateUser = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const userId = parseIdParam(req.params.id);
    if (!userId) return res.status(400).json({ ok: false, message: 'invalid id' });

    const payload = sanitizeObject(req.body || {});
    const role = payload.role ? String(payload.role).toLowerCase() : null;
    if (role && !['customer', 'contractor', 'admin'].includes(role)) {
      return res.status(400).json({ ok: false, message: 'invalid role' });
    }

    await client.query('BEGIN');

    const existingUserRes = await client.query('SELECT id, role FROM users WHERE id = $1', [userId]);
    const existingUser = existingUserRes.rows[0];
    if (!existingUser) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, message: 'User not found' });
    }

    const nextRole = role || existingUser.role;

    if (payload.password) {
      const passwordHash = await bcrypt.hash(String(payload.password), 10);
      await client.query(
        `UPDATE users
         SET name = COALESCE($2, name),
             phone = COALESCE($3, phone),
             email = COALESCE($4, email),
             role = COALESCE($5, role),
             password_hash = $6
         WHERE id = $1`,
        [userId, payload.name || null, payload.phone || null, payload.email || null, nextRole, passwordHash]
      );
    } else {
      await client.query(
        `UPDATE users
         SET name = COALESCE($2, name),
             phone = COALESCE($3, phone),
             email = COALESCE($4, email),
             role = COALESCE($5, role)
         WHERE id = $1`,
        [userId, payload.name || null, payload.phone || null, payload.email || null, nextRole]
      );
    }

    const contractorData = payload.contractor || {};
    const hasContractorPayload = Object.keys(contractorData).length > 0;

    if (nextRole === 'contractor') {
      const contractorRes = await client.query('SELECT id FROM contractors WHERE user_id = $1 LIMIT 1', [userId]);
      const existingContractor = contractorRes.rows[0];

      if (!existingContractor) {
        const categories = Array.isArray(contractorData.categories)
          ? contractorData.categories
          : contractorData.category
            ? [contractorData.category]
            : [];
        await client.query(
          `INSERT INTO contractors (
            user_id, business_name, category, categories, description, services,
            daily_rate, experience_years, team_size, is_labour_group,
            is_responsibility_model, location_text, is_available
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
          [
            userId,
            contractorData.business_name || payload.name || 'Contractor',
            contractorData.category || categories[0] || null,
            categories,
            contractorData.description || null,
            Array.isArray(contractorData.services) ? contractorData.services : [],
            contractorData.daily_rate || null,
            contractorData.experience_years || 0,
            contractorData.team_size || 1,
            !!contractorData.is_labour_group,
            !!contractorData.is_responsibility_model,
            contractorData.location_text || null,
            contractorData.is_available === undefined ? true : !!contractorData.is_available,
          ]
        );
      } else if (hasContractorPayload) {
        const categories = Array.isArray(contractorData.categories)
          ? contractorData.categories
          : contractorData.category
            ? [contractorData.category]
            : undefined;
        await client.query(
          `UPDATE contractors
           SET business_name = COALESCE($2, business_name),
               category = COALESCE($3, category),
               categories = COALESCE($4, categories),
               description = COALESCE($5, description),
               services = COALESCE($6, services),
               daily_rate = COALESCE($7, daily_rate),
               experience_years = COALESCE($8, experience_years),
               team_size = COALESCE($9, team_size),
               is_labour_group = COALESCE($10, is_labour_group),
               is_responsibility_model = COALESCE($11, is_responsibility_model),
               location_text = COALESCE($12, location_text),
               is_verified = COALESCE($13, is_verified),
               is_featured = COALESCE($14, is_featured),
               is_available = COALESCE($15, is_available),
               updated_at = now()
           WHERE user_id = $1`,
          [
            userId,
            contractorData.business_name || null,
            contractorData.category || null,
            categories,
            contractorData.description || null,
            Array.isArray(contractorData.services) ? contractorData.services : null,
            contractorData.daily_rate ?? null,
            contractorData.experience_years ?? null,
            contractorData.team_size ?? null,
            contractorData.is_labour_group ?? null,
            contractorData.is_responsibility_model ?? null,
            contractorData.location_text || null,
            toBool(contractorData.is_verified),
            toBool(contractorData.is_featured),
            toBool(contractorData.is_available),
          ]
        );
      }
    } else {
      await client.query('DELETE FROM contractors WHERE user_id = $1', [userId]);
    }

    const full = await client.query(
      `SELECT u.id, u.name, u.phone, u.email, u.role,
              c.id AS contractor_id,
              c.business_name,
              c.category,
              c.is_verified,
              c.is_featured,
              c.is_available
       FROM users u
       LEFT JOIN contractors c ON c.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );

    await client.query('COMMIT');
    return res.json({ ok: true, user: full.rows[0] });
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {
      // no-op
    }
    return next(err);
  } finally {
    client.release();
  }
};

exports.deleteUser = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const userId = parseIdParam(req.params.id);
    if (!userId) return res.status(400).json({ ok: false, message: 'invalid id' });

    await client.query('BEGIN');

    const userRes = await client.query('SELECT id, role FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];
    if (!user) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      const adminCountRes = await client.query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin'`);
      if (adminCountRes.rows[0].count <= 1) {
        await client.query('ROLLBACK');
        return res.status(400).json({ ok: false, message: 'Cannot delete the last admin account' });
      }
    }

    const contractorRes = await client.query('SELECT id FROM contractors WHERE user_id = $1', [userId]);
    const contractor = contractorRes.rows[0];

    await client.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM otps WHERE phone = (SELECT phone FROM users WHERE id = $1)', [userId]);
    await client.query('DELETE FROM reports WHERE reporter_id = $1', [userId]);
    await client.query('DELETE FROM reviews WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM service_requests WHERE user_id = $1', [userId]);

    if (contractor) {
      await client.query('DELETE FROM reports WHERE contractor_id = $1', [contractor.id]);
      await client.query('DELETE FROM reviews WHERE contractor_id = $1', [contractor.id]);
      await client.query('DELETE FROM contractors WHERE id = $1', [contractor.id]);
    }

    await client.query('DELETE FROM users WHERE id = $1', [userId]);

    await client.query('COMMIT');
    return res.json({ ok: true, deleted: userId });
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {
      // no-op
    }
    return next(err);
  } finally {
    client.release();
  }
};

exports.listContractors = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePage(req);
    const q = sanitize(req.query.q || '');
    const verified = toBool(req.query.verified);

    const values = [];
    const where = [];

    if (q) {
      values.push(`%${q}%`);
      const idx = values.length;
      where.push(`(COALESCE(c.business_name, '') ILIKE $${idx} OR COALESCE(c.description, '') ILIKE $${idx} OR COALESCE(u.name, '') ILIKE $${idx})`);
    }

    if (verified !== null) {
      values.push(verified);
      where.push(`c.is_verified = $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countRes = await db.query(
      `SELECT COUNT(*)::int AS count
       FROM contractors c
       JOIN users u ON u.id = c.user_id
       ${whereSql}`,
      values
    );

    values.push(limit, offset);
    const limitIdx = values.length - 1;
    const offsetIdx = values.length;

    const result = await db.query(
      `SELECT c.*, u.name AS user_name, u.phone, u.email,
              (
                SELECT json_build_object(
                  'id', s.id,
                  'plan_type', s.plan_type,
                  'status', s.status,
                  'expires_at', s.expires_at,
                  'created_at', s.created_at
                )
                FROM subscriptions s
                WHERE s.contractor_id = c.id
                  AND s.status = 'ACTIVE'
                  AND s.expires_at > NOW()
                ORDER BY s.expires_at DESC
                LIMIT 1
              ) AS active_subscription
       FROM contractors c
       JOIN users u ON u.id = c.user_id
       ${whereSql}
       ORDER BY c.id DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      values
    );

    return res.json({
      ok: true,
      contractors: result.rows,
      pagination: {
        page,
        limit,
        total: countRes.rows[0].count,
      },
    });
  } catch (err) {
    return next(err);
  }
};

exports.createContractor = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const payload = sanitizeObject(req.body || {});
    const name = payload.name || payload.business_name || 'Contractor';
    const phone = payload.phone || null;
    const email = payload.email || null;
    const password = payload.password || null;

    if (!phone && !email) {
      return res.status(400).json({ ok: false, message: 'phone or email required' });
    }
    if (!password || String(password).length < 8) {
      return res.status(400).json({ ok: false, message: 'password min length is 8' });
    }

    await client.query('BEGIN');

    if (phone) {
      const dupPhone = await client.query('SELECT id FROM users WHERE phone = $1 LIMIT 1', [phone]);
      if (dupPhone.rows[0]) {
        await client.query('ROLLBACK');
        return res.status(409).json({ ok: false, message: 'phone already exists' });
      }
    }

    if (email) {
      const dupEmail = await client.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
      if (dupEmail.rows[0]) {
        await client.query('ROLLBACK');
        return res.status(409).json({ ok: false, message: 'email already exists' });
      }
    }

    const hash = await bcrypt.hash(String(password), 10);
    const userRes = await client.query(
      `INSERT INTO users (name, phone, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'contractor')
       RETURNING id, name, phone, email, role`,
      [name, phone, email, hash]
    );
    const user = userRes.rows[0];

    const categories = Array.isArray(payload.categories)
      ? payload.categories
      : payload.category
        ? [payload.category]
        : [];

    const contractorRes = await client.query(
      `INSERT INTO contractors (
        user_id, business_name, category, categories, description, services,
        daily_rate, experience_years, team_size, is_labour_group,
        is_responsibility_model, location_text, is_verified, is_featured, is_available,
        service_type, quick_services, tier
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING *`,
      [
        user.id,
        payload.business_name || name,
        payload.category || categories[0] || null,
        categories,
        payload.description || null,
        Array.isArray(payload.services) ? payload.services : [],
        payload.daily_rate || null,
        payload.experience_years || 0,
        payload.team_size || 1,
        !!payload.is_labour_group,
        !!payload.is_responsibility_model,
        payload.location_text || null,
        !!payload.is_verified,
        !!payload.is_featured,
        payload.is_available === undefined ? true : !!payload.is_available,
        payload.service_type || 'project',
        payload.quick_services ? JSON.stringify(payload.quick_services) : '[]',
        payload.tier || 'standard',
      ]
    );

    await client.query('COMMIT');
    return res.status(201).json({ ok: true, user, contractor: contractorRes.rows[0] });
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {
      // no-op
    }
    return next(err);
  } finally {
    client.release();
  }
};

exports.updateContractor = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ ok: false, message: 'invalid id' });

    const payload = sanitizeObject(req.body || {});
    await client.query('BEGIN');

    const contRes = await client.query('SELECT user_id FROM contractors WHERE id = $1', [id]);
    if (!contRes.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, message: 'Contractor not found' });
    }
    const userId = contRes.rows[0].user_id;

    if (payload.name || payload.phone || payload.email) {
      await client.query(
        `UPDATE users
         SET name = COALESCE($2, name),
             phone = COALESCE($3, phone),
             email = COALESCE($4, email)
         WHERE id = $1`,
        [userId, payload.name || null, payload.phone || null, payload.email || null]
      );
    }

    const categories = Array.isArray(payload.categories)
      ? payload.categories
      : payload.category
        ? [payload.category]
        : undefined;

    const result = await client.query(
      `UPDATE contractors
       SET business_name = COALESCE($2, business_name),
           category = COALESCE($3, category),
           categories = COALESCE($4, categories),
           description = COALESCE($5, description),
           services = COALESCE($6, services),
           daily_rate = COALESCE($7, daily_rate),
           experience_years = COALESCE($8, experience_years),
           team_size = COALESCE($9, team_size),
           is_labour_group = COALESCE($10, is_labour_group),
           is_responsibility_model = COALESCE($11, is_responsibility_model),
           location_text = COALESCE($12, location_text),
           is_verified = COALESCE($13, is_verified),
           is_featured = COALESCE($14, is_featured),
           is_available = COALESCE($15, is_available),
           service_type = COALESCE($16, service_type),
           quick_services = COALESCE($17, quick_services),
           tier = COALESCE($18, tier),
           updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        payload.business_name || null,
        payload.category || null,
        categories,
        payload.description || null,
        Array.isArray(payload.services) ? payload.services : null,
        payload.daily_rate ?? null,
        payload.experience_years ?? null,
        payload.team_size ?? null,
        payload.is_labour_group ?? null,
        payload.is_responsibility_model ?? null,
        payload.location_text || null,
        toBool(payload.is_verified),
        toBool(payload.is_featured),
        toBool(payload.is_available),
        payload.service_type,
        payload.quick_services ? JSON.stringify(payload.quick_services) : undefined,
        payload.tier,
      ]
    );

    await client.query('COMMIT');
    return res.json({ ok: true, contractor: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    return next(err);
  } finally {
    client.release();
  }
};

exports.deleteContractor = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ ok: false, message: 'invalid id' });

    await client.query('BEGIN');
    const contractorRes = await client.query('SELECT id, user_id FROM contractors WHERE id = $1', [id]);
    const contractor = contractorRes.rows[0];
    if (!contractor) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, message: 'Contractor not found' });
    }

    await client.query('DELETE FROM reports WHERE contractor_id = $1', [id]);
    await client.query('DELETE FROM reviews WHERE contractor_id = $1', [id]);
    await client.query('DELETE FROM service_requests WHERE user_id = $1', [contractor.user_id]);
    await client.query('DELETE FROM contractors WHERE id = $1', [id]);
    await client.query('DELETE FROM users WHERE id = $1', [contractor.user_id]);

    await client.query('COMMIT');
    return res.json({ ok: true, deleted: id });
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {
      // no-op
    }
    return next(err);
  } finally {
    client.release();
  }
};

exports.activity = async (req, res, next) => {
  try {
    const [latestUsers, latestReviews, latestReports] = await Promise.all([
      db.query(`SELECT id, name, role, phone, email FROM users ORDER BY id DESC LIMIT 10`),
      db.query(`SELECT id, contractor_id, user_id, rating, created_at FROM reviews ORDER BY id DESC LIMIT 10`),
      db.query(`SELECT id, contractor_id, reporter_id, status, created_at FROM reports ORDER BY id DESC LIMIT 10`),
    ]);

    return res.json({
      ok: true,
      activity: {
        users: latestUsers.rows,
        reviews: latestReviews.rows,
        reports: latestReports.rows,
      },
    });
  } catch (err) {
    return next(err);
  }
};

// ── Reviews management ──────────────────────────────────────────

exports.listReviews = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePage(req);
    const q = sanitize(req.query.q || '');
    const values = [];
    const where = [];

    if (q) {
      values.push(`%${q}%`);
      const idx = values.length;
      where.push(`(COALESCE(u.name, '') ILIKE $${idx} OR COALESCE(r.comment, '') ILIKE $${idx})`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countRes = await db.query(
      `SELECT COUNT(*)::int AS count FROM reviews r LEFT JOIN users u ON u.id = r.user_id ${whereSql}`,
      values
    );

    values.push(limit, offset);
    const limitIdx = values.length - 1;
    const offsetIdx = values.length;

    const result = await db.query(
      `SELECT r.*, u.name AS reviewer_name,
              c.business_name AS contractor_name
       FROM reviews r
       LEFT JOIN users u ON u.id = r.user_id
       LEFT JOIN contractors c ON c.id = r.contractor_id
       ${whereSql}
       ORDER BY r.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      values
    );

    return res.json({
      ok: true,
      reviews: result.rows,
      pagination: { page, limit, total: countRes.rows[0].count },
    });
  } catch (err) {
    return next(err);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ ok: false, message: 'invalid id' });

    const reviewRes = await db.query('SELECT id, contractor_id FROM reviews WHERE id = $1', [id]);
    const review = reviewRes.rows[0];
    if (!review) return res.status(404).json({ ok: false, message: 'Review not found' });

    await db.query('DELETE FROM reviews WHERE id = $1', [id]);

    // Recalculate contractor rating
    const agg = await db.query(
      `SELECT AVG(rating)::numeric(3,2) as avg, COUNT(*)::int as cnt FROM reviews WHERE contractor_id = $1`,
      [review.contractor_id]
    );
    await db.query(
      `UPDATE contractors SET rating = $1, reviews_count = $2, review_count = $2, updated_at = now() WHERE id = $3`,
      [agg.rows[0].avg || 0, agg.rows[0].cnt || 0, review.contractor_id]
    );

    return res.json({ ok: true, deleted: id });
  } catch (err) {
    return next(err);
  }
};

// ── Analytics ──────────────────────────────────────────

exports.analytics = async (req, res, next) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days || '30', 10), 7), 90);

    const [regTrend, reviewTrend, topContractors] = await Promise.all([
      db.query(
        `SELECT d::date AS date, COUNT(u.id)::int AS count
         FROM generate_series(now() - ($1 || ' days')::interval, now(), '1 day') d
         LEFT JOIN users u ON u.created_at::date = d::date
         GROUP BY d::date ORDER BY d::date`,
        [days]
      ),
      db.query(
        `SELECT d::date AS date, COUNT(r.id)::int AS count
         FROM generate_series(now() - ($1 || ' days')::interval, now(), '1 day') d
         LEFT JOIN reviews r ON r.created_at::date = d::date
         GROUP BY d::date ORDER BY d::date`,
        [days]
      ),
      db.query(
        `SELECT c.id, COALESCE(c.business_name, u.name) AS name, c.category,
                c.rating, c.views_count, c.leads_count,
                COALESCE(c.review_count, c.reviews_count, 0) AS review_count
         FROM contractors c JOIN users u ON u.id = c.user_id
         ORDER BY c.leads_count DESC NULLS LAST, c.views_count DESC NULLS LAST
         LIMIT 10`
      ),
    ]);

    return res.json({
      ok: true,
      analytics: {
        registration_trend: regTrend.rows,
        review_trend: reviewTrend.rows,
        top_contractors: topContractors.rows,
      },
    });
  } catch (err) {
    return next(err);
  }
};

// ── Site settings ──────────────────────────────────────────

const DEFAULT_SETTINGS = {
  maintenance_mode: false,
  featured_limit: 8,
  site_name: 'Thekedaar',
  support_email: 'hello@thekedaar.com',
  support_phone: '+91 90000 00000',
  max_portfolio_photos: 5,
};

exports.getSettings = async (req, res, next) => {
  try {
    const result = await db.query(`SELECT key, value FROM site_settings`).catch(() => ({ rows: [] }));
    const settings = { ...DEFAULT_SETTINGS };
    for (const row of result.rows) {
      try { settings[row.key] = JSON.parse(row.value); } catch { settings[row.key] = row.value; }
    }
    return res.json({ ok: true, settings });
  } catch (err) {
    return next(err);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const payload = sanitizeObject(req.body || {});
    const allowedKeys = Object.keys(DEFAULT_SETTINGS);

    for (const [key, value] of Object.entries(payload)) {
      if (!allowedKeys.includes(key)) continue;
      const jsonValue = JSON.stringify(value);
      await db.query(
        `INSERT INTO site_settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()`,
        [key, jsonValue]
      );
    }

    // Return updated settings
    const result = await db.query(`SELECT key, value FROM site_settings`).catch(() => ({ rows: [] }));
    const settings = { ...DEFAULT_SETTINGS };
    for (const row of result.rows) {
      try { settings[row.key] = JSON.parse(row.value); } catch { settings[row.key] = row.value; }
    }
    return res.json({ ok: true, settings });
  } catch (err) {
    return next(err);
  }
};

// ── Service Categories management ──────────────────────────────

exports.listServiceCategories = async (req, res, next) => {
  try {
    const { type } = req.query;
    let query = `SELECT * FROM service_categories`;
    const params = [];
    if (type) { params.push(type); query += ` WHERE type = $1`; }
    query += ` ORDER BY type, display_order ASC`;
    const { rows } = await db.query(query, params);
    res.json({ ok: true, categories: rows });
  } catch (err) { next(err); }
};

exports.createServiceCategory = async (req, res, next) => {
  try {
    const p = sanitizeObject(req.body || {});
    if (!p.name || !p.slug) return res.status(400).json({ ok: false, message: 'name and slug required' });
    const result = await db.query(
      `INSERT INTO service_categories (name, name_hi, slug, description, description_hi, icon, type, display_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [p.name, p.name_hi || null, p.slug, p.description || null, p.description_hi || null, p.icon || null, p.type || 'bada', p.display_order || 0, p.is_active !== false]
    );
    res.status(201).json({ ok: true, category: result.rows[0] });
  } catch (err) { next(err); }
};

exports.updateServiceCategory = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ ok: false, message: 'invalid id' });
    const p = sanitizeObject(req.body || {});
    const result = await db.query(
      `UPDATE service_categories SET
        name = COALESCE($2, name), name_hi = COALESCE($3, name_hi), slug = COALESCE($4, slug),
        description = COALESCE($5, description), description_hi = COALESCE($6, description_hi),
        icon = COALESCE($7, icon), type = COALESCE($8, type),
        display_order = COALESCE($9, display_order), is_active = COALESCE($10, is_active),
        updated_at = now()
       WHERE id = $1 RETURNING *`,
      [id, p.name || null, p.name_hi || null, p.slug || null, p.description || null, p.description_hi || null, p.icon || null, p.type || null, p.display_order ?? null, toBool(p.is_active)]
    );
    if (!result.rows[0]) return res.status(404).json({ ok: false, message: 'Not found' });
    res.json({ ok: true, category: result.rows[0] });
  } catch (err) { next(err); }
};

exports.deleteServiceCategory = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ ok: false, message: 'invalid id' });
    await db.query(`DELETE FROM services WHERE category_id = $1`, [id]);
    await db.query(`DELETE FROM service_categories WHERE id = $1`, [id]);
    res.json({ ok: true, deleted: id });
  } catch (err) { next(err); }
};

// ── Services management ────────────────────────────────────────

exports.listAdminServices = async (req, res, next) => {
  try {
    const { category_id } = req.query;
    let query = `SELECT s.*, sc.name as category_name, sc.type as category_type
                 FROM services s JOIN service_categories sc ON s.category_id = sc.id`;
    const params = [];
    if (category_id) { params.push(category_id); query += ` WHERE s.category_id = $1`; }
    query += ` ORDER BY sc.type, sc.display_order, s.display_order ASC`;
    const { rows } = await db.query(query, params);
    res.json({ ok: true, services: rows });
  } catch (err) { next(err); }
};

exports.createAdminService = async (req, res, next) => {
  try {
    const p = sanitizeObject(req.body || {});
    if (!p.name || !p.slug || !p.category_id) return res.status(400).json({ ok: false, message: 'name, slug, and category_id required' });
    const result = await db.query(
      `INSERT INTO services (category_id, name, name_hi, slug, description, description_hi, price_starts_at, price_label, image_url, icon, rating, is_active, display_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [p.category_id, p.name, p.name_hi || null, p.slug, p.description || null, p.description_hi || null, p.price_starts_at || null, p.price_label || 'Starting at', p.image_url || null, p.icon || null, p.rating || 4.5, p.is_active !== false, p.display_order || 0]
    );
    res.status(201).json({ ok: true, service: result.rows[0] });
  } catch (err) { next(err); }
};

exports.updateAdminService = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ ok: false, message: 'invalid id' });
    const p = sanitizeObject(req.body || {});
    const result = await db.query(
      `UPDATE services SET
        category_id = COALESCE($2, category_id), name = COALESCE($3, name), name_hi = COALESCE($4, name_hi),
        slug = COALESCE($5, slug), description = COALESCE($6, description), description_hi = COALESCE($7, description_hi),
        price_starts_at = COALESCE($8, price_starts_at), price_label = COALESCE($9, price_label),
        image_url = COALESCE($10, image_url), icon = COALESCE($11, icon),
        is_active = COALESCE($12, is_active), display_order = COALESCE($13, display_order),
        updated_at = now()
       WHERE id = $1 RETURNING *`,
      [id, p.category_id || null, p.name || null, p.name_hi || null, p.slug || null, p.description || null, p.description_hi || null, p.price_starts_at ?? null, p.price_label || null, p.image_url || null, p.icon || null, toBool(p.is_active), p.display_order ?? null]
    );
    if (!result.rows[0]) return res.status(404).json({ ok: false, message: 'Not found' });
    res.json({ ok: true, service: result.rows[0] });
  } catch (err) { next(err); }
};

exports.deleteAdminService = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ ok: false, message: 'invalid id' });
    await db.query(`DELETE FROM services WHERE id = $1`, [id]);
    res.json({ ok: true, deleted: id });
  } catch (err) { next(err); }
};

// ── Service Requests management ────────────────────────────────

exports.listServiceRequests = async (req, res, next) => {
  try {
    const { status, type } = req.query;
    let query = `SELECT sr.*, s.name as service_name, sc.name as category_name
                 FROM service_requests sr
                 LEFT JOIN services s ON sr.service_id = s.id
                 LEFT JOIN service_categories sc ON sr.category_id = sc.id`;
    const params = [];
    const where = [];
    if (status) { params.push(status); where.push(`sr.status = $${params.length}`); }
    if (type) { params.push(type); where.push(`sr.type = $${params.length}`); }
    if (where.length) query += ` WHERE ` + where.join(' AND ');
    query += ` ORDER BY sr.created_at DESC LIMIT 100`;
    const { rows } = await db.query(query, params);
    res.json({ ok: true, requests: rows });
  } catch (err) { next(err); }
};

exports.updateServiceRequest = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ ok: false, message: 'invalid id' });
    const { status } = req.body;
    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ ok: false, message: 'invalid status' });
    }
    const result = await db.query(
      `UPDATE service_requests SET status = $2, updated_at = now() WHERE id = $1 RETURNING *`,
      [id, status]
    );
    if (!result.rows[0]) return res.status(404).json({ ok: false, message: 'Not found' });
    if (result.rows[0].user_id) {
      await db.query(
        `INSERT INTO notifications (user_id, message, type)
         VALUES ($1, $2, $3)`,
        [
          result.rows[0].user_id,
          `Your service request has been marked ${status}.`,
          'service_request',
        ]
      ).catch(() => { });
    }
    res.json({ ok: true, request: result.rows[0] });
  } catch (err) { next(err); }
};

exports.createManualSubscription = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const contractor_id = parseIdParam(req.params.id);
    if (!contractor_id) return res.status(400).json({ ok: false, message: 'invalid contractor id' });
    
    const { plan_type } = req.body || {};
    if (!['verified_badge', 'priority_listing', 'premium'].includes(plan_type)) {
      return res.status(400).json({ ok: false, message: 'invalid plan type' });
    }

    await client.query('BEGIN');

    // Check if contractor exists
    const contRes = await client.query('SELECT id, user_id FROM contractors WHERE id = $1', [contractor_id]);
    if (!contRes.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, message: 'Contractor not found' });
    }

    // Set other active subscriptions for this contractor to expired
    await client.query(
      `UPDATE subscriptions 
       SET status = 'EXPIRED' 
       WHERE contractor_id = $1 AND status = 'ACTIVE'`,
      [contractor_id]
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days manual subscription

    const subRes = await client.query(
      `INSERT INTO subscriptions (contractor_id, plan_type, status, amount_paid, razorpay_order_id, razorpay_payment_id, expires_at)
       VALUES ($1, $2, 'ACTIVE', 0.00, 'manual', 'manual_pay_' || gen_random_uuid(), $3)
       RETURNING *`,
      [contractor_id, plan_type, expiresAt]
    );

    // Sync contractor flags
    if (plan_type === 'verified_badge' || plan_type === 'premium') {
      await client.query(`UPDATE contractors SET is_verified = true WHERE id = $1`, [contractor_id]);
    }
    if (plan_type === 'priority_listing' || plan_type === 'premium') {
      await client.query(`UPDATE contractors SET is_featured = true WHERE id = $1`, [contractor_id]);
    }

    await client.query('COMMIT');
    return res.json({ ok: true, subscription: subRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    return next(err);
  } finally {
    client.release();
  }
};

exports.cancelSubscription = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const contractor_id = parseIdParam(req.params.id);
    if (!contractor_id) return res.status(400).json({ ok: false, message: 'invalid contractor id' });

    await client.query('BEGIN');

    // Check contractor
    const contRes = await client.query('SELECT id, user_id FROM contractors WHERE id = $1', [contractor_id]);
    if (!contRes.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, message: 'Contractor not found' });
    }

    // Set active subscriptions to cancelled
    await client.query(
      `UPDATE subscriptions
       SET status = 'CANCELLED'
       WHERE contractor_id = $1 AND status = 'ACTIVE'`,
      [contractor_id]
    );

    await client.query(
      `UPDATE contractors 
       SET is_verified = false, is_featured = false 
       WHERE id = $1`,
      [contractor_id]
    );

    await client.query('COMMIT');
    return res.json({ ok: true, message: 'Subscription cancelled successfully' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    return next(err);
  } finally {
    client.release();
  }
};

// ── FEDERATIONS & SOCIETIES COMMAND (SUPER ADMIN) ──

exports.listFederations = async (req, res, next) => {
  try {
    const query = `
      SELECT f.*,
        (SELECT COUNT(*) FROM cooperative_societies WHERE federation_id = f.id) AS total_societies,
        (SELECT COUNT(*) FROM contractors c JOIN cooperative_societies cs ON c.society_id = cs.id WHERE cs.federation_id = f.id) AS total_masters
      FROM federations f
      ORDER BY f.is_national DESC, f.state ASC
    `;
    const { rows } = await db.query(query);
    return res.json({ ok: true, federations: rows });
  } catch (err) {
    return next(err);
  }
};

exports.createFederation = async (req, res, next) => {
  try {
    const { name, registration_no, state, region, jurisdiction_districts, contact_email, contact_phone, office_address, welfare_fund_balance } = req.body;
    if (!name || !state) return res.status(400).json({ ok: false, message: 'Federation name and state required' });

    const query = `
      INSERT INTO federations (name, registration_no, state, jurisdiction_state, region, jurisdiction_districts, contact_email, contact_phone, office_address, welfare_fund_balance)
      VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const { rows } = await db.query(query, [
      sanitize(name),
      sanitize(registration_no || `FED-${Date.now()}`),
      sanitize(state),
      sanitize(region || 'State Level'),
      Array.isArray(jurisdiction_districts) ? jurisdiction_districts : [sanitize(state)],
      contact_email ? sanitize(contact_email) : null,
      contact_phone ? sanitize(contact_phone) : null,
      office_address ? sanitize(office_address) : null,
      Number(welfare_fund_balance) || 1000000.00
    ]);

    return res.json({ ok: true, federation: rows[0] });
  } catch (err) {
    return next(err);
  }
};

exports.updateFederation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, state, jurisdiction_districts, contact_email, contact_phone, office_address, welfare_fund_balance, is_active } = req.body;

    const query = `
      UPDATE federations
      SET name = COALESCE($2, name),
          state = COALESCE($3, state),
          jurisdiction_state = COALESCE($3, jurisdiction_state),
          jurisdiction_districts = COALESCE($4, jurisdiction_districts),
          contact_email = COALESCE($5, contact_email),
          contact_phone = COALESCE($6, contact_phone),
          office_address = COALESCE($7, office_address),
          welfare_fund_balance = COALESCE($8, welfare_fund_balance),
          is_active = COALESCE($9, is_active),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await db.query(query, [
      id,
      name ? sanitize(name) : null,
      state ? sanitize(state) : null,
      Array.isArray(jurisdiction_districts) ? jurisdiction_districts : null,
      contact_email ? sanitize(contact_email) : null,
      contact_phone ? sanitize(contact_phone) : null,
      office_address ? sanitize(office_address) : null,
      welfare_fund_balance !== undefined ? Number(welfare_fund_balance) : null,
      is_active !== undefined ? toBool(is_active) : null
    ]);

    if (!rows[0]) return res.status(404).json({ ok: false, message: 'Federation not found' });
    return res.json({ ok: true, federation: rows[0] });
  } catch (err) {
    return next(err);
  }
};

exports.deleteFederation = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM federations WHERE id = $1', [id]);
    return res.json({ ok: true, message: 'Federation deleted successfully' });
  } catch (err) {
    return next(err);
  }
};

exports.listSocieties = async (req, res, next) => {
  try {
    const query = `
      SELECT cs.*, f.name AS federation_name, f.state AS federation_state,
        (SELECT COUNT(*) FROM contractors WHERE society_id = cs.id) AS total_contractors,
        (SELECT COUNT(*) FROM contractors WHERE society_id = cs.id AND (is_verified = true OR verification_status = 'verified')) AS verified_contractors
      FROM cooperative_societies cs
      LEFT JOIN federations f ON cs.federation_id = f.id
      ORDER BY cs.jurisdiction_state ASC, cs.district ASC
    `;
    const { rows } = await db.query(query);
    return res.json({ ok: true, societies: rows });
  } catch (err) {
    return next(err);
  }
};

exports.createSociety = async (req, res, next) => {
  try {
    const { federation_id, name, registration_no, district, jurisdiction_districts, jurisdiction_state, contact_phone, contact_email, office_address, welfare_pool_balance } = req.body;
    if (!name || !district) return res.status(400).json({ ok: false, message: 'Society name and district are required' });

    const query = `
      INSERT INTO cooperative_societies (federation_id, name, registration_no, district, jurisdiction_districts, jurisdiction_state, region, contact_phone, contact_email, office_address, welfare_pool_balance)
      VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const { rows } = await db.query(query, [
      federation_id || null,
      sanitize(name),
      sanitize(registration_no || `SOC-${Date.now()}`),
      sanitize(district),
      Array.isArray(jurisdiction_districts) ? jurisdiction_districts : [sanitize(district)],
      sanitize(jurisdiction_state || 'State'),
      contact_phone ? sanitize(contact_phone) : null,
      contact_email ? sanitize(contact_email) : null,
      office_address ? sanitize(office_address) : null,
      Number(welfare_pool_balance) || 500000.00
    ]);

    return res.json({ ok: true, society: rows[0] });
  } catch (err) {
    return next(err);
  }
};

exports.updateSociety = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { federation_id, name, district, jurisdiction_districts, jurisdiction_state, contact_phone, contact_email, office_address, is_active } = req.body;

    const query = `
      UPDATE cooperative_societies
      SET federation_id = COALESCE($2, federation_id),
          name = COALESCE($3, name),
          district = COALESCE($4, district),
          jurisdiction_districts = COALESCE($5, jurisdiction_districts),
          jurisdiction_state = COALESCE($6, jurisdiction_state),
          contact_phone = COALESCE($7, contact_phone),
          contact_email = COALESCE($8, contact_email),
          office_address = COALESCE($9, office_address),
          is_active = COALESCE($10, is_active),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await db.query(query, [
      id,
      federation_id || null,
      name ? sanitize(name) : null,
      district ? sanitize(district) : null,
      Array.isArray(jurisdiction_districts) ? jurisdiction_districts : null,
      jurisdiction_state ? sanitize(jurisdiction_state) : null,
      contact_phone ? sanitize(contact_phone) : null,
      contact_email ? sanitize(contact_email) : null,
      office_address ? sanitize(office_address) : null,
      is_active !== undefined ? toBool(is_active) : null
    ]);

    if (!rows[0]) return res.status(404).json({ ok: false, message: 'Society not found' });
    return res.json({ ok: true, society: rows[0] });
  } catch (err) {
    return next(err);
  }
};

exports.deleteSociety = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM cooperative_societies WHERE id = $1', [id]);
    return res.json({ ok: true, message: 'Society deleted successfully' });
  } catch (err) {
    return next(err);
  }
};

exports.reassignContractorSociety = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { society_id } = req.body;
    if (!society_id) return res.status(400).json({ ok: false, message: 'society_id is required' });

    const { rows } = await db.query(
      `UPDATE contractors SET society_id = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, society_id]
    );
    if (!rows[0]) return res.status(404).json({ ok: false, message: 'Contractor not found' });

    // Also sync user
    await db.query('UPDATE users SET society_id = $2 WHERE id = $1', [rows[0].user_id, society_id]);

    return res.json({ ok: true, contractor: rows[0] });
  } catch (err) {
    return next(err);
  }
};

// ── NATIONWIDE BOOKINGS & ESCROW COMMAND (SUPER ADMIN) ──

exports.listAllBookings = async (req, res, next) => {
  try {
    // 1. Fetch quick bookings
    const qbQuery = `
      SELECT qb.id, 'quick_booking' AS booking_type, qb.service_name, qb.service_price AS amount,
             qb.status, qb.booking_fee_status, qb.booking_fee_order_id, qb.booking_fee_payment_id,
             qb.scheduled_date, qb.scheduled_time_slot, qb.customer_address, qb.created_at,
             u.name AS customer_name, u.phone AS customer_phone, u.email AS customer_email,
             c.business_name AS contractor_name, cu.phone AS contractor_phone,
             cs.name AS society_name, f.name AS federation_name
      FROM quick_bookings qb
      JOIN users u ON qb.customer_id = u.id
      JOIN contractors c ON qb.contractor_id = c.id
      JOIN users cu ON c.user_id = cu.id
      LEFT JOIN cooperative_societies cs ON c.society_id = cs.id
      LEFT JOIN federations f ON cs.federation_id = f.id
      ORDER BY qb.created_at DESC
      LIMIT 100
    `;
    const qbRes = await db.query(qbQuery);

    // 2. Fetch standard quote bookings
    const stdQuery = `
      SELECT b.id, 'standard_booking' AS booking_type, b.service_type AS service_name, b.total_price AS amount,
             b.status, b.payment_status AS booking_fee_status, b.razorpay_order_id AS booking_fee_order_id,
             b.razorpay_payment_id AS booking_fee_payment_id, b.start_date AS scheduled_date,
             NULL AS scheduled_time_slot, b.address AS customer_address, b.created_at,
             u.name AS customer_name, u.phone AS customer_phone, u.email AS customer_email,
             c.business_name AS contractor_name, cu.phone AS contractor_phone,
             cs.name AS society_name, f.name AS federation_name
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      JOIN contractors c ON b.contractor_id = c.id
      JOIN users cu ON c.user_id = cu.id
      LEFT JOIN cooperative_societies cs ON c.society_id = cs.id
      LEFT JOIN federations f ON cs.federation_id = f.id
      ORDER BY b.created_at DESC
      LIMIT 100
    `;
    const stdRes = await db.query(stdQuery).catch(() => ({ rows: [] }));

    const combined = [...qbRes.rows, ...stdRes.rows].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return res.json({ ok: true, bookings: combined });
  } catch (err) {
    return next(err);
  }
};

exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, booking_type } = req.body;

    if (booking_type === 'quick_booking' || !booking_type) {
      const { rows } = await db.query(
        `UPDATE quick_bookings SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [id, status]
      );
      if (rows[0]) return res.json({ ok: true, booking: rows[0] });
    }

    const { rows: bRows } = await db.query(
      `UPDATE bookings SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, status]
    );
    if (!bRows[0]) return res.status(404).json({ ok: false, message: 'Booking not found' });
    return res.json({ ok: true, booking: bRows[0] });
  } catch (err) {
    return next(err);
  }
};

// ── USER ROLES & AUTHORITY ASSIGNMENT (SUPER ADMIN) ──

exports.updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const validRoles = ['customer', 'contractor', 'worker', 'society_admin', 'federation_admin', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ ok: false, message: 'Invalid role' });
    }

    const { rows } = await db.query(
      `UPDATE users SET role = $2, updated_at = NOW() WHERE id = $1 RETURNING id, name, email, phone, role`,
      [id, role]
    );
    if (!rows[0]) return res.status(404).json({ ok: false, message: 'User not found' });
    return res.json({ ok: true, user: rows[0] });
  } catch (err) {
    return next(err);
  }
};

exports.assignUserAuthority = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { society_id, federation_id } = req.body;

    const { rows } = await db.query(
      `UPDATE users SET society_id = $2, federation_id = $3, updated_at = NOW() WHERE id = $1 RETURNING id, name, email, phone, role, society_id, federation_id`,
      [id, society_id || null, federation_id || null]
    );
    if (!rows[0]) return res.status(404).json({ ok: false, message: 'User not found' });
    return res.json({ ok: true, user: rows[0] });
  } catch (err) {
    return next(err);
  }
};

// ── NATIONWIDE EMERGENCY BROADCAST (SUPER ADMIN) ──

exports.emergencyBroadcast = async (req, res, next) => {
  try {
    const { message, type = 'broadcast', target_state, target_district } = req.body;
    if (!message) return res.status(400).json({ ok: false, message: 'Broadcast message required' });

    const notificationService = require('../services/notificationService');
    const { getIo } = require('../config/socket');

    // Store in all active users' notification boxes or broadcast to sockets
    let userQuery = `SELECT id, email FROM users WHERE is_active = true`;
    const params = [];
    if (target_state) {
      userQuery += ` AND (location_text ILIKE $1 OR state ILIKE $1)`;
      params.push(`%${target_state}%`);
    }

    const { rows } = await db.query(userQuery, params);

    // Send in-app notification to all users
    for (const u of rows.slice(0, 500)) {
      await db.query(
        `INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)`,
        [u.id, `📢 ANNOUNCEMENT: ${message}`, type]
      );
    }

    // Push live WebSocket broadcast to all connected clients
    try {
      const io = getIo();
      if (io) {
        io.emit('notification:new', {
          message: `📢 PLATFORM BROADCAST: ${message}`,
          type: 'broadcast',
          created_at: new Date().toISOString(),
        });
      }
    } catch (e) {}

    return res.json({ ok: true, recipient_count: rows.length, message: 'Broadcast dispatched successfully' });
  } catch (err) {
    return next(err);
  }
};

