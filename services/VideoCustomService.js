// services/VideoCustomService.js
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class VideoCustomService {
  constructor() {
    this.kieApiKey = process.env.KIE_API_KEY;
    this.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    this.syncApiKey = process.env.SYNC_API_KEY;
    this.callbackUrl = process.env.CALLBACK_BASE_URL;
  }

  // ✅ BARU: Simpan image ke local dan return public URL
  async saveImageToLocal(imagePath, generationId) {
    try {
      const ext = path.extname(imagePath);
      const filename = `image_${generationId}_${Date.now()}${ext}`;
      const imageDir = path.join('uploads/video-custom/images');
      const localPath = path.join(imageDir, filename);

      // Create directory if not exists
      await fs.promises.mkdir(imageDir, { recursive: true });

      // Copy image file
      await fs.promises.copyFile(imagePath, localPath);

      // Generate public URL (served via Express static + ngrok)
      const publicUrl = `${this.callbackUrl}/uploads/video-custom/images/${filename}`;

      return { localPath, publicUrl };
    } catch (error) {
      console.error('Save image error:', error);
      throw error;
    }
  }

  async generateVideo(imageUrl, prompt) {
    try {
      const response = await axios.post(
        'https://api.kie.ai/api/v1/jobs/createTask',
        {
          model: 'bytedance/v1-pro-fast-image-to-video',
          callBackUrl: `${this.callbackUrl}/api/video-custom/webhook/video`,
          input: {
            prompt: prompt,
            image_url: imageUrl,
            resolution: '720p',
            duration: '5'
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.kieApiKey}`
          }
        }
      );

      if (response.data.code === 200) {
        return response.data.data.taskId;
      }

      throw new Error(response.data.message || 'Failed to generate video');
    } catch (error) {
      console.error('Video generation error:', error.response?.data || error.message);
      throw error;
    }
  }

  async generateAudio(text, voiceId) {
    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text: text,
          model_id: 'eleven_multilingual_v2',
          language_code: 'id'
        },
        {
          headers: {
            'xi-api-key': this.elevenLabsApiKey,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );

      return response.data;
    } catch (error) {
      console.error('Audio generation error:', error.response?.data || error.message);
      throw error;
    }
  }

  async saveAudioToLocal(audioBuffer, generationId) {
    try {
      const filename = `audio_${generationId}_${Date.now()}.mp3`;
      const audioDir = path.join('uploads/video-custom/audio');
      const localPath = path.join(audioDir, filename);

      await fs.promises.mkdir(audioDir, { recursive: true });
      await fs.promises.writeFile(localPath, audioBuffer);

      // Generate public URL (served via Express static + ngrok)
      const publicUrl = `${this.callbackUrl}/uploads/video-custom/audio/${filename}`;

      return { localPath, publicUrl };
    } catch (error) {
      console.error('Save audio error:', error);
      throw error;
    }
  }

  async syncVideoAudio(videoUrl, audioUrl) {
    try {
      const response = await axios.post(
        'https://api.sync.so/v2/generate',
        {
          model: 'lipsync-2',
          input: [
            {
              type: 'video',
              url: videoUrl
            },
            {
              type: 'audio',
              url: audioUrl
            }
          ],
          options: {
            sync_mode: 'loop'
          },
          webhookUrl: `${this.callbackUrl}/api/video-custom/webhook/sync`
        },
        {
          headers: {
            'x-api-key': this.syncApiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.id) {
        return response.data.id;
      }

      throw new Error('Failed to sync video and audio');
    } catch (error) {
      console.error('Sync error:', error.response?.data || error.message);
      throw error;
    }
  }

  async downloadFile(url, outputPath) {
    try {
      const response = await axios.get(url, {
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }
}

module.exports = VideoCustomService;