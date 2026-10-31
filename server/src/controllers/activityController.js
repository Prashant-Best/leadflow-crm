const Activity = require('../models/Activity');
const Lead = require('../models/Lead');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { validatedData } = require('../middleware/validate');

const LEAD_SUMMARY_FIELDS = 'name company stage';

// GET /activities?status=&overdue=&leadId=
async function listActivities(req, res) {
  const { status, overdue, leadId } = validatedData(req, 'query');

  const filter = { createdBy: req.user._id };
  if (status) filter.status = status;
  if (leadId) filter.leadId = leadId;
  if (overdue === 'true') {
    filter.status = 'Pending';
    filter.dueAt = { $lt: new Date() };
  }

  const activities = await Activity.find(filter)
    .sort({ dueAt: 1 })
    .populate('leadId', LEAD_SUMMARY_FIELDS);

  sendSuccess(res, {
    message: 'Follow-ups fetched',
    data: { items: activities, count: activities.length },
  });
}

// POST /activities - the lead must exist and belong to the logged-in user.
async function createActivity(req, res) {
  const data = validatedData(req, 'body');

  const lead = await Lead.findById(data.leadId);
  if (!lead) {
    throw ApiError.notFound('Lead not found', [{ field: 'leadId', message: 'Lead does not exist' }]);
  }
  if (!lead.createdBy.equals(req.user._id)) {
    throw ApiError.forbidden('You do not have access to this lead');
  }

  const activity = await Activity.create({ ...data, createdBy: req.user._id, status: 'Pending' });
  await activity.populate('leadId', LEAD_SUMMARY_FIELDS);

  sendSuccess(res, { statusCode: 201, message: 'Follow-up created', data: { activity } });
}

// PATCH /activities/:id - edit fields or mark complete.
async function updateActivity(req, res) {
  const { status, ...fields } = validatedData(req, 'body');
  const activity = req.doc;

  if (status === undefined && Object.keys(fields).length === 0) {
    throw ApiError.badRequest('Provide at least one field to update');
  }

  if (status === 'Pending' && activity.status === 'Completed') {
    throw ApiError.badRequest('A completed follow-up cannot be reopened');
  }

  // completedAt is recorded by the server the first time it is completed.
  // Completing an already completed follow-up keeps the original time.
  if (status === 'Completed' && activity.status !== 'Completed') {
    activity.status = 'Completed';
    activity.completedAt = new Date();
  }

  activity.set(fields);
  await activity.save();
  await activity.populate('leadId', LEAD_SUMMARY_FIELDS);

  sendSuccess(res, { message: 'Follow-up updated', data: { activity } });
}

module.exports = { listActivities, createActivity, updateActivity };
