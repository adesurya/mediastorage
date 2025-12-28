// routes/videoGenerationRoutes.js
const express = require('express');
const VideoGenerationController = require('../controllers/VideoGenerationController');

const initVideoGenerationRoutes = (db) => {
  const router = express.Router();
  const controller = new VideoGenerationController(db);

  // Create new video generation
  router.post(
    '/generate',
    controller.getUploadMiddleware(),
    (req, res) => controller.create(req, res)
  );

  // Get generation by ID
  router.get('/generation/:id', (req, res) => controller.getById(req, res));

  // Get user history
  router.get('/history', (req, res) => controller.getHistory(req, res));

  // Delete generation
  router.delete('/generation/:id', (req, res) => controller.delete(req, res));

  // Callback endpoint (public - no auth needed)
  router.post('/callback', (req, res) => controller.handleCallback(req, res));

  return router;
};

module.exports = initVideoGenerationRoutes;