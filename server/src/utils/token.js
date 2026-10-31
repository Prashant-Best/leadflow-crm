const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

const ALGORITHM = 'HS256';

function signToken(user) {
  return jwt.sign({ sub: user.id }, env.jwtSecret, {
    algorithm: ALGORITHM,
    expiresIn: env.jwtExpiresIn,
  });
}

// Throws TokenExpiredError / JsonWebTokenError when the token is invalid.
// Pinning the algorithm prevents "alg: none" and algorithm-switching tricks.
function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret, { algorithms: [ALGORITHM] });
}

module.exports = { signToken, verifyToken };
