const { connectDB } = require('../config/db');
const { env } = require('../config/env');
const ApiError = require('../utils/ApiError');

// Makes sure the server is configured and MongoDB is connected before a route
// runs. Locally the connection is opened at startup; on serverless hosting it is
// opened lazily here on the first request and then reused.
async function ensureDb(req, res, next) {
  if (!env.mongoUri || !env.jwtSecret) {
    console.error('[config] MONGODB_URI and JWT_SECRET must both be set');
    throw new ApiError(503, 'Server is not configured yet, please try again later');
  }

  try {
    await connectDB();
  } catch (err) {
    console.error(`[db] connection failed: ${err.message}`);
    throw new ApiError(503, 'Database is not reachable right now, please try again shortly');
  }
  next();
}

module.exports = ensureDb;
