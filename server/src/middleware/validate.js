const { validationResult, matchedData } = require('express-validator');
const ApiError = require('../utils/ApiError');

function formatErrors(result) {
  return result.array().flatMap((error) => {
    // checkExact() reports every field that no rule allows (e.g. _id, createdBy).
    if (error.type === 'unknown_fields') {
      return error.fields.map((field) => ({
        field: field.path,
        message: `${field.path} is not an allowed field`,
      }));
    }
    return [{ field: error.path || error.type, message: error.msg }];
  });
}

// Runs the given validation chains, then stops the request with a 400 and a
// list of field errors if anything failed.
function validate(chains) {
  return [
    ...chains,
    (req, res, next) => {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        throw ApiError.badRequest('Validation failed', formatErrors(result));
      }
      next();
    },
  ];
}

// Only the fields that passed validation (already trimmed/converted).
// Fields the client did not send are left out, so a PATCH never touches them.
function validatedData(req, location) {
  const data = matchedData(req, { locations: [location], includeOptionals: true });
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

// Turns empty strings into null for optional fields, so an empty form input
// means "no value" instead of failing format checks such as isEmail.
function blankToNull(fields) {
  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      fields.forEach((field) => {
        if (typeof req.body[field] === 'string' && req.body[field].trim() === '') {
          req.body[field] = null;
        }
      });
    }
    next();
  };
}

module.exports = { validate, validatedData, blankToNull };
