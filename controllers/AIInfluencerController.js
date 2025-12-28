// controllers/AIInfluencerController.js
const AIInfluencerModel = require('../models/AIInfluencerModel');
const AIInfluencerService = require('../services/AIInfluencerService');

class AIInfluencerController {
  constructor(db) {
    this.model = new AIInfluencerModel(db);
    this.service = new AIInfluencerService();
  }

  // Optimize prompt with OpenAI
  async optimizePrompt(req, res) {
    try {
      const { prompt } = req.body;

      if (!prompt || prompt.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Prompt tidak boleh kosong'
        });
      }

      const result = await this.service.optimizePrompt(prompt);

      if (result.success) {
        res.json({
          success: true,
          optimizedPrompt: result.optimizedPrompt
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Optimize prompt error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Create new AI Influencer
  async create(req, res) {
    try {
      const userId = req.session.userId;
      const { name, prompt } = req.body;

      if (!name || !prompt) {
        return res.status(400).json({
          success: false,
          message: 'Name dan prompt harus diisi'
        });
      }

      // Create record in database
      const influencerId = await this.model.create(userId, name, prompt);

      // Start generation process (async)
      this.startGeneration(influencerId, prompt).catch(err => {
        console.error('Generation error:', err);
      });

      res.json({
        success: true,
        message: 'AI Influencer generation dimulai',
        data: {
          influencerId,
          estimatedTime: this.service.getEstimatedTimeMessage()
        }
      });
    } catch (error) {
      console.error('Create influencer error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Start generation process (async)
  async startGeneration(influencerId, prompt) {
    try {
      // Update status to generating
      await this.model.updateStatus(influencerId, 'generating');

      // Call API to generate image
      const result = await this.service.generateImage(prompt);

      if (result.success) {
        // Update task ID
        await this.model.updateTaskId(influencerId, result.taskId);
        console.log(`✅ Generation started for influencer ${influencerId}, taskId: ${result.taskId}`);
      } else {
        // Update as failed
        await this.model.updateFailed(influencerId, result.error);
        console.error(`❌ Generation failed for influencer ${influencerId}:`, result.error);
      }
    } catch (error) {
      console.error('Start generation error:', error);
      await this.model.updateFailed(influencerId, error.message);
    }
  }

  // Handle callback from API
  async handleCallback(req, res) {
    try {
      const callbackData = req.body;
      console.log('📥 Callback received:', JSON.stringify(callbackData, null, 2));

      const result = await this.service.handleCallback(callbackData);

      if (result.success) {
        // Get influencer info
        const influencer = await this.model.getByTaskId(result.taskId);
        if (!influencer) {
          return res.status(404).json({
            success: false,
            message: 'Influencer not found'
          });
        }

        // Download image
        const imageResult = await this.service.downloadImage(
          result.imageUrl,
          influencer.id,
          influencer.name
        );

        // Update as completed
        await this.model.updateCompleted(
          result.taskId,
          imageResult.publicUrl,
          imageResult.localPath,
          result.costTime
        );

        console.log(`✅ AI Influencer ${influencer.id} completed successfully`);
      } else {
        // Update as failed
        await this.model.updateFailed(result.taskId, result.errorMessage);
        console.error(`❌ AI Influencer generation failed:`, result.errorMessage);
      }

      res.json({ success: true, message: 'Callback processed' });
    } catch (error) {
      console.error('Callback error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get influencer by ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.session.userId;

      const influencer = await this.model.getById(id, userId);

      if (!influencer) {
        return res.status(404).json({
          success: false,
          message: 'AI Influencer not found'
        });
      }

      res.json({ success: true, data: influencer });
    } catch (error) {
      console.error('Get influencer error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get user history
  async getHistory(req, res) {
    try {
      const userId = req.session.userId;
      const limit = parseInt(req.query.limit) || 20;

      const history = await this.model.getUserHistory(userId, limit);

      res.json({ success: true, data: history });
    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Delete influencer
  async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.session.userId;

      const influencer = await this.model.getById(id, userId);
      if (!influencer) {
        return res.status(404).json({
          success: false,
          message: 'AI Influencer not found'
        });
      }

      // Delete from database
      await this.model.db.query('DELETE FROM ai_influencers WHERE id = ?', [id]);

      res.json({ success: true, message: 'AI Influencer deleted' });
    } catch (error) {
      console.error('Delete influencer error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = AIInfluencerController;