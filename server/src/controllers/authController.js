const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { signToken } = require('../utils/token');
const { validatedData } = require('../middleware/validate');
const { env } = require('../config/env');

// Compared against when the email is unknown, so a login attempt takes about
// the same time whether or not the account exists.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 10);

async function register(req, res) {
  const { name, email, password } = validatedData(req, 'body');

  if (await User.exists({ email })) {
    throw ApiError.conflict('Email is already registered', [
      { field: 'email', message: 'Email is already registered' },
    ]);
  }

  const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
  const user = await User.create({ name, email, passwordHash });

  sendSuccess(res, {
    statusCode: 201,
    message: 'Account created',
    data: { user, token: signToken(user) },
  });
}

async function login(req, res) {
  const { email, password } = validatedData(req, 'body');

  const user = await User.findOne({ email }).select('+passwordHash');
  const passwordMatches = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);

  // Same message for "no such user" and "wrong password" so the response
  // does not reveal which emails are registered.
  if (!user || !passwordMatches) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  sendSuccess(res, {
    message: 'Logged in',
    data: { user, token: signToken(user) },
  });
}

function getMe(req, res) {
  sendSuccess(res, { message: 'Profile fetched', data: { user: req.user } });
}

module.exports = { register, login, getMe };
