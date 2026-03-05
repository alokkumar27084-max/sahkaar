const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'backend', 'src', 'controllers', 'contractorController.js');

const appendStr = `
exports.addPortfolioItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    
    let contractorId = id;
    if (contractorId === 'me') {
        const my = await Contractor.findByUserId(req.user.id);
        if (!my) return res.status(404).json({ ok: false, message: 'Contractor profile not found' });
        contractorId = my.id;
    }

    const existing = await Contractor.findById(contractorId);
    if (!existing) return res.status(404).json({ ok: false, message: 'Not found' });
    if (existing.user_id !== req.user.id) return res.status(403).json({ ok: false, message: 'Forbidden' });
    
    if (!req.file) return res.status(400).json({ ok: false, message: 'No image file uploaded' });
    if (!isValidImage(req.file)) return res.status(400).json({ ok: false, message: 'Invalid image type' });
    
    const imagePath = \`/uploads/\${req.file.filename}\`;
    const item = await Contractor.addPortfolioItem(contractorId, imagePath, title, description);
    
    return res.json({ ok: true, portfolio_item: item });
  } catch (err) {
    return next(err);
  }
};

exports.removePortfolioItem = async (req, res, next) => {
  try {
    const { id, itemId } = req.params;
    
    let contractorId = id;
    if (contractorId === 'me') {
        const my = await Contractor.findByUserId(req.user.id);
        if (!my) return res.status(404).json({ ok: false, message: 'Contractor profile not found' });
        contractorId = my.id;
    }

    const existing = await Contractor.findById(contractorId);
    if (!existing) return res.status(404).json({ ok: false, message: 'Not found' });
    if (existing.user_id !== req.user.id) return res.status(403).json({ ok: false, message: 'Forbidden' });
    
    await Contractor.removePortfolioItem(itemId, contractorId);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
};

exports.requestVerification = async (req, res, next) => {
  try {
    let contractorId = req.params.id;
    if (contractorId === 'me') {
        const my = await Contractor.findByUserId(req.user.id);
        if (!my) return res.status(404).json({ ok: false, message: 'Contractor profile not found' });
        contractorId = my.id;
    }
    const existing = await Contractor.findById(contractorId);
    if (!existing) return res.status(404).json({ ok: false, message: 'Not found' });
    if (existing.user_id !== req.user.id) return res.status(403).json({ ok: false, message: 'Forbidden' });
    
    const updated = await Contractor.update(contractorId, { verification_status: 'pending' });
    return res.json({ ok: true, contractor: updated });
  } catch (err) {
    return next(err);
  }
};
`;

fs.appendFileSync(p, appendStr, 'utf8');
console.log('Appended contractorController.js');
