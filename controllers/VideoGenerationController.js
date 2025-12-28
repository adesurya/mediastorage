// controllers/VideoGenerationController.js
const VideoGenerationModel = require('../models/VideoGenerationModel');
const VideoGenerationService = require('../services/VideoGenerationService');
const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

class VideoGenerationController {
  constructor(db) {
    this.model = new VideoGenerationModel(db);
    this.service = new VideoGenerationService();
  }

  // Upload middleware
  getUploadMiddleware() {
    return upload.fields([
      { name: 'scene1_image1', maxCount: 1 },
      { name: 'scene1_image2', maxCount: 1 },
      { name: 'scene2_image1', maxCount: 1 },
      { name: 'scene2_image2', maxCount: 1 },
      { name: 'scene3_image1', maxCount: 1 },
      { name: 'scene3_image2', maxCount: 1 },
      { name: 'scene4_image1', maxCount: 1 },
      { name: 'scene4_image2', maxCount: 1 },
      { name: 'scene5_image1', maxCount: 1 },
      { name: 'scene5_image2', maxCount: 1 },
      { name: 'scene6_image1', maxCount: 1 },
      { name: 'scene6_image2', maxCount: 1 }
    ]);
  }

  // Create new video generation
  async create(req, res) {
    try {
      const userId = req.session.userId;
      const { title, scenes: scenesData } = req.body;

      if (!title) {
        return res.status(400).json({ success: false, message: 'Title is required' });
      }

      // Parse scenes data
      const scenes = JSON.parse(scenesData);
      
      if (!scenes || scenes.length === 0) {
        return res.status(400).json({ success: false, message: 'At least one scene is required' });
      }

      // Upload images and prepare scenes
      const preparedScenes = [];
      
      for (let i = 0; i < scenes.length; i++) {
        const sceneNum = i + 1;
        const scene = scenes[i];

        // Upload image1
        const image1File = req.files[`scene${sceneNum}_image1`]?.[0];
        if (!image1File) {
          return res.status(400).json({ 
            success: false, 
            message: `Scene ${sceneNum}: Image 1 is required` 
          });
        }

        const image1 = await this.service.uploadImage(image1File, userId);

        // Upload image2 if provided
        let image2 = null;
        const image2File = req.files[`scene${sceneNum}_image2`]?.[0];
        if (image2File) {
          image2 = await this.service.uploadImage(image2File, userId);
        }

        preparedScenes.push({
          prompt: scene.prompt,
          image1_url: image1.publicUrl,
          image2_url: image2?.publicUrl || null
        });
      }

      // Create generation in database
      const generationId = await this.model.create(userId, title, preparedScenes);

      // Get full generation data with scenes
      const generation = await this.model.getById(generationId, userId);

      // Start async generation process (don't wait)
      this.startGeneration(generation).catch(err => {
        console.error('Generation error:', err);
      });

      res.json({
        success: true,
        message: 'Video generation started',
        data: {
          generationId,
          estimatedTime: this.service.getEstimatedTimeMessage()
        }
      });

    } catch (error) {
      console.error('Create generation error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  // Start generation process (async)
  async startGeneration(generation) {
    try {
      // Generate all scenes in parallel
      const results = await this.service.generateMultipleScenes(
        generation.scenes, 
        this.model
      );

      console.log(`Generation ${generation.id} started:`, results);
    } catch (error) {
      console.error('Start generation error:', error);
    }
  }

  // Handle callback from API
  async handleCallback(req, res) {
    try {
      const callbackData = req.body;
      const result = await this.service.handleCallback(callbackData);

      if (result.success) {
        // Get scene info
        const scene = await this.model.getSceneByTaskId(result.taskId);
        if (!scene) {
          return res.status(404).json({ success: false, message: 'Scene not found' });
        }

        // Download video to local server
        const videoFile = await this.service.downloadVideo(
          result.videoUrl,
          scene.generation_id,
          scene.scene_number
        );

        // Update scene status
        await this.model.updateSceneComplete(
          result.taskId,
          videoFile.publicUrl,
          result.originalUrl,
          result.resolution,
          result.fallbackFlag
        );

        console.log(`Scene ${scene.id} completed successfully`);
      } else {
        // Update scene as failed
        await this.model.updateSceneFailed(result.taskId, result.errorMessage);
        console.error(`Scene failed:`, result.errorMessage);
      }

      res.json({ success: true, message: 'Callback processed' });
    } catch (error) {
      console.error('Callback error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get generation by ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.session.userId;

      const generation = await this.model.getById(id, userId);

      if (!generation) {
        return res.status(404).json({ success: false, message: 'Generation not found' });
      }

      res.json({ success: true, data: generation });
    } catch (error) {
      console.error('Get generation error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get user history
  async getHistory(req, res) {
    try {
      const userId = req.session.userId;
      const limit = parseInt(req.query.limit) || 20;

      const history = await this.model.getUserHistory(userId, limit);

      res.json({ success: true, data: history });
    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Delete generation
  async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.session.userId;

      const generation = await this.model.getById(id, userId);
      if (!generation) {
        return res.status(404).json({ success: false, message: 'Generation not found' });
      }

      // Delete will cascade to scenes
      await this.model.db.query('DELETE FROM video_generations WHERE id = ?', [id]);

      res.json({ success: true, message: 'Generation deleted' });
    } catch (error) {
      console.error('Delete generation error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = VideoGenerationController;