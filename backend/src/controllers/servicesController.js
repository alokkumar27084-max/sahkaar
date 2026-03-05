const db = require('../config/db');

// ── Public: List service categories ─────────────────────────────
async function listCategories(req, res, next) {
    try {
        const { type } = req.query; // 'chhota' | 'bada' | undefined
        let query = `SELECT * FROM service_categories WHERE is_active = true`;
        const params = [];
        if (type) {
            params.push(type);
            query += ` AND type = $${params.length}`;
        }
        query += ` ORDER BY display_order ASC, name ASC`;
        const { rows } = await db.query(query, params);
        res.json({ ok: true, categories: rows });
    } catch (err) { next(err); }
}

// ── Public: Get single category with its services ───────────────
async function getCategoryBySlug(req, res, next) {
    try {
        const { slug } = req.params;
        const catResult = await db.query(
            `SELECT * FROM service_categories WHERE slug = $1 AND is_active = true`, [slug]
        );
        if (catResult.rows.length === 0) {
            return res.status(404).json({ ok: false, message: 'Category not found' });
        }
        const category = catResult.rows[0];
        const svcResult = await db.query(
            `SELECT * FROM services WHERE category_id = $1 AND is_active = true ORDER BY display_order ASC, name ASC`,
            [category.id]
        );
        res.json({ ok: true, category, services: svcResult.rows });
    } catch (err) { next(err); }
}

// ── Public: Get single service by slug ──────────────────────────
async function getServiceBySlug(req, res, next) {
    try {
        const { slug } = req.params;
        const result = await db.query(
            `SELECT s.*, sc.name as category_name, sc.name_hi as category_name_hi, sc.slug as category_slug, sc.type as category_type
       FROM services s
       JOIN service_categories sc ON s.category_id = sc.id
       WHERE s.slug = $1 AND s.is_active = true`, [slug]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ ok: false, message: 'Service not found' });
        }
        // Also get related services from same category
        const svc = result.rows[0];
        const related = await db.query(
            `SELECT id, name, name_hi, slug, price_starts_at, icon, rating FROM services
       WHERE category_id = $1 AND id != $2 AND is_active = true
       ORDER BY display_order ASC LIMIT 6`, [svc.category_id, svc.id]
        );
        res.json({ ok: true, service: svc, related: related.rows });
    } catch (err) { next(err); }
}

// ── Public: Submit a service request ────────────────────────────
async function submitRequest(req, res, next) {
    try {
        const { service_id, category_id, customer_name, customer_phone, customer_address, preferred_date, preferred_time, notes, type } = req.body;
        if (!customer_name || !customer_phone) {
            return res.status(400).json({ ok: false, message: 'Name and phone are required' });
        }
        const result = await db.query(
            `INSERT INTO service_requests (service_id, category_id, customer_name, customer_phone, customer_address, preferred_date, preferred_time, notes, type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
            [service_id || null, category_id || null, customer_name, customer_phone, customer_address || null, preferred_date || null, preferred_time || null, notes || null, type || 'chhota']
        );
        // Increment bookings count if service_id provided
        if (service_id) {
            await db.query(`UPDATE services SET bookings_count = bookings_count + 1 WHERE id = $1`, [service_id]);
        }
        res.status(201).json({ ok: true, request: result.rows[0] });
    } catch (err) { next(err); }
}

// ── Public: Search services ─────────────────────────────────────
async function searchServices(req, res, next) {
    try {
        const { q, type } = req.query;
        let query = `SELECT s.*, sc.name as category_name, sc.slug as category_slug, sc.type as category_type
                 FROM services s JOIN service_categories sc ON s.category_id = sc.id
                 WHERE s.is_active = true AND sc.is_active = true`;
        const params = [];
        if (q) {
            params.push(`%${q}%`);
            query += ` AND (s.name ILIKE $${params.length} OR s.name_hi ILIKE $${params.length} OR s.description ILIKE $${params.length})`;
        }
        if (type) {
            params.push(type);
            query += ` AND sc.type = $${params.length}`;
        }
        query += ` ORDER BY s.bookings_count DESC, s.rating DESC LIMIT 50`;
        const { rows } = await db.query(query, params);
        res.json({ ok: true, services: rows });
    } catch (err) { next(err); }
}

module.exports = { listCategories, getCategoryBySlug, getServiceBySlug, submitRequest, searchServices };
