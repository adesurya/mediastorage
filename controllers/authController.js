const User = require('../models/User');
const jwt = require('jsonwebtoken');

class AuthController {
  static showLogin(req, res) {
    if (req.session.userId) {
      return res.redirect('/dashboard');
    }
    res.render('login', { error: null });
  }

  static async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.render('login', { 
          error: 'Username and password are required' 
        });
      }

      const user = await User.findByUsername(username);

      if (!user) {
        return res.render('login', { 
          error: 'Invalid username or password' 
        });
      }

      const isValidPassword = await User.verifyPassword(password, user.password);

      if (!isValidPassword) {
        return res.render('login', { 
          error: 'Invalid username or password' 
        });
      }

      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.cookie('token', token, { 
        httpOnly: true, 
        maxAge: 24 * 60 * 60 * 1000 
      });

      res.redirect('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      res.render('login', { 
        error: 'An error occurred during login' 
      });
    }
  }

  static logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
      }
      res.clearCookie('token');
      res.redirect('/auth/login');
    });
  }

  static async apiLogin(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username and password are required' 
        });
      }

      const user = await User.findByUsername(username);

      if (!user || !(await User.verifyPassword(password, user.password))) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        }
      });
    } catch (error) {
      console.error('API Login error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  }
}

module.exports = AuthController;