const { Pool } = require('pg');

async function setupDatabase() {
  // Try different passwords
  const passwords = ['password', 'postgres', '', 'admin', '123456'];
  
  let connected = false;
  let connectedPassword = null;
  
  for (const pwd of passwords) {
    try {
      const pool = new Pool({
        user: 'postgres',
        password: pwd,
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        connectionTimeoutMillis: 2000,
      });
      
      const client = await pool.connect();
      console.log(`✓ Connected with password: "${pwd === '' ? '(empty)' : pwd}"`);
      connectedPassword = pwd;
      connected = true;
      
      // Check if database exists
      const res = await client.query(
        "SELECT 1 FROM pg_database WHERE datname = 'thekedaar';"
      );
      
      if (res.rows.length === 0) {
        console.log('Creating database thekedaar...');
        await client.query('CREATE DATABASE thekedaar;');
        console.log('✓ Database created successfully');
      } else {
        console.log('✓ Database thekedaar already exists');
      }
      
      client.release();
      await pool.end();
      break;
    } catch (error) {
      // Continue trying next password
    }
  }
  
  if (!connected) {
    console.log('❌ Could not connect to PostgreSQL with any default password');
    console.log('Tried passwords: ' + passwords.join(', '));
    console.log('\nPlease manually set the postgres password or update .env');
    process.exit(1);
  }
  
  // Update .env with correct password
  if (connectedPassword !== null) {
    const fs = require('fs');
    const envPath = './.env';
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(
      /DATABASE_URL=.*/,
      `DATABASE_URL=postgresql://postgres:${connectedPassword || 'password'}@localhost:5432/thekedaar`
    );
    fs.writeFileSync(envPath, envContent);
    console.log('✓ Updated .env with correct database credentials');
  }
}

setupDatabase();
