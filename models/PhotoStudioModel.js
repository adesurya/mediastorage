// models/PhotoStudioModel.js
const fs = require('fs').promises;
const path = require('path');

class PhotoStudioModel {
  constructor(db) {
    this.db = db;
  }

  // Create new Photo Studio
  async create(userId, styleName, styleImagePath, productImageUrl, localProductPath) {
    // Set expiration to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const [result] = await this.db.query(
      `INSERT INTO photo_studios 
       (user_id, style_name, style_image_path, product_image_url, local_product_path, expires_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, styleName, styleImagePath, productImageUrl, localProductPath, expiresAt]
    );

    return result.insertId;
  }

  // Get by ID
  async getById(id, userId = null) {
    const query = userId
      ? `SELECT * FROM photo_studios WHERE id = ? AND user_id = ?`
      : `SELECT * FROM photo_studios WHERE id = ?`;
    const params = userId ? [id, userId] : [id];

    const [studios] = await this.db.query(query, params);
    return studios.length > 0 ? studios[0] : null;
  }

  // Update task ID and status to generating
  async updateTaskId(id, taskId) {
    await this.db.query(
      `UPDATE photo_studios 
       SET task_id = ?, status = 'generating', updated_at = NOW() 
       WHERE id = ?`,
      [taskId, id]
    );
  }

  // Update on completion
  async updateCompleted(taskId, resultImageUrl, localResultPath, costTime) {
    await this.db.query(
      `UPDATE photo_studios 
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
      `UPDATE photo_studios 
       SET status = 'failed', error_message = ?, updated_at = NOW() 
       WHERE task_id = ?`,
      [errorMessage, taskId]
    );
  }

  // Update on failure by ID (when taskId not available yet)
  async updateFailedById(studioId, errorMessage) {
    await this.db.query(
      `UPDATE photo_studios 
       SET status = 'failed', error_message = ?, updated_at = NOW() 
       WHERE id = ?`,
      [errorMessage, studioId]
    );
  }

  // Get by task ID for callback
  async getByTaskId(taskId) {
    const [studios] = await this.db.query(
      `SELECT * FROM photo_studios WHERE task_id = ?`,
      [taskId]
    );
    return studios.length > 0 ? studios[0] : null;
  }

  // Get user history
  async getUserHistory(userId, limit = 20) {
    const [studios] = await this.db.query(
      `SELECT * FROM photo_studios 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [userId, limit]
    );
    return studios;
  }

  // Delete expired studios (called by cron)
  async deleteExpired() {
    try {
      // Get expired studios with images
      const [expired] = await this.db.query(
        `SELECT id, local_product_path, local_result_path 
         FROM photo_studios 
         WHERE expires_at < NOW()`
      );

      // Delete image files
      for (const record of expired) {
        const paths = [record.local_product_path, record.local_result_path].filter(Boolean);
        
        for (const imagePath of paths) {
          try {
            const fullPath = path.join(__dirname, '..', 'public', imagePath.replace(/^\//, ''));
            await fs.unlink(fullPath);
            console.log(`✅ Deleted image: ${imagePath}`);
          } catch (err) {
            console.log(`Failed to delete image: ${err.message}`);
          }
        }
      }

      // Delete database records
      const [result] = await this.db.query(
        `DELETE FROM photo_studios WHERE expires_at < NOW()`
      );

      console.log(`🗑️ Deleted ${result.affectedRows} expired Photo Studios`);
      return result.affectedRows;
    } catch (error) {
      console.error('Error deleting expired studios:', error);
      throw error;
    }
  }

  // Update status
  async updateStatus(id, status) {
    await this.db.query(
      `UPDATE photo_studios SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, id]
    );
  }
}

module.exports = PhotoStudioModel;