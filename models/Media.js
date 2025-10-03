const { promisePool } = require('../config/database');

class Media {
  static async findAll() {
    const [rows] = await promisePool.query(`
      SELECT m.*, u.username 
      FROM media m 
      JOIN users u ON m.user_id = u.id 
      ORDER BY m.created_at DESC
    `);
    return rows;
  }

  static async findByUserId(userId) {
    const [rows] = await promisePool.query(
      'SELECT * FROM media WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await promisePool.query(
      'SELECT * FROM media WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async create(mediaData) {
    const { 
      user_id, 
      filename, 
      original_name, 
      file_path, 
      file_size, 
      mime_type,
      public_url 
    } = mediaData;
    
    const [result] = await promisePool.query(
      `INSERT INTO media 
       (user_id, filename, original_name, file_path, file_size, mime_type, public_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, filename, original_name, file_path, file_size, mime_type, public_url]
    );
    
    return result.insertId;
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
}

module.exports = Media;