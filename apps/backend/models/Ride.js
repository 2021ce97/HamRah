const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  riderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    index: true,
  },
  pickup: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    landmarkName: { type: String, default: '' },
  },
  destination: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    landmarkName: { type: String, default: '' },
  },
  status: {
    type: String,
    enum: ['Pending', 'Negotiating', 'Accepted', 'InProgress', 'Completed', 'Cancelled', 'Expired'],
    default: 'Pending',
    index: true,
  },
  proposedFare: {
    type: Number, // In AFN
    required: true,
    min: 0,
  },
  agreedFare: {
    type: Number, // In AFN
    min: 0,
  },
  counterOffers: [{
    driverId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Driver',
      required: true,
    },
    amount: { 
      type: Number, 
      required: true,
      min: 0,
    },
    timestamp: { 
      type: Date, 
      default: Date.now,
    },
  }],
  estimatedDistance: {
    type: Number, // In meters
    required: true,
  },
  estimatedDuration: {
    type: Number, // In seconds
    required: true,
  },
  routeGeometry: {
    type: Object, // GeoJSON LineString
    required: false,
  },
  commissionAmount: {
    type: Number, // Calculated at the end (e.g., 8% of agreedFare)
    default: 0,
  },
  expiresAt: {
    type: Date,
    index: true,
  },
  acceptedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Compound indexes for efficient queries
rideSchema.index({ riderId: 1, status: 1 });
rideSchema.index({ driverId: 1, status: 1 });

// TTL index for automatic cleanup of expired requests
rideSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Ride', rideSchema);
