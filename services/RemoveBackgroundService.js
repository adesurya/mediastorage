// services/RemoveBackgroundService.js
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class RemoveBackgroundService {
  constructor() {
    this.apiKey = process.env.KIE_AI_API_KEY;
    this.apiUrl = 'https://api.kie.ai/api/v1/jobs/createTask';
    this.imgbbApiKey = process.env.IMGBB_API_KEY;
    this.imgbbUrl = 'https://api.imgbb.com/1/upload';
    this.callbackUrl = process.env.REMOVE_BG_CALLBACK_URL || 'https://your-domain.com/api/remove-background/callback';
    
    // Validation warnings
    if (!this.apiKey) {
      console.warn('⚠️ WARNING: KIE_AI_API_KEY not set in environment variables!');
    }
    if (!this.imgbbApiKey) {
      console.warn('⚠️ WARNING: IMGBB_API_KEY not set in environment variables!');
    }
    if (this.callbackUrl.includes('your-domain.com')) {
      console.warn('⚠️ WARNING: REMOVE_BG_CALLBACK_URL is using default placeholder! Set proper callback URL in .env');
    }
  }

  // Process uploaded image
  async processUploadedImage(file, backgroundId) {
    try {
      const uploadsDir = path.join(__dirname, '..', 'public', 'uploads', 'remove-background', backgroundId.toString());
      
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const filename = `original_${timestamp}${ext}`;
      const filepath = path.join(uploadsDir, filename);

      fs.writeFileSync(filepath, file.buffer);

      // Upload to IMGBB
      const imgbbResult = await this.uploadToImgBB(file.buffer, filename);

      return {
        success: true,
        localPath: `/uploads/remove-background/${backgroundId}/${filename}`,
        publicUrl: imgbbResult.success ? imgbbResult.url : `/uploads/remove-background/${backgroundId}/${filename}`
      };
    } catch (error) {
      console.error('Process uploaded image error:', error.message);
      throw new Error(`Failed to process uploaded image: ${error.message}`);
    }
  }

  // Upload image to IMGBB
  async uploadToImgBB(imageBuffer, filename) {
    try {
      const base64Image = imageBuffer.toString('base64');

      const formData = new FormData();
      formData.append('key', this.imgbbApiKey);
      formData.append('image', base64Image);
      formData.append('name', filename);

      const response = await axios.post(
        this.imgbbUrl,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 30000
        }
      );

      if (response.data.success) {
        return {
          success: true,
          url: response.data.data.url,
          deleteUrl: response.data.data.delete_url
        };
      } else {
        throw new Error('IMGBB upload failed');
      }
    } catch (error) {
      console.error('IMGBB upload error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate remove background with kie.ai
  async generateRemoveBackground(imageUrl) {
    try {
      const requestBody = {
        model: 'recraft/remove-background',
        callBackUrl: this.callbackUrl,
        input: {
          image: imageUrl
        }
      };

      console.log('Sending remove background request to kie.ai:', JSON.stringify(requestBody, null, 2));

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

      console.log('Kie.ai remove background response:', JSON.stringify(response.data, null, 2));

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
      console.error('Remove background generation error:');
      console.error('- Error message:', error.message);
      console.error('- Response status:', error.response?.status);
      console.error('- Response data:', JSON.stringify(error.response?.data, null, 2));
      
      let errorMessage = 'Unknown API error';
      
      if (error.response) {
        errorMessage = error.response.data?.msg || 
                       error.response.data?.message || 
                       `API Error: ${error.response.status} - ${error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'No response from API server - check network/API key';
      } else {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Download result image from API
  async downloadResultImage(imageUrl, backgroundId) {
    try {
      const response = await axios({
        method: 'get',
        url: imageUrl,
        responseType: 'arraybuffer'
      });

      const downloadDir = path.join(__dirname, '..', 'public', 'uploads', 'remove-background', backgroundId.toString());
      
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      const timestamp = Date.now();
      const filename = `sijagoai_nobg_${timestamp}.png`;
      const filepath = path.join(downloadDir, filename);

      await fs.promises.writeFile(filepath, response.data);

      // Upload to ImgBB for public URL
      const imgbbResult = await this.uploadToImgBB(Buffer.from(response.data), filename);

      return {
        success: true,
        localPath: `/uploads/remove-background/${backgroundId}/${filename}`,
        publicUrl: imgbbResult.success ? imgbbResult.url : `/uploads/remove-background/${backgroundId}/${filename}`
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
    return 'Remove Background sedang diproses. Estimasi waktu: 1-2 menit. Anda dapat meninggalkan halaman ini, hasil akan tersimpan di history.';
  }
}

module.exports = RemoveBackgroundService;