// models/ImageUpscaleModel.js
const fs = require('fs').promises;
const path = require('path');

class ImageUpscaleModel {
  constructor(db) {
    this.db = db;
  }

  // Create new upscale record
  async create(userId, originalImageUrl, localImagePath) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const [result] = await this.db.query(
      `INSERT INTO image_upscales 
       (user_id, original_image_url, local_image_path, expires_at) 
       VALUES (?, ?, ?, ?)`,
      [userId, originalImageUrl, localImagePath, expiresAt]
    );

    return result.insertId;
  }

  // Get by ID
  async getById(id, userId = null) {
    const query = userId
      ? `SELECT * FROM image_upscales WHERE id = ? AND user_id = ?`
      : `SELECT * FROM image_upscales WHERE id = ?`;
    const params = userId ? [id, userId] : [id];

    const [upscales] = await this.db.query(query, params);
    return upscales.length > 0 ? upscales[0] : null;
  }

  // Update task ID and status to generating
  async updateTaskId(id, taskId) {
    await this.db.query(
      `UPDATE image_upscales 
       SET task_id = ?, status = 'generating', updated_at = NOW() 
       WHERE id = ?`,
      [taskId, id]
    );
  }

  // Update on completion
  async updateCompleted(taskId, resultImageUrl, localResultPath, costTime) {
    await this.db.query(
      `UPDATE image_upscales 
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
      `UPDATE image_upscales 
       SET status = 'failed', error_message = ?, updated_at = NOW() 
       WHERE task_id = ?`,
      [errorMessage, taskId]
    );
  }

  // Update on failure by ID (for errors before task_id is set)
  async updateFailedById(upscaleId, errorMessage) {
    await this.db.query(
      `UPDATE image_upscales 
       SET status = 'failed', error_message = ?, updated_at = NOW() 
       WHERE id = ?`,
      [errorMessage, upscaleId]
    );
  }

  // Get by task ID for callback
  async getByTaskId(taskId) {
    const [upscales] = await this.db.query(
      `SELECT * FROM image_upscales WHERE task_id = ?`,
      [taskId]
    );
    return upscales.length > 0 ? upscales[0] : null;
  }

  // Get user history
  async getUserHistory(userId, limit = 20) {
    const [upscales] = await this.db.query(
      `SELECT * FROM image_upscales 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [userId, limit]
    );
    return upscales;
  }

  // Delete expired upscales (called by cron)
  async deleteExpired() {
    try {
      // Get expired upscales with images
      const [expired] = await this.db.query(
        `SELECT id, local_image_path, local_result_path 
         FROM image_upscales 
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
        `DELETE FROM image_upscales WHERE expires_at < NOW()`
      );

      console.log(`🗑️  Deleted ${result.affectedRows} expired Image Upscales`);
      return result.affectedRows;
    } catch (error) {
      console.error('Error deleting expired upscales:', error);
      throw error;
    }
  }

  // Update status
  async updateStatus(id, status) {
    await this.db.query(
      `UPDATE image_upscales SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, id]
    );
  }
}

module.exports = ImageUpscaleModel;