const axios = require('axios');
const Media = require('../models/Media');
const User = require('../models/User');

const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY || 'S2V39HOHKC2rrB77rCB9nUEgsl5cdxrU6cN1dno3';
const SHOTSTACK_BASE_URL = 'https://api.shotstack.io/edit/stage';

// Template IDs untuk setiap style
const VIDEO_STYLES = {
  'style1': '986212b8-3d6a-488b-9685-ed1108285841',
  'style2': '986212b8-3d6a-488b-9685-ed1108285842', // Ganti dengan ID template asli
  'style3': '986212b8-3d6a-488b-9685-ed1108285843', // Ganti dengan ID template asli
};

class VideoController {
  static async index(req, res) {
    try {
      const currentUser = await User.findById(req.session.userId);
      const videoFiles = await Media.findAll();
      
      // Filter hanya video files
      const videos = videoFiles.filter(media => 
        media.mime_type && media.mime_type.startsWith('video/')
      );
      
      res.render('generate-video', { 
        videos,
        user: currentUser,
        styles: Object.keys(VIDEO_STYLES),
        error: null,
        success: null 
      });
    } catch (error) {
      console.error('Error loading generate video page:', error);
      res.status(500).send('Server error');
    }
  }

  static async renderVideo(req, res) {
    try {
      const { styleId, clips } = req.body;

      if (!styleId || !clips || clips.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Style and clips are required' 
        });
      }

      // Validasi bahwa clips adalah array dengan 12 elemen
      if (clips.length !== 12) {
        return res.status(400).json({ 
          success: false, 
          message: 'Exactly 12 video clips are required' 
        });
      }

      const templateId = VIDEO_STYLES[styleId];
      if (!templateId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid style selected' 
        });
      }

      // Build merge array
      const merge = clips.map((clipUrl, index) => ({
        find: `clip${index + 1}`,
        replace: clipUrl
      }));

      // Call Shotstack API
      const response = await axios.post(
        `${SHOTSTACK_BASE_URL}/templates/render`,
        {
          id: templateId,
          merge: merge
        },
        {
          headers: {
            'x-api-key': SHOTSTACK_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        res.json({
          success: true,
          message: 'Video render queued successfully',
          data: {
            renderId: response.data.response.id,
            message: response.data.response.message
          }
        });
      } else {
        throw new Error('Failed to queue render');
      }
    } catch (error) {
      console.error('Error rendering video:', error.response?.data || error.message);
      res.status(500).json({ 
        success: false, 
        message: error.response?.data?.message || 'Failed to render video' 
      });
    }
  }

  static async checkRenderStatus(req, res) {
    try {
      const { renderId } = req.params;

      if (!renderId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Render ID is required' 
        });
      }

      const response = await axios.get(
        `${SHOTSTACK_BASE_URL}/render/${renderId}`,
        {
          headers: {
            'Accept': 'application/json',
            'x-api-key': SHOTSTACK_API_KEY
          }
        }
      );

      if (response.data.success) {
        res.json({
          success: true,
          data: response.data.response
        });
      } else {
        throw new Error('Failed to get render status');
      }
    } catch (error) {
      console.error('Error checking render status:', error.response?.data || error.message);
      res.status(500).json({ 
        success: false, 
        message: error.response?.data?.message || 'Failed to check render status' 
      });
    }
  }
}

module.exports = VideoController;