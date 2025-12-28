// routes/removeBackgroundRoutes.js
const express = require('express');
const RemoveBackgroundController = require('../controllers/RemoveBackgroundController');

const initRemoveBackgroundRoutes = (db) => {
  const router = express.Router();
  const controller = new RemoveBackgroundController(db);

  // Create new remove background (with image upload)
  router.post('/generate', controller.getUploadMiddleware(), (req, res) => controller.create(req, res));

  // Get background by ID
  router.get('/background/:id', (req, res) => controller.getById(req, res));

  // Get user history
  router.get('/history', (req, res) => controller.getHistory(req, res));

  // Callback endpoint (public - no auth needed)
  router.post('/callback', (req, res) => controller.handleCallback(req, res));

  return router;
};

module.exports = initRemoveBackgroundRoutes;