const mongoose = require('mongoose');
const { LEAD_STAGES, LEAD_SOURCES, SERVICE_INTERESTS } = require('../constants/enums');
const buildToJSON = require('./toJSON');

const { PHONE_PATTERN, EMAIL_PATTERN } = require('../constants/patterns');

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Lead name is required'],
      trim: true,
      maxlength: [100, 'Name must be at most 100 characters'],
    },
    company: {
      type: String,
      trim: true,
      maxlength: [100, 'Company must be at most 100 characters'],
      default: null,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
      match: [EMAIL_PATTERN, 'Enter a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
      default: null,
      match: [PHONE_PATTERN, 'Enter a valid phone number'],
    },
    serviceInterest: {
      type: String,
      enum: SERVICE_INTERESTS,
      default: 'Other',
    },
    source: {
      type: String,
      enum: LEAD_SOURCES,
      default: 'Other',
    },
    budget: {
      type: Number,
      min: [0, 'Budget cannot be negative'],
      default: null,
    },
    stage: {
      type: String,
      enum: LEAD_STAGES,
      default: 'New',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes must be at most 1000 characters'],
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
  },
  {
    timestamps: true,
    toJSON: buildToJSON(),
  }
);

// Runs on every save (create and update), so the rule also holds after a PATCH
// that clears one of the two contact fields.
leadSchema.pre('validate', function requireContact() {
  if (!this.email && !this.phone) {
    this.invalidate('email', 'Provide at least an email or a phone number');
  }
});

leadSchema.index({ createdBy: 1, createdAt: -1 });
leadSchema.index({ createdBy: 1, stage: 1 });

module.exports = mongoose.model('Lead', leadSchema);
