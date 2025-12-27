// models/VideoPromptingModel.js - FIXED
class VideoPromptingModel {
  constructor(pool) {
    this.pool = pool;
  }

  async create(userId, data) {
    try {
      const { ideKonten, highlightPoints, urlProducts, hook, value, cta } = data;
      const [result] = await this.pool.execute(
        `INSERT INTO video_promptings 
         (user_id, ide_konten, highlight_points, url_products, hook, value, cta, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'processing')`,
        [userId, ideKonten, JSON.stringify(highlightPoints), urlProducts, hook, value, cta]
      );
      return result.insertId;
    } catch (error) {
      console.error('Create video prompting error:', error);
      throw error;
    }
  }

  async updatePrompt(id, generatedPrompt) {
    try {
      await this.pool.execute(
        `UPDATE video_promptings 
         SET generated_prompt = ?, status = 'completed'
         WHERE id = ?`,
        [generatedPrompt, id]
      );
    } catch (error) {
      console.error('Update prompt error:', error);
      throw error;
    }
  }

  async updateStatus(id, status, errorMessage = null) {
    try {
      await this.pool.execute(
        `UPDATE video_promptings 
         SET status = ?, error_message = ?
         WHERE id = ?`,
        [status, errorMessage, id]
      );
    } catch (error) {
      console.error('Update status error:', error);
      throw error;
    }
  }

  async getById(id) {
    try {
      const [rows] = await this.pool.execute(
        `SELECT * FROM video_promptings WHERE id = ?`,
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Get by id error:', error);
      return null;
    }
  }

  async getUserHistory(userId, limit = 20) {
    try {
      // Use query instead of execute to avoid LIMIT parameter binding issues
      const limitInt = parseInt(limit, 10);
      const [rows] = await this.pool.query(
        `SELECT * FROM video_promptings 
         WHERE user_id = ?
         ORDER BY created_at DESC 
         LIMIT ${limitInt}`,
        [userId]
      );
      return rows || [];
    } catch (error) {
      console.error('Get user history error:', error);
      return [];
    }
  }
}

module.exports = VideoPromptingModel;