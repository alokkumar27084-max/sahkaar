/**
 * Central JWT secret resolution. Never use a weak default in production.
 */
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'dev-secret') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set to a strong non-default value in production');
    }
    return 'dev-secret';
  }
  return secret;
}

module.exports = { getJwtSecret };
