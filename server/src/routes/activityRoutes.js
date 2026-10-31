const express = require('express');
const Activity = require('../models/Activity');
const activities = require('../controllers/activityController');
const { protect } = require('../middleware/auth');
const { validate, blankToNull } = require('../middleware/validate');
const loadOwned = require('../middleware/loadOwned');
const {
  listActivitiesRules,
  createActivityRules,
  updateActivityRules,
} = require('../validators/activity');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(validate(listActivitiesRules), activities.listActivities)
  .post(blankToNull(['notes']), validate(createActivityRules), activities.createActivity);

router.patch(
  '/:id',
  blankToNull(['notes']),
  validate(updateActivityRules),
  loadOwned(Activity, 'Follow-up'),
  activities.updateActivity
);

module.exports = router;
