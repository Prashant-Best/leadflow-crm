const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const { env } = require('../config/env');

function notFound(req, res) {
  throw ApiError.notFound(`Route ${req.method} ${req.path} not found`);
}

// Central error handler. Converts every error into the standard error shape:
// { success: false, message: '...', errors: [...] }
// Stack traces and internal details are never sent to the client.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let message = 'Something went wrong, please try again';
  let errors = [];

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Request body is not valid JSON';
  } else if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request body is too large';
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.kind === 'ObjectId' || e.name === 'CastError' ? `Invalid value for ${e.path}` : e.message,
    }));
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    statusCode = 409;
    message = field === 'email' ? 'Email is already registered' : `Duplicate value for ${field}`;
    errors = [{ field, message }];
  }

  if (statusCode >= 500 && !env.isTest) {
    // Log only what is needed to debug: no request body, headers or tokens.
    console.error(`[error] ${req.method} ${req.path} -> ${err.name}: ${err.message}`);
  }

  res.status(statusCode).json({ success: false, message, errors });
}

module.exports = { notFound, errorHandler };
