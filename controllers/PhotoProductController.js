// controllers/PhotoProductController.js
const multer = require('multer');
const PhotoProductModel = require('../models/PhotoProductModel');
const PhotoProductService = require('../services/PhotoProductService');

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

class PhotoProductController {
  constructor(db) {
    this.model = new PhotoProductModel(db);
    this.service = new PhotoProductService();
    
    // Multer middleware for 2 images
    this.uploadMiddleware = upload.fields([
      { name: 'image1', maxCount: 1 },
      { name: 'image2', maxCount: 1 }
    ]);
  }

  // Get upload middleware
  getUploadMiddleware() {
    return this.uploadMiddleware;
  }

  // Optimize prompt with OpenAI
  async optimizePrompt(req, res) {
    try {
      const { prompt } = req.body;

      if (!prompt || prompt.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Prompt tidak boleh kosong'
        });
      }

      const result = await this.service.optimizePrompt(prompt);

      if (result.success) {
        res.json({
          success: true,
          optimizedPrompt: result.optimizedPrompt
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Optimize prompt error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Create new Photo Product
  async create(req, res) {
    try {
      const userId = req.session.userId;
      const { productName, prompt } = req.body;
      const files = req.files;

      if (!productName || !prompt) {
        return res.status(400).json({
          success: false,
          message: 'Product name dan prompt harus diisi'
        });
      }

      if (!files || !files.image1 || files.image1.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Minimal 1 gambar harus diupload'
        });
      }

      // Create initial record
      const productId = await this.model.create(
        userId,
        productName,
        prompt,
        'pending', // Temporary, will be updated
        files.image2 ? 'pending' : null
      );

      // Process uploaded images
      const image1Result = await this.service.processUploadedImage(files.image1[0], productId, 1);
      let image2Result = null;

      if (files.image2 && files.image2.length > 0) {
        image2Result = await this.service.processUploadedImage(files.image2[0], productId, 2);
      }

      // Update with actual image URLs
      await this.model.db.query(
        `UPDATE photo_products 
         SET image1_url = ?, image2_url = ?, local_image1_path = ?, local_image2_path = ?
         WHERE id = ?`,
        [
          image1Result.publicUrl,
          image2Result ? image2Result.publicUrl : null,
          image1Result.localPath,
          image2Result ? image2Result.localPath : null,
          productId
        ]
      );

      // Start generation process (async)
      this.startGeneration(productId, prompt, [
        image1Result.publicUrl,
        image2Result ? image2Result.publicUrl : null
      ]).catch(err => {
        console.error('Generation error:', err);
      });

      res.json({
        success: true,
        message: 'Photo Product generation dimulai',
        data: {
          productId,
          estimatedTime: this.service.getEstimatedTimeMessage()
        }
      });
    } catch (error) {
      console.error('Create photo product error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Start generation process (async)
  async startGeneration(productId, prompt, imageUrls) {
    try {
      // Update status to generating
      await this.model.updateStatus(productId, 'generating');

      // Call API to generate photo product
      const result = await this.service.generatePhotoProduct(prompt, imageUrls);

      if (result.success) {
        // Update task ID
        await this.model.updateTaskId(productId, result.taskId);
        console.log(`✅ Generation started for product ${productId}, taskId: ${result.taskId}`);
      } else {
        // Update as failed
        await this.model.updateFailed(productId, result.error);
        console.error(`❌ Generation failed for product ${productId}:`, result.error);
      }
    } catch (error) {
      console.error('Start generation error:', error);
      await this.model.updateFailed(productId, error.message);
    }
  }

  // Handle callback from API
  async handleCallback(req, res) {
    try {
      const callbackData = req.body;
      console.log('📥 Callback received:', JSON.stringify(callbackData, null, 2));

      const result = await this.service.handleCallback(callbackData);

      if (result.success) {
        // Get product info
        const product = await this.model.getByTaskId(result.taskId);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: 'Product not found'
          });
        }

        // Download result image
        const imageResult = await this.service.downloadResultImage(
          result.imageUrl,
          product.id,
          product.product_name
        );

        // Update as completed
        await this.model.updateCompleted(
          result.taskId,
          imageResult.publicUrl,
          imageResult.localPath,
          result.costTime
        );

        console.log(`✅ Photo Product ${product.id} completed successfully`);
      } else {
        // Update as failed
        await this.model.updateFailed(result.taskId, result.errorMessage);
        console.error(`❌ Photo Product generation failed:`, result.errorMessage);
      }

      res.json({ success: true, message: 'Callback processed' });
    } catch (error) {
      console.error('Callback error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get product by ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.session.userId;

      const product = await this.model.getById(id, userId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Photo Product not found'
        });
      }

      res.json({ success: true, data: product });
    } catch (error) {
      console.error('Get product error:', error);
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

  // Delete product
  async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.session.userId;

      const deleted = await this.model.delete(id, userId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Photo Product not found'
        });
      }

      res.json({ success: true, message: 'Photo Product deleted' });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = PhotoProductController;