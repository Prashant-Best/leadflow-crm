const ApiError = require('../utils/ApiError');

// Loads the document named by req.params.id and checks that it belongs to the
// logged-in user. 404 if it does not exist, 403 if it belongs to someone else.
// The id format is validated before this runs, so findById never sees a bad id.
function loadOwned(Model, label) {
  return async (req, res, next) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) {
      throw ApiError.notFound(`${label} not found`);
    }
    if (!doc.createdBy.equals(req.user._id)) {
      throw ApiError.forbidden(`You do not have access to this ${label.toLowerCase()}`);
    }
    req.doc = doc;
    next();
  };
}

module.exports = loadOwned;
