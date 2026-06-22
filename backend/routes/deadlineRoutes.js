const express = require('express');
const deadlineController = require('../controllers/deadlineController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.post('/', deadlineController.createDeadline);
router.get('/', deadlineController.getDeadlines);
router.put('/:id', deadlineController.updateDeadline);
router.delete('/:id', deadlineController.deleteDeadline);

module.exports = router;
