// models/VideoCustomModel.js
const fs = require('fs').promises;
const path = require('path');

class VideoCustomModel {
  constructor(pool) {
    this.pool = pool;
  }

  async create(data) {
    const {
      user_id,
      title,
      image_url,
      local_image_path,
      video_prompt,
      narration_text,
      voice_id,
      voice_name
    } = data;

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const initialLog = this.formatLog('Generation created');

    const [result] = await this.pool.execute(
      `INSERT INTO video_custom_generations 
       (user_id, title, image_url, local_image_path, video_prompt, narration_text, 
        voice_id, voice_name, expires_at, process_log) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, title, image_url, local_image_path, video_prompt, narration_text, 
       voice_id, voice_name, expiresAt, initialLog]
    );

    return result.insertId;
  }

  // ✅ BARU: Method untuk format log dengan timestamp
  formatLog(message) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    return `[${timestamp}] ${message}`;
  }

  // ✅ BARU: Method untuk append log
  async appendLog(id, message) {
    const formattedLog = this.formatLog(message);
    
    await this.pool.execute(
      `UPDATE video_custom_generations 
       SET process_log = CONCAT(COALESCE(process_log, ''), '\n', ?)
       WHERE id = ?`,
      [formattedLog, id]
    );
  }

  async updateImagePaths(id, imageUrl, localImagePath) {
    await this.pool.execute(
      `UPDATE video_custom_generations 
       SET image_url = ?, local_image_path = ?
       WHERE id = ?`,
      [imageUrl, localImagePath, id]
    );
    
    await this.appendLog(id, `Image uploaded: ${imageUrl}`);
  }

  async findById(id) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM video_custom_generations WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  async findByUserId(userId, limit = 20, offset = 0) {
    const limitInt = parseInt(limit);
    const offsetInt = parseInt(offset);
    
    const [rows] = await this.pool.query(
      `SELECT * FROM video_custom_generations 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ${limitInt} OFFSET ${offsetInt}`,
      [userId]
    );
    return rows;
  }

  async updateVideoTask(id, taskId) {
    await this.pool.execute(
      `UPDATE video_custom_generations 
       SET video_task_id = ?, status = 'generating_video', video_status = 'processing'
       WHERE id = ?`,
      [taskId, id]
    );
    
    await this.appendLog(id, `Video generation started with task ID: ${taskId}`);
  }

  async updateVideoCompleted(taskId, videoUrl) {
    await this.pool.execute(
      `UPDATE video_custom_generations 
       SET video_url = ?, video_status = 'completed'
       WHERE video_task_id = ?`,
      [videoUrl, taskId]
    );
    
    // Get generation ID to append log
    const [rows] = await this.pool.execute(
      'SELECT id FROM video_custom_generations WHERE video_task_id = ?',
      [taskId]
    );
    
    if (rows.length > 0) {
      await this.appendLog(rows[0].id, `✅ Video generation completed`);
    }
  }

  async updateVideoFailed(taskId, errorMessage) {
    await this.pool.execute(
      `UPDATE video_custom_generations 
       SET video_status = 'failed', status = 'failed', error_message = ?
       WHERE video_task_id = ?`,
      [errorMessage, taskId]
    );
    
    const [rows] = await this.pool.execute(
      'SELECT id FROM video_custom_generations WHERE video_task_id = ?',
      [taskId]
    );
    
    if (rows.length > 0) {
      await this.appendLog(rows[0].id, `❌ Video generation failed: ${errorMessage}`);
    }
  }

  async updateAudioCompleted(id, audioUrl) {
    await this.pool.execute(
      `UPDATE video_custom_generations 
       SET audio_url = ?, audio_status = 'completed'
       WHERE id = ?`,
      [audioUrl, id]
    );
    
    await this.appendLog(id, `✅ Audio generation completed`);
  }

  async updateAudioFailed(id, errorMessage) {
    await this.pool.execute(
      `UPDATE video_custom_generations 
       SET audio_status = 'failed', status = 'failed', error_message = ?
       WHERE id = ?`,
      [errorMessage, id]
    );
    
    await this.appendLog(id, `❌ Audio generation failed: ${errorMessage}`);
  }

  async updateSyncTask(id, taskId) {
    await this.pool.execute(
      `UPDATE video_custom_generations 
       SET sync_task_id = ?, status = 'syncing', sync_status = 'processing'
       WHERE id = ?`,
      [taskId, id]
    );
    
    await this.appendLog(id, `🔄 Sync started with task ID: ${taskId}`);
  }

  async updateSyncCompleted(taskId, finalVideoUrl, localPath) {
    const endTime = Date.now();
    
    const [rows] = await this.pool.execute(
      'SELECT id, created_at FROM video_custom_generations WHERE sync_task_id = ?',
      [taskId]
    );

    if (rows.length > 0) {
      const startTime = new Date(rows[0].created_at).getTime();
      const costTime = Math.floor((endTime - startTime) / 1000);

      await this.pool.execute(
        `UPDATE video_custom_generations 
         SET final_video_url = ?, local_final_path = ?, sync_status = 'completed', 
             status = 'completed', cost_time = ?
         WHERE sync_task_id = ?`,
        [finalVideoUrl, localPath, costTime, taskId]
      );
      
      await this.appendLog(rows[0].id, `✅ Sync completed! Total time: ${costTime} seconds`);
    }
  }

  async updateSyncFailed(taskId, errorMessage) {
    await this.pool.execute(
      `UPDATE video_custom_generations 
       SET sync_status = 'failed', status = 'failed', error_message = ?
       WHERE sync_task_id = ?`,
      [errorMessage, taskId]
    );
    
    const [rows] = await this.pool.execute(
      'SELECT id FROM video_custom_generations WHERE sync_task_id = ?',
      [taskId]
    );
    
    if (rows.length > 0) {
      await this.appendLog(rows[0].id, `❌ Sync failed: ${errorMessage}`);
    }
  }

  async findByVideoTaskId(taskId) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM video_custom_generations WHERE video_task_id = ?',
      [taskId]
    );
    return rows[0] || null;
  }

  async findBySyncTaskId(taskId) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM video_custom_generations WHERE sync_task_id = ?',
      [taskId]
    );
    return rows[0] || null;
  }

  async findPendingSync() {
    const [rows] = await this.pool.execute(
      `SELECT * FROM video_custom_generations 
       WHERE video_status = 'completed' 
         AND audio_status = 'completed' 
         AND sync_status = 'pending'
       ORDER BY created_at ASC`
    );
    return rows;
  }

  async deleteExpired() {
    const [rows] = await this.pool.execute(
      `SELECT id, local_image_path, local_final_path, audio_url 
       FROM video_custom_generations 
       WHERE expires_at < NOW()`
    );

    for (const row of rows) {
      if (row.local_image_path && !row.local_image_path.includes('pending')) {
        try {
          await fs.unlink(row.local_image_path);
        } catch (err) {
          console.error(`Failed to delete image: ${row.local_image_path}`, err);
        }
      }

      if (row.local_final_path) {
        try {
          await fs.unlink(row.local_final_path);
        } catch (err) {
          console.error(`Failed to delete video: ${row.local_final_path}`, err);
        }
      }

      if (row.audio_url && row.audio_url.includes('/uploads/video-custom/audio/')) {
        try {
          const audioFilename = row.audio_url.split('/').pop();
          const audioPath = path.join('uploads/video-custom/audio', audioFilename);
          await fs.unlink(audioPath);
        } catch (err) {
          console.error(`Failed to delete audio: ${row.audio_url}`, err);
        }
      }
    }

    const [result] = await this.pool.execute(
      'DELETE FROM video_custom_generations WHERE expires_at < NOW()'
    );

    return result.affectedRows;
  }

  async countByUserId(userId) {
    const [rows] = await this.pool.execute(
      'SELECT COUNT(*) as total FROM video_custom_generations WHERE user_id = ?',
      [userId]
    );
    return rows[0].total;
  }
}

module.exports = VideoCustomModel;