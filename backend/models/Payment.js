const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: [true, 'Please specify the payment amount'],
  },
  method: {
    type: String,
    enum: ['Cash', 'UPI', 'Card', 'Net Banking'],
    default: 'UPI',
  },
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending',
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  paymentDate: {
    type: Date,
  },
  drillingDepth: {
    type: Number,
  },
  drillingRate: {
    type: Number,
  },
  casingDepth: {
    type: Number,
  },
  casingRate: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Payment', PaymentSchema);
