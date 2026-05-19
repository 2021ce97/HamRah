const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    default: '',
  },
  language: {
    type: String,
    enum: ['Dari', 'Pashto', 'English'],
    default: 'Dari',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
