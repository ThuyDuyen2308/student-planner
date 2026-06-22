const express = require('express');
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload'); // Giới hạn 10MB là đủ cho cả tài liệu và ảnh

const router = express.Router();

router.use(authMiddleware);

router.put('/', profileController.updateProfile);
router.post('/avatar', upload.single('avatar'), profileController.uploadAvatar);

module.exports = router;
