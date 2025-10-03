const User = require('../models/User');

const checkRole = (...roles) => {
  return async (req, res, next) => {
    try {
      const userId = req.session.userId || req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      if (!roles.includes(user.role)) {
        if (req.accepts('html')) {
          return res.status(403).send(`
            <h1>Access Denied</h1>
            <p>You don't have permission to access this page.</p>
            <a href="/media">Back to Media</a>
          `);
        }
        
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Insufficient permissions.' 
        });
      }

      req.userRole = user.role;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  };
};

module.exports = checkRole;