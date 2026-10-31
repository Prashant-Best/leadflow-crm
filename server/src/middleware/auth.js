const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/token');

// Protects a route: requires "Authorization: Bearer <token>", verifies the JWT
// signature and expiry, and loads the user into req.user.
async function protect(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized('Authentication token is missing');
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    throw ApiError.unauthorized(
      err.name === 'TokenExpiredError'
        ? 'Your session has expired, please log in again'
        : 'Invalid authentication token'
    );
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw ApiError.unauthorized('The account for this token no longer exists');
  }

  req.user = user;
  next();
}

module.exports = { protect };
