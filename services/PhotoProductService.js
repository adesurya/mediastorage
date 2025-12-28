// services/PhotoProductService.js
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class PhotoProductService {
  constructor() {
    this.apiUrl = 'https://api.kie.ai/api/v1/jobs/createTask';
    this.apiKey = process.env.KIE_API_KEY || 'c1912a36b02a6508ddae00f41b0236cb';
    this.callbackUrl = process.env.CALLBACK_URL || 'https://plus.sijago.ai/api/photo-product/callback';
    
    // OpenAI configuration
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    this.openaiUrl = 'https://api.openai.com/v1/chat/completions';
    
    // ImgBB configuration
    this.imgbbApiKey = process.env.IMGBB_API_KEY || '';
    this.imgbbUrl = 'https://api.imgbb.com/1/upload';
  }

  // Optimize prompt using OpenAI
  async optimizePrompt(originalPrompt) {
    try {
      if (!this.openaiApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const systemPrompt = `You are an expert photo editing and product photography prompt optimizer. Your task is to transform user descriptions into highly detailed, professional prompts for AI image editing and generation.

Guidelines:
1. Focus on product photography elements: composition, lighting, background, angles
2. Include specific details about hand positioning, product grip, and natural poses
3. Add professional photography terms: depth of field, focus, lighting setup
4. Specify background and aesthetic (clean, commercial, professional)
5. Mention camera angles and perspectives
6. Keep it concise but detailed (2-3 sentences max)
7. Optimize for product showcase and commercial photography

Example:
Input: "tangan pegang produk dengan background putih"
Output: "Close-up shot of hands holding product at eye level, fingers naturally gripping the item with relaxed posture. Soft studio lighting from 45-degree angle highlighting product features and creating gentle shadows. Shallow depth of field with product in sharp focus, crisp white studio background, bright and clean commercial aesthetic with professional color grading."`;

      const response = await axios.post(
        this.openaiUrl,
        {
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: originalPrompt }
          ],
          temperature: 0.7,
          max_tokens: 250
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
  async processUploadedImage(file, productId, imageNumber) {
    try {
      // Create directory if not exists
      const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'photo-products', productId.toString());
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Save locally
      const filename = `image${imageNumber}_${Date.now()}.jpg`;
      const localPath = path.join(uploadDir, filename);
      await fs.promises.writeFile(localPath, file.buffer);

      // Upload to ImgBB for public URL
      const imgbbResult = await this.uploadToImgBB(file.buffer, `${productId}_${filename}`);

      return {
        success: true,
        localPath: `/uploads/photo-products/${productId}/${filename}`,
        publicUrl: imgbbResult.success ? imgbbResult.url : `/uploads/photo-products/${productId}/${filename}`
      };
    } catch (error) {
      console.error('Process uploaded image error:', error.message);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  // Generate Photo Product with kie.ai
  async generatePhotoProduct(prompt, imageUrls) {
    try {
      const requestBody = {
        model: 'seedream/4.5-edit',
        callBackUrl: this.callbackUrl,
        input: {
          prompt: prompt,
          image_urls: imageUrls.filter(Boolean), // Remove null/undefined
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
      console.error('Photo product generation error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Download result image from API
  async downloadResultImage(imageUrl, productId, productName) {
    try {
      const response = await axios({
        method: 'get',
        url: imageUrl,
        responseType: 'arraybuffer'
      });

      const downloadDir = path.join(__dirname, '..', 'public', 'uploads', 'photo-products', productId.toString());
      
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      // Sanitize name for filename
      const sanitizedName = productName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `sijagoai_${sanitizedName}_result.jpg`;
      const filepath = path.join(downloadDir, filename);

      await fs.promises.writeFile(filepath, response.data);

      // Upload to ImgBB for public URL
      const imgbbResult = await this.uploadToImgBB(Buffer.from(response.data), filename);

      return {
        success: true,
        localPath: `/uploads/photo-products/${productId}/${filename}`,
        publicUrl: imgbbResult.success ? imgbbResult.url : `/uploads/photo-products/${productId}/${filename}`
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
    return 'Photo Product sedang diproses. Estimasi waktu: 1-2 menit. Anda dapat meninggalkan halaman ini, hasil akan tersimpan di history.';
  }
}

module.exports = PhotoProductService;