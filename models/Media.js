const { promisePool } = require('../config/database');

class Media {
  static async findAll() {
    const [rows] = await promisePool.query(`
      SELECT m.*, u.username, c.name as category_name
      FROM media m 
      JOIN users u ON m.user_id = u.id 
      LEFT JOIN categories c ON m.category_id = c.id
      ORDER BY m.created_at DESC
    `);
    return rows;
  }

  static async findByUserId(userId) {
    const [rows] = await promisePool.query(
      `SELECT m.*, c.name as category_name
       FROM media m
       LEFT JOIN categories c ON m.category_id = c.id
       WHERE m.user_id = ? 
       ORDER BY m.created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async findByCategoryId(categoryId) {
    const [rows] = await promisePool.query(
      `SELECT m.*, u.username, c.name as category_name
       FROM media m
       JOIN users u ON m.user_id = u.id
       LEFT JOIN categories c ON m.category_id = c.id
       WHERE m.category_id = ?
       ORDER BY m.created_at DESC`,
      [categoryId]
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await promisePool.query(
      `SELECT m.*, c.name as category_name
       FROM media m
       LEFT JOIN categories c ON m.category_id = c.id
       WHERE m.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async create(mediaData) {
    const { 
      user_id, 
      category_id,
      filename, 
      original_name, 
      file_path, 
      file_size, 
      mime_type,
      public_url 
    } = mediaData;
    
    const [result] = await promisePool.query(
      `INSERT INTO media 
       (user_id, category_id, filename, original_name, file_path, file_size, mime_type, public_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, category_id || null, filename, original_name, file_path, file_size, mime_type, public_url]
    );
    
    return result.insertId;
  }

  static async updateCategory(id, categoryId) {
    await promisePool.query(
      'UPDATE media SET category_id = ? WHERE id = ?',
      [categoryId || null, id]
    );
    return true;
  }

  static async delete(id) {
    await promisePool.query('DELETE FROM media WHERE id = ?', [id]);
    return true;
  }

  static async getStats() {
    const [totalFiles] = await promisePool.query(
      'SELECT COUNT(*) as count FROM media'
    );
    
    const [totalSize] = await promisePool.query(
      'SELECT SUM(file_size) as size FROM media'
    );
    
    return {
      totalFiles: totalFiles[0].count,
      totalSize: totalSize[0].size || 0
    };
  }

  static async getStatsByCategory() {
    const [rows] = await promisePool.query(`
      SELECT 
        c.id,
        c.name,
        COUNT(m.id) as file_count,
        COALESCE(SUM(m.file_size), 0) as total_size
      FROM categories c
      LEFT JOIN media m ON c.id = m.category_id
      GROUP BY c.id, c.name
      ORDER BY c.name
    `);
    return rows;
  }
}

module.exports = Media;