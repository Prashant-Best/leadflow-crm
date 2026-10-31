const rateLimit = require('express-rate-limit');
const { env } = require('../config/env');

// Slows down password guessing on the login/register endpoints.
// The store is in memory, so on serverless hosting each instance counts separately.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => env.isTest,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many attempts, please try again in a few minutes',
      errors: [],
    });
  },
});

module.exports = { authLimiter };
