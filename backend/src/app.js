// Express app configuration: middleware, routes, and basic error handling
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const routes = require('./routes');
const db = require('./config/db');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');
const { bookingController } = require('./controllers/bookingController');

// ── PRODUCTION READINESS CHECKS ──
const CRITICAL_KEYS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET'
];

if (process.env.NODE_ENV === 'production') {
  const missing = CRITICAL_KEYS.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`🛑 CRITICAL ERROR: Missing environment variables for production: ${missing.join(', ')}`);
    console.error('Platform will NOT function correctly in production without these keys.');
  }
} else {
  const missing = CRITICAL_KEYS.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`⚠️  DEV WARNING: Missing keys: ${missing.join(', ')}. Some features (Payments, Auth) will run in MOCK mode.`);
  }
}

const app = express();

// Basic security headers — allow cross-origin resource loading for uploaded images
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
}));

// CORS - restrict to configured frontend URL(s)
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const corsOrigins = frontendUrl.split(',').map((x) => x.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || corsOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS blocked'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
}));

// Stricter rate limits for OTP endpoints (must be before the general /api limiter)
app.use('/api/auth/send-otp', rateLimit({ windowMs: 10 * 60 * 1000, max: 5 }));
app.use('/api/auth/otp/request', rateLimit({ windowMs: 10 * 60 * 1000, max: 5 }));
// General API rate limit to avoid basic abuse
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.use(express.json({
  limit: '10mb',
  verify: (req, res, buffer) => {
    if (req.originalUrl.startsWith('/api/payments/webhook')) {
      req.rawBody = Buffer.from(buffer);
    }
  },
}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Detect MIME type for extensionless uploaded files via magic bytes
app.use('/uploads', (req, res, next) => {
  const ext = path.extname(req.path);
  if (!ext) {
    const filePath = path.join(__dirname, '../uploads', req.path);
    try {
      const fd = fs.openSync(filePath, 'r');
      const buf = Buffer.alloc(4);
      fs.readSync(fd, buf, 0, 4, 0);
      fs.closeSync(fd);
      // Detect type from magic bytes
      if (buf[0] === 0xFF && buf[1] === 0xD8) res.type('image/jpeg');
      else if (buf[0] === 0x89 && buf[1] === 0x50) res.type('image/png');
      else if (buf.toString('ascii', 0, 4) === 'RIFF') res.type('image/webp');
      else res.type('application/octet-stream');
    } catch { /* let static serve handle errors */ }
  }
  next();
});
// Serve uploaded files from backend/uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health endpoint used by deployment monitors (includes DB check when DATABASE_URL is set)
app.get('/health', async (req, res) => {
  const payload = { status: 'ok', time: new Date().toISOString() };
  if (!process.env.DATABASE_URL) {
    payload.db = 'not_configured';
    return res.json(payload);
  }
  try {
    await db.query('SELECT 1');
    payload.db = 'ok';
    return res.json(payload);
  } catch (err) {
    console.error('Health DB check failed:', err.message);
    payload.status = 'degraded';
    payload.db = 'error';
    return res.status(503).json(payload);
  }
});

// Mount app routes
app.use('/api', routes);

// Serve OpenAPI spec via Swagger UI at /api/docs
// Temporarily disabled due to YAML parsing issue
/*
try {
  const openapiPath = path.join(__dirname, '../openapi.yaml');
  if (fs.existsSync(openapiPath)) {
    const specYaml = fs.readFileSync(openapiPath, 'utf8');
    const specObj = require('js-yaml').load(specYaml);
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specObj));
  }
} catch (err) {
  console.warn('Swagger UI not available:', err.message);
}
*/

// Basic 404 handler
app.use((req, res) => res.status(404).json({ ok: false, message: 'Not found' }));

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ ok: false, message: err.message || 'Server error' });
});

module.exports = app;
