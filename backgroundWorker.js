const axios = require('axios');
const fs = require('fs');
const path = require('path');

const Persona = require('./models/Persona');
const ProductPromotion = require('./models/ProductPromotion');
const VideoAI = require('./models/VideoAI');
const ProductShot = require('./models/ProductShot');

class BackgroundWorker {
  constructor() {
    this.isRunning = false;
    this.checkInterval = 10000; // Check every 10 seconds
  }

  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🔄 Background worker started');
    
    this.run();
  }

  async run() {
    if (!this.isRunning) return;

    try {
      await this.checkPersonas();
      await this.checkProductPromotions();
      await this.checkVideoAI();
      await this.checkProductShots();
    } catch (error) {
      console.error('❌ Background worker error:', error.message);
    }

    // Schedule next run
    setTimeout(() => this.run(), this.checkInterval);
  }

  async checkPersonas() {
    try {
      const { promisePool } = require('./config/database');
      const [personas] = await promisePool.query(
        'SELECT * FROM personas WHERE status = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)',
        ['processing']
      );

      for (const persona of personas) {
        await this.checkPersonaStatus(persona);
      }
    } catch (error) {
      console.error('Error checking personas:', error.message);
    }
  }

  async checkPersonaStatus(persona) {
    try {
      const statusResponse = await axios.get(
        `https://queue.fal.run/fal-ai/bytedance/requests/${persona.request_id}/status`,
        {
          headers: { 'Authorization': `Key ${process.env.FAL_KEY}` },
          timeout: 10000
        }
      );

      const status = statusResponse.data.status;

      if (status === 'COMPLETED') {
        const resultResponse = await axios.get(
          `https://queue.fal.run/fal-ai/bytedance/requests/${persona.request_id}`,
          {
            headers: { 'Authorization': `Key ${process.env.FAL_KEY}` },
            timeout: 15000
          }
        );

        const imageUrl = resultResponse.data.images[0].url;
        
        const uploadsDir = path.join(__dirname, 'public', 'uploads', 'personas');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const imageResponse = await axios.get(imageUrl, { 
          responseType: 'arraybuffer',
          timeout: 30000
        });
        const filename = `persona_${persona.request_id}_${Date.now()}.png`;
        const filepath = path.join(uploadsDir, filename);
        
        fs.writeFileSync(filepath, imageResponse.data);

        const publicUrl = `/uploads/personas/${filename}`;
        await Persona.updateStatus(persona.id, 'completed', publicUrl);
        
        console.log(`✅ Persona ${persona.id} completed`);
      } else if (status === 'FAILED') {
        await Persona.updateStatus(persona.id, 'failed');
        console.log(`❌ Persona ${persona.id} failed`);
      }
    } catch (error) {
      // Check if it's an HTTP error (4xx or 5xx)
      if (error.response) {
        const statusCode = error.response.status;
        
        // If 4xx or 5xx, mark as failed and stop checking
        if (statusCode >= 400) {
          await Persona.updateStatus(persona.id, 'failed');
          console.log(`❌ Persona ${persona.id} failed with HTTP ${statusCode} - Dropped from queue`);
          return; // Stop checking this request
        }
      }
      
      console.error(`Error checking persona ${persona.id}:`, error.message);
      
      // Mark as failed if too old (1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (new Date(persona.created_at) < oneHourAgo) {
        await Persona.updateStatus(persona.id, 'failed');
        console.log(`⏰ Persona ${persona.id} timed out - Dropped from queue`);
      }
    }
  }

  async checkProductPromotions() {
    try {
      const { promisePool } = require('./config/database');
      const [promotions] = await promisePool.query(
        'SELECT * FROM product_promotions WHERE status = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)',
        ['processing']
      );

      for (const promotion of promotions) {
        await this.checkPromotionStatus(promotion);
      }
    } catch (error) {
      console.error('Error checking promotions:', error.message);
    }
  }

  async checkPromotionStatus(promotion) {
    try {
      const statusResponse = await axios.get(
        `https://queue.fal.run/fal-ai/bytedance/requests/${promotion.request_id}/status`,
        {
          headers: { 'Authorization': `Key ${process.env.FAL_KEY}` },
          timeout: 10000
        }
      );

      const status = statusResponse.data.status;

      if (status === 'COMPLETED') {
        const resultResponse = await axios.get(
          `https://queue.fal.run/fal-ai/bytedance/requests/${promotion.request_id}`,
          {
            headers: { 'Authorization': `Key ${process.env.FAL_KEY}` },
            timeout: 15000
          }
        );

        const imageUrl = resultResponse.data.images[0].url;
        
        const uploadsDir = path.join(__dirname, 'public', 'uploads', 'promotions');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const imageResponse = await axios.get(imageUrl, { 
          responseType: 'arraybuffer',
          timeout: 30000 
        });
        const filename = `promo_${promotion.request_id}_${Date.now()}.png`;
        const filepath = path.join(uploadsDir, filename);
        
        fs.writeFileSync(filepath, imageResponse.data);

        const publicUrl = `/uploads/promotions/${filename}`;
        await ProductPromotion.updateStatus(promotion.id, 'completed', publicUrl);
        
        console.log(`✅ Promotion ${promotion.id} completed`);
      } else if (status === 'FAILED') {
        await ProductPromotion.updateStatus(promotion.id, 'failed');
        console.log(`❌ Promotion ${promotion.id} failed`);
      }
    } catch (error) {
      if (error.response) {
        const statusCode = error.response.status;
        if (statusCode >= 400) {
          await ProductPromotion.updateStatus(promotion.id, 'failed');
          console.log(`❌ Promotion ${promotion.id} failed with HTTP ${statusCode} - Dropped from queue`);
          return;
        }
      }
      
      console.error(`Error checking promotion ${promotion.id}:`, error.message);
      
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (new Date(promotion.created_at) < oneHourAgo) {
        await ProductPromotion.updateStatus(promotion.id, 'failed');
        console.log(`⏰ Promotion ${promotion.id} timed out - Dropped from queue`);
      }
    }
  }

  async checkVideoAI() {
    try {
      const { promisePool } = require('./config/database');
      const [videos] = await promisePool.query(
        'SELECT * FROM video_ai WHERE status = ? AND created_at > DATE_SUB(NOW(), INTERVAL 2 HOUR)',
        ['processing']
      );

      for (const video of videos) {
        await this.checkVideoStatus(video);
      }
    } catch (error) {
      console.error('Error checking videos:', error.message);
    }
  }

  async checkVideoStatus(video) {
    try {
      const statusResponse = await axios.get(
        `https://queue.fal.run/fal-ai/veo3/requests/${video.request_id}/status`,
        {
          headers: { 'Authorization': `Key ${process.env.FAL_KEY}` },
          timeout: 10000
        }
      );

      const status = statusResponse.data.status;

      if (status === 'COMPLETED') {
        const resultResponse = await axios.get(
          `https://queue.fal.run/fal-ai/veo3/requests/${video.request_id}`,
          {
            headers: { 'Authorization': `Key ${process.env.FAL_KEY}` },
            timeout: 15000
          }
        );

        const videoUrl = resultResponse.data.video.url;
        
        const uploadsDir = path.join(__dirname, 'public', 'uploads', 'videos');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const videoResponse = await axios.get(videoUrl, { 
          responseType: 'arraybuffer',
          timeout: 60000
        });
        const filename = `video_${video.request_id}_${Date.now()}.mp4`;
        const filepath = path.join(uploadsDir, filename);
        
        fs.writeFileSync(filepath, videoResponse.data);

        const publicUrl = `/uploads/videos/${filename}`;
        await VideoAI.updateStatus(video.id, 'completed', publicUrl);
        
        console.log(`✅ Video ${video.id} completed`);
      } else if (status === 'FAILED') {
        await VideoAI.updateStatus(video.id, 'failed');
        console.log(`❌ Video ${video.id} failed`);
      }
    } catch (error) {
      if (error.response) {
        const statusCode = error.response.status;
        if (statusCode >= 400) {
          await VideoAI.updateStatus(video.id, 'failed');
          console.log(`❌ Video ${video.id} failed with HTTP ${statusCode} - Dropped from queue`);
          return;
        }
      }
      
      console.error(`Error checking video ${video.id}:`, error.message);
      
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      if (new Date(video.created_at) < twoHoursAgo) {
        await VideoAI.updateStatus(video.id, 'failed');
        console.log(`⏰ Video ${video.id} timed out - Dropped from queue`);
      }
    }
  }

  async checkProductShots() {
    try {
      const { promisePool } = require('./config/database');
      const [shots] = await promisePool.query(
        'SELECT * FROM product_shots WHERE status = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)',
        ['processing']
      );

      for (const shot of shots) {
        await this.checkProductShotStatus(shot);
      }
    } catch (error) {
      console.error('Error checking product shots:', error.message);
    }
  }

  async checkProductShotStatus(shot) {
    try {
      const statusResponse = await axios.get(
        `https://queue.fal.run/fal-ai/bria/requests/${shot.request_id}/status`,
        {
          headers: { 'Authorization': `Key ${process.env.FAL_KEY}` },
          timeout: 10000
        }
      );

      const status = statusResponse.data.status;

      if (status === 'COMPLETED') {
        const resultResponse = await axios.get(
          `https://queue.fal.run/fal-ai/bria/requests/${shot.request_id}`,
          {
            headers: { 'Authorization': `Key ${process.env.FAL_KEY}` },
            timeout: 15000
          }
        );

        const imageUrl = resultResponse.data.images[0].url;
        
        const uploadsDir = path.join(__dirname, 'public', 'uploads', 'product-shots');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const imageResponse = await axios.get(imageUrl, { 
          responseType: 'arraybuffer',
          timeout: 30000 
        });
        const filename = `shot_${shot.request_id}_${Date.now()}.png`;
        const filepath = path.join(uploadsDir, filename);
        
        fs.writeFileSync(filepath, imageResponse.data);

        const publicUrl = `/uploads/product-shots/${filename}`;
        await ProductShot.updateStatus(shot.id, 'completed', publicUrl);
        
        console.log(`✅ Product Shot ${shot.id} completed`);
      } else if (status === 'FAILED') {
        await ProductShot.updateStatus(shot.id, 'failed');
        console.log(`❌ Product Shot ${shot.id} failed`);
      }
    } catch (error) {
      if (error.response) {
        const statusCode = error.response.status;
        if (statusCode >= 400) {
          await ProductShot.updateStatus(shot.id, 'failed');
          console.log(`❌ Product Shot ${shot.id} failed with HTTP ${statusCode} - Dropped from queue`);
          return;
        }
      }
      
      console.error(`Error checking product shot ${shot.id}:`, error.message);
      
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (new Date(shot.created_at) < oneHourAgo) {
        await ProductShot.updateStatus(shot.id, 'failed');
        console.log(`⏰ Product Shot ${shot.id} timed out - Dropped from queue`);
      }
    }
  }

  stop() {
    this.isRunning = false;
    console.log('🛑 Background worker stopped');
  }
}

// Singleton instance
const worker = new BackgroundWorker();

module.exports = worker;