const express = require('express');
const Lead = require('../models/Lead');
const leads = require('../controllers/leadController');
const { protect } = require('../middleware/auth');
const { validate, blankToNull } = require('../middleware/validate');
const loadOwned = require('../middleware/loadOwned');
const {
  NULLABLE_LEAD_FIELDS,
  listLeadsRules,
  createLeadRules,
  updateLeadRules,
  leadIdRules,
} = require('../validators/lead');

const router = express.Router();
const loadLead = loadOwned(Lead, 'Lead');

router.use(protect);

router
  .route('/')
  .get(validate(listLeadsRules), leads.listLeads)
  .post(blankToNull(NULLABLE_LEAD_FIELDS), validate(createLeadRules), leads.createLead);

router
  .route('/:id')
  .get(validate(leadIdRules), loadLead, leads.getLead)
  .patch(blankToNull(NULLABLE_LEAD_FIELDS), validate(updateLeadRules), loadLead, leads.updateLead)
  .delete(validate(leadIdRules), loadLead, leads.deleteLead);

module.exports = router;
