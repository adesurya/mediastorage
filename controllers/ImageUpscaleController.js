// controllers/ImageUpscaleController.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ImageUpscaleModel = require('../models/ImageUpscaleModel.js');
const ImageUpscaleService = require('../services/ImageUpscaleService');

// Multer configuration for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

class ImageUpscaleController {
  constructor(db) {
    this.model = new ImageUpscaleModel(db);
    this.service = new ImageUpscaleService();
    this.uploadMiddleware = upload.single('image');
  }

  getUploadMiddleware() {
    return this.uploadMiddleware;
  }

  // Create new upscale request
  async create(req, res) {
    try {
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file uploaded'
        });
      }

      // Create initial record
      const upscaleId = await this.model.create(userId, '', '');

      // Process uploaded image
      const imageResult = await this.service.processUploadedImage(req.file, upscaleId);

      // Update record with image URLs
      await this.model.db.query(
        `UPDATE image_upscales 
         SET original_image_url = ?, local_image_path = ?, updated_at = NOW() 
         WHERE id = ?`,
        [imageResult.publicUrl, imageResult.localPath, upscaleId]
      );

      // Start generation process (async)
      this.startGeneration(upscaleId, imageResult.publicUrl).catch(err => {
        console.error('Generation error:', err);
      });

      res.json({
        success: true,
        message: this.service.getEstimatedTimeMessage(),
        data: {
          upscaleId: upscaleId,
          status: 'pending'
        }
      });

    } catch (error) {
      console.error('Create upscale error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Start generation process (async)
  async startGeneration(upscaleId, imageUrl) {
    try {
      // Update status to generating
      await this.model.updateStatus(upscaleId, 'generating');

      // Call API to generate upscale
      const result = await this.service.generateUpscale(imageUrl);

      if (result.success) {
        // Update task ID
        await this.model.updateTaskId(upscaleId, result.taskId);
        console.log(`✅ Upscale generation started for upscale ${upscaleId}, taskId: ${result.taskId}`);
      } else {
        // Update as failed
        const errorMsg = result.error || 'Unknown API error';
        await this.model.updateFailedById(upscaleId, errorMsg);
        console.error(`❌ Upscale generation failed for upscale ${upscaleId}:`, errorMsg);
      }
    } catch (error) {
      console.error('Start generation error:', error);
      const errorMsg = error.message || 'Unknown error';
      await this.model.updateFailedById(upscaleId, errorMsg);
    }
  }

  // Handle callback from API
  async handleCallback(req, res) {
    try {
      const callbackData = req.body;

      console.log('Received upscale callback:', JSON.stringify(callbackData, null, 2));

      const result = await this.service.handleCallback(callbackData);

      if (result.success) {
        // Download result image
        const upscale = await this.model.getByTaskId(result.taskId);

        if (!upscale) {
          console.error('Upscale not found for taskId:', result.taskId);
          return res.status(404).json({ success: false, message: 'Upscale not found' });
        }

        const downloadResult = await this.service.downloadResultImage(result.imageUrl, upscale.id);

        // Update as completed
        await this.model.updateCompleted(
          result.taskId,
          downloadResult.publicUrl,
          downloadResult.localPath,
          result.costTime
        );

        console.log(`✅ Upscale completed for upscale ${upscale.id}`);
      } else {
        // Update as failed
        await this.model.updateFailed(result.taskId, result.errorMessage);
        console.error(`❌ Upscale failed for taskId ${result.taskId}:`, result.errorMessage);
      }

      res.json({ success: true, message: 'Callback processed' });

    } catch (error) {
      console.error('Handle callback error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get upscale by ID
  async getById(req, res) {
    try {
      const upscaleId = req.params.id;
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const upscale = await this.model.getById(upscaleId, userId);

      if (!upscale) {
        return res.status(404).json({
          success: false,
          message: 'Upscale not found'
        });
      }

      res.json({
        success: true,
        data: upscale
      });

    } catch (error) {
      console.error('Get upscale by ID error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get user history
  async getHistory(req, res) {
    try {
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const limit = parseInt(req.query.limit) || 20;
      const upscales = await this.model.getUserHistory(userId, limit);

      res.json({
        success: true,
        data: upscales
      });

    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = ImageUpscaleController;