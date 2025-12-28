// routes/photoStudioRoutes.js
const express = require('express');
const PhotoStudioController = require('../controllers/PhotoStudioController');

const initPhotoStudioRoutes = (db) => {
  const router = express.Router();
  const controller = new PhotoStudioController(db);

  // Get available styles
  router.get('/styles', (req, res) => controller.getStyles(req, res));

  // Create new Photo Studio (with image upload)
  router.post('/generate', controller.getUploadMiddleware(), (req, res) => controller.create(req, res));

  // Get studio by ID
  router.get('/studio/:id', (req, res) => controller.getById(req, res));

  // Get user history
  router.get('/history', (req, res) => controller.getHistory(req, res));

  // Callback endpoint (public - no auth needed)
  router.post('/callback', (req, res) => controller.handleCallback(req, res));

  return router;
};

module.exports = initPhotoStudioRoutes;