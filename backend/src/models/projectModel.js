// ─────────────────────────────────────────────
// projectModel.js — SaaS Project Management CRUD
// ─────────────────────────────────────────────
const db = require('../config/db');

// ── Project CRUD ──

exports.create = async ({ meeting_id, customer_id, contractor_id, title, description, escrow_opted, estimated_budget, start_date, expected_end_date }) => {
  const { rows } = await db.query(
    `INSERT INTO projects
       (meeting_id, customer_id, contractor_id, title, description,
        escrow_opted, estimated_budget, start_date, expected_end_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [meeting_id, customer_id, contractor_id, title, description,
     escrow_opted || false, estimated_budget, start_date, expected_end_date]
  );
  return rows[0];
};

exports.findById = async (id) => {
  const { rows } = await db.query(
    `SELECT p.*, u.name AS customer_name, c.business_name AS contractor_name,
            c.photo_url AS contractor_photo
     FROM projects p
     JOIN users u ON p.customer_id = u.id
     JOIN contractors c ON p.contractor_id = c.id
     WHERE p.id = $1`,
    [id]
  );
  return rows[0];
};

exports.findByCustomer = async (customer_id) => {
  const { rows } = await db.query(
    `SELECT p.*, c.business_name AS contractor_name, c.photo_url AS contractor_photo,
            c.category AS contractor_category
     FROM projects p
     JOIN contractors c ON p.contractor_id = c.id
     WHERE p.customer_id = $1
     ORDER BY p.created_at DESC`,
    [customer_id]
  );
  return rows;
};

exports.findByContractor = async (contractor_id) => {
  const { rows } = await db.query(
    `SELECT p.*, u.name AS customer_name
     FROM projects p
     JOIN users u ON p.customer_id = u.id
     WHERE p.contractor_id = $1
     ORDER BY p.created_at DESC`,
    [contractor_id]
  );
  return rows;
};

exports.update = async (id, fields) => {
  const allowed = ['title','description','status','estimated_budget','actual_cost','start_date','expected_end_date','actual_end_date'];
  const sets = [];
  const vals = [];
  let idx = 1;
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = $${idx}`);
      vals.push(fields[key]);
      idx++;
    }
  }
  if (sets.length === 0) return null;
  sets.push(`updated_at = NOW()`);
  vals.push(id);
  const { rows } = await db.query(
    `UPDATE projects SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    vals
  );
  return rows[0];
};

// ── Milestones ──

exports.addMilestone = async (project_id, { title, description, amount, due_date, sort_order }) => {
  const { rows } = await db.query(
    `INSERT INTO project_milestones (project_id, title, description, amount, due_date, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [project_id, title, description, amount, due_date, sort_order || 0]
  );
  return rows[0];
};

exports.getMilestones = async (project_id) => {
  const { rows } = await db.query(
    `SELECT * FROM project_milestones WHERE project_id = $1 ORDER BY sort_order, created_at`,
    [project_id]
  );
  return rows;
};

exports.updateMilestone = async (id, fields) => {
  const allowed = ['title','description','amount','status','payment_status','due_date','completed_at','razorpay_order_id','razorpay_payment_id','sort_order'];
  const sets = [];
  const vals = [];
  let idx = 1;
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = $${idx}`);
      vals.push(fields[key]);
      idx++;
    }
  }
  if (sets.length === 0) return null;
  vals.push(id);
  const { rows } = await db.query(
    `UPDATE project_milestones SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    vals
  );
  return rows[0];
};

exports.deleteMilestone = async (id) => {
  await db.query(`DELETE FROM project_milestones WHERE id = $1`, [id]);
};

// ── Materials ──

exports.addMaterial = async (project_id, { name, category, quantity, unit, unit_price, total_price, vendor_name, purchase_date, receipt_url, added_by, notes }) => {
  const { rows } = await db.query(
    `INSERT INTO project_materials
       (project_id, name, category, quantity, unit, unit_price, total_price,
        vendor_name, purchase_date, receipt_url, added_by, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [project_id, name, category, quantity, unit, unit_price, total_price || (quantity * unit_price),
     vendor_name, purchase_date, receipt_url, added_by, notes]
  );
  return rows[0];
};

exports.getMaterials = async (project_id) => {
  const { rows } = await db.query(
    `SELECT * FROM project_materials WHERE project_id = $1 ORDER BY created_at DESC`,
    [project_id]
  );
  return rows;
};

exports.updateMaterial = async (id, fields) => {
  const allowed = ['name','category','quantity','unit','unit_price','total_price','vendor_name','purchase_date','receipt_url','notes'];
  const sets = [];
  const vals = [];
  let idx = 1;
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = $${idx}`);
      vals.push(fields[key]);
      idx++;
    }
  }
  if (sets.length === 0) return null;
  vals.push(id);
  const { rows } = await db.query(
    `UPDATE project_materials SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    vals
  );
  return rows[0];
};

exports.deleteMaterial = async (id) => {
  await db.query(`DELETE FROM project_materials WHERE id = $1`, [id]);
};

// ── Manpower ──

exports.addManpower = async (project_id, { worker_name, role, daily_rate, phone, notes }) => {
  const { rows } = await db.query(
    `INSERT INTO project_manpower (project_id, worker_name, role, daily_rate, phone, notes)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [project_id, worker_name, role, daily_rate, phone, notes]
  );
  return rows[0];
};

exports.getManpower = async (project_id) => {
  const { rows } = await db.query(
    `SELECT * FROM project_manpower WHERE project_id = $1 ORDER BY created_at`,
    [project_id]
  );
  return rows;
};

exports.updateManpower = async (id, fields) => {
  const allowed = ['worker_name','role','daily_rate','days_worked','total_paid','phone','status','notes'];
  const sets = [];
  const vals = [];
  let idx = 1;
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = $${idx}`);
      vals.push(fields[key]);
      idx++;
    }
  }
  if (sets.length === 0) return null;
  vals.push(id);
  const { rows } = await db.query(
    `UPDATE project_manpower SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    vals
  );
  return rows[0];
};

exports.deleteManpower = async (id) => {
  await db.query(`DELETE FROM project_manpower WHERE id = $1`, [id]);
};

// ── Expenses ──

exports.addExpense = async (project_id, { category, description, amount, date, receipt_url, added_by }) => {
  const { rows } = await db.query(
    `INSERT INTO project_expenses (project_id, category, description, amount, date, receipt_url, added_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [project_id, category, description, amount, date, receipt_url, added_by]
  );
  return rows[0];
};

exports.getExpenses = async (project_id) => {
  const { rows } = await db.query(
    `SELECT * FROM project_expenses WHERE project_id = $1 ORDER BY created_at DESC`,
    [project_id]
  );
  return rows;
};

exports.deleteExpense = async (id) => {
  await db.query(`DELETE FROM project_expenses WHERE id = $1`, [id]);
};

// ── Project Summary (aggregated costs) ──

exports.getSummary = async (project_id) => {
  const [milestones, materials, manpower, expenses] = await Promise.all([
    db.query(`SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS count,
              COUNT(*) FILTER (WHERE status='COMPLETED') AS completed
              FROM project_milestones WHERE project_id = $1`, [project_id]),
    db.query(`SELECT COALESCE(SUM(total_price),0) AS total, COUNT(*) AS count
              FROM project_materials WHERE project_id = $1`, [project_id]),
    db.query(`SELECT COALESCE(SUM(total_paid),0) AS total, COUNT(*) AS count,
              COALESCE(SUM(days_worked),0) AS total_days
              FROM project_manpower WHERE project_id = $1`, [project_id]),
    db.query(`SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS count
              FROM project_expenses WHERE project_id = $1`, [project_id]),
  ]);

  return {
    milestones: milestones.rows[0],
    materials: materials.rows[0],
    manpower: manpower.rows[0],
    expenses: expenses.rows[0],
    total_cost: parseFloat(materials.rows[0].total) +
                parseFloat(manpower.rows[0].total) +
                parseFloat(expenses.rows[0].total),
  };
};
