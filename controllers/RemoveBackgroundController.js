// controllers/RemoveBackgroundController.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const RemoveBackgroundModel = require('../models/RemoveBackgroundModel');
const RemoveBackgroundService = require('../services/RemoveBackgroundService');

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

class RemoveBackgroundController {
  constructor(db) {
    this.model = new RemoveBackgroundModel(db);
    this.service = new RemoveBackgroundService();
    this.uploadMiddleware = upload.single('image');
  }

  getUploadMiddleware() {
    return this.uploadMiddleware;
  }

  // Create new remove background request
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
      const backgroundId = await this.model.create(userId, '', '');

      // Process uploaded image
      const imageResult = await this.service.processUploadedImage(req.file, backgroundId);

      // Update record with image URLs
      await this.model.db.query(
        `UPDATE remove_backgrounds 
         SET original_image_url = ?, local_image_path = ?, updated_at = NOW() 
         WHERE id = ?`,
        [imageResult.publicUrl, imageResult.localPath, backgroundId]
      );

      // Start generation process (async)
      this.startGeneration(backgroundId, imageResult.publicUrl).catch(err => {
        console.error('Generation error:', err);
      });

      res.json({
        success: true,
        message: this.service.getEstimatedTimeMessage(),
        data: {
          backgroundId: backgroundId,
          status: 'pending'
        }
      });

    } catch (error) {
      console.error('Create remove background error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Start generation process (async)
  async startGeneration(backgroundId, imageUrl) {
    try {
      // Update status to generating
      await this.model.updateStatus(backgroundId, 'generating');

      // Call API to generate remove background
      const result = await this.service.generateRemoveBackground(imageUrl);

      if (result.success) {
        // Update task ID
        await this.model.updateTaskId(backgroundId, result.taskId);
        console.log(`✅ Remove background generation started for background ${backgroundId}, taskId: ${result.taskId}`);
      } else {
        // Update as failed
        const errorMsg = result.error || 'Unknown API error';
        await this.model.updateFailedById(backgroundId, errorMsg);
        console.error(`❌ Remove background generation failed for background ${backgroundId}:`, errorMsg);
      }
    } catch (error) {
      console.error('Start generation error:', error);
      const errorMsg = error.message || 'Unknown error';
      await this.model.updateFailedById(backgroundId, errorMsg);
    }
  }

  // Handle callback from API
  async handleCallback(req, res) {
    try {
      const callbackData = req.body;

      console.log('Received remove background callback:', JSON.stringify(callbackData, null, 2));

      const result = await this.service.handleCallback(callbackData);

      if (result.success) {
        // Download result image
        const background = await this.model.getByTaskId(result.taskId);

        if (!background) {
          console.error('Background not found for taskId:', result.taskId);
          return res.status(404).json({ success: false, message: 'Background not found' });
        }

        const downloadResult = await this.service.downloadResultImage(result.imageUrl, background.id);

        // Update as completed
        await this.model.updateCompleted(
          result.taskId,
          downloadResult.publicUrl,
          downloadResult.localPath,
          result.costTime
        );

        console.log(`✅ Remove background completed for background ${background.id}`);
      } else {
        // Update as failed
        await this.model.updateFailed(result.taskId, result.errorMessage);
        console.error(`❌ Remove background failed for taskId ${result.taskId}:`, result.errorMessage);
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

  // Get background by ID
  async getById(req, res) {
    try {
      const backgroundId = req.params.id;
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const background = await this.model.getById(backgroundId, userId);

      if (!background) {
        return res.status(404).json({
          success: false,
          message: 'Background not found'
        });
      }

      res.json({
        success: true,
        data: background
      });

    } catch (error) {
      console.error('Get background by ID error:', error);
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
      const backgrounds = await this.model.getUserHistory(userId, limit);

      res.json({
        success: true,
        data: backgrounds
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

module.exports = RemoveBackgroundController;