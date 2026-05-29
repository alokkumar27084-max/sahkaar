const express = require('express');
const router = express.Router();
const controller = require('../controllers/projectController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.post('/', controller.createProject);
router.get('/me', controller.getMyProjects);
router.get('/:id', controller.getProject);
router.put('/:id', controller.updateProject);

// Milestones
router.post('/:id/milestones', controller.addMilestone);
router.put('/:id/milestones/:mid', controller.updateMilestone);
router.delete('/:id/milestones/:mid', controller.deleteMilestone);

// Materials
router.post('/:id/materials', controller.addMaterial);
router.put('/:id/materials/:mid', controller.updateMaterial);
router.delete('/:id/materials/:mid', controller.deleteMaterial);

// Manpower
router.post('/:id/manpower', controller.addManpower);
router.put('/:id/manpower/:wid', controller.updateManpower);
router.delete('/:id/manpower/:wid', controller.deleteManpower);

// Expenses
router.post('/:id/expenses', controller.addExpense);
router.delete('/:id/expenses/:eid', controller.deleteExpense);

// Summary
router.get('/:id/summary', controller.getProjectSummary);

module.exports = router;
