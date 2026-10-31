const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const { LEAD_STAGES, CLOSED_STAGES } = require('../constants/enums');
const { sendSuccess } = require('../utils/apiResponse');

// GET /dashboard/summary
// Every number is counted from the database for the logged-in user at request time.
async function getSummary(req, res) {
  const owner = { createdBy: req.user._id };
  const now = new Date();

  const [
    totalLeads,
    activeLeads,
    wonLeads,
    lostLeads,
    pendingFollowUps,
    overdueFollowUps,
    completedFollowUps,
    stageCounts,
    upcomingFollowUps,
  ] = await Promise.all([
    Lead.countDocuments(owner),
    Lead.countDocuments({ ...owner, stage: { $nin: CLOSED_STAGES } }),
    Lead.countDocuments({ ...owner, stage: 'Won' }),
    Lead.countDocuments({ ...owner, stage: 'Lost' }),
    Activity.countDocuments({ ...owner, status: 'Pending' }),
    Activity.countDocuments({ ...owner, status: 'Pending', dueAt: { $lt: now } }),
    Activity.countDocuments({ ...owner, status: 'Completed' }),
    Lead.aggregate([{ $match: owner }, { $group: { _id: '$stage', count: { $sum: 1 } } }]),
    Activity.find({ ...owner, status: 'Pending' })
      .sort({ dueAt: 1 })
      .limit(5)
      .populate('leadId', 'name company stage'),
  ]);

  // Always return every stage, including the ones with zero leads.
  const countByStage = Object.fromEntries(stageCounts.map((s) => [s._id, s.count]));
  const leadsByStage = LEAD_STAGES.map((stage) => ({ stage, count: countByStage[stage] || 0 }));

  sendSuccess(res, {
    message: 'Dashboard summary fetched',
    data: {
      totalLeads,
      activeLeads,
      wonLeads,
      lostLeads,
      pendingFollowUps,
      overdueFollowUps,
      completedFollowUps,
      leadsByStage,
      upcomingFollowUps,
      generatedAt: now.toISOString(),
    },
  });
}

module.exports = { getSummary };
