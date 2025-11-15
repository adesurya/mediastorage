const express = require('express');
const router = express.Router();
const VideoAIController = require('../controllers/videoAIController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, VideoAIController.showVideoAIPage);
router.post('/upload-image', authMiddleware, VideoAIController.uploadImage);
router.post('/optimize', authMiddleware, VideoAIController.optimizePrompt);
router.post('/generate', authMiddleware, VideoAIController.generateVideo);
router.get('/status/:requestId', authMiddleware, VideoAIController.checkStatus);
router.get('/history', authMiddleware, VideoAIController.getHistory);

module.exports = router;