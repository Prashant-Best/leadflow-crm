const { body, query, checkExact } = require('express-validator');
const { ACTIVITY_TYPES, ACTIVITY_STATUSES } = require('../constants/enums');
const { idParam, isIsoDateTimeWithZone } = require('./common');

const titleRule = (isUpdate) => {
  const chain = body('title');
  if (isUpdate) chain.optional();
  else chain.exists({ values: 'null' }).withMessage('Title is required').bail();
  return chain
    .isString()
    .withMessage('Title must be text')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 150 })
    .withMessage('Title must be at most 150 characters');
};

const dueAtRule = (isUpdate) => {
  const chain = body('dueAt');
  if (isUpdate) chain.optional();
  else chain.exists({ values: 'falsy' }).withMessage('Due date and time is required').bail();
  return chain.custom(isIsoDateTimeWithZone).bail().toDate();
};

const commonRules = (isUpdate) => [
  titleRule(isUpdate),
  dueAtRule(isUpdate),
  body('type')
    .optional()
    .isIn(ACTIVITY_TYPES)
    .withMessage(`Type must be one of: ${ACTIVITY_TYPES.join(', ')}`),
  body('notes')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Notes must be text')
    .bail()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be at most 1000 characters'),
];

const listActivitiesRules = [
  checkExact(
    [
      query('status')
        .optional()
        .isIn(ACTIVITY_STATUSES)
        .withMessage(`Status must be one of: ${ACTIVITY_STATUSES.join(', ')}`),
      query('overdue')
        .optional()
        .isIn(['true', 'false'])
        .withMessage('overdue must be true or false'),
      query('leadId').optional().isMongoId().withMessage('Invalid lead id format'),
    ],
    { locations: ['query'] }
  ),
];

// status and completedAt are not accepted on create: new follow-ups always start
// as Pending and completedAt is set by the server.
const createActivityRules = [
  checkExact(
    [
      body('leadId')
        .exists({ values: 'falsy' })
        .withMessage('Lead is required')
        .bail()
        .isMongoId()
        .withMessage('Invalid lead id format'),
      ...commonRules(false),
    ],
    { locations: ['body', 'query'] }
  ),
];

// leadId cannot be changed after creation; completedAt is server-controlled.
const updateActivityRules = [
  checkExact(
    [
      idParam(),
      ...commonRules(true),
      body('status')
        .optional()
        .isIn(ACTIVITY_STATUSES)
        .withMessage(`Status must be one of: ${ACTIVITY_STATUSES.join(', ')}`),
    ],
    { locations: ['body', 'query'] }
  ),
];

module.exports = { listActivitiesRules, createActivityRules, updateActivityRules };
