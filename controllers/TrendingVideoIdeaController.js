// controllers/TrendingVideoIdeaController.js
const TrendingVideoIdeaService = require('../services/TrendingVideoIdeaService');

class TrendingVideoIdeaController {
  constructor(pool) {
    this.service = new TrendingVideoIdeaService(pool);
  }

  generateIdea = async (req, res) => {
    try {
      const { videoId, videoUrl } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!videoId || !videoUrl) {
        return res.status(400).json({
          success: false,
          message: 'Video ID and URL are required'
        });
      }

      // Check if already exists
      const existing = await this.service.getByVideoId(userId, videoId);
      if (existing && existing.status === 'completed') {
        return res.json({
          success: true,
          ideaId: existing.id,
          status: existing.status,
          message: 'Idea already generated'
        });
      }

      // Start generation
      const result = await this.service.startGeneration(userId, videoId, videoUrl);

      res.json({
        success: true,
        ideaId: result.ideaId,
        status: result.status,
        message: 'Generation started'
      });

    } catch (error) {
      console.error('Generate idea error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate idea'
      });
    }
  };

  getStatus = async (req, res) => {
    try {
      const { ideaId } = req.params;

      const idea = await this.service.getStatus(ideaId);

      if (!idea) {
        return res.status(404).json({
          success: false,
          message: 'Idea not found'
        });
      }

      res.json({
        success: true,
        data: {
          id: idea.id,
          status: idea.status,
          transcriptText: idea.transcript_text,
          generatedIdea: idea.generated_idea,
          errorMessage: idea.error_message,
          createdAt: idea.created_at
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

  getResult = async (req, res) => {
    try {
      const { ideaId } = req.params;

      const idea = await this.service.getStatus(ideaId);

      if (!idea) {
        return res.status(404).json({
          success: false,
          message: 'Idea not found'
        });
      }

      res.json({
        success: true,
        data: {
          videoUrl: idea.video_url,
          transcriptText: idea.transcript_text,
          generatedIdea: idea.generated_idea,
          status: idea.status,
          createdAt: idea.created_at
        }
      });

    } catch (error) {
      console.error('Get result error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get result'
      });
    }
  };

  streamResult = async (req, res) => {
    try {
      const { ideaId } = req.params;

      const idea = await this.service.getStatus(ideaId);

      if (!idea) {
        return res.status(404).json({
          success: false,
          message: 'Idea not found'
        });
      }

      if (idea.status !== 'generating' || !idea.transcript_text) {
        return res.json({
          success: true,
          data: {
            status: idea.status,
            generatedIdea: idea.generated_idea
          }
        });
      }

      // Set headers for SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let fullContent = '';

      try {
        for await (const chunk of this.service.generateIdeaStream(idea.transcript_text)) {
          fullContent += chunk;
          res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
        }

        // Save full content
        await this.service.model.updateIdea(ideaId, fullContent);

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
      const limit = parseInt(req.query.limit) || 10;

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

module.exports = TrendingVideoIdeaController;