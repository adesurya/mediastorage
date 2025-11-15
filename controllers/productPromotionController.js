const ProductPromotion = require('../models/ProductPromotion');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const OpenAI = require('openai');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'promotions', 'source');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'source-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
}).array('images', 4); // Max 4 images

class ProductPromotionController {
  static async showPromotionPage(req, res) {
    try {
      const user = {
        id: req.session.userId,
        username: req.session.username,
        role: req.session.role
      };

      const history = await ProductPromotion.findByUserId(user.id);

      res.render('promotion', {
        user,
        currentPage: 'promotion',
        history
      });
    } catch (error) {
      console.error('Error showing promotion page:', error);
      res.status(500).send('Internal Server Error');
    }
  }

  static uploadImages(req, res) {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ 
          success: false, 
          message: err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 10MB)' : err.message 
        });
      } else if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'No images uploaded' });
      }

      if (req.files.length > 4) {
        return res.status(400).json({ success: false, message: 'Maximum 4 images allowed' });
      }

      const imageUrls = req.files.map(file => `/uploads/promotions/source/${file.filename}`);

      res.json({ success: true, imageUrls });
    });
  }

  static async optimizePrompt(req, res) {
    try {
      const { prompt } = req.body;

      if (!prompt) {
        return res.status(400).json({ success: false, message: 'Prompt is required' });
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "As a professional prompting AI using seedream model, your task is to create professional prompt and optimize for this content. Return only the optimized prompt in English, without any additional explanation."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 250
      });

      const optimizedPrompt = completion.choices[0].message.content.trim();

      res.json({ success: true, optimizedPrompt });
    } catch (error) {
      console.error('Error optimizing prompt:', error);
      res.status(500).json({ success: false, message: 'Failed to optimize prompt' });
    }
  }

  static async generatePromotion(req, res) {
    try {
      const { prompt, optimizedPrompt, imageUrls } = req.body;
      const userId = req.session.userId;

      if (!prompt) {
        return res.status(400).json({ success: false, message: 'Prompt is required' });
      }

      if (!imageUrls || imageUrls.length === 0) {
        return res.status(400).json({ success: false, message: 'At least one image is required' });
      }

      const finalPrompt = optimizedPrompt || prompt;

      // Upload images to a temporary public service (imgbb or similar)
      // Since localhost URLs won't work with Fal.AI, we need to upload to a public service
      const publicImageUrls = [];
      
      for (const localUrl of imageUrls) {
        try {
          // Read local file
          const localPath = path.join(__dirname, '..', 'public', localUrl);
          const imageBuffer = fs.readFileSync(localPath);
          const base64Image = imageBuffer.toString('base64');
          
          // Upload to imgbb (free image hosting)
          const formData = new URLSearchParams();
          formData.append('key', process.env.IMGBB_API_KEY || '');
          formData.append('image', base64Image);
          
          const uploadResponse = await axios.post('https://api.imgbb.com/1/upload', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          });
          
          if (uploadResponse.data.success) {
            publicImageUrls.push(uploadResponse.data.data.url);
          } else {
            // Fallback: try using base64 data URL
            const mimeType = localUrl.endsWith('.png') ? 'image/png' : 
                           localUrl.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
            publicImageUrls.push(`data:${mimeType};base64,${base64Image}`);
          }
        } catch (uploadError) {
          console.error('Error uploading to imgbb:', uploadError.message);
          // Fallback: use base64 data URL
          const localPath = path.join(__dirname, '..', 'public', localUrl);
          const imageBuffer = fs.readFileSync(localPath);
          const base64Image = imageBuffer.toString('base64');
          const mimeType = localUrl.endsWith('.png') ? 'image/png' : 
                         localUrl.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
          publicImageUrls.push(`data:${mimeType};base64,${base64Image}`);
        }
      }

      const response = await axios.post(
        'https://queue.fal.run/fal-ai/bytedance/seedream/v4/edit',
        { 
          prompt: finalPrompt,
          image_urls: publicImageUrls
        },
        {
          headers: {
            'Authorization': `Key ${process.env.FAL_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const requestId = response.data.request_id;
      
      const promotionId = await ProductPromotion.create(userId, prompt, finalPrompt, imageUrls, requestId);

      res.json({ 
        success: true, 
        requestId,
        promotionId
      });
    } catch (error) {
      console.error('Error generating promotion:', error);
      res.status(500).json({ 
        success: false, 
        message: error.response?.data?.detail || error.message || 'Failed to generate promotion' 
      });
    }
  }

  static async checkStatus(req, res) {
    try {
      const { requestId } = req.params;

      const response = await axios.get(
        `https://queue.fal.run/fal-ai/bytedance/requests/${requestId}/status`,
        {
          headers: {
            'Authorization': `Key ${process.env.FAL_KEY}`
          },
          timeout: 10000 // 10 second timeout
        }
      );

      const status = response.data.status;

      if (status === 'COMPLETED') {
        const resultResponse = await axios.get(
          `https://queue.fal.run/fal-ai/bytedance/requests/${requestId}`,
          {
            headers: {
              'Authorization': `Key ${process.env.FAL_KEY}`
            },
            timeout: 15000
          }
        );

        const imageUrl = resultResponse.data.images[0].url;
        
        const uploadsDir = path.join(__dirname, '..', 'public', 'uploads', 'promotions');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const imageResponse = await axios.get(imageUrl, { 
          responseType: 'arraybuffer',
          timeout: 30000 
        });
        const filename = `promo_${requestId}_${Date.now()}.png`;
        const filepath = path.join(uploadsDir, filename);
        
        fs.writeFileSync(filepath, imageResponse.data);

        const publicUrl = `/uploads/promotions/${filename}`;
        
        const promotion = await ProductPromotion.findByRequestId(requestId);
        if (promotion) {
          await ProductPromotion.updateStatus(promotion.id, 'completed', publicUrl);
        }

        res.json({ 
          success: true, 
          status: 'COMPLETED',
          imageUrl: publicUrl,
          promotionId: promotion?.id
        });
      } else if (status === 'FAILED') {
        const promotion = await ProductPromotion.findByRequestId(requestId);
        if (promotion) {
          await ProductPromotion.updateStatus(promotion.id, 'failed');
        }
        
        res.json({ 
          success: false, 
          status: 'FAILED',
          message: 'Gagal memproses permintaan Anda. Silahkan ulangi atau tunggu beberapa saat.'
        });
      } else {
        // IN_QUEUE or IN_PROGRESS
        res.json({ 
          success: true, 
          status: status 
        });
      }
    } catch (error) {
      console.error('Error checking status:', error);
      
      // Check if it's a timeout or network error
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        res.status(500).json({ 
          success: false, 
          status: 'TIMEOUT',
          message: 'Koneksi timeout. Silahkan coba lagi.'
        });
      } else if (error.response?.status === 404) {
        res.status(404).json({ 
          success: false, 
          status: 'NOT_FOUND',
          message: 'Request tidak ditemukan. Mungkin sudah kadaluarsa.'
        });
      } else {
        res.status(500).json({ 
          success: false, 
          status: 'ERROR',
          message: 'Gagal memproses permintaan Anda. Silahkan ulangi atau tunggu beberapa saat.'
        });
      }
    }
  }

  static async getHistory(req, res) {
    try {
      const userId = req.session.userId;
      const history = await ProductPromotion.findByUserId(userId);
      
      res.json({ success: true, history });
    } catch (error) {
      console.error('Error getting history:', error);
      res.status(500).json({ success: false, message: 'Failed to get history' });
    }
  }
}

module.exports = ProductPromotionController;