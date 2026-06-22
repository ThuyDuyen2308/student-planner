const express = require('express');
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(authMiddleware);

router.post('/upload', upload.single('document'), documentController.uploadDocument);
router.get('/', documentController.getMyDocuments);
router.get('/:id/download', documentController.downloadDocument);
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
