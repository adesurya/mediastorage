// models/AIInfluencerModel.js
const fs = require('fs').promises;
const path = require('path');

class AIInfluencerModel {
  constructor(db) {
    this.db = db;
  }

  // Create new AI Influencer
  async create(userId, name, originalPrompt) {
    // Set expiration to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const [result] = await this.db.query(
      `INSERT INTO ai_influencers (user_id, name, original_prompt, expires_at) 
       VALUES (?, ?, ?, ?)`,
      [userId, name, originalPrompt, expiresAt]
    );

    return result.insertId;
  }

  // Get by ID
  async getById(id, userId = null) {
    const query = userId
      ? `SELECT * FROM ai_influencers WHERE id = ? AND user_id = ?`
      : `SELECT * FROM ai_influencers WHERE id = ?`;
    const params = userId ? [id, userId] : [id];

    const [influencers] = await this.db.query(query, params);
    return influencers.length > 0 ? influencers[0] : null;
  }

  // Update optimized prompt
  async updateOptimizedPrompt(id, optimizedPrompt) {
    await this.db.query(
      `UPDATE ai_influencers 
       SET optimized_prompt = ?, status = 'optimizing', updated_at = NOW() 
       WHERE id = ?`,
      [optimizedPrompt, id]
    );
  }

  // Update task ID and status to generating
  async updateTaskId(id, taskId) {
    await this.db.query(
      `UPDATE ai_influencers 
       SET task_id = ?, status = 'generating', updated_at = NOW() 
       WHERE id = ?`,
      [taskId, id]
    );
  }

  // Update on completion
  async updateCompleted(taskId, imageUrl, localImagePath, costTime) {
    await this.db.query(
      `UPDATE ai_influencers 
       SET status = 'completed', 
           image_url = ?, 
           local_image_path = ?,
           cost_time = ?,
           updated_at = NOW() 
       WHERE task_id = ?`,
      [imageUrl, localImagePath, costTime, taskId]
    );
  }

  // Update on failure
  async updateFailed(taskId, errorMessage) {
    await this.db.query(
      `UPDATE ai_influencers 
       SET status = 'failed', error_message = ?, updated_at = NOW() 
       WHERE task_id = ?`,
      [errorMessage, taskId]
    );
  }

  // Get by task ID for callback
  async getByTaskId(taskId) {
    const [influencers] = await this.db.query(
      `SELECT * FROM ai_influencers WHERE task_id = ?`,
      [taskId]
    );
    return influencers.length > 0 ? influencers[0] : null;
  }

  // Get user history
  async getUserHistory(userId, limit = 20) {
    const [influencers] = await this.db.query(
      `SELECT * FROM ai_influencers 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [userId, limit]
    );
    return influencers;
  }

  // Delete expired influencers (called by cron)
  async deleteExpired() {
    try {
      // Get expired influencers with images
      const [expired] = await this.db.query(
        `SELECT id, local_image_path 
         FROM ai_influencers 
         WHERE expires_at < NOW() AND local_image_path IS NOT NULL`
      );

      // Delete image files
      for (const record of expired) {
        if (record.local_image_path) {
          try {
            const imagePath = path.join(__dirname, '..', 'public', record.local_image_path.replace(/^\//, ''));
            await fs.unlink(imagePath);
            console.log(`✅ Deleted image: ${record.local_image_path}`);
          } catch (err) {
            console.log(`Failed to delete image: ${err.message}`);
          }
        }
      }

      // Delete database records
      const [result] = await this.db.query(
        `DELETE FROM ai_influencers WHERE expires_at < NOW()`
      );

      console.log(`🗑️ Deleted ${result.affectedRows} expired AI Influencers`);
      return result.affectedRows;
    } catch (error) {
      console.error('Error deleting expired influencers:', error);
      throw error;
    }
  }

  // Update status
  async updateStatus(id, status) {
    await this.db.query(
      `UPDATE ai_influencers SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, id]
    );
  }
}

module.exports = AIInfluencerModel;