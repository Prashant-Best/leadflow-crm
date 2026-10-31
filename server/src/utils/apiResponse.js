// Every successful response uses the same shape:
// { success: true, message: '...', data: {...} }
function sendSuccess(res, { statusCode = 200, message = 'OK', data = {} } = {}) {
  return res.status(statusCode).json({ success: true, message, data });
}

module.exports = { sendSuccess };
