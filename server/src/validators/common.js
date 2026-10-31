const { param } = require('express-validator');

const idParam = () => param('id').isMongoId().withMessage('Invalid id format');

// Accepts only ISO 8601 date-times that carry a timezone (Z or +05:30), so the
// stored moment in time is never ambiguous.
const ISO_WITH_TIMEZONE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

function isIsoDateTimeWithZone(value) {
  if (typeof value !== 'string' || !ISO_WITH_TIMEZONE.test(value) || Number.isNaN(Date.parse(value))) {
    throw new Error('Must be a valid ISO 8601 date-time with timezone, e.g. 2026-11-05T10:30:00.000Z');
  }
  return true;
}

module.exports = { idParam, isIsoDateTimeWithZone };
