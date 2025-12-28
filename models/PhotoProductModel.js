// models/PhotoProductModel.js
const fs = require('fs').promises;
const path = require('path');

class PhotoProductModel {
  constructor(db) {
    this.db = db;
  }

  // Create new Photo Product
  async create(userId, productName, originalPrompt, image1Url, image2Url = null, localImage1Path = null, localImage2Path = null) {
    // Set expiration to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const [result] = await this.db.query(
      `INSERT INTO photo_products 
       (user_id, product_name, original_prompt, image1_url, image2_url, local_image1_path, local_image2_path, expires_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, productName, originalPrompt, image1Url, image2Url, localImage1Path, localImage2Path, expiresAt]
    );

    return result.insertId;
  }

  // Get by ID
  async getById(id, userId = null) {
    const query = userId
      ? `SELECT * FROM photo_products WHERE id = ? AND user_id = ?`
      : `SELECT * FROM photo_products WHERE id = ?`;
    const params = userId ? [id, userId] : [id];

    const [products] = await this.db.query(query, params);
    return products.length > 0 ? products[0] : null;
  }

  // Update optimized prompt
  async updateOptimizedPrompt(id, optimizedPrompt) {
    await this.db.query(
      `UPDATE photo_products 
       SET optimized_prompt = ?, status = 'optimizing', updated_at = NOW() 
       WHERE id = ?`,
      [optimizedPrompt, id]
    );
  }

  // Update task ID and status to generating
  async updateTaskId(id, taskId) {
    await this.db.query(
      `UPDATE photo_products 
       SET task_id = ?, status = 'generating', updated_at = NOW() 
       WHERE id = ?`,
      [taskId, id]
    );
  }

  // Update on completion
  async updateCompleted(taskId, resultImageUrl, localResultPath, costTime) {
    await this.db.query(
      `UPDATE photo_products 
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
      `UPDATE photo_products 
       SET status = 'failed', error_message = ?, updated_at = NOW() 
       WHERE task_id = ?`,
      [errorMessage, taskId]
    );
  }

  // Get by task ID for callback
  async getByTaskId(taskId) {
    const [products] = await this.db.query(
      `SELECT * FROM photo_products WHERE task_id = ?`,
      [taskId]
    );
    return products.length > 0 ? products[0] : null;
  }

  // Get user history
  async getUserHistory(userId, limit = 20) {
    const [products] = await this.db.query(
      `SELECT * FROM photo_products 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [userId, limit]
    );
    return products;
  }

  // Delete expired products (called by cron)
  async deleteExpired() {
    try {
      // Get expired products with images
      const [expired] = await this.db.query(
        `SELECT id, local_image1_path, local_image2_path, local_result_path 
         FROM photo_products 
         WHERE expires_at < NOW()`
      );

      // Delete image files
      for (const record of expired) {
        const paths = [record.local_image1_path, record.local_image2_path, record.local_result_path].filter(Boolean);
        
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
        `DELETE FROM photo_products WHERE expires_at < NOW()`
      );

      console.log(`🗑️ Deleted ${result.affectedRows} expired Photo Products`);
      return result.affectedRows;
    } catch (error) {
      console.error('Error deleting expired products:', error);
      throw error;
    }
  }

  // Update status
  async updateStatus(id, status) {
    await this.db.query(
      `UPDATE photo_products SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, id]
    );
  }

  // Delete by ID
  async delete(id, userId) {
    const product = await this.getById(id, userId);
    if (!product) return false;

    // Delete files
    const paths = [product.local_image1_path, product.local_image2_path, product.local_result_path].filter(Boolean);
    for (const imagePath of paths) {
      try {
        const fullPath = path.join(__dirname, '..', 'public', imagePath.replace(/^\//, ''));
        await fs.unlink(fullPath);
      } catch (err) {
        console.log(`Failed to delete file: ${err.message}`);
      }
    }

    // Delete from DB
    await this.db.query('DELETE FROM photo_products WHERE id = ? AND user_id = ?', [id, userId]);
    return true;
  }
}

module.exports = PhotoProductModel;