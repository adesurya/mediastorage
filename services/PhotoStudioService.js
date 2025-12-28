// services/PhotoStudioService.js
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class PhotoStudioService {
  constructor() {
    this.apiKey = process.env.KIE_AI_API_KEY || 'c1912a36b02a6508ddae00f41b0236cb';
    this.apiUrl = 'https://api.kie.ai/api/v1/jobs/createTask';
    this.imgbbApiKey = process.env.IMGBB_API_KEY || 'c592632c8a32fd52fcba6e3c75332a28';
    this.imgbbUrl = 'https://api.imgbb.com/1/upload';
    this.callbackUrl = process.env.PHOTO_STUDIO_CALLBACK_URL || 'https:/plus.sijago.ai/api/photo-studio/callback';
    
    // Validation warnings
    if (!this.apiKey) {
      console.warn('⚠️ WARNING: KIE_AI_API_KEY not set in environment variables!');
    }
    if (!this.imgbbApiKey) {
      console.warn('⚠️ WARNING: IMGBB_API_KEY not set in environment variables!');
    }
    if (this.callbackUrl.includes('your-domain.com')) {
      console.warn('⚠️ WARNING: PHOTO_STUDIO_CALLBACK_URL is using default placeholder! Set proper callback URL in .env');
    }
    
    // Fixed prompt as per requirement
    this.fixedPrompt = "Replace the existing product in the background image with the new product from the second image. Seamlessly integrate the new product into the scene with perfect lighting match, realistic shadows, accurate reflections on the surface, natural color grading that matches the background ambiance, professional product placement with proper perspective and scale, remove any existing product completely, maintain the original background aesthetic and mood, ensure photorealistic result with studio-quality finishing, 8k resolution, professional product photography, commercial advertising style";
  }

  // Get available styles from directory
  getAvailableStyles() {
    const stylesDir = path.join(__dirname, '..', 'public', 'styles', 'photo-studio');
    
    if (!fs.existsSync(stylesDir)) {
      fs.mkdirSync(stylesDir, { recursive: true });
      return [];
    }

    try {
      const files = fs.readdirSync(stylesDir);
      const styles = files
        .filter(file => file.endsWith('.png'))
        .map(file => {
          const name = path.basename(file, '.png');
          return {
            name: name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            filename: file,
            path: `/styles/photo-studio/${file}`,
            value: name
          };
        });

      return styles;
    } catch (error) {
      console.error('Error reading styles directory:', error);
      return [];
    }
  }

  // Upload image to ImgBB
  async uploadToImgBB(imageBuffer, filename) {
    try {
      if (!this.imgbbApiKey) {
        throw new Error('ImgBB API key not configured');
      }

      const base64Image = imageBuffer.toString('base64');
      
      const formData = new FormData();
      formData.append('key', this.imgbbApiKey);
      formData.append('image', base64Image);
      formData.append('name', filename);

      const response = await axios.post(this.imgbbUrl, formData, {
        headers: formData.getHeaders()
      });

      if (response.data.success) {
        return {
          success: true,
          url: response.data.data.url
        };
      } else {
        throw new Error('ImgBB upload failed');
      }
    } catch (error) {
      console.error('ImgBB upload error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Save uploaded image locally and upload to ImgBB
  async processUploadedImage(file, studioId, imageNumber) {
    try {
      // Create directory if not exists
      const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'photo-studio', studioId.toString());
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Save locally
      const filename = `image${imageNumber}_${Date.now()}.jpg`;
      const localPath = path.join(uploadDir, filename);
      await fs.promises.writeFile(localPath, file.buffer);

      // Upload to ImgBB for public URL
      const imgbbResult = await this.uploadToImgBB(file.buffer, `${studioId}_${filename}`);

      return {
        success: true,
        localPath: `/uploads/photo-studio/${studioId}/${filename}`,
        publicUrl: imgbbResult.success ? imgbbResult.url : `/uploads/photo-studio/${studioId}/${filename}`
      };
    } catch (error) {
      console.error('Process uploaded image error:', error.message);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  // Generate Photo Studio with kie.ai
  async generatePhotoStudio(styleImageUrl, productImageUrl) {
    try {
      const requestBody = {
        model: 'google/nano-banana-edit',
        callBackUrl: this.callbackUrl,
        input: {
          prompt: this.fixedPrompt,
          image_urls: [styleImageUrl, productImageUrl],
          output_format: 'png',
          image_size: '1:1'
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
          },
          timeout: 30000
        }
      );

      console.log('Kie.ai response:', JSON.stringify(response.data, null, 2));

      if (response.data.code === 200) {
        return {
          success: true,
          taskId: response.data.data.taskId,
          message: response.data.msg || response.data.message || 'Success'
        };
      } else {
        const errorMsg = response.data.msg || response.data.message || 'API returned non-200 code';
        console.error('API returned error:', response.data);
        return {
          success: false,
          error: errorMsg
        };
      }
    } catch (error) {
      // Detailed error logging
      console.error('Photo studio generation error:');
      console.error('- Error message:', error.message);
      console.error('- Response status:', error.response?.status);
      console.error('- Response data:', JSON.stringify(error.response?.data, null, 2));
      
      let errorMessage = 'Unknown API error';
      
      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.msg || 
                       error.response.data?.message || 
                       `API Error: ${error.response.status} - ${error.response.statusText}`;
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'No response from API server - check network/API key';
      } else {
        // Error in request setup
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Download result image from API
  async downloadResultImage(imageUrl, studioId, styleName) {
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

      // Sanitize name for filename
      const sanitizedName = styleName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `sijagoai_${sanitizedName}_result.png`;
      const filepath = path.join(downloadDir, filename);

      await fs.promises.writeFile(filepath, response.data);

      // Upload to ImgBB for public URL
      const imgbbResult = await this.uploadToImgBB(Buffer.from(response.data), filename);

      return {
        success: true,
        localPath: `/uploads/photo-studio/${studioId}/${filename}`,
        publicUrl: imgbbResult.success ? imgbbResult.url : `/uploads/photo-studio/${studioId}/${filename}`
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
      // Parse resultJson
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