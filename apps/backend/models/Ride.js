const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  riderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
  },
  pickup: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    landmarkName: { type: String, required: true },
  },
  destination: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    landmarkName: { type: String, required: true },
  },
  status: {
    type: String,
    enum: ['Pending', 'Negotiating', 'Accepted', 'InProgress', 'Completed', 'Cancelled'],
    default: 'Pending',
  },
  proposedFare: {
    type: Number, // In AFN
    required: true,
  },
  agreedFare: {
    type: Number, // In AFN
  },
  commissionAmount: {
    type: Number, // Calculated at the end (e.g., 8% of agreedFare)
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Ride', rideSchema);
