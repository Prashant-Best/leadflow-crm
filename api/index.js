// Vercel serverless entry point. Every /api/* request is rewritten here
// (see vercel.json) and handled by the same Express app used locally.
const app = require('../server/src/app');

module.exports = app;
