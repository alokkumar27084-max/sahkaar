// Entry point: load environment, create app, start listener
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const http = require('http');
const { validateProductionEnv } = require('./config/validateEnv');
const app = require('./app');
const { initSocket } = require('./config/socket');

validateProductionEnv();

// Ensure upload directories exist (multer / static serving)
const uploadsRoot = path.join(__dirname, '../uploads');
for (const sub of ['', 'avatars']) {
  const dir = sub ? path.join(uploadsRoot, sub) : uploadsRoot;
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (e) {
    console.warn('Could not create uploads directory:', dir, e.message);
  }
}

const PORT = process.env.PORT || 5000;

// create default admin if credentials provided
(async function seedAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    try {
      const bcrypt = require('bcrypt');
      const db = require('./config/db');

      // Derive a unique placeholder phone for admin to avoid collisions
      const crypto = require('crypto');
      const adminPhonePlaceholder = 'admin' + crypto.createHash('md5').update(ADMIN_EMAIL).digest('hex').slice(0, 5);

      const existing = await db.query(
        'SELECT id, role FROM users WHERE LOWER(email) = $1',
        [ADMIN_EMAIL.toLowerCase()]
      );

      if (!existing.rows.length) {
        // Admin does not exist — create via upsert to handle any phone conflicts
        const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
        await db.query(
          `INSERT INTO users (name, phone, email, password_hash, role)
           VALUES ('Administrator', $1, $2, $3, 'admin')
           ON CONFLICT (email) DO UPDATE
             SET role = 'admin', password_hash = EXCLUDED.password_hash`,
          [adminPhonePlaceholder, ADMIN_EMAIL, hash]
        );
        console.log('✅ Default admin user created:', ADMIN_EMAIL);
      } else if (existing.rows[0].role !== 'admin') {
        const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
        await db.query(
          `UPDATE users SET role = 'admin', password_hash = $2 WHERE id = $1`,
          [existing.rows[0].id, hash]
        );
        console.log('✅ Existing user promoted to admin:', ADMIN_EMAIL);
      } else {
        console.log('ℹ️  Admin user already exists:', ADMIN_EMAIL);
      }
    } catch (err) {
      console.error('Error seeding admin user:', err);
    }
  }
})();

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
