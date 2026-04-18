/**
 * Fail fast in production when critical env vars are missing or unsafe.
 */
function validateProductionEnv() {
  if (process.env.NODE_ENV !== 'production') return;

  const errors = [];
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev-secret') {
    errors.push('JWT_SECRET must be set to a strong secret (not dev-secret)');
  }
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required');
  }
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    errors.push('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required for production payments');
  }
  if (!process.env.FRONTEND_URL) {
    errors.push('FRONTEND_URL is required for CORS and cookies');
  }

  if (errors.length) {
    console.error('[validateEnv] Production configuration errors:\n', errors.join('\n'));
    process.exit(1);
  }
}

module.exports = { validateProductionEnv };
