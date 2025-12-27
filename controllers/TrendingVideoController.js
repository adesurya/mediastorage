// controllers/TrendingVideoController.js
const TrendingVideoService = require('../services/TrendingVideoService');

class TrendingVideoController {
  constructor(pool) {
    this.service = new TrendingVideoService(pool);
  }

  search = async (req, res) => {
    try {
      const { query, page = 1, limit = 20 } = req.query;
      const userId = req.user?.id;

      if (!query || query.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const result = await this.service.searchVideos(query, userId);
      const videos = this.service.formatVideoData(result.videos);

      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedVideos = videos.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          query: result.query,
          videos: paginatedVideos,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: videos.length,
            totalPages: Math.ceil(videos.length / limit)
          },
          fromCache: result.fromCache,
          expiresAt: result.expiresAt
        }
      });

    } catch (error) {
      console.error('Search Controller Error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to search videos'
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
      console.error('Get History Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve search history'
      });
    }
  };

  getPopular = async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const popular = await this.service.getPopularSearches(limit);

      res.json({
        success: true,
        data: popular
      });

    } catch (error) {
      console.error('Get Popular Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve popular searches'
      });
    }
  };
}

module.exports = TrendingVideoController;