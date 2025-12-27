// controllers/ProductIdeaController.js - FIXED VERSION
const ProductIdeaService = require('../services/ProductIdeaService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads/product-ideas');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files (JPEG, PNG, WEBP) are allowed'));
  }
});

class ProductIdeaController {
  constructor(pool) {
    this.service = new ProductIdeaService(pool);
    this.upload = upload.single('productImage');
  }

  generate = async (req, res) => {
    try {
      const userId = req.user?.id;
      const { productName, productDescription, productUrl } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!productName || !productDescription) {
        return res.status(400).json({
          success: false,
          message: 'Product name and description are required'
        });
      }

      // Handle image path (if uploaded via multer)
      let productImage = null;
      if (req.file) {
        productImage = '/uploads/product-ideas/' + req.file.filename;
      }

      const result = await this.service.startGeneration(userId, {
        productName,
        productDescription,
        productUrl,
        productImage
      });

      res.json({
        success: true,
        ideaId: result.ideaId,
        status: result.status,
        message: 'Generation started'
      });

    } catch (error) {
      console.error('Generate error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate idea'
      });
    }
  };

  // Upload image endpoint
  uploadImage = (req, res) => {
    this.upload(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      res.json({
        success: true,
        imageUrl: '/uploads/product-ideas/' + req.file.filename,
        message: 'Image uploaded successfully'
      });
    });
  };

  getStatus = async (req, res) => {
    try {
      const { ideaId } = req.params;

      const idea = await this.service.getStatus(ideaId);

      if (!idea) {
        return res.status(404).json({
          success: false,
          message: 'Idea not found'
        });
      }

      let highlightPoints = [];
      if (idea.highlight_points) {
        try {
          highlightPoints = JSON.parse(idea.highlight_points);
        } catch (e) {
          highlightPoints = [];
        }
      }

      res.json({
        success: true,
        data: {
          id: idea.id,
          status: idea.status,
          productName: idea.product_name,
          productDescription: idea.product_description,
          productUrl: idea.product_url,
          productImage: idea.product_image,
          ideKonten: idea.ide_konten,
          highlightPoints: highlightPoints,
          hook: idea.hook,
          value: idea.value,
          cta: idea.cta,
          errorMessage: idea.error_message,
          createdAt: idea.created_at
        }
      });

    } catch (error) {
      console.error('Get status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get status'
      });
    }
  };

  streamResult = async (req, res) => {
    try {
      const { ideaId } = req.params;

      const idea = await this.service.getStatus(ideaId);

      if (!idea) {
        return res.status(404).json({
          success: false,
          message: 'Idea not found'
        });
      }

      if (idea.status === 'completed') {
        let highlightPoints = [];
        try {
          highlightPoints = JSON.parse(idea.highlight_points);
        } catch (e) {
          highlightPoints = [];
        }

        return res.json({
          success: true,
          data: {
            status: idea.status,
            ideKonten: idea.ide_konten,
            highlightPoints: highlightPoints,
            hook: idea.hook,
            value: idea.value,
            cta: idea.cta
          }
        });
      }

      if (idea.status !== 'processing') {
        return res.json({
          success: false,
          data: {
            status: idea.status,
            errorMessage: idea.error_message
          }
        });
      }

      // Set headers for SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let fullContent = '';
      const formData = {
        productName: idea.product_name,
        productDescription: idea.product_description,
        productUrl: idea.product_url,
        productImage: idea.product_image
      };

      const prompt = this.service.buildPrompt(formData);

      try {
        for await (const chunk of this.service.generateIdeaStream(prompt)) {
          fullContent += chunk;
          res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
        }

        // Parse and save
        const parsedIdea = this.service.parseGeneratedContent(fullContent);
        await this.service.model.updateIdea(ideaId, parsedIdea);

        res.write(`data: ${JSON.stringify({ 
          chunk: '', 
          done: true, 
          fullContent,
          parsed: parsedIdea 
        })}\n\n`);
        res.end();
      } catch (streamError) {
        console.error('Stream error:', streamError);
        res.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`);
        res.end();
      }

    } catch (error) {
      console.error('Stream result error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to stream result'
      });
    }
  };

  getHistory = async (req, res) => {
    try {
      const userId = req.user?.id;
      const limit = parseInt(req.query.limit) || 20;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const history = await this.service.getUserHistory(userId, limit);

      res.json({
        success: true,
        data: history
      });

    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get history'
      });
    }
  };
}

module.exports = ProductIdeaController;