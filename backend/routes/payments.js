const express = require('express');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get payment/invoice details by Booking ID
// @route   GET /api/payments/booking/:bookingId
// @access  Private
router.get('/booking/:bookingId', protect, async (req, res) => {
  try {
    const payment = await Payment.findOne({ bookingId: req.params.bookingId }).populate(
      'bookingId',
      'location borewellDetails preferredDate status'
    );

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Mark payment as paid
// @route   PUT /api/payments/:id/pay
// @access  Private
router.put('/:id/pay', protect, async (req, res) => {
  const { method } = req.body;

  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    payment.status = 'paid';
    payment.paymentDate = Date.now();
    if (method) payment.method = method;

    await payment.save();

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get Owner Earnings Summary (Total + Today)
// @route   GET /api/payments/owner/summary
// @access  Private (Owner only)
router.get('/owner/summary', protect, authorize('owner'), async (req, res) => {
  try {
    // 1. Get all bookings for this owner
    const bookings = await Booking.find({ ownerId: req.user.id });
    const bookingIds = bookings.map((b) => b._id);

    // 2. Get all payments related to these bookings
    const payments = await Payment.find({
      bookingId: { $in: bookingIds },
      status: 'paid',
    });

    let totalEarnings = 0;
    let todayEarnings = 0;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    payments.forEach((payment) => {
      totalEarnings += payment.amount;
      
      const payDate = new Date(payment.paymentDate || payment.createdAt);
      if (payDate >= startOfToday && payDate <= endOfToday) {
        todayEarnings += payment.amount;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalEarnings,
        todayEarnings,
        paymentCount: payments.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
