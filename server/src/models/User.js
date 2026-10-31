const mongoose = require('mongoose');
const { USER_ROLES } = require('../constants/enums');
const buildToJSON = require('./toJSON');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name must be at most 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    // select: false keeps the hash out of every query unless asked for explicitly,
    // and toJSON removes it as a second safety net.
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'admin',
    },
  },
  {
    timestamps: true,
    toJSON: buildToJSON(['passwordHash']),
  }
);

module.exports = mongoose.model('User', userSchema);
