const express = require('express');
const router = express.Router();
const VideoController = require('../controllers/videoController');
const { authMiddleware, apiAuthMiddleware } = require('../middleware/auth');

// Web routes
router.get('/', authMiddleware, VideoController.index);

// API routes
router.post('/api/render', authMiddleware, VideoController.renderVideo);
router.get('/api/status/:renderId', authMiddleware, VideoController.checkRenderStatus);

module.exports = router;