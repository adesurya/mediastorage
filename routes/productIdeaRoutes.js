// routes/productIdeaRoutes.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const ProductIdeaController = require('../controllers/ProductIdeaController');

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

function initProductIdeaRoutes(pool) {
  const controller = new ProductIdeaController(pool);

  // Upload image endpoint
  router.post('/upload-image', sessionAuth, (req, res) => controller.uploadImage(req, res));
  
  // Generate endpoint
  router.post('/generate', sessionAuth, (req, res) => controller.generate(req, res));
  
  router.get('/status/:ideaId', sessionAuth, (req, res) => controller.getStatus(req, res));
  router.get('/stream/:ideaId', sessionAuth, (req, res) => controller.streamResult(req, res));
  router.get('/history', sessionAuth, (req, res) => controller.getHistory(req, res));

  return router;
}

module.exports = initProductIdeaRoutes;