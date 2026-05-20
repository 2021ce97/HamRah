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
  rating: {
    type: Number,
    default: 5.0,
    min: 0,
    max: 5,
  },
  totalRides: {
    type: Number,
    default: 0,
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
  socketId: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
