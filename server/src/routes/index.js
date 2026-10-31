const express = require('express');
const { getHealth } = require('../controllers/healthController');
const ensureDb = require('../middleware/ensureDb');
const authRoutes = require('./authRoutes');
const leadRoutes = require('./leadRoutes');
const activityRoutes = require('./activityRoutes');
const dashboardRoutes = require('./dashboardRoutes');

const router = express.Router();

// Health is registered before ensureDb so it still answers (and reports the
// database state) when MongoDB is down.
router.get('/health', getHealth);

router.use(ensureDb);
router.use('/auth', authRoutes);
router.use('/leads', leadRoutes);
router.use('/activities', activityRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
