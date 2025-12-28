// services/PhotoStudioService.js
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class PhotoStudioService {
  constructor() {
    this.apiKey = process.env.KIE_AI_API_KEY;
    this.apiUrl = 'https://api.kie.ai/api/v1/jobs/createTask';
    this.callbackUrl = process.env.PHOTO_STUDIO_CALLBACK_URL || 'https://plus.sijago.ai/api/photo-studio/callback';
    
    // OpenAI configuration
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    this.openaiUrl = 'https://api.openai.com/v1/chat/completions';
    
    // Validation warnings
    if (!this.apiKey) {
      console.warn('⚠️ WARNING: KIE_AI_API_KEY not set in environment variables!');
    }
    if (this.callbackUrl.includes('your-domain.com')) {
      console.warn('⚠️ WARNING: PHOTO_STUDIO_CALLBACK_URL is using default placeholder! Set proper callback URL in .env');
    }
  }

  // Optimize prompt using OpenAI
  async optimizePrompt(originalPrompt) {
    try {
      if (!this.openaiApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const systemPrompt = `You are an expert AI photo studio prompt optimizer. Your task is to transform user descriptions into highly detailed, professional prompts for AI photo studio generation.

Guidelines:
1. Focus on studio photography and background details
2. Include lighting setup, background style, and atmosphere
3. Specify desired mood, color palette, and composition
4. Make it professional and studio-quality
5. Keep it concise but detailed (2-3 sentences max)

Example:
Input: "background modern dan pencahayaan studio"
Output: "Professional photography studio with minimalist modern background featuring clean white walls and subtle geometric elements, three-point lighting setup with key light, fill light, and rim light for dimensional depth, commercial portrait-grade atmosphere with controlled color temperature at 5500K."`;

      const response = await axios.post(
        this.openaiUrl,
        {
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: originalPrompt }
          ],
          temperature: 0.7,
          max_tokens: 200
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const optimizedPrompt = response.data.choices[0].message.content.trim();
      return {
        success: true,
        optimizedPrompt
      };
    } catch (error) {
      console.error('OpenAI optimization error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  // Save uploaded image locally
  async processUploadedImage(file, studioId, imageType) {
    try {
      const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'photo-studio', studioId.toString());
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filename = `${imageType}_${Date.now()}.jpg`;
      const localPath = path.join(uploadDir, filename);
      await fs.promises.writeFile(localPath, file.buffer);

      const relativePath = `/uploads/photo-studio/${studioId}/${filename}`;

      return {
        success: true,
        localPath: relativePath,
        publicUrl: relativePath  // ✅ FIXED: Use local path instead of ImgBB URL
      };
    } catch (error) {
      console.error('Process uploaded image error:', error.message);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  // Generate Photo Studio with kie.ai
  async generatePhotoStudio(prompt, faceImageUrl, styleImageUrl = null) {
    try {
      const imageUrls = [faceImageUrl];
      if (styleImageUrl) {
        imageUrls.push(styleImageUrl);
      }

      const requestBody = {
        model: 'seedream/4.5-edit',
        callBackUrl: this.callbackUrl,
        input: {
          prompt: prompt,
          image_urls: imageUrls,
          aspect_ratio: '1:1',
          quality: 'basic'
        }
      };

      console.log('Sending request to kie.ai:', JSON.stringify(requestBody, null, 2));

      const response = await axios.post(
        this.apiUrl,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.code === 200) {
        return {
          success: true,
          taskId: response.data.data.taskId,
          message: response.data.message
        };
      } else {
        return {
          success: false,
          error: response.data.message
        };
      }
    } catch (error) {
      console.error('Photo studio generation error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Download result image from API
  async downloadResultImage(imageUrl, studioId, sessionName) {
    try {
      const response = await axios({
        method: 'get',
        url: imageUrl,
        responseType: 'arraybuffer'
      });

      const downloadDir = path.join(__dirname, '..', 'public', 'uploads', 'photo-studio', studioId.toString());
      
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      const sanitizedName = sessionName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `sijagoai_${sanitizedName}_result.jpg`;
      const filepath = path.join(downloadDir, filename);

      await fs.promises.writeFile(filepath, response.data);

      const localPath = `/uploads/photo-studio/${studioId}/${filename}`;

      return {
        success: true,
        localPath: localPath,
        publicUrl: localPath  // ✅ FIXED: Use local path instead of ImgBB URL
      };
    } catch (error) {
      console.error('Download result image error:', error.message);
      throw new Error(`Failed to download result image: ${error.message}`);
    }
  }

  // Handle callback from API
  async handleCallback(callbackData) {
    const { code, data, msg } = callbackData;

    if (code === 200 && data.state === 'success') {
      const resultJson = JSON.parse(data.resultJson);
      
      return {
        success: true,
        taskId: data.taskId,
        imageUrl: resultJson.resultUrls[0],
        costTime: data.costTime
      };
    } else {
      return {
        success: false,
        taskId: data.taskId,
        errorMessage: data.failMsg || msg,
        failCode: data.failCode
      };
    }
  }

  // Get estimated time message
  getEstimatedTimeMessage() {
    return 'Photo Studio sedang diproses. Estimasi waktu: 1-2 menit. Anda dapat meninggalkan halaman ini, hasil akan tersimpan di history.';
  }
}

module.exports = PhotoStudioService;