const express = require('express');
const syncController = require('../controllers/syncController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.post('/', syncController.triggerSync);
router.post('/extension', syncController.receiveExtensionData); // Nhận dữ liệu từ Chrome Extension
router.get('/dashboard', syncController.getDashboardData);

module.exports = router;
