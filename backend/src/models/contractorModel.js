const db = require('../config/db');

function contractorSelect() {
  return `
    SELECT c.*, u.name AS user_name, u.phone,
           COALESCE(c.business_name, u.name) AS name,
           COALESCE(c.category, c.categories[1], NULL) AS category,
           COALESCE(c.review_count, c.reviews_count, 0) AS review_count,
           COALESCE(c.portfolio_photos, c.portfolio_urls, '{}') AS portfolio_photos
    FROM contractors c
    JOIN users u ON u.id = c.user_id
  `;
}

exports.create = async (data) => {
  const categories = Array.isArray(data.categories) ? data.categories : (data.category ? [data.category] : []);
  const category = data.category || categories[0] || null;
  const lat = data.lat ?? data.latitude ?? null;
  const lng = data.lng ?? data.longitude ?? null;

  const res = await db.query(
    `INSERT INTO contractors (
      user_id, business_name, category, categories, description, services,
      daily_rate, experience_years, team_size, is_labour_group,
      is_responsibility_model, location_text, lat, lng, latitude, longitude
    )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING *`,
    [
      data.user_id,
      data.business_name || null,
      category,
      categories,
      data.description || null,
      data.services || [],
      data.daily_rate || null,
      data.experience_years || 0,
      data.team_size || 1,
      !!data.is_labour_group,
      !!data.is_responsibility_model,
      data.location_text || null,
      lat,
      lng,
      lat,
      lng,
    ]
  );
  return res.rows[0];
};

exports.setImage = async (id, imageUrl) => {
  const res = await db.query(
    `UPDATE contractors
     SET image_url = $1, photo_url = $1, updated_at = now()
     WHERE id = $2
     RETURNING *`,
    [imageUrl, id]
  );
  return res.rows[0];
};

exports.appendPortfolio = async (id, imageUrls) => {
  const res = await db.query(
    `UPDATE contractors
     SET portfolio_urls = COALESCE(portfolio_urls, '{}') || $2,
         portfolio_photos = COALESCE(portfolio_photos, '{}') || $2,
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, imageUrls]
  );
  return res.rows[0];
};

exports.setPortfolio = async (id, imageUrls) => {
  const res = await db.query(
    `UPDATE contractors
     SET portfolio_urls = $2,
         portfolio_photos = $2,
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, imageUrls || []]
  );
  return res.rows[0];
};

exports.setIdProof = async (id, url) => {
  const res = await db.query(
    `UPDATE contractors
     SET id_proof_url = $1, updated_at = now()
     WHERE id = $2
     RETURNING *`,
    [url, id]
  );
  return res.rows[0];
};

exports.findById = async (id) => {
  const res = await db.query(
    `${contractorSelect()}
     WHERE c.id = $1`,
    [id]
  );
  return res.rows[0];
};

exports.findByUserId = async (userId) => {
  const res = await db.query(
    `${contractorSelect()}
     WHERE c.user_id = $1`,
    [userId]
  );
  return res.rows[0];
};

exports.update = async (id, data) => {
  const categories = Array.isArray(data.categories) ? data.categories : undefined;
  const category = data.category || (categories && categories[0]) || undefined;
  const lat = data.lat ?? data.latitude;
  const lng = data.lng ?? data.longitude;

  const res = await db.query(
    `UPDATE contractors
     SET business_name = COALESCE($2, business_name),
         description = COALESCE($3, description),
         category = COALESCE($4, category),
         categories = COALESCE($5, categories),
         services = COALESCE($6, services),
         daily_rate = COALESCE($7, daily_rate),
         experience_years = COALESCE($8, experience_years),
         team_size = COALESCE($9, team_size),
         is_labour_group = COALESCE($10, is_labour_group),
         is_responsibility_model = COALESCE($11, is_responsibility_model),
         location_text = COALESCE($12, location_text),
         lat = COALESCE($13, lat),
         lng = COALESCE($14, lng),
         latitude = COALESCE($13, latitude),
         longitude = COALESCE($14, longitude),
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      data.business_name,
      data.description,
      category,
      categories,
      data.services,
      data.daily_rate,
      data.experience_years,
      data.team_size,
      data.is_labour_group,
      data.is_responsibility_model,
      data.location_text,
      lat,
      lng,
    ]
  );
  return res.rows[0];
};

exports.remove = async (id) => {
  await db.query('DELETE FROM contractors WHERE id = $1', [id]);
  return { ok: true };
};

exports.search = async ({
  q,
  category,
  verified,
  featured,
  labour_group,
  lat,
  lng,
  sort,
  page = 1,
  limit = 20,
}) => {
  const safeLimit = Math.max(1, Math.min(parseInt(limit, 10) || 20, 100));
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const offset = (safePage - 1) * safeLimit;
  const hasCoordinates = lat !== undefined && lng !== undefined && lat !== '' && lng !== '';
  const latValue = hasCoordinates ? parseFloat(lat) : 0;
  const lngValue = hasCoordinates ? parseFloat(lng) : 0;

  const params = [latValue, lngValue];
  const where = ['COALESCE(array_length(c.categories, 1), 0) > 0'];

  if (q) {
    params.push(`%${q}%`);
    const i = params.length;
    where.push(`(COALESCE(c.business_name, '') ILIKE $${i} OR COALESCE(c.description, '') ILIKE $${i})`);
  }

  if (category) {
    params.push(category);
    const i = params.length;
    where.push(`(c.category = $${i} OR $${i} = ANY(COALESCE(c.categories, '{}')))`);
  }

  if (verified === true || verified === 'true') where.push('c.is_verified = true');
  if (featured === true || featured === 'true') where.push('c.is_featured = true');
  if (labour_group === true || labour_group === 'true') where.push('c.is_labour_group = true');

  const orderBy = sort === 'rating' ? 'c.rating DESC NULLS LAST' : 'distance_km ASC NULLS LAST';

  params.push(safeLimit, offset);
  const limitIdx = params.length - 1;
  const offsetIdx = params.length;

  const sql = `
    SELECT c.*, u.name AS user_name, u.phone,
      COALESCE(c.business_name, u.name) AS name,
      COALESCE(c.category, c.categories[1], NULL) AS category,
      COALESCE(c.review_count, c.reviews_count, 0) AS review_count,
      COALESCE(c.portfolio_photos, c.portfolio_urls, '{}') AS portfolio_photos,
      (
        6371 * acos(
          cos(radians($1)) * cos(radians(COALESCE(c.lat, c.latitude)))
          * cos(radians(COALESCE(c.lng, c.longitude)) - radians($2))
          + sin(radians($1)) * sin(radians(COALESCE(c.lat, c.latitude)))
        )
      ) AS distance_km
    FROM contractors c
    JOIN users u ON u.id = c.user_id
    WHERE ${where.join(' AND ')}
    ORDER BY ${orderBy}, c.created_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const res = await db.query(sql, params);
  return res.rows;
};

exports.addReview = async (contractorId, userId, rating, comment) => {
  const existing = await db.query(
    `SELECT id FROM reviews WHERE contractor_id = $1 AND user_id = $2 LIMIT 1`,
    [contractorId, userId]
  );
  if (existing.rows[0]) {
    const err = new Error('Already reviewed');
    err.status = 409;
    throw err;
  }

  const res = await db.query(
    `INSERT INTO reviews (contractor_id, user_id, rating, comment)
     VALUES ($1,$2,$3,$4)
     RETURNING *`,
    [contractorId, userId, rating, comment]
  );

  const agg = await db.query(
    'SELECT AVG(rating)::numeric(3,2) as avg, COUNT(*)::int as cnt FROM reviews WHERE contractor_id = $1',
    [contractorId]
  );

  const avg = agg.rows[0].avg || 0;
  const cnt = agg.rows[0].cnt || 0;
  await db.query(
    `UPDATE contractors
     SET rating = $1, reviews_count = $2, review_count = $2, updated_at = now()
     WHERE id = $3`,
    [avg, cnt, contractorId]
  );
  return res.rows[0];
};

exports.getReviews = async (contractorId) => {
  const res = await db.query(
    `SELECT r.*, COALESCE(u.name, 'Customer') AS reviewer_name
     FROM reviews r
     LEFT JOIN users u ON u.id = r.user_id
     WHERE r.contractor_id = $1
     ORDER BY r.created_at DESC`,
    [contractorId]
  );
  return res.rows;
};

exports.setAvailabilityByUserId = async (userId, available) => {
  const res = await db.query(
    `UPDATE contractors
     SET is_available = $2, updated_at = now()
     WHERE user_id = $1
     RETURNING *`,
    [userId, !!available]
  );
  return res.rows[0];
};

exports.incrementViews = async (id) => {
  await db.query(
    `UPDATE contractors
     SET views_count = COALESCE(views_count, 0) + 1,
         updated_at = now()
     WHERE id = $1`,
    [id]
  );
};

exports.incrementLeads = async (id) => {
  const res = await db.query(
    `UPDATE contractors
     SET leads_count = COALESCE(leads_count, 0) + 1,
         updated_at = now()
     WHERE id = $1
     RETURNING id, leads_count`,
    [id]
  );
  return res.rows[0];
};
