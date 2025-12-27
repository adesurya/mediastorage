// middleware/auth.js
// Session-based authentication middleware

/**
 * Authentication middleware untuk halaman web (redirect ke login jika tidak authenticated)
 */
const authMiddleware = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.redirect('/auth/login');
};

/**
 * Authentication middleware untuk API routes (return JSON error jika tidak authenticated)
 */
const apiAuthMiddleware = (req, res, next) => {
  if (req.session && req.session.userId) {
    // Attach user info to request for API handlers
    req.user = {
      id: req.session.userId,
      username: req.session.user?.username,
      email: req.session.user?.email,
      role: req.session.user?.role
    };
    return next();
  }

  return res.status(401).json({ 
    success: false, 
    message: 'Authentication required' 
  });
};

/**
 * Optional authentication middleware (tidak require auth, tapi attach user jika authenticated)
 */
const optionalAuthMiddleware = (req, res, next) => {
  if (req.session && req.session.userId) {
    req.user = {
      id: req.session.userId,
      username: req.session.user?.username,
      email: req.session.user?.email,
      role: req.session.user?.role
    };
  }
  next();
};

module.exports = { 
  authMiddleware, 
  apiAuthMiddleware,
  optionalAuthMiddleware 
};