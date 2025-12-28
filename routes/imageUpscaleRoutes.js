// routes/imageUpscaleRoutes.js
const express = require('express');
const ImageUpscaleController = require('../controllers/ImageUpscaleController');

const initImageUpscaleRoutes = (db) => {
  const router = express.Router();
  const controller = new ImageUpscaleController(db);

  // Create new upscale (with image upload)
  router.post('/generate', controller.getUploadMiddleware(), (req, res) => controller.create(req, res));

  // Get upscale by ID
  router.get('/upscale/:id', (req, res) => controller.getById(req, res));

  // Get user history
  router.get('/history', (req, res) => controller.getHistory(req, res));

  // Callback endpoint (public - no auth needed)
  router.post('/callback', (req, res) => controller.handleCallback(req, res));

  return router;
};

module.exports = initImageUpscaleRoutes;