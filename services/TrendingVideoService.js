// services/TrendingVideoService.js
const axios = require('axios');
const TrendingVideoModel = require('../models/TrendingVideoModel');

class TrendingVideoService {
  constructor(pool) {
    this.model = new TrendingVideoModel(pool);
    this.apiConfig = {
      baseURL: 'https://tiktok-api6.p.rapidapi.com',
      headers: {
        'x-rapidapi-host': 'tiktok-api6.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY || '0f68742654msh1594faded7caad5p15786ajsn6919b6854d18'
      },
      timeout: 30000
    };
  }

  async searchVideos(query, userId = null) {
    try {
      const cached = await this.model.getCachedResult(query);
      if (cached) {
        console.log(`Cache HIT for query: ${query}`);
        if (userId) {
          await this.model.logUserSearch(userId, query, cached.total_videos);
        }
        
        let videoData = cached.video_data;
        if (typeof videoData === 'string') {
          videoData = JSON.parse(videoData);
        }
        
        return {
          query: cached.query,
          videos: videoData,
          fromCache: true,
          expiresAt: cached.expires_at
        };
      }

      console.log(`Cache MISS for query: ${query} - Calling API`);
      const response = await this.callTikTokAPI(query);
      
      if (response.videos && response.videos.length > 0) {
        await this.model.saveCacheResult(query, response.videos);
        
        if (userId) {
          await this.model.logUserSearch(userId, query, response.videos.length);
        }

        return {
          query: response.query || query,
          videos: response.videos,
          fromCache: false
        };
      }

      return {
        query,
        videos: [],
        fromCache: false
      };

    } catch (error) {
      console.error('Search Videos Error:', error.message);
      throw new Error(`Failed to search videos: ${error.message}`);
    }
  }

  async callTikTokAPI(query) {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await axios.get(
        `/search/general/query?query=${encodedQuery}`,
        this.apiConfig
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`TikTok API Error: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.request) {
        throw new Error('No response from TikTok API');
      } else {
        throw new Error(`Request setup error: ${error.message}`);
      }
    }
  }

  async getUserHistory(userId, limit = 10) {
    return await this.model.getUserSearchHistory(userId, limit);
  }

  async getPopularSearches(limit = 10) {
    return await this.model.getPopularSearches(limit);
  }

  formatVideoData(videos) {
    return videos.map(video => ({
      video_id: video.video_id,
      description: video.description,
      create_time: video.create_time,
      author: video.author,
      author_name: video.author_name,
      statistics: {
        comments: video.statistics?.number_of_comments || 0,
        hearts: video.statistics?.number_of_hearts || 0,
        plays: video.statistics?.number_of_plays || 0,
        reposts: video.statistics?.number_of_reposts || 0,
        saves: video.statistics?.number_of_saves || 0
      },
      cover: video.cover,
      download_url: video.download_url,
      duration: video.duration,
      avatar_thumb: video.avatar_thumb
    }));
  }
}

module.exports = TrendingVideoService;