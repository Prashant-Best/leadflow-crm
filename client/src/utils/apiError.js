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

  const { message, errors } = error.response.data || {};
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
