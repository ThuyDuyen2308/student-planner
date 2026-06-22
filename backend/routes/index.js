const express = require('express');
const authRoutes = require('./authRoutes');
const documentRoutes = require('./documentRoutes');
const profileRoutes = require('./profileRoutes');
const syncRoutes = require('./syncRoutes');
const aiRoutes = require('./aiRoutes');
const deadlineRoutes = require('./deadlineRoutes'); // Added deadline routes
// const scheduleRoutes = require('./scheduleRoutes'); // To be updated later

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/profile', profileRoutes);
router.use('/sync', syncRoutes);
router.use('/ai', aiRoutes);
router.use('/deadlines', deadlineRoutes);

module.exports = router;
