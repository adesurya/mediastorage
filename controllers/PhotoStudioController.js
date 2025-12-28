// controllers/PhotoStudioController.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PhotoStudioModel = require('../models/PhotoStudioModel');
const PhotoStudioService = require('../services/PhotoStudioService');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

class PhotoStudioController {
  constructor(db) {
    this.model = new PhotoStudioModel(db);
    this.service = new PhotoStudioService();
    
    // Multer middleware for single product image
    this.uploadMiddleware = upload.single('product_image');
  }

  // Get upload middleware
  getUploadMiddleware() {
    return this.uploadMiddleware;
  }

  // Get available styles
  async getStyles(req, res) {
    try {
      const styles = this.service.getAvailableStyles();
      
      res.json({
        success: true,
        data: styles
      });
    } catch (error) {
      console.error('Get styles error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Create new Photo Studio
  async create(req, res) {
    try {
      const userId = req.session.userId;
      const { styleName, styleImagePath } = req.body;
      const file = req.file;

      if (!styleName || !styleImagePath) {
        return res.status(400).json({
          success: false,
          message: 'Style name dan style path harus diisi'
        });
      }

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'Product image harus diupload'
        });
      }

      // Create initial record
      const studioId = await this.model.create(
        userId,
        styleName,
        styleImagePath,
        'pending', // Temporary, will be updated
        'pending'  // Temporary, will be updated
      );

      // Process uploaded product image
      const productResult = await this.service.processUploadedImage(file, studioId, 1);

      // Update with actual image URLs
      await this.model.db.query(
        `UPDATE photo_studios 
         SET product_image_url = ?, local_product_path = ?
         WHERE id = ?`,
        [
          productResult.publicUrl,
          productResult.localPath,
          studioId
        ]
      );

      // Get style image buffer and upload to IMGBB
      const styleFullPath = path.join(__dirname, '..', 'public', styleImagePath);
      const styleImageBuffer = fs.readFileSync(styleFullPath);
      const styleImgbbResult = await this.service.uploadToImgBB(styleImageBuffer, `style_${studioId}.png`);

      const styleImageUrl = styleImgbbResult.success ? styleImgbbResult.url : `http://localhost:3000${styleImagePath}`;

      // Start generation process (async)
      this.startGeneration(studioId, styleImageUrl, productResult.publicUrl, styleName).catch(err => {
        console.error('Generation error:', err);
      });

      res.json({
        success: true,
        message: 'Photo Studio generation dimulai',
        data: {
          studioId,
          estimatedTime: this.service.getEstimatedTimeMessage()
        }
      });
    } catch (error) {
      console.error('Create photo studio error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Start generation process (async)
  async startGeneration(studioId, styleImageUrl, productImageUrl, styleName) {
    try {
      // Update status to generating
      await this.model.updateStatus(studioId, 'generating');

      // Call API to generate photo studio
      const result = await this.service.generatePhotoStudio(styleImageUrl, productImageUrl);

      if (result.success) {
        // Update task ID
        await this.model.updateTaskId(studioId, result.taskId);
        console.log(`✅ Generation started for studio ${studioId}, taskId: ${result.taskId}`);
      } else {
        // Update as failed
        const errorMsg = result.error || 'Unknown API error';
        await this.model.updateFailedById(studioId, errorMsg);
        console.error(`❌ Generation failed for studio ${studioId}:`, errorMsg);
      }
    } catch (error) {
      console.error('Start generation error:', error);
      const errorMsg = error.message || 'Unknown error';
      await this.model.updateFailedById(studioId, errorMsg);
    }
  }

  // Handle callback from API
  async handleCallback(req, res) {
    try {
      const callbackData = req.body;
      console.log('📥 Photo Studio Callback received:', JSON.stringify(callbackData, null, 2));

      const result = await this.service.handleCallback(callbackData);

      if (result.success) {
        // Get studio info
        const studio = await this.model.getByTaskId(result.taskId);
        if (!studio) {
          return res.status(404).json({
            success: false,
            message: 'Studio not found'
          });
        }

        // Download result image
        const imageResult = await this.service.downloadResultImage(
          result.imageUrl,
          studio.id,
          studio.style_name
        );

        // Update as completed
        await this.model.updateCompleted(
          result.taskId,
          imageResult.publicUrl,
          imageResult.localPath,
          result.costTime
        );

        console.log(`✅ Photo Studio ${studio.id} completed successfully`);
      } else {
        // Update as failed
        await this.model.updateFailed(result.taskId, result.errorMessage);
        console.error(`❌ Photo Studio generation failed:`, result.errorMessage);
      }

      res.json({ success: true, message: 'Callback processed' });
    } catch (error) {
      console.error('Callback error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get studio by ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.session.userId;

      const studio = await this.model.getById(id, userId);

      if (!studio) {
        return res.status(404).json({
          success: false,
          message: 'Photo Studio not found'
        });
      }

      res.json({ success: true, data: studio });
    } catch (error) {
      console.error('Get studio error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get user history
  async getHistory(req, res) {
    try {
      const userId = req.session.userId;
      const limit = parseInt(req.query.limit) || 20;

      const history = await this.model.getUserHistory(userId, limit);

      res.json({ success: true, data: history });
    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = PhotoStudioController;