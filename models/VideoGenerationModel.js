// models/VideoGenerationModel.js
const fs = require('fs').promises;
const path = require('path');

class VideoGenerationModel {
  constructor(db) {
    this.db = db;
  }

  // Create new video generation
  async create(userId, title, scenes) {
    const connection = await this.db.getConnection();
    try {
      await connection.beginTransaction();

      // Set expiration to 24 hours from now
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Create main generation record
      const [result] = await connection.query(
        `INSERT INTO video_generations (user_id, title, total_scenes, expires_at) 
         VALUES (?, ?, ?, ?)`,
        [userId, title, scenes.length, expiresAt]
      );

      const generationId = result.insertId;

      // Insert all scenes
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        await connection.query(
          `INSERT INTO video_scenes 
           (generation_id, scene_number, prompt, image1_url, image2_url) 
           VALUES (?, ?, ?, ?, ?)`,
          [generationId, i + 1, scene.prompt, scene.image1_url, scene.image2_url || null]
        );
      }

      await connection.commit();
      return generationId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get generation by ID with scenes
  async getById(generationId, userId = null) {
    const query = userId
      ? `SELECT * FROM video_generations WHERE id = ? AND user_id = ?`
      : `SELECT * FROM video_generations WHERE id = ?`;
    const params = userId ? [generationId, userId] : [generationId];

    const [generations] = await this.db.query(query, params);
    
    if (generations.length === 0) return null;

    const generation = generations[0];

    // Get all scenes
    const [scenes] = await this.db.query(
      `SELECT * FROM video_scenes WHERE generation_id = ? ORDER BY scene_number ASC`,
      [generationId]
    );

    return {
      ...generation,
      scenes
    };
  }

  // Update scene with task ID
  async updateSceneTaskId(sceneId, taskId) {
    await this.db.query(
      `UPDATE video_scenes SET task_id = ?, status = 'processing', updated_at = NOW() 
       WHERE id = ?`,
      [taskId, sceneId]
    );
  }

  // Update scene status on completion
  async updateSceneComplete(taskId, videoUrl, originalUrl, resolution, fallbackFlag) {
    const [result] = await this.db.query(
      `UPDATE video_scenes 
       SET status = 'completed', 
           video_url = ?, 
           original_url = ?,
           resolution = ?,
           fallback_flag = ?,
           updated_at = NOW() 
       WHERE task_id = ?`,
      [videoUrl, originalUrl, resolution, fallbackFlag, taskId]
    );

    // Update generation status
    if (result.affectedRows > 0) {
      const [scene] = await this.db.query(
        `SELECT generation_id FROM video_scenes WHERE task_id = ?`,
        [taskId]
      );
      
      if (scene.length > 0) {
        await this.updateGenerationStatus(scene[0].generation_id);
      }
    }
  }

  // Update scene status on failure
  async updateSceneFailed(taskId, errorMessage) {
    const [result] = await this.db.query(
      `UPDATE video_scenes 
       SET status = 'failed', error_message = ?, updated_at = NOW() 
       WHERE task_id = ?`,
      [errorMessage, taskId]
    );

    // Update generation status
    if (result.affectedRows > 0) {
      const [scene] = await this.db.query(
        `SELECT generation_id FROM video_scenes WHERE task_id = ?`,
        [taskId]
      );
      
      if (scene.length > 0) {
        await this.updateGenerationStatus(scene[0].generation_id);
      }
    }
  }

  // Update generation status based on scenes
  async updateGenerationStatus(generationId) {
    const [scenes] = await this.db.query(
      `SELECT status FROM video_scenes WHERE generation_id = ?`,
      [generationId]
    );

    const completed = scenes.filter(s => s.status === 'completed').length;
    const failed = scenes.filter(s => s.status === 'failed').length;
    const total = scenes.length;

    let status = 'processing';
    if (completed === total) {
      status = 'completed';
    } else if (completed + failed === total && completed > 0) {
      status = 'partial';
    } else if (failed === total) {
      status = 'failed';
    }

    await this.db.query(
      `UPDATE video_generations 
       SET status = ?, completed_scenes = ?, failed_scenes = ?, updated_at = NOW() 
       WHERE id = ?`,
      [status, completed, failed, generationId]
    );
  }

  // Get user history
  async getUserHistory(userId, limit = 20) {
    const [generations] = await this.db.query(
      `SELECT g.*, 
              (SELECT COUNT(*) FROM video_scenes WHERE generation_id = g.id AND status = 'completed') as completed_count,
              (SELECT COUNT(*) FROM video_scenes WHERE generation_id = g.id AND status = 'failed') as failed_count
       FROM video_generations g
       WHERE g.user_id = ? 
       ORDER BY g.created_at DESC 
       LIMIT ?`,
      [userId, limit]
    );

    return generations;
  }

  // Delete expired generations (called by cron)
  async deleteExpired() {
    const connection = await this.db.getConnection();
    try {
      await connection.beginTransaction();

      // Get expired generations with their scenes
      const [expired] = await connection.query(
        `SELECT g.id, s.video_url, s.original_url 
         FROM video_generations g
         LEFT JOIN video_scenes s ON g.id = s.generation_id
         WHERE g.expires_at < NOW() AND s.video_url IS NOT NULL`
      );

      // Delete video files
      for (const record of expired) {
        if (record.video_url) {
          try {
            const videoPath = path.join(__dirname, '..', 'public', record.video_url.replace(/^\//, ''));
            await fs.unlink(videoPath);
          } catch (err) {
            console.log(`Failed to delete video: ${err.message}`);
          }
        }
      }

      // Delete database records (cascades to scenes)
      const [result] = await connection.query(
        `DELETE FROM video_generations WHERE expires_at < NOW()`
      );

      await connection.commit();
      return result.affectedRows;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get scene by task ID for callback
  async getSceneByTaskId(taskId) {
    const [scenes] = await this.db.query(
      `SELECT * FROM video_scenes WHERE task_id = ?`,
      [taskId]
    );
    return scenes.length > 0 ? scenes[0] : null;
  }
}

module.exports = VideoGenerationModel;