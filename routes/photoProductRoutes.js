// routes/photoProductRoutes.js
const express = require('express');
const PhotoProductController = require('../controllers/PhotoProductController');

const initPhotoProductRoutes = (db) => {
  const router = express.Router();
  const controller = new PhotoProductController(db);

  // Optimize prompt with OpenAI
  router.post('/optimize-prompt', (req, res) => controller.optimizePrompt(req, res));

  // Create new Photo Product (with image upload)
  router.post('/generate', controller.getUploadMiddleware(), (req, res) => controller.create(req, res));

  // Get product by ID
  router.get('/product/:id', (req, res) => controller.getById(req, res));

  // Get user history
  router.get('/history', (req, res) => controller.getHistory(req, res));

  // Delete product
  router.delete('/product/:id', (req, res) => controller.delete(req, res));

  // Callback endpoint (public - no auth needed)
  router.post('/callback', (req, res) => controller.handleCallback(req, res));

  return router;
};

module.exports = initPhotoProductRoutes;