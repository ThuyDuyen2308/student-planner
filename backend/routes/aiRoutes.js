const express = require('express');
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.post('/summarize', aiController.summarize);
router.post('/quiz', aiController.generateQuiz);
router.post('/chat', aiController.chat);
router.get('/chat/:sessionId', aiController.getChatHistory);
router.post('/study-plan', aiController.planStudy);
router.get('/study-plan', aiController.getStudyPlans);

module.exports = router;
