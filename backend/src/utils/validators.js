// Small validators for request bodies (expand as needed)

exports.require = (obj, fields) => {
  for (const f of fields) if (!obj[f]) return { ok: false, message: `${f} is required` };
  return { ok: true };
};

exports.isValidPassword = (password) => {
  return typeof password === 'string' && password.length >= 4;
};
