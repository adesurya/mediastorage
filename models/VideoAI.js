const { promisePool } = require('../config/database');

class VideoAI {
  static async create(userId, prompt, optimizedPrompt, imageUrl, requestId) {
    const [result] = await promisePool.query(
      'INSERT INTO video_ai (user_id, prompt, optimized_prompt, image_url, request_id, status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, prompt, optimizedPrompt, imageUrl, requestId, 'processing']
    );
    return result.insertId;
  }

  static async updateStatus(id, status, videoUrl = null) {
    await promisePool.query(
      'UPDATE video_ai SET status = ?, video_url = ?, updated_at = NOW() WHERE id = ?',
      [status, videoUrl, id]
    );
  }

  static async findById(id) {
    const [rows] = await promisePool.query(
      'SELECT * FROM video_ai WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async findByRequestId(requestId) {
    const [rows] = await promisePool.query(
      'SELECT * FROM video_ai WHERE request_id = ?',
      [requestId]
    );
    return rows[0];
  }

  static async findByUserId(userId, limit = 20) {
    const [rows] = await promisePool.query(
      'SELECT * FROM video_ai WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );
    return rows;
  }

  static async deleteOldVideos() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [videos] = await promisePool.query(
      'SELECT * FROM video_ai WHERE created_at < ? AND video_url IS NOT NULL',
      [thirtyDaysAgo]
    );

    const fs = require('fs');
    const path = require('path');

    for (const video of videos) {
      // Delete video file
      if (video.video_url) {
        const videoPath = path.join(__dirname, '..', 'public', 'uploads', 'videos', path.basename(video.video_url));
        if (fs.existsSync(videoPath)) {
          fs.unlinkSync(videoPath);
        }
      }

      // Delete source image
      if (video.image_url && video.image_url.startsWith('/uploads/')) {
        const imagePath = path.join(__dirname, '..', 'public', video.image_url);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    }

    await promisePool.query(
      'DELETE FROM video_ai WHERE created_at < ?',
      [thirtyDaysAgo]
    );
  }
}

module.exports = VideoAI;