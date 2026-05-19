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
    enum: ['Online', 'Offline', 'InRide'],
    default: 'Offline',
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for geospatial queries (e.g., finding nearby drivers)
driverSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('Driver', driverSchema);
