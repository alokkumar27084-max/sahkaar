const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend', 'src', 'models', 'contractorModel.js');
let content = fs.readFileSync(filePath, 'utf8');

const findByIdStr = `exports.findById = async (id) => {
  const res = await db.query(
    \`\${contractorSelect()}
     WHERE c.id = $1\`,
    [id]
  );
  return res.rows[0];
};`;

const findByIdNew = `exports.findById = async (id) => {
  const res = await db.query(
    \`\${contractorSelect()}
     WHERE c.id = $1\`,
    [id]
  );
  if (res.rows[0]) {
    const portfolioRes = await db.query(
      'SELECT id, image_url, title, description, created_at FROM portfolio_items WHERE contractor_id = $1 ORDER BY created_at DESC',
      [id]
    );
    res.rows[0].portfolio_items = portfolioRes.rows;
  }
  return res.rows[0];
};`;

content = content.replace(findByIdStr, findByIdNew);

const findByUserIdStr = `exports.findByUserId = async (userId) => {
  const res = await db.query(
    \`\${contractorSelect()}
     WHERE c.user_id = $1\`,
    [userId]
  );
  return res.rows[0];
};`;

const findByUserIdNew = `exports.findByUserId = async (userId) => {
  const res = await db.query(
    \`\${contractorSelect()}
     WHERE c.user_id = $1\`,
    [userId]
  );
  if (res.rows[0]) {
    const portfolioRes = await db.query(
      'SELECT id, image_url, title, description, created_at FROM portfolio_items WHERE contractor_id = $1 ORDER BY created_at DESC',
      [res.rows[0].id]
    );
    res.rows[0].portfolio_items = portfolioRes.rows;
  }
  return res.rows[0];
};`;

content = content.replace(findByUserIdStr, findByUserIdNew);

const updateStr = `         latitude = COALESCE($13, latitude),
         longitude = COALESCE($14, longitude),
         updated_at = now()
     WHERE id = $1
     RETURNING *\`,
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
};`;

const updateNew = `         latitude = COALESCE($13, latitude),
         longitude = COALESCE($14, longitude),
         is_verified = COALESCE($15, is_verified),
         verification_status = COALESCE($16, verification_status),
         tier = COALESCE($17, tier),
         updated_at = now()
     WHERE id = $1
     RETURNING *\`,
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
      data.is_verified,
      data.verification_status,
      data.tier
    ]
  );
  return res.rows[0];
};

exports.addPortfolioItem = async (contractorId, imageUrl, title, description) => {
  const res = await db.query(
    \`INSERT INTO portfolio_items (contractor_id, image_url, title, description)
     VALUES ($1, $2, $3, $4)
     RETURNING *\`,
    [contractorId, imageUrl, title, description]
  );
  return res.rows[0];
};

exports.removePortfolioItem = async (id, contractorId) => {
  await db.query('DELETE FROM portfolio_items WHERE id = $1 AND contractor_id = $2', [id, contractorId]);
  return { ok: true };
};`;

content = content.replace(updateStr, updateNew);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Update complete.');
