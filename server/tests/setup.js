const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server-core');
const User = require('../src/models/User');
const Lead = require('../src/models/Lead');
const Activity = require('../src/models/Activity');

// Each test file gets its own throwaway in-memory MongoDB, so tests never
// touch a real database. Set MONGODB_URI_TEST to use a local database instead.
let memoryServer;

beforeAll(async () => {
  let uri = process.env.MONGODB_URI_TEST;
  if (!uri) {
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri('leadflow_test');
  }
  await mongoose.connect(uri);
  // Build indexes up front so the unique email index exists before the
  // duplicate-email test runs.
  await Promise.all([User.init(), Lead.init(), Activity.init()]);
});

afterEach(async () => {
  await Promise.all([User.deleteMany({}), Lead.deleteMany({}), Activity.deleteMany({})]);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
});
