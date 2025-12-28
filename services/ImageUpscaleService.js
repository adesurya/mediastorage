// services/ImageUpscaleService.js
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class ImageUpscaleService {
  constructor() {
    this.apiKey = process.env.KIE_AI_API_KEY;
    this.apiUrl = 'https://api.kie.ai/api/v1/jobs/createTask';
    this.callbackUrl = process.env.IMAGE_UPSCALE_CALLBACK_URL || 'https://plus.sijago.ai/api/image-upscale/callback';
    
    // Validation warnings
    if (!this.apiKey) {
      console.warn('⚠️ WARNING: KIE_AI_API_KEY not set in environment variables!');
    }
    if (this.callbackUrl.includes('your-domain.com')) {
      console.warn('⚠️ WARNING: IMAGE_UPSCALE_CALLBACK_URL is using default placeholder! Set proper callback URL in .env');
    }
  }

  // Process uploaded image
  async processUploadedImage(file, upscaleId) {
    try {
      const uploadsDir = path.join(__dirname, '..', 'public', 'uploads', 'image-upscale', upscaleId.toString());
      
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const filename = `original_${timestamp}${ext}`;
      const filepath = path.join(uploadsDir, filename);

      fs.writeFileSync(filepath, file.buffer);

      const relativePath = `/uploads/image-upscale/${upscaleId}/${filename}`;

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

  // Upscale image using kie.ai
  async upscaleImage(imageUrl) {
    try {
      const requestBody = {
        model: 'z-upscale',
        callBackUrl: this.callbackUrl,
        input: {
          image_url: imageUrl,
          scale: 4
        }
      };

      console.log('Sending upscale request to kie.ai:', JSON.stringify(requestBody, null, 2));

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
      console.error('Image upscale error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Download upscaled image from API
  async downloadUpscaledImage(imageUrl, upscaleId) {
    try {
      const response = await axios({
        method: 'get',
        url: imageUrl,
        responseType: 'arraybuffer'
      });

      const downloadDir = path.join(__dirname, '..', 'public', 'uploads', 'image-upscale', upscaleId.toString());
      
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      const filename = `upscaled_${Date.now()}.jpg`;
      const filepath = path.join(downloadDir, filename);

      await fs.promises.writeFile(filepath, response.data);

      const localPath = `/uploads/image-upscale/${upscaleId}/${filename}`;

      return {
        success: true,
        localPath: localPath,
        publicUrl: localPath  // ✅ FIXED: Use local path instead of ImgBB URL
      };
    } catch (error) {
      console.error('Download upscaled image error:', error.message);
      throw new Error(`Failed to download upscaled image: ${error.message}`);
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
    return 'Image Upscale sedang diproses. Estimasi waktu: 30-60 detik. Anda dapat meninggalkan halaman ini, hasil akan tersimpan di history.';
  }
}

module.exports = ImageUpscaleService;