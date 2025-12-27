// models/TrendingVideoModel.js - FIX getPopularSearches
const crypto = require('crypto');

class TrendingVideoModel {
  constructor(pool) {
    this.pool = pool;
  }

  generateQueryHash(query) {
    return crypto.createHash('sha256').update(query.toLowerCase().trim()).digest('hex');
  }

  async getCachedResult(query) {
    try {
      const queryHash = this.generateQueryHash(query);
      const [rows] = await this.pool.execute(
        `SELECT * FROM trending_video_cache 
         WHERE query_hash = ? AND expires_at > NOW()`,
        [queryHash]
      );

      if (rows && rows.length > 0) {
        await this.pool.execute(
          `UPDATE trending_video_cache 
           SET search_count = search_count + 1, last_searched_at = NOW() 
           WHERE query_hash = ?`,
          [queryHash]
        );
        return rows[0];
      }
      return null;
    } catch (error) {
      console.error('getCachedResult error:', error);
      return null;
    }
  }

  async saveCacheResult(query, videoData) {
    try {
      const queryHash = this.generateQueryHash(query);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await this.pool.execute(
        `INSERT INTO trending_video_cache (query, query_hash, video_data, total_videos, expires_at)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           video_data = VALUES(video_data),
           total_videos = VALUES(total_videos),
           search_count = search_count + 1,
           last_searched_at = NOW(),
           expires_at = VALUES(expires_at)`,
        [query, queryHash, JSON.stringify(videoData), videoData.length, expiresAt]
      );
    } catch (error) {
      console.error('saveCacheResult error:', error);
    }
  }

  async logUserSearch(userId, query, resultCount) {
    try {
      await this.pool.execute(
        `INSERT INTO trending_video_searches (user_id, query, result_count)
         VALUES (?, ?, ?)`,
        [userId, query, resultCount]
      );
    } catch (error) {
      console.error('logUserSearch error:', error);
    }
  }

  async getUserSearchHistory(userId, limit = 10) {
    try {
      const limitInt = parseInt(limit, 10);
      const [rows] = await this.pool.execute(
        `SELECT query, result_count, created_at 
         FROM trending_video_searches 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [userId, limitInt]
      );
      return rows || [];
    } catch (error) {
      console.error('getUserSearchHistory error:', error);
      return [];
    }
  }

  async getPopularSearches(limit = 10) {
    try {
      // Ensure limit is a number, not a string
      const limitInt = parseInt(limit, 10);
      
      // Use query instead of execute to avoid parameter binding issues
      const [rows] = await this.pool.query(
        `SELECT query, search_count, last_searched_at 
         FROM trending_video_cache 
         WHERE expires_at > NOW()
         ORDER BY search_count DESC 
         LIMIT ${limitInt}`
      );
      return rows || [];
    } catch (error) {
      console.error('getPopularSearches error:', error);
      return [];
    }
  }
}

module.exports = TrendingVideoModel;