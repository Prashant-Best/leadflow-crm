// Escape characters that have a special meaning in regular expressions so that
// user search text like "a.*(" is matched literally instead of crashing the query.
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = escapeRegex;
