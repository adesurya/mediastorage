const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController');
const { authMiddleware, apiAuthMiddleware } = require('../middleware/auth');

// Web routes
router.get('/', authMiddleware, CategoryController.index);

// API routes
router.get('/api', apiAuthMiddleware, CategoryController.getAllCategories);
router.get('/api/:id', apiAuthMiddleware, CategoryController.getCategoryById);
router.post('/api', authMiddleware, CategoryController.createCategory);
router.put('/api/:id', authMiddleware, CategoryController.updateCategory);
router.delete('/api/:id', authMiddleware, CategoryController.deleteCategory);

module.exports = router;