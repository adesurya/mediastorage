const User = require('../models/User');

class UserController {
  static async index(req, res) {
    try {
      const currentUser = await User.findById(req.session.userId);
      const users = await User.findAll();
      
      res.render('users', { 
        users, 
        user: currentUser,
        error: null,
        success: null 
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).send('Server error');
    }
  }

  static async getAllUsers(req, res) {
    try {
      const users = await User.findAll();
      res.json({ 
        success: true, 
        data: users 
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  }

  static async getUserById(req, res) {
    try {
      const user = await User.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      res.json({ 
        success: true, 
        data: user 
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  }

  static async createUser(req, res) {
    try {
      const { username, email, password, role } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username, email, and password are required' 
        });
      }

      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username already exists' 
        });
      }

      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email already exists' 
        });
      }

      const userId = await User.create({ username, email, password, role });
      const newUser = await User.findById(userId);

      res.status(201).json({ 
        success: true, 
        message: 'User created successfully',
        data: newUser 
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  }

  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { username, email, role, password } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      await User.update(id, { username, email, role });

      if (password && password.trim() !== '') {
        await User.updatePassword(id, password);
      }

      const updatedUser = await User.findById(id);

      res.json({ 
        success: true, 
        message: 'User updated successfully',
        data: updatedUser 
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  }

  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      if (parseInt(id) === req.session.userId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete your own account' 
        });
      }

      await User.delete(id);

      res.json({ 
        success: true, 
        message: 'User deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  }
}

module.exports = UserController;