const express = require('express');
const router = express.Router();
const ProductPromotionController = require('../controllers/productPromotionController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, ProductPromotionController.showPromotionPage);
router.post('/upload-images', authMiddleware, ProductPromotionController.uploadImages);
router.post('/optimize', authMiddleware, ProductPromotionController.optimizePrompt);
router.post('/generate', authMiddleware, ProductPromotionController.generatePromotion);
router.get('/status/:requestId', authMiddleware, ProductPromotionController.checkStatus);
router.get('/history', authMiddleware, ProductPromotionController.getHistory);
router.get('/processing-status', authMiddleware, ProductPromotionController.getProcessingStatus);
module.exports = router;