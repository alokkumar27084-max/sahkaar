// ─────────────────────────────────────────────
// projectController.js — SaaS Project Management
// ─────────────────────────────────────────────
const projectModel = require('../models/projectModel');

// ── Projects ──

exports.createProject = async (req, res) => {
  try {
    const { meeting_id, contractor_id, title, description, escrow_opted,
            estimated_budget, start_date, expected_end_date } = req.body;

    if (!contractor_id || !title) {
      return res.status(400).json({ ok: false, message: 'contractor_id and title are required' });
    }

    const project = await projectModel.create({
      meeting_id,
      customer_id: req.user.id,
      contractor_id,
      title,
      description,
      escrow_opted,
      estimated_budget,
      start_date,
      expected_end_date,
    });

    res.json({ ok: true, project });
  } catch (err) {
    console.error('createProject error:', err);
    res.status(500).json({ ok: false, message: 'Failed to create project' });
  }
};

exports.getMyProjects = async (req, res) => {
  try {
    const { role } = req.query;
    let projects;
    if (role === 'contractor') {
      const db = require('../config/db');
      const { rows } = await db.query(`SELECT id FROM contractors WHERE user_id = $1`, [req.user.id]);
      projects = rows[0] ? await projectModel.findByContractor(rows[0].id) : [];
    } else {
      projects = await projectModel.findByCustomer(req.user.id);
    }
    res.json({ ok: true, projects });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to fetch projects' });
  }
};

exports.getProject = async (req, res) => {
  try {
    const project = await projectModel.findById(req.params.id);
    if (!project) return res.status(404).json({ ok: false, message: 'Project not found' });

    // Auth check: only project customer or contractor can view
    const db = require('../config/db');
    const { rows } = await db.query(`SELECT id FROM contractors WHERE user_id = $1`, [req.user.id]);
    const isContractor = rows[0] && rows[0].id === project.contractor_id;
    if (project.customer_id !== req.user.id && !isContractor) {
      return res.status(403).json({ ok: false, message: 'Not authorized' });
    }

    // Fetch all sub-data
    const [milestones, materials, manpower, expenses, summary] = await Promise.all([
      projectModel.getMilestones(project.id),
      projectModel.getMaterials(project.id),
      projectModel.getManpower(project.id),
      projectModel.getExpenses(project.id),
      projectModel.getSummary(project.id),
    ]);

    res.json({ ok: true, project, milestones, materials, manpower, expenses, summary });
  } catch (err) {
    console.error('getProject error:', err);
    res.status(500).json({ ok: false, message: 'Failed to fetch project' });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const updated = await projectModel.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ ok: false, message: 'Project not found or no changes' });
    res.json({ ok: true, project: updated });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to update project' });
  }
};

// ── Milestones ──

exports.addMilestone = async (req, res) => {
  try {
    const milestone = await projectModel.addMilestone(req.params.id, req.body);
    res.json({ ok: true, milestone });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to add milestone' });
  }
};

exports.updateMilestone = async (req, res) => {
  try {
    const milestone = await projectModel.updateMilestone(req.params.mid, req.body);
    if (!milestone) return res.status(404).json({ ok: false, message: 'Milestone not found' });
    res.json({ ok: true, milestone });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to update milestone' });
  }
};

exports.deleteMilestone = async (req, res) => {
  try {
    await projectModel.deleteMilestone(req.params.mid);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to delete milestone' });
  }
};

// ── Materials ──

exports.addMaterial = async (req, res) => {
  try {
    const material = await projectModel.addMaterial(req.params.id, { ...req.body, added_by: req.user.id });
    res.json({ ok: true, material });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to add material' });
  }
};

exports.updateMaterial = async (req, res) => {
  try {
    const material = await projectModel.updateMaterial(req.params.mid, req.body);
    if (!material) return res.status(404).json({ ok: false, message: 'Material not found' });
    res.json({ ok: true, material });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to update material' });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    await projectModel.deleteMaterial(req.params.mid);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to delete material' });
  }
};

// ── Manpower ──

exports.addManpower = async (req, res) => {
  try {
    const worker = await projectModel.addManpower(req.params.id, req.body);
    res.json({ ok: true, worker });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to add worker' });
  }
};

exports.updateManpower = async (req, res) => {
  try {
    const worker = await projectModel.updateManpower(req.params.wid, req.body);
    if (!worker) return res.status(404).json({ ok: false, message: 'Worker not found' });
    res.json({ ok: true, worker });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to update worker' });
  }
};

exports.deleteManpower = async (req, res) => {
  try {
    await projectModel.deleteManpower(req.params.wid);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to delete worker' });
  }
};

// ── Expenses ──

exports.addExpense = async (req, res) => {
  try {
    const expense = await projectModel.addExpense(req.params.id, { ...req.body, added_by: req.user.id });
    res.json({ ok: true, expense });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to add expense' });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    await projectModel.deleteExpense(req.params.eid);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to delete expense' });
  }
};

// ── Summary ──

exports.getProjectSummary = async (req, res) => {
  try {
    const summary = await projectModel.getSummary(req.params.id);
    res.json({ ok: true, summary });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to fetch summary' });
  }
};
