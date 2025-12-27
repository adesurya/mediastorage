// models/TrendingVideoIdeaModel.js
class TrendingVideoIdeaModel {
  constructor(pool) {
    this.pool = pool;
  }

  async create(userId, videoId, videoUrl) {
    try {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const [result] = await this.pool.execute(
        `INSERT INTO trending_video_ideas 
         (user_id, video_id, video_url, status, expires_at)
         VALUES (?, ?, ?, 'transcribing', ?)`,
        [userId, videoId, videoUrl, expiresAt]
      );
      return result.insertId;
    } catch (error) {
      console.error('Create idea error:', error);
      throw error;
    }
  }

  async updateTranscript(id, transcriptId, transcriptText) {
    try {
      await this.pool.execute(
        `UPDATE trending_video_ideas 
         SET transcript_id = ?, transcript_text = ?, status = 'generating'
         WHERE id = ?`,
        [transcriptId, transcriptText, id]
      );
    } catch (error) {
      console.error('Update transcript error:', error);
      throw error;
    }
  }

  async updateIdea(id, generatedIdea) {
    try {
      await this.pool.execute(
        `UPDATE trending_video_ideas 
         SET generated_idea = ?, status = 'completed'
         WHERE id = ?`,
        [generatedIdea, id]
      );
    } catch (error) {
      console.error('Update idea error:', error);
      throw error;
    }
  }

  async updateStatus(id, status, errorMessage = null) {
    try {
      await this.pool.execute(
        `UPDATE trending_video_ideas 
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
        `SELECT * FROM trending_video_ideas WHERE id = ?`,
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Get by id error:', error);
      return null;
    }
  }

  async getByVideoId(userId, videoId) {
    try {
      const [rows] = await this.pool.execute(
        `SELECT * FROM trending_video_ideas 
         WHERE user_id = ? AND video_id = ? AND expires_at > NOW()
         ORDER BY created_at DESC 
         LIMIT 1`,
        [userId, videoId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Get by video id error:', error);
      return null;
    }
  }

  async getUserHistory(userId, limit = 10) {
    try {
      const limitInt = parseInt(limit);
      const [rows] = await this.pool.execute(
        `SELECT * FROM trending_video_ideas 
         WHERE user_id = ? AND expires_at > NOW()
         ORDER BY created_at DESC 
         LIMIT ?`,
        [userId, limitInt]
      );
      return rows || [];
    } catch (error) {
      console.error('Get user history error:', error);
      return [];
    }
  }
}

module.exports = TrendingVideoIdeaModel;