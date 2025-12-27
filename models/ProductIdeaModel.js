// models/ProductIdeaModel.js
class ProductIdeaModel {
  constructor(pool) {
    this.pool = pool;
  }

  async create(userId, data) {
    try {
      const { productName, productDescription, productUrl, productImage } = data;
      const [result] = await this.pool.execute(
        `INSERT INTO product_ideas 
         (user_id, product_name, product_description, product_url, product_image, status)
         VALUES (?, ?, ?, ?, ?, 'processing')`,
        [userId, productName, productDescription, productUrl, productImage]
      );
      return result.insertId;
    } catch (error) {
      console.error('Create product idea error:', error);
      throw error;
    }
  }

  async updateIdea(id, data) {
    try {
      const { ideKonten, highlightPoints, hook, value, cta } = data;
      await this.pool.execute(
        `UPDATE product_ideas 
         SET ide_konten = ?, highlight_points = ?, hook = ?, value = ?, cta = ?, status = 'completed'
         WHERE id = ?`,
        [ideKonten, JSON.stringify(highlightPoints), hook, value, cta, id]
      );
    } catch (error) {
      console.error('Update idea error:', error);
      throw error;
    }
  }

  async updateStatus(id, status, errorMessage = null) {
    try {
      await this.pool.execute(
        `UPDATE product_ideas 
         SET status = ?, error_message = ?
         WHERE id = ?`,
        [status, errorMessage, id]
      );
    } catch (error) {
      console.error('Update status error:', error);
      throw error;
    }
  }

  async getById(id) {
    try {
      const [rows] = await this.pool.execute(
        `SELECT * FROM product_ideas WHERE id = ?`,
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Get by id error:', error);
      return null;
    }
  }

  async getUserHistory(userId, limit = 20) {
    try {
      const limitInt = parseInt(limit, 10);
      const [rows] = await this.pool.query(
        `SELECT * FROM product_ideas 
         WHERE user_id = ?
         ORDER BY created_at DESC 
         LIMIT ${limitInt}`,
        [userId]
      );
      return rows || [];
    } catch (error) {
      console.error('Get user history error:', error);
      return [];
    }
  }
}

module.exports = ProductIdeaModel;