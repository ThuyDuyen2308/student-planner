const express = require('express');
const authRoutes = require('./authRoutes');
const subjectRoutes = require('./subjectRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/subjects', subjectRoutes);

module.exports = router;
