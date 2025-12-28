// controllers/VideoCustomController.js
const VideoCustomModel = require('../models/VideoCustomModel');
const VideoCustomService = require('../services/VideoCustomService');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const upload = multer({
  dest: 'uploads/temp/',
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
}).single('image');

class VideoCustomController {
  constructor(pool) {
    this.model = new VideoCustomModel(pool);
    this.service = new VideoCustomService();
  }

  create = async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      try {
        const { title, video_prompt, narration_text, voice_id } = req.body;

        if (!req.file) {
          return res.status(400).json({ error: 'Image is required' });
        }

        if (!title || !video_prompt || !narration_text || !voice_id) {
          return res.status(400).json({ error: 'All fields are required' });
        }

        const voices = [
          { name: 'Moncus', voiceId: 'IfTf4aIKP5HWjtR9yPZ2' },
          { name: 'Selina', voiceId: 'WQ4h6sgS9p2XXvLsESBT' },
          { name: 'Citra', voiceId: 'RbNgJzKAV7jpYJNtCBpj' },
          { name: 'Livna', voiceId: 'GdyFAZdMpKMBHw5pc1Bu' },
          { name: 'Anjani', voiceId: '52LXmmR0nGnIcDs1TL3f' }
        ];

        const voice = voices.find(v => v.voiceId === voice_id);
        if (!voice) {
          return res.status(400).json({ error: 'Invalid voice selected' });
        }

        // Create database record first to get ID
        const generationId = await this.model.create({
          user_id: req.user.id,
          title,
          image_url: 'pending', // temporary
          local_image_path: 'pending', // temporary
          video_prompt,
          narration_text,
          voice_id,
          voice_name: voice.name
        });

        // ✅ UBAH: Simpan image ke local (bukan IMGBB)
        const { localPath: imagePath, publicUrl: imageUrl } = await this.service.saveImageToLocal(
          req.file.path,
          generationId
        );

        // Update dengan path dan URL yang benar
        await this.model.updateImagePaths(generationId, imageUrl, imagePath);

        // Delete temp file
        await fs.unlink(req.file.path).catch(() => {});

        // Start async processing
        this.processGeneration(generationId).catch(error => {
          console.error(`Background processing error for generation ${generationId}:`, error);
        });

        res.json({
          success: true,
          generationId,
          message: 'Video generation started. This will take 1-2 minutes.'
        });

      } catch (error) {
        console.error('Error creating generation:', error);
        
        if (req.file && req.file.path) {
          try {
            await fs.unlink(req.file.path);
          } catch (unlinkError) {
            console.error('Error deleting temp file:', unlinkError);
          }
        }

        res.status(500).json({ error: 'Failed to start generation' });
      }
    });
  };

  processGeneration = async (generationId) => {
  try {
    const generation = await this.model.findById(generationId);
    if (!generation) {
      throw new Error('Generation not found');
    }

    // ✅ Log start
    await this.model.appendLog(generationId, '🚀 Starting video and audio generation...');

    // Process video and audio in parallel
    const [videoTaskId, audioBuffer] = await Promise.all([
      this.service.generateVideo(generation.image_url, generation.video_prompt),
      this.service.generateAudio(generation.narration_text, generation.voice_id)
    ]);

    // Update video task ID
    await this.model.updateVideoTask(generationId, videoTaskId);

    // Save audio to local
    const { localPath, publicUrl } = await this.service.saveAudioToLocal(audioBuffer, generationId);
    await this.model.updateAudioCompleted(generationId, publicUrl);

    console.log(`Generation ${generationId}: Video task ${videoTaskId} started, audio saved at ${publicUrl}`);

  } catch (error) {
    console.error(`Processing error for generation ${generationId}:`, error);
    await this.model.updateAudioFailed(generationId, error.message);
  }
};

  handleVideoWebhook = async (req, res) => {
    try {
      const { data } = req.body;

      if (!data || !data.taskId) {
        return res.status(400).json({ error: 'Invalid webhook data' });
      }

      const generation = await this.model.findByVideoTaskId(data.taskId);
      if (!generation) {
        console.log(`No generation found for video task: ${data.taskId}`);
        return res.json({ received: true });
      }

      if (data.state === 'success') {
        const resultJson = JSON.parse(data.resultJson);
        const videoUrl = resultJson.resultUrls[0];

        await this.model.updateVideoCompleted(data.taskId, videoUrl);
        console.log(`Video completed for generation ${generation.id}`);

        // Check if we can start sync
        await this.checkAndStartSync(generation.id);

      } else if (data.state === 'fail') {
        const errorMsg = data.failMsg || 'Video generation failed';
        await this.model.updateVideoFailed(data.taskId, errorMsg);
        console.error(`Video failed for generation ${generation.id}: ${errorMsg}`);
      }

      res.json({ received: true });

    } catch (error) {
      console.error('Video webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  };

  handleSyncWebhook = async (req, res) => {
    try {
      const { id, status, outputUrl, error: errorMsg } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Invalid webhook data' });
      }

      const generation = await this.model.findBySyncTaskId(id);
      if (!generation) {
        console.log(`No generation found for sync task: ${id}`);
        return res.json({ received: true });
      }

      if (status === 'COMPLETED' && outputUrl) {
        // Download final video
        const filename = `sijagoai_video_${generation.id}_${Date.now()}.mp4`;
        const localPath = path.join('uploads/video-custom', filename);
        
        await fs.mkdir(path.dirname(localPath), { recursive: true });
        await this.service.downloadFile(outputUrl, localPath);

        await this.model.updateSyncCompleted(id, outputUrl, localPath);
        console.log(`Sync completed for generation ${generation.id}`);

      } else if (status === 'FAILED') {
        await this.model.updateSyncFailed(id, errorMsg || 'Sync failed');
        console.error(`Sync failed for generation ${generation.id}: ${errorMsg}`);
      }

      res.json({ received: true });

    } catch (error) {
      console.error('Sync webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  };

  checkAndStartSync = async (generationId) => {
    try {
      const generation = await this.model.findById(generationId);
      
      if (!generation) return;

      if (generation.video_status === 'completed' && 
          generation.audio_status === 'completed' &&
          generation.sync_status === 'pending') {
        
        const syncTaskId = await this.service.syncVideoAudio(
          generation.video_url,
          generation.audio_url
        );

        await this.model.updateSyncTask(generationId, syncTaskId);
        console.log(`Sync started for generation ${generationId}: ${syncTaskId}`);
      }

    } catch (error) {
      console.error(`Error starting sync for generation ${generationId}:`, error);
      await this.model.updateSyncFailed(generationId, error.message);
    }
  };

  getStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const generation = await this.model.findById(id);

    if (!generation || generation.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Generation not found' });
    }

    res.json({
      id: generation.id,
      title: generation.title,
      status: generation.status,
      video_status: generation.video_status,
      audio_status: generation.audio_status,
      sync_status: generation.sync_status,
      final_video_url: generation.final_video_url,
      error_message: generation.error_message,
      process_log: generation.process_log, // ✅ Tambahkan ini
      cost_time: generation.cost_time,
      created_at: generation.created_at
    });

  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
};

  download = async (req, res) => {
    try {
      const { id } = req.params;
      const generation = await this.model.findById(id);

      if (!generation || generation.user_id !== req.user.id) {
        return res.status(404).send('Generation not found');
      }

      if (generation.status !== 'completed' || !generation.local_final_path) {
        return res.status(400).send('Video not ready');
      }

      const filename = `sijagoai_video_${generation.id}.mp4`;
      res.download(generation.local_final_path, filename);

    } catch (error) {
      console.error('Error downloading:', error);
      res.status(500).send('Download failed');
    }
  };
}

module.exports = VideoCustomController;