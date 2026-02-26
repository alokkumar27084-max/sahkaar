exports.checkRole = (...roles) => (req, res, next) => {
  const roleSet = new Set(roles);
  if (!req.user || !roleSet.has(req.user.role)) {
    return res.status(403).json({ ok: false, message: 'Forbidden' });
  }
  return next();
};
