// services/VideoGenerationService.js
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class VideoGenerationService {
  constructor() {
    this.apiUrl = 'https://api.kie.ai/api/v1/veo/generate';
    this.apiKey = 'c1912a36b02a6508ddae00f41b0236cb';
    this.callbackUrl = process.env.CALLBACK_URL || 'https://plus.sijago.ai/api/video-generation/callback';
    
    // ImgBB API for temporary image hosting (get free key at https://api.imgbb.com/)
    this.imgbbApiKey = process.env.IMGBB_API_KEY || '';
    this.imgbbUrl = 'https://api.imgbb.com/1/upload';
  }

  // Upload image to ImgBB and get public URL
  async uploadImageToImgBB(imageBuffer, filename) {
    try {
      const base64Image = imageBuffer.toString('base64');
      
      const formData = new FormData();
      formData.append('key', this.imgbbApiKey);
      formData.append('image', base64Image);
      formData.append('name', filename);

      const response = await axios.post(this.imgbbUrl, formData, {
        headers: formData.getHeaders()
      });

      if (response.data.success) {
        return response.data.data.url;
      } else {
        throw new Error('ImgBB upload failed');
      }
    } catch (error) {
      throw new Error(`Failed to upload image to ImgBB: ${error.message}`);
    }
  }

  // Alternative: Upload image to kie.ai File Upload API (if available)
  // Uncomment and use this if kie.ai provides file upload endpoint
  async uploadImageToKieAI(imageBuffer, filename) {
    try {
      const formData = new FormData();
      formData.append('file', imageBuffer, filename);

      const response = await axios.post(
        'https://api.kie.ai/api/v1/upload', // UPDATE THIS URL
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            ...formData.getHeaders()
          }
        }
      );

      // Return the URL from kie.ai response
      return response.data.data.url; // ADJUST based on actual response structure
    } catch (error) {
      throw new Error(`Failed to upload to kie.ai: ${error.message}`);
    }
  }

  // Generate video via API
  async generateVideo(prompt, imageUrls) {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          prompt,
          imageUrls,
          model: 'veo3_fast',
          callBackUrl: this.callbackUrl,
          aspectRatio: '9:16',
          enableFallback: false,
          enableTranslation: true,
          generationType: 'FIRST_AND_LAST_FRAMES_2_VIDEO'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        taskId: response.data.data.taskId,
        message: response.data.msg
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.msg || error.message,
        code: error.response?.status
      };
    }
  }

  // Upload image to local server and ImgBB (for public access)
  async uploadImage(file, userId) {
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'video-gen', String(userId));
    
    // Create directory if not exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${Date.now()}_${file.originalname}`;
    const filepath = path.join(uploadDir, filename);

    // Save file locally
    await fs.promises.writeFile(filepath, file.buffer);

    // Upload to ImgBB for public URL
    let publicUrl;
    try {
      publicUrl = await this.uploadImageToImgBB(file.buffer, filename);
      console.log('✅ Image uploaded to ImgBB:', publicUrl);
    } catch (error) {
      console.error('❌ ImgBB upload failed:', error.message);
      // Fallback: use ngrok or public URL if available
      const localUrl = `/uploads/video-gen/${userId}/${filename}`;
      publicUrl = `${process.env.BASE_URL || 'http://localhost:3000'}${localUrl}`;
      console.warn('⚠️ Using local URL (may not work):', publicUrl);
    }

    return {
      filepath,
      localUrl: `/uploads/video-gen/${userId}/${filename}`,
      publicUrl: publicUrl
    };
  }

  // Download video from API result to local server
  async downloadVideo(videoUrl, generationId, sceneNumber) {
    try {
      const response = await axios({
        method: 'get',
        url: videoUrl,
        responseType: 'stream'
      });

      const downloadDir = path.join(__dirname, '..', 'public', 'uploads', 'videos', String(generationId));
      
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      const filename = `sijagoai_${generationId}_scene${sceneNumber}.mp4`;
      const filepath = path.join(downloadDir, filename);

      const writer = fs.createWriteStream(filepath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          resolve({
            filepath,
            publicUrl: `/uploads/videos/${generationId}/${filename}`
          });
        });
        writer.on('error', reject);
      });
    } catch (error) {
      throw new Error(`Failed to download video: ${error.message}`);
    }
  }

  // Process callback from API
  async handleCallback(callbackData) {
    const { code, msg, data } = callbackData;
    const { taskId, info, fallbackFlag } = data;

    if (code === 200) {
      // Success
      return {
        success: true,
        taskId,
        videoUrl: info.resultUrls[0],
        originalUrl: info.originUrls?.[0],
        resolution: info.resolution,
        fallbackFlag: fallbackFlag || false
      };
    } else {
      // Failed
      return {
        success: false,
        taskId,
        errorMessage: msg,
        fallbackFlag: fallbackFlag || false
      };
    }
  }

  // Get estimated time message
  getEstimatedTimeMessage() {
    return 'Video sedang diproses. Estimasi waktu: 2-3 menit. Anda dapat meninggalkan halaman ini, hasil akan tersimpan di history.';
  }

  // Generate multiple scenes in parallel
  async generateMultipleScenes(scenes, model) {
    const promises = scenes.map(async (scene) => {
      try {
        // Prepare image URLs
        const imageUrls = [scene.image1_url];
        if (scene.image2_url) {
          imageUrls.push(scene.image2_url);
        }

        // Call API
        const result = await this.generateVideo(scene.prompt, imageUrls);
        
        if (result.success) {
          // Update scene with task ID
          await model.updateSceneTaskId(scene.id, result.taskId);
          return { sceneId: scene.id, success: true, taskId: result.taskId };
        } else {
          // Mark scene as failed
          await model.updateSceneFailed(scene.id, result.error);
          return { sceneId: scene.id, success: false, error: result.error };
        }
      } catch (error) {
        await model.updateSceneFailed(scene.id, error.message);
        return { sceneId: scene.id, success: false, error: error.message };
      }
    });

    return await Promise.allSettled(promises);
  }
}

module.exports = VideoGenerationService;