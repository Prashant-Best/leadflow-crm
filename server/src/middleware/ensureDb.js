const { connectDB } = require('../config/db');
const ApiError = require('../utils/ApiError');

// Makes sure MongoDB is connected before a route touches it. Locally the
// connection is opened at startup; on serverless hosting it is opened lazily
// here on the first request and then reused.
async function ensureDb(req, res, next) {
  try {
    await connectDB();
  } catch (err) {
    console.error(`[db] connection failed: ${err.message}`);
    throw new ApiError(503, 'Database is not reachable right now, please try again shortly');
  }
  next();
}

module.exports = ensureDb;
