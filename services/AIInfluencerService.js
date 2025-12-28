// services/AIInfluencerService.js
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class AIInfluencerService {
  constructor() {
    this.apiUrl = 'https://api.kie.ai/api/v1/jobs/createTask';
    this.apiKey = process.env.KIE_API_KEY || 'c1912a36b02a6508ddae00f41b0236cb';
    this.callbackUrl = process.env.CALLBACK_URL || 'https://plus.sijago.ai/api/ai-influencer/callback';
    
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

      const systemPrompt = `You are an expert AI image generation prompt optimizer. Your task is to transform user descriptions into highly detailed, professional prompts for AI image generation.

Guidelines:
1. Always start with "A hyper-realistic, close-up portrait"
2. Include all physical details: gender, age, face type, hair model, skin color, ethnicity/race
3. Add professional photography details: lighting, camera, lens, film aesthetic
4. Make it cinematic and professional
5. Keep it concise but detailed (2-3 sentences max)
6. Focus on portrait photography style

Example:
Input: "wanita indonesia umur 25 tahun"
Output: "A hyper-realistic, close-up portrait of a 25-year-old Indonesian woman with warm brown skin, oval face shape, long straight black hair, and gentle almond-shaped eyes. Natural daylight from a window creates soft shadows. Shot on a Canon EOS R5 with an 85mm f/1.4 lens, capturing a Kodak Portra 400 film-grain aesthetic."`;

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

  // Generate AI Influencer image
  async generateImage(prompt) {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'z-image',
          callBackUrl: this.callbackUrl,
          input: {
            prompt: prompt,
            aspect_ratio: '1:1'
          }
        },
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
      console.error('Image generation error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
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

  // Download image from result URL
  async downloadImage(imageUrl, influencerId, name) {
    try {
      const response = await axios({
        method: 'get',
        url: imageUrl,
        responseType: 'arraybuffer'
      });

      const downloadDir = path.join(__dirname, '..', 'public', 'uploads', 'ai-influencers');
      
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      // Sanitize name for filename
      const sanitizedName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `sijagoai_${sanitizedName}_${influencerId}.jpg`;
      const filepath = path.join(downloadDir, filename);

      await fs.promises.writeFile(filepath, response.data);

      // Upload to ImgBB for public URL
      const imgbbResult = await this.uploadToImgBB(Buffer.from(response.data), filename);

      return {
        success: true,
        localPath: `/uploads/ai-influencers/${filename}`,
        publicUrl: imgbbResult.success ? imgbbResult.url : `/uploads/ai-influencers/${filename}`
      };
    } catch (error) {
      console.error('Download image error:', error.message);
      throw new Error(`Failed to download image: ${error.message}`);
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
    return 'AI Influencer sedang dibuat. Estimasi waktu: 1-2 menit. Anda dapat meninggalkan halaman ini, hasil akan tersimpan di history.';
  }
}

module.exports = AIInfluencerService;