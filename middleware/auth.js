const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.redirect('/auth/login');
};

const apiAuthMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

module.exports = { authMiddleware, apiAuthMiddleware };