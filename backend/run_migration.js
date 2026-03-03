require('dotenv').config();
const db = require('./src/config/db');
const fs = require('fs');
const sql = fs.readFileSync('./migrations/010_add_site_settings.sql', 'utf8');
db.query(sql)
    .then(() => { console.log('Migration OK'); process.exit(0); })
    .catch(e => { console.error(e.message); process.exit(1); });
