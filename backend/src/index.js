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
      const User = require('./models/userModel');
      const db = require('./config/db');
      const existing = await User.findByEmail(ADMIN_EMAIL);
      if (!existing) {
        const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
        // provide a placeholder phone to satisfy non-null constraint
        await User.create({ name: 'Administrator', phone: '0000000000', email: ADMIN_EMAIL, password_hash: hash, role: 'admin' });
        console.log('✅ Default admin user created:', ADMIN_EMAIL);
      } else if (existing.role !== 'admin') {
        const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
        await db.query(
          `UPDATE users
           SET role = 'admin',
               password_hash = $2
           WHERE id = $1`,
          [existing.id, hash]
        );
        console.log('✅ Existing user promoted to admin:', ADMIN_EMAIL);
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
