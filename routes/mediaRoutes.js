const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const MediaController = require('../controllers/mediaController');
const { authMiddleware, apiAuthMiddleware } = require('../middleware/auth');

// Konfigurasi multer untuk upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Multer configuration yang flexible - support single dan multiple
const uploadFlexible = multer({ 
  storage: storage,
  limits: { 
    fileSize: 100 * 1024 * 1024 // 100MB per file
  },
  fileFilter: function (req, file, cb) {
    cb(null, true);
  }
});

// Middleware wrapper untuk handle both single and multiple
const uploadMiddleware = (req, res, next) => {
  const upload = uploadFlexible.any();
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  });
};

// Web routes
router.get('/', authMiddleware, MediaController.index);
router.get('/dashboard', authMiddleware, MediaController.dashboard);

// API routes
router.get('/api', apiAuthMiddleware, MediaController.getAllMedia);
router.get('/api/:id', apiAuthMiddleware, MediaController.getMediaById);
router.post('/api/upload', authMiddleware, uploadMiddleware, MediaController.uploadFlexible);
router.delete('/api/:id', apiAuthMiddleware, MediaController.deleteMedia);
router.get('/api/download/:id', apiAuthMiddleware, MediaController.downloadMedia);
router.put('/api/:id/category', authMiddleware, MediaController.updateMediaCategory);

// Main upload route - support both single and multiple
router.post('/upload', authMiddleware, uploadMiddleware, MediaController.uploadFlexible);
router.delete('/delete/:id', authMiddleware, MediaController.deleteMedia);

module.exports = router;