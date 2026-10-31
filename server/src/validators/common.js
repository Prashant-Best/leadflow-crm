const { param } = require('express-validator');

const idParam = () => param('id').isMongoId().withMessage('Invalid id format');

const DATE_TIME_MESSAGE = 'Must be a valid ISO 8601 date-time with timezone, e.g. 2026-11-05T10:30:00.000Z';

// Strict ISO 8601 rejects impossible dates such as 2026-02-30.
const STRICT_ISO = { strict: true, strictSeparator: true };

// The value must carry a timezone (Z or +05:30), so the stored moment in time
// is never ambiguous.
function hasTimezone(value) {
  if (!/T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    throw new Error(DATE_TIME_MESSAGE);
  }
  return true;
}

module.exports = { idParam, DATE_TIME_MESSAGE, STRICT_ISO, hasTimezone };
