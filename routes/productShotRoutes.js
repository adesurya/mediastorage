const express = require('express');
const router = express.Router();
const ProductShotController = require('../controllers/productShotController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, ProductShotController.showProductShotPage);
router.post('/upload-images', authMiddleware, ProductShotController.uploadImages);
router.post('/optimize', authMiddleware, ProductShotController.optimizePrompt);
router.post('/generate', authMiddleware, ProductShotController.generateProductShot);
router.get('/status/:requestId', authMiddleware, ProductShotController.checkStatus);
router.get('/history', authMiddleware, ProductShotController.getHistory);
router.get('/processing-status', authMiddleware, ProductShotController.getProcessingStatus);
module.exports = router;