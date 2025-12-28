// routes/videoCustomRoutes.js
const express = require('express');
const { apiAuthMiddleware } = require('../middleware/auth');

function initVideoCustomRoutes(pool) {
  const router = express.Router();
  const VideoCustomController = require('../controllers/VideoCustomController');
  const controller = new VideoCustomController(pool);

  // API routes only
  router.post('/create', apiAuthMiddleware, controller.create);
  router.get('/status/:id', apiAuthMiddleware, controller.getStatus);
  router.get('/download/:id', apiAuthMiddleware, controller.download);

  // Webhook routes (no auth)
  router.post('/webhook/video', controller.handleVideoWebhook);
  router.post('/webhook/sync', controller.handleSyncWebhook);

  return router;
}

module.exports = initVideoCustomRoutes;