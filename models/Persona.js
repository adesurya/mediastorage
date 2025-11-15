const { promisePool } = require('../config/database');

class Persona {
  static async create(userId, prompt, optimizedPrompt, requestId) {
    const [result] = await promisePool.query(
      'INSERT INTO personas (user_id, prompt, optimized_prompt, request_id, status) VALUES (?, ?, ?, ?, ?)',
      [userId, prompt, optimizedPrompt, requestId, 'processing']
    );
    return result.insertId;
  }

  static async updateStatus(id, status, imageUrl = null) {
    await promisePool.query(
      'UPDATE personas SET status = ?, image_url = ?, updated_at = NOW() WHERE id = ?',
      [status, imageUrl, id]
    );
  }

  static async findById(id) {
    const [rows] = await promisePool.query(
      'SELECT * FROM personas WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async findByRequestId(requestId) {
    const [rows] = await promisePool.query(
      'SELECT * FROM personas WHERE request_id = ?',
      [requestId]
    );
    return rows[0];
  }

  static async findByUserId(userId, limit = 20) {
    const [rows] = await promisePool.query(
      'SELECT * FROM personas WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );
    return rows;
  }

  static async deleteOldImages() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [personas] = await promisePool.query(
      'SELECT * FROM personas WHERE created_at < ? AND image_url IS NOT NULL',
      [thirtyDaysAgo]
    );

    const fs = require('fs');
    const path = require('path');

    for (const persona of personas) {
      if (persona.image_url) {
        const imagePath = path.join(__dirname, '..', 'public', 'uploads', 'personas', path.basename(persona.image_url));
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    }

    await promisePool.query(
      'DELETE FROM personas WHERE created_at < ?',
      [thirtyDaysAgo]
    );
  }
}

module.exports = Persona;