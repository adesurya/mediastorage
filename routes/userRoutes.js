const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authMiddleware, apiAuthMiddleware } = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

// Web routes (dengan view)
router.get('/', authMiddleware, checkRole('admin'), UserController.index);

// API routes
router.get('/api', apiAuthMiddleware, checkRole('admin'), UserController.getAllUsers);
router.get('/api/:id', apiAuthMiddleware, checkRole('admin'), UserController.getUserById);
router.post('/api', apiAuthMiddleware, checkRole('admin'), UserController.createUser);
router.put('/api/:id', apiAuthMiddleware, checkRole('admin'), UserController.updateUser);
router.delete('/api/:id', apiAuthMiddleware, checkRole('admin'), UserController.deleteUser);

// Alternative API routes tanpa /api prefix (untuk compatibility)
router.get('/all', apiAuthMiddleware, checkRole('admin'), UserController.getAllUsers);
router.post('/create', apiAuthMiddleware, checkRole('admin'), UserController.createUser);
router.put('/update/:id', apiAuthMiddleware, checkRole('admin'), UserController.updateUser);
router.delete('/delete/:id', apiAuthMiddleware, checkRole('admin'), UserController.deleteUser);

module.exports = router;