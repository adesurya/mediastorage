// routes/aiInfluencerRoutes.js
const express = require('express');
const AIInfluencerController = require('../controllers/AIInfluencerController');

const initAIInfluencerRoutes = (db) => {
  const router = express.Router();
  const controller = new AIInfluencerController(db);

  // Optimize prompt with OpenAI
  router.post('/optimize-prompt', (req, res) => controller.optimizePrompt(req, res));

  // Create new AI Influencer
  router.post('/generate', (req, res) => controller.create(req, res));

  // Get influencer by ID
  router.get('/influencer/:id', (req, res) => controller.getById(req, res));

  // Get user history
  router.get('/history', (req, res) => controller.getHistory(req, res));

  // Delete influencer
  router.delete('/influencer/:id', (req, res) => controller.delete(req, res));

  // Callback endpoint (public - no auth needed)
  router.post('/callback', (req, res) => controller.handleCallback(req, res));

  return router;
};

module.exports = initAIInfluencerRoutes;