// Single source of truth for every option list used by the models and validators.
// The client keeps a copy in client/src/constants/enums.js - update both together.

const LEAD_STAGES = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];
const CLOSED_STAGES = ['Won', 'Lost'];

const LEAD_SOURCES = ['Website', 'Referral', 'Social Media', 'Email', 'Direct Outreach', 'Other'];

const SERVICE_INTERESTS = [
  'Website Development',
  'SEO',
  'Social Media Marketing',
  'Paid Ads',
  'Branding',
  'Other',
];

const ACTIVITY_TYPES = ['Call', 'Email', 'Meeting', 'Task'];
const ACTIVITY_STATUSES = ['Pending', 'Completed'];

const USER_ROLES = ['admin'];

module.exports = {
  LEAD_STAGES,
  CLOSED_STAGES,
  LEAD_SOURCES,
  SERVICE_INTERESTS,
  ACTIVITY_TYPES,
  ACTIVITY_STATUSES,
  USER_ROLES,
};
