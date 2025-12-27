// controllers/VideoPromptingController.js
const VideoPromptingService = require('../services/VideoPromptingService');

class VideoPromptingController {
  constructor(pool) {
    this.service = new VideoPromptingService(pool);
  }

  generate = async (req, res) => {
    try {
      const userId = req.user?.id;
      const { ideKonten, highlightPoints, urlProducts, hook, value, cta } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!ideKonten || !highlightPoints || !hook || !value || !cta) {
        return res.status(400).json({
          success: false,
          message: 'All required fields must be filled'
        });
      }

      const result = await this.service.startGeneration(userId, {
        ideKonten,
        highlightPoints,
        urlProducts,
        hook,
        value,
        cta
      });

      res.json({
        success: true,
        promptingId: result.promptingId,
        status: result.status,
        message: 'Generation started'
      });

    } catch (error) {
      console.error('Generate error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate prompt'
      });
    }
  };

  getStatus = async (req, res) => {
    try {
      const { promptingId } = req.params;

      const prompting = await this.service.getStatus(promptingId);

      if (!prompting) {
        return res.status(404).json({
          success: false,
          message: 'Prompting not found'
        });
      }

      res.json({
        success: true,
        data: {
          id: prompting.id,
          status: prompting.status,
          generatedPrompt: prompting.generated_prompt,
          errorMessage: prompting.error_message,
          createdAt: prompting.created_at
        }
      });

    } catch (error) {
      console.error('Get status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get status'
      });
    }
  };

  streamResult = async (req, res) => {
    try {
      const { promptingId } = req.params;

      const prompting = await this.service.getStatus(promptingId);

      if (!prompting) {
        return res.status(404).json({
          success: false,
          message: 'Prompting not found'
        });
      }

      if (prompting.status === 'completed') {
        return res.json({
          success: true,
          data: {
            status: prompting.status,
            generatedPrompt: prompting.generated_prompt
          }
        });
      }

      if (prompting.status !== 'processing') {
        return res.json({
          success: false,
          data: {
            status: prompting.status,
            errorMessage: prompting.error_message
          }
        });
      }

      // Set headers for SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let fullContent = '';
      const formData = {
        ideKonten: prompting.ide_konten,
        highlightPoints: JSON.parse(prompting.highlight_points),
        urlProducts: prompting.url_products,
        hook: prompting.hook,
        value: prompting.value,
        cta: prompting.cta
      };

      const prompt = this.service.buildPrompt(formData);

      try {
        for await (const chunk of this.service.generatePromptStream(prompt)) {
          fullContent += chunk;
          res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
        }

        await this.service.model.updatePrompt(promptingId, fullContent);

        res.write(`data: ${JSON.stringify({ chunk: '', done: true, fullContent })}\n\n`);
        res.end();
      } catch (streamError) {
        console.error('Stream error:', streamError);
        res.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`);
        res.end();
      }

    } catch (error) {
      console.error('Stream result error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to stream result'
      });
    }
  };

  getHistory = async (req, res) => {
    try {
      const userId = req.user?.id;
      const limit = parseInt(req.query.limit) || 20;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const history = await this.service.getUserHistory(userId, limit);

      res.json({
        success: true,
        data: history
      });

    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get history'
      });
    }
  };
}

module.exports = VideoPromptingController;