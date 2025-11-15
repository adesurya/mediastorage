const { promisePool } = require('../config/database');

class ProductShot {
  static async create(userId, sceneDescription, optimizedDescription, productImageUrl, refImageUrl, requestId) {
    const [result] = await promisePool.query(
      'INSERT INTO product_shots (user_id, scene_description, optimized_description, product_image_url, ref_image_url, request_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, sceneDescription, optimizedDescription, productImageUrl, refImageUrl, requestId, 'processing']
    );
    return result.insertId;
  }

  static async updateStatus(id, status, resultImageUrl = null) {
    await promisePool.query(
      'UPDATE product_shots SET status = ?, result_image_url = ?, updated_at = NOW() WHERE id = ?',
      [status, resultImageUrl, id]
    );
  }

  static async findById(id) {
    const [rows] = await promisePool.query(
      'SELECT * FROM product_shots WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async findByRequestId(requestId) {
    const [rows] = await promisePool.query(
      'SELECT * FROM product_shots WHERE request_id = ?',
      [requestId]
    );
    return rows[0];
  }

  static async findByUserId(userId, limit = 20) {
    const [rows] = await promisePool.query(
      'SELECT * FROM product_shots WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );
    return rows;
  }

  static async deleteOldImages() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [shots] = await promisePool.query(
      'SELECT * FROM product_shots WHERE created_at < ? AND result_image_url IS NOT NULL',
      [thirtyDaysAgo]
    );

    const fs = require('fs');
    const path = require('path');

    for (const shot of shots) {
      // Delete result image
      if (shot.result_image_url) {
        const resultPath = path.join(__dirname, '..', 'public', 'uploads', 'product-shots', path.basename(shot.result_image_url));
        if (fs.existsSync(resultPath)) {
          fs.unlinkSync(resultPath);
        }
      }

      // Delete source images
      if (shot.product_image_url && shot.product_image_url.startsWith('/uploads/')) {
        const imagePath = path.join(__dirname, '..', 'public', shot.product_image_url);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      if (shot.ref_image_url && shot.ref_image_url.startsWith('/uploads/')) {
        const refPath = path.join(__dirname, '..', 'public', shot.ref_image_url);
        if (fs.existsSync(refPath)) {
          fs.unlinkSync(refPath);
        }
      }
    }

    await promisePool.query(
      'DELETE FROM product_shots WHERE created_at < ?',
      [thirtyDaysAgo]
    );
  }
}

module.exports = ProductShot;