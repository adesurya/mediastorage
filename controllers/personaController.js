const Persona = require('../models/Persona');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

class PersonaController {
  static async showPersonaPage(req, res) {
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      const user = {
        id: req.session.userId,
        username: req.session.username,
        role: req.session.role
      };

      const history = await Persona.findByUserId(user.id);

      res.render('persona', {
        user,
        currentPage: 'persona',
        history
      });
    } catch (error) {
      console.error('Error showing persona page:', error);
      res.status(500).send('Internal Server Error');
    }
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
            content: "As a professional AI Image Generator prompter, your task is to create professional prompts for creating persona images with specific details. Return only the optimized prompt in English, without any additional explanation."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      });

      const optimizedPrompt = completion.choices[0].message.content.trim();

      res.json({ success: true, optimizedPrompt });
    } catch (error) {
      console.error('Error optimizing prompt:', error);
      res.status(500).json({ success: false, message: 'Failed to optimize prompt' });
    }
  }

  static async generatePersona(req, res) {
    try {
      const { prompt, optimizedPrompt } = req.body;
      const userId = req.session.userId;

      if (!prompt) {
        return res.status(400).json({ success: false, message: 'Prompt is required' });
      }

      const finalPrompt = optimizedPrompt || prompt;

      const response = await axios.post(
        'https://queue.fal.run/fal-ai/bytedance/seedream/v4/text-to-image',
        { prompt: finalPrompt },
        {
          headers: {
            'Authorization': `Key ${process.env.FAL_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const requestId = response.data.request_id;
      
      const personaId = await Persona.create(userId, prompt, finalPrompt, requestId);

      res.json({ 
        success: true, 
        requestId,
        personaId
      });
    } catch (error) {
      console.error('Error generating persona:', error);
      res.status(500).json({ 
        success: false, 
        message: error.response?.data?.detail || 'Failed to generate persona' 
      });
    }
  }

  static async getProcessingStatus(req, res) {
    try {
      const userId = req.session.userId;
      const { promisePool } = require('../config/database');
      const [processing] = await promisePool.query(
        'SELECT id, status, created_at FROM personas WHERE user_id = ? AND status = ? ORDER BY created_at DESC',
        [userId, 'processing']
      );
      res.json({ success: true, hasProcessing: processing.length > 0, processingCount: processing.length, items: processing });
    } catch (error) {
      console.error('Error getting processing status:', error);
      res.status(500).json({ success: false, message: 'Failed to get status' });
    }
  }

  static async checkStatus(req, res) {
    try {
      const { requestId } = req.params;

      const response = await axios.get(
        `https://queue.fal.run/fal-ai/bytedance/requests/${requestId}/status`,
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
          `https://queue.fal.run/fal-ai/bytedance/requests/${requestId}`,
          {
            headers: {
              'Authorization': `Key ${process.env.FAL_KEY}`
            },
            timeout: 15000
          }
        );

        const imageUrl = resultResponse.data.images[0].url;
        
        const uploadsDir = path.join(__dirname, '..', 'public', 'uploads', 'personas');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const imageResponse = await axios.get(imageUrl, { 
          responseType: 'arraybuffer',
          timeout: 30000
        });
        const filename = `persona_${requestId}_${Date.now()}.png`;
        const filepath = path.join(uploadsDir, filename);
        
        fs.writeFileSync(filepath, imageResponse.data);

        const publicUrl = `/uploads/personas/${filename}`;
        
        const persona = await Persona.findByRequestId(requestId);
        if (persona) {
          await Persona.updateStatus(persona.id, 'completed', publicUrl);
        }

        res.json({ 
          success: true, 
          status: 'COMPLETED',
          imageUrl: publicUrl,
          personaId: persona?.id
        });
      } else if (status === 'FAILED') {
        const persona = await Persona.findByRequestId(requestId);
        if (persona) {
          await Persona.updateStatus(persona.id, 'failed');
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
      const history = await Persona.findByUserId(userId);
      
      res.json({ success: true, history });
    } catch (error) {
      console.error('Error getting history:', error);
      res.status(500).json({ success: false, message: 'Failed to get history' });
    }
  }
}

module.exports = PersonaController;