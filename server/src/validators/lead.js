const { body, query, checkExact } = require('express-validator');
const { LEAD_STAGES, LEAD_SOURCES, SERVICE_INTERESTS } = require('../constants/enums');
const { PHONE_PATTERN } = require('../constants/patterns');
const { idParam } = require('./common');

// Optional fields where an empty value means "not provided".
const NULLABLE_LEAD_FIELDS = ['company', 'email', 'phone', 'budget', 'notes'];

function nameRule(isUpdate) {
  const chain = body('name');
  if (isUpdate) chain.optional();
  else chain.exists({ values: 'null' }).withMessage('Lead name is required').bail();
  return chain
    .isString()
    .withMessage('Lead name must be text')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Lead name is required')
    .isLength({ max: 100 })
    .withMessage('Lead name must be at most 100 characters');
}

// Fields shared by create and update. On update every field is optional and
// only the ones sent are changed.
function leadFieldRules(isUpdate) {
  return [
    nameRule(isUpdate),
    body('company')
      .optional({ values: 'null' })
      .isString()
      .withMessage('Company must be text')
      .bail()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Company must be at most 100 characters'),
    body('email')
      .optional({ values: 'null' })
      .isString()
      .withMessage('Email must be text')
      .bail()
      .trim()
      .toLowerCase()
      .isEmail()
      .withMessage('Enter a valid email address'),
    body('phone')
      .optional({ values: 'null' })
      .isString()
      .withMessage('Phone must be text')
      .bail()
      .trim()
      .matches(PHONE_PATTERN)
      .withMessage('Enter a valid phone number (7-15 digits, may start with +)'),
    body('serviceInterest')
      .optional()
      .isIn(SERVICE_INTERESTS)
      .withMessage(`Service interest must be one of: ${SERVICE_INTERESTS.join(', ')}`),
    body('source')
      .optional()
      .isIn(LEAD_SOURCES)
      .withMessage(`Source must be one of: ${LEAD_SOURCES.join(', ')}`),
    body('budget')
      .optional({ values: 'null' })
      .isFloat({ min: 0 })
      .withMessage('Budget must be a number of 0 or more')
      .toFloat(),
    body('stage')
      .optional()
      .isIn(LEAD_STAGES)
      .withMessage(`Stage must be one of: ${LEAD_STAGES.join(', ')}`),
    body('notes')
      .optional({ values: 'null' })
      .isString()
      .withMessage('Notes must be text')
      .bail()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes must be at most 1000 characters'),
  ];
}

// On create at least one contact method is required. On update the same rule
// is enforced by the model, which sees the merged (old + new) document.
const contactRequired = body('email').custom((value, { req }) => {
  if (value == null && req.body?.phone == null) {
    throw new Error('Provide at least an email or a phone number');
  }
  return true;
});

const listLeadsRules = [
  checkExact(
    [
      query('search')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Search text must be at most 100 characters'),
      query('stage')
        .optional()
        .isIn(LEAD_STAGES)
        .withMessage(`Stage must be one of: ${LEAD_STAGES.join(', ')}`),
      // active=true -> only leads that are not Won or Lost
      query('active').optional().isIn(['true', 'false']).withMessage('active must be true or false'),
    ],
    { locations: ['query'] }
  ),
];

const createLeadRules = [
  checkExact([contactRequired, ...leadFieldRules(false)], { locations: ['body', 'query'] }),
];

const updateLeadRules = [
  checkExact([idParam(), ...leadFieldRules(true)], { locations: ['body', 'query'] }),
];

const leadIdRules = [checkExact([idParam()], { locations: ['body', 'query'] })];

module.exports = {
  NULLABLE_LEAD_FIELDS,
  listLeadsRules,
  createLeadRules,
  updateLeadRules,
  leadIdRules,
};
