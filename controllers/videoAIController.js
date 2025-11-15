const VideoAI = require('../models/VideoAI');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const OpenAI = require('openai');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'videos', 'source');
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
}).single('image');

class VideoAIController {
  static async showVideoAIPage(req, res) {
    try {
      const user = {
        id: req.session.userId,
        username: req.session.username,
        role: req.session.role
      };

      const history = await VideoAI.findByUserId(user.id);

      res.render('video-ai', {
        user,
        currentPage: 'video-ai',
        history
      });
    } catch (error) {
      console.error('Error showing video AI page:', error);
      res.status(500).send('Internal Server Error');
    }
  }

  static uploadImage(req, res) {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ 
          success: false, 
          message: err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 10MB)' : err.message 
        });
      } else if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image uploaded' });
      }

      const imageUrl = `/uploads/videos/source/${req.file.filename}`;

      res.json({ success: true, imageUrl });
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
            content: "As a professional prompting AI using veo3 model, your task is to create professional prompt including transition camera, realistic, natural and optimize for this content. Return only the optimized prompt in English, without any additional explanation. Specific for speech, using Bahasa."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      });

      const optimizedPrompt = completion.choices[0].message.content.trim();

      res.json({ success: true, optimizedPrompt });
    } catch (error) {
      console.error('Error optimizing prompt:', error);
      res.status(500).json({ success: false, message: 'Failed to optimize prompt' });
    }
  }

  static async generateVideo(req, res) {
    try {
      const { prompt, optimizedPrompt, imageUrl } = req.body;
      const userId = req.session.userId;

      if (!prompt) {
        return res.status(400).json({ success: false, message: 'Prompt is required' });
      }

      if (!imageUrl) {
        return res.status(400).json({ success: false, message: 'Image is required' });
      }

      const finalPrompt = optimizedPrompt || prompt;

      // Upload image to public service or use base64
      let publicImageUrl;
      
      try {
        const localPath = path.join(__dirname, '..', 'public', imageUrl);
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
          publicImageUrl = uploadResponse.data.data.url;
        } else {
          // Fallback to base64
          const mimeType = imageUrl.endsWith('.png') ? 'image/png' : 
                         imageUrl.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
          publicImageUrl = `data:${mimeType};base64,${base64Image}`;
        }
      } catch (uploadError) {
        console.error('Error uploading to imgbb:', uploadError.message);
        // Fallback to base64
        const localPath = path.join(__dirname, '..', 'public', imageUrl);
        const imageBuffer = fs.readFileSync(localPath);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = imageUrl.endsWith('.png') ? 'image/png' : 
                       imageUrl.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
        publicImageUrl = `data:${mimeType};base64,${base64Image}`;
      }

      const response = await axios.post(
        'https://queue.fal.run/fal-ai/veo3/fast/image-to-video',
        { 
          prompt: finalPrompt,
          image_url: publicImageUrl
        },
        {
          headers: {
            'Authorization': `Key ${process.env.FAL_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const requestId = response.data.request_id;
      
      const videoId = await VideoAI.create(userId, prompt, finalPrompt, imageUrl, requestId);

      res.json({ 
        success: true, 
        requestId,
        videoId
      });
    } catch (error) {
      console.error('Error generating video:', error);
      res.status(500).json({ 
        success: false, 
        message: error.response?.data?.detail || error.message || 'Failed to generate video' 
      });
    }
  }

  static async checkStatus(req, res) {
    try {
      const { requestId } = req.params;

      const response = await axios.get(
        `https://queue.fal.run/fal-ai/veo3/requests/${requestId}/status`,
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
          `https://queue.fal.run/fal-ai/veo3/requests/${requestId}`,
          {
            headers: {
              'Authorization': `Key ${process.env.FAL_KEY}`
            },
            timeout: 15000
          }
        );

        const videoUrl = resultResponse.data.video.url;
        
        const uploadsDir = path.join(__dirname, '..', 'public', 'uploads', 'videos');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Download video
        const videoResponse = await axios.get(videoUrl, { 
          responseType: 'arraybuffer',
          timeout: 60000 // 60s for video download
        });
        const filename = `video_${requestId}_${Date.now()}.mp4`;
        const filepath = path.join(uploadsDir, filename);
        
        fs.writeFileSync(filepath, videoResponse.data);

        const publicUrl = `/uploads/videos/${filename}`;
        
        const video = await VideoAI.findByRequestId(requestId);
        if (video) {
          await VideoAI.updateStatus(video.id, 'completed', publicUrl);
        }

        res.json({ 
          success: true, 
          status: 'COMPLETED',
          videoUrl: publicUrl,
          videoId: video?.id
        });
      } else if (status === 'FAILED') {
        const video = await VideoAI.findByRequestId(requestId);
        if (video) {
          await VideoAI.updateStatus(video.id, 'failed');
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
      const history = await VideoAI.findByUserId(userId);
      
      res.json({ success: true, history });
    } catch (error) {
      console.error('Error getting history:', error);
      res.status(500).json({ success: false, message: 'Failed to get history' });
    }
  }
}

module.exports = VideoAIController;