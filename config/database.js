const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
    return;
  }
  console.log('✅ Database connected successfully');
  connection.release();
});

const initDatabase = async () => {
  try {
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_category_per_user (name, user_id)
      )
    `);

    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS media (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        category_id INT DEFAULT NULL,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        public_url VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);

    // Tabel untuk Idea Feature
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS idea_chats (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_created (user_id, created_at DESC)
      )
    `);

    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS idea_messages (
        id INT PRIMARY KEY AUTO_INCREMENT,
        chat_id INT NOT NULL,
        role ENUM('user', 'assistant') NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES idea_chats(id) ON DELETE CASCADE,
        INDEX idx_chat_created (chat_id, created_at ASC)
      )
    `);

    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS personas (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        prompt TEXT NOT NULL,
        optimized_prompt TEXT,
        request_id VARCHAR(255) NOT NULL,
        status ENUM('processing', 'completed', 'failed') DEFAULT 'processing',
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_created (user_id, created_at DESC),
        INDEX idx_request_id (request_id)
      )
    `);

    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS product_promotions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        prompt TEXT NOT NULL,
        optimized_prompt TEXT,
        image_urls TEXT NOT NULL,
        request_id VARCHAR(255) NOT NULL,
        status ENUM('processing', 'completed', 'failed') DEFAULT 'processing',
        result_image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_created (user_id, created_at DESC),
        INDEX idx_request_id (request_id)
      )
    `);

    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS video_ai (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        prompt TEXT NOT NULL,
        optimized_prompt TEXT,
        image_url VARCHAR(500) NOT NULL,
        request_id VARCHAR(255) NOT NULL,
        status ENUM('processing', 'completed', 'failed') DEFAULT 'processing',
        video_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_created (user_id, created_at DESC),
        INDEX idx_request_id (request_id)
      )
    `);

    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS product_shots (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        scene_description TEXT NOT NULL,
        optimized_description TEXT,
        product_image_url VARCHAR(500) NOT NULL,
        ref_image_url VARCHAR(500),
        request_id VARCHAR(255) NOT NULL,
        status ENUM('processing', 'completed', 'failed') DEFAULT 'processing',
        result_image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_created (user_id, created_at DESC),
        INDEX idx_request_id (request_id)
      )
    `);

    console.log('✅ Database tables initialized');

    const bcrypt = require('bcryptjs');
    const [users] = await promisePool.query('SELECT * FROM users WHERE role = ?', ['admin']);
    
    if (users.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await promisePool.query(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        ['admin', 'admin@example.com', hashedPassword, 'admin']
      );
      console.log('✅ Default admin created (username: admin, password: admin123)');
    }
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
  }
};

module.exports = { pool, promisePool, initDatabase };