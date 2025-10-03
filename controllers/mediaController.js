const Media = require('../models/Media');
const Category = require('../models/Category');
const User = require('../models/User');
const fs = require('fs').promises;
const path = require('path');

class MediaController {
  static async index(req, res) {
    try {
      const currentUser = await User.findById(req.session.userId);
      const mediaFiles = await Media.findAll();
      const categories = await Category.findAll();
      const stats = await Media.getStats();
      
      res.render('media', { 
        media: mediaFiles,
        categories,
        stats,
        user: currentUser,
        baseUrl: process.env.BASE_URL || `http://${req.get('host')}`,
        error: null,
        success: null 
      });
    } catch (error) {
      console.error('Error fetching media:', error);
      res.status(500).send('Server error');
    }
  }

  static async dashboard(req, res) {
    try {
      const currentUser = await User.findById(req.session.userId);
      const recentMedia = await Media.findAll();
      const stats = await Media.getStats();
      const totalCategories = await Category.getStats();
      
      res.render('dashboard', { 
        user: currentUser,
        recentMedia: recentMedia.slice(0, 10),
        stats: {
          ...stats,
          totalCategories
        }
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
      res.status(500).send('Server error');
    }
  }

  static async getAllMedia(req, res) {
    try {
      const mediaFiles = await Media.findAll();
      res.json({ 
        success: true, 
        data: mediaFiles 
      });
    } catch (error) {
      console.error('Error fetching media:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  }

  static async getMediaById(req, res) {
    try {
      const media = await Media.findById(req.params.id);
      
      if (!media) {
        return res.status(404).json({ 
          success: false, 
          message: 'Media not found' 
        });
      }
      
      res.json({ 
        success: true, 
        data: media 
      });
    } catch (error) {
      console.error('Error fetching media:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  }

  static async uploadFlexible(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'No files uploaded' 
        });
      }

      const userId = req.session.userId || req.user?.id;
      const categoryId = req.body.category_id || null;
      const baseUrl = process.env.BASE_URL || `http://${req.get('host')}`;
      
      const uploadedFiles = [];
      const errors = [];

      for (const file of req.files) {
        try {
          const mediaData = {
            user_id: userId,
            category_id: categoryId,
            filename: file.filename,
            original_name: file.originalname,
            file_path: file.path,
            file_size: file.size,
            mime_type: file.mimetype,
            public_url: `${baseUrl}/uploads/${file.filename}`
          };

          const mediaId = await Media.create(mediaData);
          const newMedia = await Media.findById(mediaId);
          uploadedFiles.push(newMedia);
        } catch (error) {
          console.error(`Error uploading ${file.originalname}:`, error);
          errors.push({
            filename: file.originalname,
            error: error.message
          });
          
          // Clean up failed file
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
          }
        }
      }

      if (uploadedFiles.length === 0) {
        return res.status(500).json({ 
          success: false, 
          message: 'All uploads failed',
          errors 
        });
      }

      const message = uploadedFiles.length === 1 
        ? 'File uploaded successfully'
        : `${uploadedFiles.length} file(s) uploaded successfully`;

      res.status(201).json({ 
        success: true, 
        message,
        data: uploadedFiles.length === 1 ? uploadedFiles[0] : uploadedFiles,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error('Error uploading media:', error);
      
      // Clean up all uploaded files on complete failure
      if (req.files) {
        for (const file of req.files) {
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
          }
        }
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Server error during upload' 
      });
    }
  }

  static async uploadMedia(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'No file uploaded' 
        });
      }

      const userId = req.session.userId || req.user?.id;
      const categoryId = req.body.category_id || null;
      const baseUrl = process.env.BASE_URL || `http://${req.get('host')}`;
      
      const mediaData = {
        user_id: userId,
        category_id: categoryId,
        filename: req.file.filename,
        original_name: req.file.originalname,
        file_path: req.file.path,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        public_url: `${baseUrl}/uploads/${req.file.filename}`
      };

      const mediaId = await Media.create(mediaData);
      const newMedia = await Media.findById(mediaId);

      res.status(201).json({ 
        success: true, 
        message: 'File uploaded successfully',
        data: newMedia 
      });
    } catch (error) {
      console.error('Error uploading media:', error);
      
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Server error during upload' 
      });
    }
  }

  static async uploadMultipleMedia(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'No file uploaded' 
        });
      }

      const userId = req.session.userId || req.user?.id;
      const categoryId = req.body.category_id || null;
      const baseUrl = process.env.BASE_URL || `http://${req.get('host')}`;
      
      const mediaData = {
        user_id: userId,
        category_id: categoryId,
        filename: req.file.filename,
        original_name: req.file.originalname,
        file_path: req.file.path,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        public_url: `${baseUrl}/uploads/${req.file.filename}`
      };

      const mediaId = await Media.create(mediaData);
      const newMedia = await Media.findById(mediaId);

      res.status(201).json({ 
        success: true, 
        message: 'File uploaded successfully',
        data: newMedia 
      });
    } catch (error) {
      console.error('Error uploading media:', error);
      
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Server error during upload' 
      });
    }
  }

  static async uploadMultipleMedia(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'No files uploaded' 
        });
      }

      const userId = req.session.userId || req.user?.id;
      const categoryId = req.body.category_id || null;
      const baseUrl = process.env.BASE_URL || `http://${req.get('host')}`;
      
      const uploadedFiles = [];
      const errors = [];

      for (const file of req.files) {
        try {
          const mediaData = {
            user_id: userId,
            category_id: categoryId,
            filename: file.filename,
            original_name: file.originalname,
            file_path: file.path,
            file_size: file.size,
            mime_type: file.mimetype,
            public_url: `${baseUrl}/uploads/${file.filename}`
          };

          const mediaId = await Media.create(mediaData);
          const newMedia = await Media.findById(mediaId);
          uploadedFiles.push(newMedia);
        } catch (error) {
          console.error(`Error uploading ${file.originalname}:`, error);
          errors.push({
            filename: file.originalname,
            error: error.message
          });
          
          // Clean up failed file
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
          }
        }
      }

      if (uploadedFiles.length === 0) {
        return res.status(500).json({ 
          success: false, 
          message: 'All uploads failed',
          errors 
        });
      }

      res.status(201).json({ 
        success: true, 
        message: `${uploadedFiles.length} file(s) uploaded successfully`,
        data: uploadedFiles,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error('Error uploading multiple media:', error);
      
      // Clean up all uploaded files on complete failure
      if (req.files) {
        for (const file of req.files) {
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
          }
        }
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Server error during upload' 
      });
    }
  }

  static async updateMediaCategory(req, res) {
    try {
      const { id } = req.params;
      const { category_id } = req.body;

      const media = await Media.findById(id);
      if (!media) {
        return res.status(404).json({ 
          success: false, 
          message: 'Media not found' 
        });
      }

      await Media.updateCategory(id, category_id);
      const updatedMedia = await Media.findById(id);

      res.json({ 
        success: true, 
        message: 'Media category updated successfully',
        data: updatedMedia 
      });
    } catch (error) {
      console.error('Error updating media category:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  }

  static async deleteMedia(req, res) {
    try {
      const { id } = req.params;
      const media = await Media.findById(id);

      if (!media) {
        return res.status(404).json({ 
          success: false, 
          message: 'Media not found' 
        });
      }

      try {
        await fs.unlink(media.file_path);
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
      }

      await Media.delete(id);

      res.json({ 
        success: true, 
        message: 'Media deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting media:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  }

  static async downloadMedia(req, res) {
    try {
      const media = await Media.findById(req.params.id);

      if (!media) {
        return res.status(404).json({ 
          success: false, 
          message: 'Media not found' 
        });
      }

      res.download(media.file_path, media.original_name);
    } catch (error) {
      console.error('Error downloading media:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  }
}

module.exports = MediaController;