// Shared toJSON options: expose `id` instead of `_id` and hide internal fields.
function buildToJSON(hiddenFields = []) {
  return {
    virtuals: true,
    versionKey: false,
    transform(doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      hiddenFields.forEach((field) => delete ret[field]);
      return ret;
    },
  };
}

module.exports = buildToJSON;
