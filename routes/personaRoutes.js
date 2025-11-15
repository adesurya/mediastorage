const express = require('express');
const router = express.Router();
const PersonaController = require('../controllers/personaController');
const { authMiddleware } = require('../middleware/auth');

// Routes
router.get('/', authMiddleware, PersonaController.showPersonaPage);
router.post('/optimize', authMiddleware, PersonaController.optimizePrompt);
router.post('/generate', authMiddleware, PersonaController.generatePersona);
router.get('/status/:requestId', authMiddleware, PersonaController.checkStatus);
router.get('/history', authMiddleware, PersonaController.getHistory);

module.exports = router;