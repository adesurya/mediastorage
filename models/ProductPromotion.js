const { promisePool } = require('../config/database');

class ProductPromotion {
  static async create(userId, prompt, optimizedPrompt, imageUrls, requestId) {
    const [result] = await promisePool.query(
      'INSERT INTO product_promotions (user_id, prompt, optimized_prompt, image_urls, request_id, status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, prompt, optimizedPrompt, JSON.stringify(imageUrls), requestId, 'processing']
    );
    return result.insertId;
  }

  static async updateStatus(id, status, resultImageUrl = null) {
    await promisePool.query(
      'UPDATE product_promotions SET status = ?, result_image_url = ?, updated_at = NOW() WHERE id = ?',
      [status, resultImageUrl, id]
    );
  }

  static async findById(id) {
    const [rows] = await promisePool.query(
      'SELECT * FROM product_promotions WHERE id = ?',
      [id]
    );
    if (rows[0]) {
      rows[0].image_urls = JSON.parse(rows[0].image_urls);
    }
    return rows[0];
  }

  static async findByRequestId(requestId) {
    const [rows] = await promisePool.query(
      'SELECT * FROM product_promotions WHERE request_id = ?',
      [requestId]
    );
    if (rows[0]) {
      rows[0].image_urls = JSON.parse(rows[0].image_urls);
    }
    return rows[0];
  }

  static async findByUserId(userId, limit = 20) {
    const [rows] = await promisePool.query(
      'SELECT * FROM product_promotions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );
    rows.forEach(row => {
      if (row.image_urls) {
        row.image_urls = JSON.parse(row.image_urls);
      }
    });
    return rows;
  }

  static async deleteOldImages() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [promotions] = await promisePool.query(
      'SELECT * FROM product_promotions WHERE created_at < ? AND result_image_url IS NOT NULL',
      [thirtyDaysAgo]
    );

    const fs = require('fs');
    const path = require('path');

    for (const promo of promotions) {
      // Delete result image
      if (promo.result_image_url) {
        const resultPath = path.join(__dirname, '..', 'public', 'uploads', 'promotions', path.basename(promo.result_image_url));
        if (fs.existsSync(resultPath)) {
          fs.unlinkSync(resultPath);
        }
      }

      // Delete source images
      if (promo.image_urls) {
        const imageUrls = JSON.parse(promo.image_urls);
        imageUrls.forEach(url => {
          if (url.startsWith('/uploads/')) {
            const imagePath = path.join(__dirname, '..', 'public', url);
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
            }
          }
        });
      }
    }

    await promisePool.query(
      'DELETE FROM product_promotions WHERE created_at < ?',
      [thirtyDaysAgo]
    );
  }
}

module.exports = ProductPromotion;