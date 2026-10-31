const mongoose = require('mongoose');
const { ACTIVITY_TYPES, ACTIVITY_STATUSES } = require('../constants/enums');
const buildToJSON = require('./toJSON');

// An activity is a follow-up scheduled against a lead (call, email, meeting or task).
const activitySchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Lead is required'],
      immutable: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title must be at most 150 characters'],
    },
    type: {
      type: String,
      enum: ACTIVITY_TYPES,
      default: 'Task',
    },
    // Stored as a UTC Date. Clients send ISO 8601 strings with a timezone.
    dueAt: {
      type: Date,
      required: [true, 'Due date and time is required'],
    },
    status: {
      type: String,
      enum: ACTIVITY_STATUSES,
      default: 'Pending',
    },
    // Set by the server only, at the moment the activity is marked complete.
    completedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes must be at most 1000 characters'],
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: buildToJSON(),
  }
);

// Overdue = still pending and the due time has already passed.
// Completed activities are never overdue.
activitySchema.virtual('isOverdue').get(function isOverdue() {
  return this.status === 'Pending' && this.dueAt instanceof Date && this.dueAt < new Date();
});

activitySchema.index({ createdBy: 1, status: 1, dueAt: 1 });
activitySchema.index({ leadId: 1 });

module.exports = mongoose.model('Activity', activitySchema);
