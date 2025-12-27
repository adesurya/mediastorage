// routes/videoPromptingRoutes.js
const express = require('express');
const router = express.Router();
const VideoPromptingController = require('../controllers/VideoPromptingController');

const sessionAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    req.user = {
      id: req.session.userId,
      username: req.session.user?.username,
      role: req.session.user?.role
    };
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'Authentication required'
  });
};

function initVideoPromptingRoutes(pool) {
  const controller = new VideoPromptingController(pool);

  router.post('/generate', sessionAuth, (req, res) => controller.generate(req, res));
  router.get('/status/:promptingId', sessionAuth, (req, res) => controller.getStatus(req, res));
  router.get('/stream/:promptingId', sessionAuth, (req, res) => controller.streamResult(req, res));
  router.get('/history', sessionAuth, (req, res) => controller.getHistory(req, res));

  return router;
}

module.exports = initVideoPromptingRoutes;