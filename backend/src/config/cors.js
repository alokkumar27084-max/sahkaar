function getCorsOrigins(frontendUrl = 'http://localhost:3000') {
  return frontendUrl
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      try {
        return new URL(value).origin;
      } catch {
        return value.replace(/\/$/, '');
      }
    });
}

function isCorsOriginAllowed(origin, corsOrigins) {
  return !origin || corsOrigins.includes(origin);
}

module.exports = { getCorsOrigins, isCorsOriginAllowed };