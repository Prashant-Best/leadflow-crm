// Shared by the Mongoose models and the request validators.

// 7-15 digits, optionally starting with +, with spaces, dashes or brackets
// allowed between them (e.g. "+91 98765 43210", "(022) 2345-6789").
const PHONE_PATTERN = /^\+?(?:[\s\-()]*\d){7,15}[\s\-()]*$/;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = { PHONE_PATTERN, EMAIL_PATTERN };
