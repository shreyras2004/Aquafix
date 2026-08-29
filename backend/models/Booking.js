const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  location: {
    type: String,
    required: [true, 'Please add a site address or location description'],
    trim: true,
  },
  borewellDetails: {
    type: String,
    required: [true, 'Please add borewell details (e.g., expected depth, diameter, ground type)'],
    trim: true,
  },
  preferredDate: {
    type: Date,
    required: [true, 'Please specify a preferred date'],
  },
  siteImageUrl: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Booking', BookingSchema);
