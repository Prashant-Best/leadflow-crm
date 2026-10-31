// Converts an axios error into { message, fieldErrors } for display.
// fieldErrors maps a field name to its first error message from the API.
export function parseApiError(error, fallback = 'Something went wrong. Please try again.') {
  if (!error?.response) {
    return {
      message:
        error?.code === 'ECONNABORTED'
          ? 'The server took too long to respond. Please try again.'
          : 'Cannot reach the server. Check your connection and try again.',
      fieldErrors: {},
    };
  }

  // A response that is not our JSON format comes from a proxy or the host
  // (API crashed, not started, or timed out), not from the API itself.
  const body = error.response.data;
  if (!body || typeof body !== 'object' || !('success' in body)) {
    return {
      message:
        error.response.status >= 500
          ? 'The server is not responding right now. Please try again in a moment.'
          : fallback,
      fieldErrors: {},
      status: error.response.status,
    };
  }

  const { message, errors } = body;
  const fieldErrors = {};
  (Array.isArray(errors) ? errors : []).forEach(({ field, message: fieldMessage }) => {
    if (field && !fieldErrors[field]) fieldErrors[field] = fieldMessage;
  });

  return {
    message: typeof message === 'string' && message ? message : fallback,
    fieldErrors,
    status: error.response.status,
  };
}
