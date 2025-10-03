const Category = require('../models/Category');
const Media = require('../models/Media');
const User = require('../models/User');

class CategoryController {
  static async index(req, res) {
    try {
      const currentUser = await User.findById(req.session.userId);
      const categories = await Category.findAll();
      
      res.render('categories', { 
        categories,
        user: currentUser,
        error: null,
        success: null 
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).send('Server error');
    }
  }

  static async getAllCategories(req, res) {
    try {
      const categories = await Category.findAll();
      res.json({ 
        success: true, 
        data: categories 
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  }

  static async getCategoryById(req, res) {
    try {
      const category = await Category.findById(req.params.id);
      
      if (!category) {
        return res.status(404).json({ 
          success: false, 
          message: 'Category not found' 
        });
      }
      
      const mediaFiles = await Media.findByCategoryId(req.params.id);
      
      res.json({ 
        success: true, 
        data: {
          category,
          media: mediaFiles
        }
      });
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  }

  static async createCategory(req, res) {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ 
          success: false, 
          message: 'Category name is required' 
        });
      }

      const userId = req.session.userId || req.user?.id;
      
      const categoryId = await Category.create({ 
        name, 
        description,
        user_id: userId
      });
      
      const newCategory = await Category.findById(categoryId);

      res.status(201).json({ 
        success: true, 
        message: 'Category created successfully',
        data: newCategory 
      });
    } catch (error) {
      console.error('Error creating category:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ 
          success: false, 
          message: 'Category name already exists' 
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  }

  static async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const category = await Category.findById(id);
      if (!category) {
        return res.status(404).json({ 
          success: false, 
          message: 'Category not found' 
        });
      }

      await Category.update(id, { name, description });
      const updatedCategory = await Category.findById(id);

      res.json({ 
        success: true, 
        message: 'Category updated successfully',
        data: updatedCategory 
      });
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  }

  static async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      const category = await Category.findById(id);
      if (!category) {
        return res.status(404).json({ 
          success: false, 
          message: 'Category not found' 
        });
      }

      await Category.delete(id);

      res.json({ 
        success: true, 
        message: 'Category deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  }
}

module.exports = CategoryController;