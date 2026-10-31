const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const ApiError = require('../utils/ApiError');
const escapeRegex = require('../utils/escapeRegex');
const { sendSuccess } = require('../utils/apiResponse');
const { validatedData } = require('../middleware/validate');

// GET /leads?search=&stage=
// Only the logged-in user's leads. Search matches name or company, case-insensitive.
async function listLeads(req, res) {
  const { search, stage } = validatedData(req, 'query');

  const filter = { createdBy: req.user._id };
  if (stage) filter.stage = stage;
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: pattern }, { company: pattern }];
  }

  const leads = await Lead.find(filter).sort({ createdAt: -1, _id: -1 });
  sendSuccess(res, { message: 'Leads fetched', data: { items: leads, count: leads.length } });
}

// POST /leads - createdBy always comes from the token, never from the body.
async function createLead(req, res) {
  const lead = await Lead.create({ ...validatedData(req, 'body'), createdBy: req.user._id });
  sendSuccess(res, { statusCode: 201, message: 'Lead created', data: { lead } });
}

// GET /leads/:id - req.doc was loaded and ownership-checked by loadOwned.
function getLead(req, res) {
  sendSuccess(res, { message: 'Lead fetched', data: { lead: req.doc } });
}

// PATCH /leads/:id - only allowlisted fields reach this point (see validators).
async function updateLead(req, res) {
  const updates = validatedData(req, 'body');
  if (Object.keys(updates).length === 0) {
    throw ApiError.badRequest('Provide at least one field to update');
  }

  // set() + save() runs the schema validators on the merged document, so the
  // "email or phone" rule still holds after a partial update.
  req.doc.set(updates);
  await req.doc.save();

  sendSuccess(res, { message: 'Lead updated', data: { lead: req.doc } });
}

// DELETE /leads/:id - follow-ups are deleted first so none are left pointing
// at a lead that no longer exists.
async function deleteLead(req, res) {
  const { deletedCount } = await Activity.deleteMany({ leadId: req.doc._id });
  await req.doc.deleteOne();

  sendSuccess(res, {
    message: 'Lead and its follow-ups deleted',
    data: { id: req.doc.id, deletedActivities: deletedCount },
  });
}

module.exports = { listLeads, createLead, getLead, updateLead, deleteLead };
