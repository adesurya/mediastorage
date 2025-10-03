const { promisePool } = require('../config/database');

class Category {
  static async findAll(userId = null) {
    let query = `
      SELECT c.*, u.username,
             (SELECT COUNT(*) FROM media WHERE category_id = c.id) as media_count
      FROM categories c 
      JOIN users u ON c.user_id = u.id
    `;
    const params = [];
    
    if (userId) {
      query += ' WHERE c.user_id = ?';
      params.push(userId);
    }
    
    query += ' ORDER BY c.created_at DESC';
    
    const [rows] = await promisePool.query(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await promisePool.query(
      `SELECT c.*, u.username,
              (SELECT COUNT(*) FROM media WHERE category_id = c.id) as media_count
       FROM categories c 
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async findByUserId(userId) {
    const [rows] = await promisePool.query(
      `SELECT c.*,
              (SELECT COUNT(*) FROM media WHERE category_id = c.id) as media_count
       FROM categories c
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async create(categoryData) {
    const { name, description, user_id } = categoryData;
    
    const [result] = await promisePool.query(
      'INSERT INTO categories (name, description, user_id) VALUES (?, ?, ?)',
      [name, description || null, user_id]
    );
    
    return result.insertId;
  }

  static async update(id, categoryData) {
    const { name, description } = categoryData;
    
    await promisePool.query(
      'UPDATE categories SET name = ?, description = ? WHERE id = ?',
      [name, description || null, id]
    );
    
    return true;
  }

  static async delete(id) {
    // Set category_id to NULL for all media in this category before deleting
    await promisePool.query('UPDATE media SET category_id = NULL WHERE category_id = ?', [id]);
    await promisePool.query('DELETE FROM categories WHERE id = ?', [id]);
    return true;
  }

  static async getStats(userId = null) {
    let query = 'SELECT COUNT(*) as count FROM categories';
    const params = [];
    
    if (userId) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }
    
    const [result] = await promisePool.query(query, params);
    return result[0].count;
  }
}

module.exports = Category;