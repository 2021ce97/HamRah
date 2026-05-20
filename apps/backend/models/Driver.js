const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  vehicleDetails: {
    make: String,
    model: String,
    color: String,
    plateNumber: String,
  },
  commissionBalance: {
    type: Number,
    default: 0, // Balance in AFN
  },
  tazkiraVerified: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['ONLINE', 'OFFLINE', 'IN_RIDE'],
    default: 'OFFLINE',
    index: true,
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0],
    },
  },
  lastLocationUpdate: {
    type: Date,
    default: Date.now,
  },
  socketId: {
    type: String,
    default: null, // Current socket connection ID
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 2dsphere index for geospatial queries
driverSchema.index({ currentLocation: '2dsphere' });

// Compound index for nearby driver queries (status + location)
driverSchema.index({ status: 1, currentLocation: '2dsphere' });

module.exports = mongoose.model('Driver', driverSchema);
