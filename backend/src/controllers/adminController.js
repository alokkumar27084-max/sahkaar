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
      `SELECT c.*, u.name AS user_name, u.phone, u.email
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
        is_responsibility_model, location_text, is_verified, is_featured, is_available
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
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
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ ok: false, message: 'invalid id' });

    const payload = sanitizeObject(req.body || {});
    const categories = Array.isArray(payload.categories)
      ? payload.categories
      : payload.category
      ? [payload.category]
      : undefined;

    const result = await db.query(
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
      ]
    );

    if (!result.rows[0]) return res.status(404).json({ ok: false, message: 'Contractor not found' });
    return res.json({ ok: true, contractor: result.rows[0] });
  } catch (err) {
    return next(err);
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
