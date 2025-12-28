// models/RemoveBackgroundModel.js
const fs = require('fs').promises;
const path = require('path');

class RemoveBackgroundModel {
  constructor(db) {
    this.db = db;
  }

  // Create new remove background record
  async create(userId, originalImageUrl, localImagePath) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const [result] = await this.db.query(
      `INSERT INTO remove_backgrounds 
       (user_id, original_image_url, local_image_path, expires_at) 
       VALUES (?, ?, ?, ?)`,
      [userId, originalImageUrl, localImagePath, expiresAt]
    );

    return result.insertId;
  }

  // Get by ID
  async getById(id, userId = null) {
    const query = userId
      ? `SELECT * FROM remove_backgrounds WHERE id = ? AND user_id = ?`
      : `SELECT * FROM remove_backgrounds WHERE id = ?`;
    const params = userId ? [id, userId] : [id];

    const [backgrounds] = await this.db.query(query, params);
    return backgrounds.length > 0 ? backgrounds[0] : null;
  }

  // Update task ID and status to generating
  async updateTaskId(id, taskId) {
    await this.db.query(
      `UPDATE remove_backgrounds 
       SET task_id = ?, status = 'generating', updated_at = NOW() 
       WHERE id = ?`,
      [taskId, id]
    );
  }

  // Update on completion
  async updateCompleted(taskId, resultImageUrl, localResultPath, costTime) {
    await this.db.query(
      `UPDATE remove_backgrounds 
       SET status = 'completed', 
           result_image_url = ?, 
           local_result_path = ?,
           cost_time = ?,
           updated_at = NOW() 
       WHERE task_id = ?`,
      [resultImageUrl, localResultPath, costTime, taskId]
    );
  }

  // Update on failure
  async updateFailed(taskId, errorMessage) {
    await this.db.query(
      `UPDATE remove_backgrounds 
       SET status = 'failed', error_message = ?, updated_at = NOW() 
       WHERE task_id = ?`,
      [errorMessage, taskId]
    );
  }

  // Update on failure by ID (for errors before task_id is set)
  async updateFailedById(backgroundId, errorMessage) {
    await this.db.query(
      `UPDATE remove_backgrounds 
       SET status = 'failed', error_message = ?, updated_at = NOW() 
       WHERE id = ?`,
      [errorMessage, backgroundId]
    );
  }

  // Get by task ID for callback
  async getByTaskId(taskId) {
    const [backgrounds] = await this.db.query(
      `SELECT * FROM remove_backgrounds WHERE task_id = ?`,
      [taskId]
    );
    return backgrounds.length > 0 ? backgrounds[0] : null;
  }

  // Get user history
  async getUserHistory(userId, limit = 20) {
    const [backgrounds] = await this.db.query(
      `SELECT * FROM remove_backgrounds 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [userId, limit]
    );
    return backgrounds;
  }

  // Delete expired backgrounds (called by cron)
  async deleteExpired() {
    try {
      // Get expired backgrounds with images
      const [expired] = await this.db.query(
        `SELECT id, local_image_path, local_result_path 
         FROM remove_backgrounds 
         WHERE expires_at < NOW()`
      );

      // Delete image files
      for (const record of expired) {
        const paths = [record.local_image_path, record.local_result_path].filter(Boolean);
        
        for (const imagePath of paths) {
          try {
            const fullPath = path.join(__dirname, '..', 'public', imagePath.replace(/^\//, ''));
            await fs.unlink(fullPath);
            console.log(`✅ Deleted image: ${imagePath}`);
          } catch (err) {
            console.log(`⚠️  Failed to delete image: ${err.message}`);
          }
        }
      }

      // Delete database records
      const [result] = await this.db.query(
        `DELETE FROM remove_backgrounds WHERE expires_at < NOW()`
      );

      console.log(`🗑️  Deleted ${result.affectedRows} expired Remove Backgrounds`);
      return result.affectedRows;
    } catch (error) {
      console.error('Error deleting expired backgrounds:', error);
      throw error;
    }
  }

  // Update status
  async updateStatus(id, status) {
    await this.db.query(
      `UPDATE remove_backgrounds SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, id]
    );
  }
}

module.exports = RemoveBackgroundModel;