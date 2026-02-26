// Simple server-side sanitizers. These are lightweight helpers to avoid
// storing raw HTML/script tags in the database. For production consider
// using a well-tested library such as `xss` or `sanitize-html`.

exports.sanitize = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'string') return value;
  // Remove any HTML tags
  return value.replace(/<[^>]*>?/gm, '').trim();
};

exports.sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const out = Array.isArray(obj) ? [] : {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v === 'string') out[k] = exports.sanitize(v);
    else if (Array.isArray(v)) out[k] = v.map((x) => (typeof x === 'string' ? exports.sanitize(x) : x));
    else out[k] = v;
  }
  return out;
};
