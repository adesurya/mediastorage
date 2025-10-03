const { promisePool } = require('../config/database');

class Idea {
  // Chat operations
  static async createChat(userId, title) {
    const [result] = await promisePool.query(
      'INSERT INTO idea_chats (user_id, title) VALUES (?, ?)',
      [userId, title]
    );
    return result.insertId;
  }

  static async findChatById(id) {
    const [rows] = await promisePool.query(
      'SELECT * FROM idea_chats WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async findChatsByUserId(userId) {
    const [rows] = await promisePool.query(
      `SELECT ic.*, 
              (SELECT COUNT(*) FROM idea_messages WHERE chat_id = ic.id) as message_count
       FROM idea_chats ic
       WHERE ic.user_id = ?
       ORDER BY ic.updated_at DESC`,
      [userId]
    );
    return rows;
  }

  static async updateChatTitle(id, title) {
    await promisePool.query(
      'UPDATE idea_chats SET title = ? WHERE id = ?',
      [title, id]
    );
    return true;
  }

  static async deleteChat(id) {
    await promisePool.query('DELETE FROM idea_chats WHERE id = ?', [id]);
    return true;
  }

  // Message operations
  static async createMessage(chatId, role, content) {
    const [result] = await promisePool.query(
      'INSERT INTO idea_messages (chat_id, role, content) VALUES (?, ?, ?)',
      [chatId, role, content]
    );
    
    // Update chat's updated_at timestamp
    await promisePool.query(
      'UPDATE idea_chats SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [chatId]
    );
    
    return result.insertId;
  }

  static async findMessagesByChatId(chatId) {
    const [rows] = await promisePool.query(
      'SELECT * FROM idea_messages WHERE chat_id = ? ORDER BY created_at ASC',
      [chatId]
    );
    return rows;
  }

  static async getStats(userId = null) {
    let query = 'SELECT COUNT(*) as count FROM idea_chats';
    const params = [];
    
    if (userId) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }
    
    const [result] = await promisePool.query(query, params);
    return result[0].count;
  }
}

module.exports = Idea;