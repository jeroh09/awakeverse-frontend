// src/models/user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  displayName: { type: String },
  avatarUrl: { type: String },
  // hidden field, stored but not exposed in UI except via context
  signupLocation: { type: String },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);