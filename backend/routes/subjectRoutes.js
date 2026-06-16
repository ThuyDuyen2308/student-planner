const express = require('express');
const subjectController = require('../controllers/subjectController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, subjectController.getSubjects);
router.get('/:id', authMiddleware, subjectController.getSubjectById);

module.exports = router;
