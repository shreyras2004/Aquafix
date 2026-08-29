const mongoose = require('mongoose');

const MachineOwnerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  machineType: {
    type: String,
    required: [true, 'Please add a machine type (e.g., DTH Rig, Rotary Rig, etc.)'],
    trim: true,
  },
  pricePerFt: {
    type: Number,
    required: [true, 'Please specify price per foot of drilling'],
  },
  rating: {
    type: Number,
    default: 5.0,
    min: 0,
    max: 5,
  },
  availability: {
    type: Boolean,
    default: true,
  },
  location: {
    lat: {
      type: Number,
      required: [true, 'Latitude is required'],
    },
    lng: {
      type: Number,
      required: [true, 'Longitude is required'],
    },
  },
  verified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('MachineOwner', MachineOwnerSchema);
