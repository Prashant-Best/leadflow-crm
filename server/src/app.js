const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { env } = require('./config/env');
const apiRoutes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Builds the Express app without starting a server, so tests and the
// serverless entry point (api/index.js) can import it directly.
const app = express();

// Behind Vercel's proxy, so req.ip is the real client IP for rate limiting.
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: env.clientOrigins }));
app.use(express.json({ limit: '100kb' }));

// Log method, path, status and time only - never query strings, bodies or headers,
// so search text, passwords and tokens stay out of the logs.
if (!env.isTest) {
  morgan.token('path', (req) => req.path);
  app.use(morgan(':method :path :status :response-time ms'));
}

app.use('/api/v1', apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
