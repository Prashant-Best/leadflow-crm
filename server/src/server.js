const app = require('./app');
const { env, assertRequiredEnv } = require('./config/env');
const { connectDB } = require('./config/db');

async function start() {
  assertRequiredEnv();
  await connectDB();
  console.log('[db] connected to MongoDB');

  app.listen(env.port, () => {
    console.log(`[api] LeadFlow API running on http://localhost:${env.port}/api/v1`);
  });
}

start().catch((err) => {
  console.error(`[startup] ${err.message}`);
  process.exit(1);
});
