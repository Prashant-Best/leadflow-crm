const mongoose = require('mongoose');
const { sendSuccess } = require('../utils/apiResponse');

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

// Reports whether the API and database are up. Never includes configuration values.
function getHealth(req, res) {
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
