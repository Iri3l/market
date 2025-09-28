const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, trim: true },
    phone: { type: String, trim: true },
    location: { type: String, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
