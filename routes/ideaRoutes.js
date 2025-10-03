const express = require('express');
const router = express.Router();
const IdeaController = require('../controllers/ideaController');
const { authMiddleware, apiAuthMiddleware } = require('../middleware/auth');

// Web routes
router.get('/', authMiddleware, IdeaController.index);

// API routes
router.get('/api/chats', authMiddleware, IdeaController.getAllChats);
router.get('/api/chats/:id', authMiddleware, IdeaController.getChatById);
router.post('/api/chats', authMiddleware, IdeaController.createChat);
router.delete('/api/chats/:id', authMiddleware, IdeaController.deleteChat);
router.post('/api/stream', authMiddleware, IdeaController.streamMessage);

module.exports = router;