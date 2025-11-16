const ProductShot = require('../models/ProductShot');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const OpenAI = require('openai');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'product-shots', 'source');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const prefix = file.fieldname === 'productImage' ? 'product-' : 'ref-';
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
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
}).fields([
  { name: 'productImage', maxCount: 1 },
  { name: 'refImage', maxCount: 1 }
]);

class ProductShotController {
  static async showProductShotPage(req, res) {
    try {
      const user = {
        id: req.session.userId,
        username: req.session.username,
        role: req.session.role
      };

      const history = await ProductShot.findByUserId(user.id);

      res.render('product-shot', {
        user,
        currentPage: 'product-shot',
        history
      });
    } catch (error) {
      console.error('Error showing product shot page:', error);
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

      if (!req.files || !req.files.productImage) {
        return res.status(400).json({ success: false, message: 'Product image is required' });
      }

      const productImageUrl = `/uploads/product-shots/source/${req.files.productImage[0].filename}`;
      const refImageUrl = req.files.refImage ? `/uploads/product-shots/source/${req.files.refImage[0].filename}` : null;

      res.json({ success: true, productImageUrl, refImageUrl });
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
            content: "As a professional prompting AI for photo shoot product, your task is to create professional prompt realistic, natural and optimize for this content. Create your image proporsional resoultion and output. Return only the optimized prompt in English, without any additional explanation."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      });

      const optimizedPrompt = completion.choices[0].message.content.trim();

      res.json({ success: true, optimizedPrompt });
    } catch (error) {
      console.error('Error optimizing prompt:', error);
      res.status(500).json({ success: false, message: 'Failed to optimize prompt' });
    }
  }

  static async generateProductShot(req, res) {
    try {
      const { sceneDescription, optimizedDescription, productImageUrl, refImageUrl, placementType, manualPlacement } = req.body;
      const userId = req.session.userId;

      if (!sceneDescription) {
        return res.status(400).json({ success: false, message: 'Scene description is required' });
      }

      if (!productImageUrl) {
        return res.status(400).json({ success: false, message: 'Product image is required' });
      }

      const finalDescription = optimizedDescription || sceneDescription;

      // Upload images to public service or use base64
      const uploadImage = async (localUrl) => {
        try {
          const localPath = path.join(__dirname, '..', 'public', localUrl);
          const imageBuffer = fs.readFileSync(localPath);
          const base64Image = imageBuffer.toString('base64');
          
          // Try upload to imgbb
          const formData = new URLSearchParams();
          formData.append('key', process.env.IMGBB_API_KEY || '');
          formData.append('image', base64Image);
          
          const uploadResponse = await axios.post('https://api.imgbb.com/1/upload', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          });
          
          if (uploadResponse.data.success) {
            return uploadResponse.data.data.url;
          } else {
            // Fallback to base64
            const mimeType = localUrl.endsWith('.png') ? 'image/png' : 
                           localUrl.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
            return `data:${mimeType};base64,${base64Image}`;
          }
        } catch (uploadError) {
          console.error('Error uploading to imgbb:', uploadError.message);
          // Fallback to base64
          const localPath = path.join(__dirname, '..', 'public', localUrl);
          const imageBuffer = fs.readFileSync(localPath);
          const base64Image = imageBuffer.toString('base64');
          const mimeType = localUrl.endsWith('.png') ? 'image/png' : 
                         localUrl.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
          return `data:${mimeType};base64,${base64Image}`;
        }
      };

      const publicProductImageUrl = await uploadImage(productImageUrl);
      const publicRefImageUrl = refImageUrl ? await uploadImage(refImageUrl) : null;

      const requestBody = {
        image_url: publicProductImageUrl,
        scene_description: finalDescription,
        optimize_description: true,
        num_results: 1,
        fast: true,
        placement_type: placementType || 'manual_placement',
        shot_size: [1000, 1000],
        manual_placement_selection: manualPlacement || 'bottom_center'
      };

      if (publicRefImageUrl) {
        requestBody.ref_image_url = publicRefImageUrl;
      }

      const response = await axios.post(
        'https://queue.fal.run/fal-ai/bria/product-shot',
        requestBody,
        {
          headers: {
            'Authorization': `Key ${process.env.FAL_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const requestId = response.data.request_id;
      
      const shotId = await ProductShot.create(userId, sceneDescription, finalDescription, productImageUrl, refImageUrl, requestId);

      res.json({ 
        success: true, 
        requestId,
        shotId
      });
    } catch (error) {
      console.error('Error generating product shot:', error);
      res.status(500).json({ 
        success: false, 
        message: error.response?.data?.detail || error.message || 'Failed to generate product shot' 
      });
    }
  }

  static async getProcessingStatus(req, res) {
    try {
      const userId = req.session.userId;
      const { promisePool } = require('../config/database');
      const [processing] = await promisePool.query(
        'SELECT id, status, created_at FROM product_shots WHERE user_id = ? AND status = ? ORDER BY created_at DESC',
        [userId, 'processing']
      );
      res.json({ success: true, hasProcessing: processing.length > 0, processingCount: processing.length, items: processing });
    } catch (error) {
      console.error('Error getting processing status:', error);
      res.status(500).json({ success: false, message: 'Failed to get status' });
    }
  }

  static async checkStatus(req, res) {
    try {
      const { requestId } = req.params;

      const response = await axios.get(
        `https://queue.fal.run/fal-ai/bria/requests/${requestId}/status`,
        {
          headers: {
            'Authorization': `Key ${process.env.FAL_KEY}`
          },
          timeout: 10000
        }
      );

      const status = response.data.status;

      if (status === 'COMPLETED') {
        const resultResponse = await axios.get(
          `https://queue.fal.run/fal-ai/bria/requests/${requestId}`,
          {
            headers: {
              'Authorization': `Key ${process.env.FAL_KEY}`
            },
            timeout: 15000
          }
        );

        const imageUrl = resultResponse.data.images[0].url;
        
        const uploadsDir = path.join(__dirname, '..', 'public', 'uploads', 'product-shots');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const imageResponse = await axios.get(imageUrl, { 
          responseType: 'arraybuffer',
          timeout: 30000 
        });
        const filename = `shot_${requestId}_${Date.now()}.png`;
        const filepath = path.join(uploadsDir, filename);
        
        fs.writeFileSync(filepath, imageResponse.data);

        const publicUrl = `/uploads/product-shots/${filename}`;
        
        const shot = await ProductShot.findByRequestId(requestId);
        if (shot) {
          await ProductShot.updateStatus(shot.id, 'completed', publicUrl);
        }

        res.json({ 
          success: true, 
          status: 'COMPLETED',
          imageUrl: publicUrl,
          shotId: shot?.id
        });
      } else if (status === 'FAILED') {
        const shot = await ProductShot.findByRequestId(requestId);
        if (shot) {
          await ProductShot.updateStatus(shot.id, 'failed');
        }
        
        res.json({ 
          success: false, 
          status: 'FAILED',
          message: 'Gagal memproses permintaan Anda. Silahkan ulangi atau tunggu beberapa saat.'
        });
      } else {
        res.json({ 
          success: true, 
          status: status 
        });
      }
    } catch (error) {
      console.error('Error checking status:', error);
      
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
      const history = await ProductShot.findByUserId(userId);
      
      res.json({ success: true, history });
    } catch (error) {
      console.error('Error getting history:', error);
      res.status(500).json({ success: false, message: 'Failed to get history' });
    }
  }
}

module.exports = ProductShotController;