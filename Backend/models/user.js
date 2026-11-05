const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePhoto: { type: String, default: "" },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String, default: null },
  verificationExpiresAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
