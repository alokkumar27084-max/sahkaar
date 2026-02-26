// Small validators for request bodies (expand as needed)

exports.require = (obj, fields) => {
  for (const f of fields) if (!obj[f]) return { ok: false, message: `${f} is required` };
  return { ok: true };
};
