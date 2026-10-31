const mongoose = require('mongoose');
const { env } = require('./env');

// Reuse one connection. This matters on serverless hosting, where the same
// warm instance handles many requests and should not reconnect every time.
let pendingConnection = null;

async function connectDB(uri = env.mongoUri) {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!uri) throw new Error('MONGODB_URI is not configured');

  if (!pendingConnection) {
    pendingConnection = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 10000 })
      .catch((err) => {
        pendingConnection = null;
        throw err;
      });
  }

  await pendingConnection;
  return mongoose.connection;
}

async function disconnectDB() {
  pendingConnection = null;
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };
