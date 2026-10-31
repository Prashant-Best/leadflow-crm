const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { sendSuccess } = require('../utils/apiResponse');

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

// Reports whether the API and database are up. Never includes configuration values.
// On a fresh serverless instance no connection exists yet, so it tries to connect
// first; a failure is reported as "disconnected" instead of an error.
async function getHealth(req, res) {
  try {
    await connectDB();
  } catch {
    // reported through the database state below
  }

  sendSuccess(res, {
    message: 'API is healthy',
    data: {
      status: 'ok',
      database: DB_STATES[mongoose.connection.readyState] || 'unknown',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
}

module.exports = { getHealth };
