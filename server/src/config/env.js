const path = require('path');
const dotenv = require('dotenv');

// Load server/.env when it exists. On hosting platforms the variables
// come from the dashboard instead, so a missing file is not an error.
dotenv.config({ path: path.join(__dirname, '..', '..', '.env'), quiet: true });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
};

env.isTest = env.nodeEnv === 'test';
env.isProduction = env.nodeEnv === 'production';

// Fail fast with a clear message instead of crashing later on the first request.
function assertRequiredEnv() {
  const missing = [];
  if (!env.mongoUri) missing.push('MONGODB_URI');
  if (!env.jwtSecret) missing.push('JWT_SECRET');
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = { env, assertRequiredEnv };
