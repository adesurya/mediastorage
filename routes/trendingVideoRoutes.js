// routes/trendingVideoRoutes.js - UPDATE
const express = require('express');
const router = express.Router();
const TrendingVideoController = require('../controllers/TrendingVideoController');
const TrendingVideoIdeaController = require('../controllers/TrendingVideoIdeaController');

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

const optionalAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    req.user = {
      id: req.session.userId,
      username: req.session.user?.username,
      role: req.session.user?.role
    };
  }
  next();
};

let controller;
let ideaController;

function initTrendingVideoRoutes(pool) {
  controller = new TrendingVideoController(pool);
  ideaController = new TrendingVideoIdeaController(pool);

  // Trending video routes
  router.get('/search', optionalAuth, (req, res) => controller.search(req, res));
  router.get('/popular', (req, res) => controller.getPopular(req, res));
  router.get('/history', sessionAuth, (req, res) => controller.getHistory(req, res));

  // Idea generation routes
  router.post('/generate-idea', sessionAuth, (req, res) => ideaController.generateIdea(req, res));
  router.get('/idea-status/:ideaId', sessionAuth, (req, res) => ideaController.getStatus(req, res));
  router.get('/idea-result/:ideaId', sessionAuth, (req, res) => ideaController.getResult(req, res));
  router.get('/idea-stream/:ideaId', sessionAuth, (req, res) => ideaController.streamResult(req, res));
  router.get('/idea-history', sessionAuth, (req, res) => ideaController.getHistory(req, res));

  return router;
}

module.exports = initTrendingVideoRoutes;