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

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: function (req, file, cb) {
    // Accept semua jenis file
    cb(null, true);
  }
});

// Web routes
router.get('/', authMiddleware, MediaController.index);
router.get('/dashboard', authMiddleware, MediaController.dashboard);

// API routes
router.get('/api', apiAuthMiddleware, MediaController.getAllMedia);
router.get('/api/:id', apiAuthMiddleware, MediaController.getMediaById);
router.post('/api/upload', authMiddleware, upload.single('file'), MediaController.uploadMedia);
router.delete('/api/:id', apiAuthMiddleware, MediaController.deleteMedia);
router.get('/api/download/:id', apiAuthMiddleware, MediaController.downloadMedia);

// Alternative routes
router.post('/upload', authMiddleware, upload.single('file'), MediaController.uploadMedia);
router.delete('/delete/:id', authMiddleware, MediaController.deleteMedia);

module.exports = router;