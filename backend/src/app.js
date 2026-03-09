// Express app configuration: middleware, routes, and basic error handling
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const routes = require('./routes');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');

const app = express();

// Basic security headers — allow cross-origin resource loading for uploaded images
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
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

app.use(express.json({ limit: '10mb' }));
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

// Health endpoint used by deployment monitors
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

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
